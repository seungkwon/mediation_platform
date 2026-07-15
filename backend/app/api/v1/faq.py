import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_current_user, is_admin
from app.db.session import get_db
from app.models.enums import FaqStatus
from app.models.faq import FaqPost
from app.models.user import User
from app.schemas.faq import FaqPostCreate, FaqPostOut, FaqPostSummary, FaqPostUpdate

router = APIRouter(prefix="/faq", tags=["faq"])


@router.post("", response_model=FaqPostOut, status_code=status.HTTP_201_CREATED)
async def create_faq_post(
    payload: FaqPostCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> FaqPost:
    post = FaqPost(author_id=admin.id, **payload.model_dump())
    db.add(post)
    await db.commit()
    await db.refresh(post, attribute_names=["author"])
    return post


@router.get("", response_model=list[FaqPostSummary])
async def list_faq_posts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[FaqPost]:
    query = select(FaqPost).order_by(FaqPost.created_at.desc())
    if not await is_admin(db, user):
        query = query.where(FaqPost.status == FaqStatus.published)
    return list((await db.execute(query)).scalars().all())


async def _get_faq_post_or_404(db: AsyncSession, post_id: uuid.UUID) -> FaqPost:
    result = await db.execute(
        select(FaqPost).options(selectinload(FaqPost.author)).where(FaqPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "FAQ를 찾을 수 없습니다.")
    return post


@router.get("/{post_id}", response_model=FaqPostOut)
async def get_faq_post(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FaqPost:
    post = await _get_faq_post_or_404(db, post_id)
    if post.status != FaqStatus.published and not await is_admin(db, user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "FAQ를 찾을 수 없습니다.")
    return post


@router.patch("/{post_id}", response_model=FaqPostOut)
async def update_faq_post(
    post_id: uuid.UUID,
    payload: FaqPostUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> FaqPost:
    post = await _get_faq_post_or_404(db, post_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    await db.commit()
    await db.refresh(post, attribute_names=["updated_at"])
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq_post(
    post_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    post = await _get_faq_post_or_404(db, post_id)
    await db.delete(post)
    await db.commit()
