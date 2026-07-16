import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.chat import ChatRoom
from app.models.enums import QuoteStatus, ServiceRequestStatus
from app.models.quote import Quote, QuoteAttachment
from app.models.seller import SellerProfile
from app.models.service_request import ServiceRequest
from app.models.user import User
from app.schemas.quote import QuoteCreate, QuoteOut
from app.services.matching import expire_overdue_requests

router = APIRouter(tags=["quotes"])


def _mask_if_sealed(quote: Quote, viewer_id: uuid.UUID) -> QuoteOut:
    out = QuoteOut.model_validate(quote)
    out.service_request_title = quote.service_request.title
    out.service_request_bid_deadline = quote.service_request.bid_deadline
    is_owner = quote.seller_id == viewer_id
    if quote.status == QuoteStatus.submitted and not is_owner:
        out.price = None
        out.delivery_days = None
        out.description = None
        out.attachments = []
    return out


async def _get_quote_or_404(db: AsyncSession, quote_id: uuid.UUID) -> Quote:
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.seller), selectinload(Quote.attachments), selectinload(Quote.service_request))
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if quote is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "견적을 찾을 수 없습니다.")
    return quote


@router.post(
    "/service-requests/{request_id}/quotes", response_model=QuoteOut, status_code=status.HTTP_201_CREATED
)
async def submit_quote(
    request_id: uuid.UUID,
    payload: QuoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QuoteOut:
    await expire_overdue_requests(db)

    seller_profile = (
        await db.execute(select(SellerProfile).where(SellerProfile.user_id == user.id))
    ).scalar_one_or_none()
    if seller_profile is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "판매자 프로필을 먼저 등록해야 견적을 제출할 수 있습니다.")

    req = await db.get(ServiceRequest, request_id)
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "서비스 요청을 찾을 수 없습니다.")
    if req.buyer_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "본인 요청에는 견적을 제출할 수 없습니다.")
    if req.status != ServiceRequestStatus.open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "마감되었거나 진행 중이 아닌 요청입니다.")

    existing = (
        await db.execute(
            select(Quote).where(Quote.service_request_id == request_id, Quote.seller_id == user.id)
        )
    ).scalar_one_or_none()

    if existing is not None:
        if existing.status not in (QuoteStatus.submitted, QuoteStatus.opened):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 확정된 견적은 수정할 수 없습니다.")
        existing.price = payload.price
        existing.delivery_days = payload.delivery_days
        existing.description = payload.description
        existing.attachments = [
            QuoteAttachment(file_path=a.file_path, original_filename=a.original_filename)
            for a in payload.attachments
        ]
        quote = existing
    else:
        quote = Quote(
            service_request_id=request_id,
            seller_id=user.id,
            price=payload.price,
            delivery_days=payload.delivery_days,
            description=payload.description,
            attachments=[
                QuoteAttachment(file_path=a.file_path, original_filename=a.original_filename)
                for a in payload.attachments
            ],
        )
        db.add(quote)

    chat_room_exists = (
        await db.execute(
            select(ChatRoom.id).where(ChatRoom.service_request_id == request_id, ChatRoom.seller_id == user.id)
        )
    ).scalar_one_or_none()
    if chat_room_exists is None:
        db.add(ChatRoom(service_request_id=request_id, buyer_id=req.buyer_id, seller_id=user.id))

    await db.commit()
    quote = await _get_quote_or_404(db, quote.id)
    return _mask_if_sealed(quote, user.id)


@router.get("/service-requests/{request_id}/quotes", response_model=list[QuoteOut])
async def list_quotes_for_request(
    request_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[QuoteOut]:
    req = await db.get(ServiceRequest, request_id)
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "서비스 요청을 찾을 수 없습니다.")

    is_buyer = req.buyer_id == user.id
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.seller), selectinload(Quote.attachments), selectinload(Quote.service_request))
        .where(Quote.service_request_id == request_id)
        .order_by(Quote.created_at)
    )
    quotes = list(result.scalars().all())

    if is_buyer:
        return [_mask_if_sealed(q, user.id) for q in quotes]

    my_quote = [q for q in quotes if q.seller_id == user.id]
    if not my_quote:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "해당 요청의 구매자 또는 견적 제출자만 조회할 수 있습니다.")
    return [_mask_if_sealed(my_quote[0], user.id)]


@router.get("/quotes/mine", response_model=list[QuoteOut])
async def list_my_quotes(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[QuoteOut]:
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.seller), selectinload(Quote.attachments), selectinload(Quote.service_request))
        .where(Quote.seller_id == user.id)
        .order_by(Quote.created_at.desc())
    )
    return [_mask_if_sealed(q, user.id) for q in result.scalars().all()]


@router.post("/quotes/{quote_id}/open", response_model=QuoteOut)
async def open_quote(
    quote_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> QuoteOut:
    quote = await _get_quote_or_404(db, quote_id)
    req = quote.service_request
    if req.buyer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "요청 작성자만 견적을 오픈할 수 있습니다.")
    if req.status != ServiceRequestStatus.open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "마감된 요청입니다.")

    if quote.status == QuoteStatus.submitted:
        quote.status = QuoteStatus.opened
        quote.opened_at = datetime.now(timezone.utc)
        await db.commit()
        quote = await _get_quote_or_404(db, quote_id)
    return _mask_if_sealed(quote, user.id)


@router.post("/quotes/{quote_id}/select", response_model=QuoteOut)
async def select_quote(
    quote_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> QuoteOut:
    quote = await _get_quote_or_404(db, quote_id)
    req = quote.service_request
    if req.buyer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "요청 작성자만 견적을 선택할 수 있습니다.")
    if req.status != ServiceRequestStatus.open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 마감되었거나 진행 중이 아닌 요청입니다.")
    if datetime.now(timezone.utc) > req.bid_deadline:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "입찰 마감시간이 지났습니다.")

    other_quotes = (
        await db.execute(select(Quote).where(Quote.service_request_id == req.id, Quote.id != quote.id))
    ).scalars().all()
    for other in other_quotes:
        other.status = QuoteStatus.rejected

    quote.status = QuoteStatus.selected
    if quote.opened_at is None:
        quote.opened_at = datetime.now(timezone.utc)
    req.status = ServiceRequestStatus.awarded
    req.selected_quote_id = quote.id

    await db.commit()
    quote = await _get_quote_or_404(db, quote_id)
    return _mask_if_sealed(quote, user.id)
