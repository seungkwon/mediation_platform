import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import ServiceRequestStatus
from app.models.quote import Quote
from app.models.service_request import ServiceRequest, ServiceRequestAttachment, ServiceRequestImage
from app.models.user import User
from app.schemas.service_request import (
    ServiceRequestCreate,
    ServiceRequestOut,
    ServiceRequestSummary,
    ServiceRequestUpdate,
)
from app.services.matching import expire_overdue_requests

router = APIRouter(prefix="/service-requests", tags=["service-requests"])


async def _get_request_or_404(db: AsyncSession, request_id: uuid.UUID) -> ServiceRequest:
    result = await db.execute(
        select(ServiceRequest)
        .options(
            selectinload(ServiceRequest.buyer),
            selectinload(ServiceRequest.images),
            selectinload(ServiceRequest.attachments),
        )
        .where(ServiceRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "서비스 요청을 찾을 수 없습니다.")
    return req


@router.post("", response_model=ServiceRequestOut, status_code=status.HTTP_201_CREATED)
async def create_service_request(
    payload: ServiceRequestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequest:
    req = ServiceRequest(
        buyer_id=user.id,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        bid_deadline=payload.bid_deadline,
        images=[ServiceRequestImage(file_path=p, sort_order=i) for i, p in enumerate(payload.image_paths)],
        attachments=[
            ServiceRequestAttachment(file_path=a.file_path, original_filename=a.original_filename, size=a.size)
            for a in payload.attachments
        ],
    )
    db.add(req)
    await db.commit()
    return await _get_request_or_404(db, req.id)


@router.get("", response_model=list[ServiceRequestSummary])
async def list_service_requests(
    category_id: uuid.UUID | None = None,
    status_filter: ServiceRequestStatus | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> list[ServiceRequest]:
    await expire_overdue_requests(db)

    query = select(ServiceRequest, func.count(Quote.id)).outerjoin(Quote).group_by(ServiceRequest.id)
    if category_id is not None:
        query = query.where(ServiceRequest.category_id == category_id)
    if status_filter is not None:
        query = query.where(ServiceRequest.status == status_filter)
    query = query.order_by(ServiceRequest.created_at.desc())

    rows = (await db.execute(query)).all()
    results = []
    for req, quote_count in rows:
        summary = ServiceRequestSummary.model_validate(req)
        summary.quote_count = quote_count
        results.append(summary)
    return results


@router.get("/mine", response_model=list[ServiceRequestSummary])
async def list_my_service_requests(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ServiceRequest]:
    await expire_overdue_requests(db)
    query = (
        select(ServiceRequest, func.count(Quote.id))
        .outerjoin(Quote)
        .where(ServiceRequest.buyer_id == user.id)
        .group_by(ServiceRequest.id)
        .order_by(ServiceRequest.created_at.desc())
    )
    rows = (await db.execute(query)).all()
    results = []
    for req, quote_count in rows:
        summary = ServiceRequestSummary.model_validate(req)
        summary.quote_count = quote_count
        results.append(summary)
    return results


@router.get("/{request_id}", response_model=ServiceRequestOut)
async def get_service_request(request_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> ServiceRequest:
    await expire_overdue_requests(db)
    return await _get_request_or_404(db, request_id)


@router.patch("/{request_id}", response_model=ServiceRequestOut)
async def update_service_request(
    request_id: uuid.UUID,
    payload: ServiceRequestUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequest:
    await expire_overdue_requests(db)
    req = await _get_request_or_404(db, request_id)
    if req.buyer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 요청만 수정할 수 있습니다.")
    if req.status != ServiceRequestStatus.open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "입찰이 진행 중인 요청만 수정할 수 있습니다.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(req, field, value)
    await db.commit()
    return await _get_request_or_404(db, request_id)


@router.post("/{request_id}/cancel", response_model=ServiceRequestOut)
async def cancel_service_request(
    request_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequest:
    await expire_overdue_requests(db)
    req = await _get_request_or_404(db, request_id)
    if req.buyer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 요청만 취소할 수 있습니다.")
    if req.status != ServiceRequestStatus.open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "입찰이 진행 중인 요청만 취소할 수 있습니다.")

    req.status = ServiceRequestStatus.cancelled
    await db.commit()
    return await _get_request_or_404(db, request_id)
