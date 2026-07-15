import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.review import Review
from app.models.seller import SellerProfile
from app.models.user import User
from app.schemas.seller import SellerProfileCreate, SellerProfileOut, SellerProfileUpdate

router = APIRouter(prefix="/sellers", tags=["sellers"])


async def _to_out(db: AsyncSession, profile: SellerProfile) -> SellerProfileOut:
    result = await db.execute(
        select(func.count(Review.id), func.avg(Review.rating)).where(Review.reviewee_id == profile.user_id)
    )
    review_count, average_rating = result.one()
    out = SellerProfileOut.model_validate(profile)
    out.review_count = review_count or 0
    out.average_rating = round(float(average_rating), 2) if average_rating is not None else None
    return out


@router.post("/me", response_model=SellerProfileOut, status_code=status.HTTP_201_CREATED)
async def create_my_seller_profile(
    payload: SellerProfileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SellerProfileOut:
    existing = await db.execute(select(SellerProfile).where(SellerProfile.user_id == user.id))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 판매자 프로필이 존재합니다.")

    profile = SellerProfile(user_id=user.id, **payload.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile, attribute_names=["user"])
    return await _to_out(db, profile)


@router.get("/me", response_model=SellerProfileOut)
async def get_my_seller_profile(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> SellerProfileOut:
    result = await db.execute(
        select(SellerProfile).options(selectinload(SellerProfile.user)).where(SellerProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "판매자 프로필이 없습니다.")
    return await _to_out(db, profile)


@router.patch("/me", response_model=SellerProfileOut)
async def update_my_seller_profile(
    payload: SellerProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SellerProfileOut:
    result = await db.execute(
        select(SellerProfile).options(selectinload(SellerProfile.user)).where(SellerProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "판매자 프로필이 없습니다.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return await _to_out(db, profile)


@router.get("/{user_id}", response_model=SellerProfileOut)
async def get_seller_profile(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> SellerProfileOut:
    result = await db.execute(
        select(SellerProfile).options(selectinload(SellerProfile.user)).where(SellerProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "판매자 프로필이 없습니다.")
    return await _to_out(db, profile)
