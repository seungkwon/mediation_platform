import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models.enums import PortfolioStatus
from app.models.seller import PortfolioMedia, PortfolioPost, SellerProfile
from app.models.user import User
from app.schemas.seller import PortfolioPostCreate, PortfolioPostOut, PortfolioPostSummary, PortfolioPostUpdate

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


async def _get_my_seller_profile(db: AsyncSession, user: User) -> SellerProfile:
    result = await db.execute(select(SellerProfile).where(SellerProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "판매자 프로필을 먼저 등록해야 합니다.")
    return profile


@router.post("", response_model=PortfolioPostOut, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    payload: PortfolioPostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioPost:
    profile = await _get_my_seller_profile(db, user)
    post = PortfolioPost(
        seller_profile_id=profile.id,
        title=payload.title,
        content=payload.content,
        status=payload.status,
        media=[PortfolioMedia(**m.model_dump()) for m in payload.media],
    )
    db.add(post)
    await db.commit()
    await db.refresh(post, attribute_names=["media"])
    return post


@router.get("", response_model=list[PortfolioPostSummary])
async def list_portfolios(
    seller_id: uuid.UUID,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioPost]:
    result = await db.execute(select(SellerProfile).where(SellerProfile.user_id == seller_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "판매자 프로필이 없습니다.")

    is_owner = user is not None and user.id == seller_id
    query = (
        select(PortfolioPost)
        .options(selectinload(PortfolioPost.media))
        .where(PortfolioPost.seller_profile_id == profile.id)
        .order_by(PortfolioPost.created_at.desc())
    )
    if not is_owner:
        query = query.where(PortfolioPost.status == PortfolioStatus.published)

    posts = list((await db.execute(query)).scalars().all())
    return [
        PortfolioPostSummary(
            id=p.id,
            title=p.title,
            status=p.status,
            thumbnail=p.media[0].file_path if p.media else None,
            created_at=p.created_at,
        )
        for p in posts
    ]


async def _get_portfolio_or_404(db: AsyncSession, post_id: uuid.UUID) -> PortfolioPost:
    result = await db.execute(
        select(PortfolioPost)
        .options(selectinload(PortfolioPost.media), selectinload(PortfolioPost.seller_profile))
        .where(PortfolioPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "게시물을 찾을 수 없습니다.")
    return post


@router.get("/{post_id}", response_model=PortfolioPostOut)
async def get_portfolio(
    post_id: uuid.UUID,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> PortfolioPost:
    post = await _get_portfolio_or_404(db, post_id)
    is_owner = user is not None and user.id == post.seller_profile.user_id
    if post.status != PortfolioStatus.published and not is_owner:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "게시물을 찾을 수 없습니다.")
    return post


@router.patch("/{post_id}", response_model=PortfolioPostOut)
async def update_portfolio(
    post_id: uuid.UUID,
    payload: PortfolioPostUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioPost:
    post = await _get_portfolio_or_404(db, post_id)
    if post.seller_profile.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 게시물만 수정할 수 있습니다.")

    data = payload.model_dump(exclude_unset=True)
    media_payload = data.pop("media", None)
    for field, value in data.items():
        setattr(post, field, value)
    if media_payload is not None:
        post.media = [PortfolioMedia(**m) for m in media_payload]

    await db.commit()
    await db.refresh(post, attribute_names=["media"])
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    post = await _get_portfolio_or_404(db, post_id)
    if post.seller_profile.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 게시물만 삭제할 수 있습니다.")
    await db.delete(post)
    await db.commit()
