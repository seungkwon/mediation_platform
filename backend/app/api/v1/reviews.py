import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import NotificationType, ServiceRequestStatus
from app.models.notification import Notification
from app.models.quote import Quote
from app.models.review import Review
from app.models.service_request import ServiceRequest
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(tags=["reviews"])


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewOut:
    req = await db.get(ServiceRequest, payload.service_request_id)
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "서비스 요청을 찾을 수 없습니다.")
    if req.buyer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "요청 작성자만 리뷰를 작성할 수 있습니다.")
    if req.status != ServiceRequestStatus.awarded or req.selected_quote_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "낙찰이 완료된 요청에만 리뷰를 작성할 수 있습니다.")

    quote = await db.get(Quote, req.selected_quote_id)

    review = Review(
        service_request_id=req.id,
        reviewer_id=user.id,
        reviewee_id=quote.seller_id,
        rating=payload.rating,
        content=payload.content,
    )
    db.add(review)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 이 요청에 대한 리뷰를 작성했습니다.")

    db.add(
        Notification(
            user_id=quote.seller_id,
            type=NotificationType.new_review,
            title="새 리뷰가 등록되었습니다",
            content=f"'{req.title}' 요청에 대한 리뷰가 등록되었습니다.",
            link=f"/sellers/{quote.seller_id}",
        )
    )

    await db.commit()
    result = await db.execute(
        select(Review).options(selectinload(Review.reviewer)).where(Review.id == review.id)
    )
    return result.scalar_one()


@router.get("/users/{user_id}/reviews", response_model=list[ReviewOut])
async def list_user_reviews(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[Review]:
    result = await db.execute(
        select(Review)
        .options(selectinload(Review.reviewer))
        .where(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
    )
    return list(result.scalars().all())
