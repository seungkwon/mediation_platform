import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_current_user, is_admin
from app.db.session import get_db
from app.models.enums import ResourceStatus
from app.models.resource import ResourceAttachment, ResourcePost
from app.models.user import User
from app.schemas.resource import ResourcePostCreate, ResourcePostOut, ResourcePostSummary, ResourcePostUpdate

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post("", response_model=ResourcePostOut, status_code=status.HTTP_201_CREATED)
async def create_resource_post(
    payload: ResourcePostCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ResourcePost:
    data = payload.model_dump()
    attachments = data.pop("attachments")
    post = ResourcePost(
        author_id=admin.id,
        **data,
        attachments=[ResourceAttachment(**a) for a in attachments],
    )
    db.add(post)
    await db.commit()
    await db.refresh(post, attribute_names=["author", "attachments"])
    return post


@router.get("", response_model=list[ResourcePostSummary])
async def list_resource_posts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ResourcePostSummary]:
    query = (
        select(ResourcePost, func.count(ResourceAttachment.id))
        .outerjoin(ResourceAttachment, ResourceAttachment.resource_post_id == ResourcePost.id)
        .group_by(ResourcePost.id)
        .order_by(ResourcePost.created_at.desc())
    )
    if not await is_admin(db, user):
        query = query.where(ResourcePost.status == ResourceStatus.published)

    rows = (await db.execute(query)).all()
    return [
        ResourcePostSummary(
            id=post.id,
            title=post.title,
            status=post.status,
            attachment_count=attachment_count,
            created_at=post.created_at,
        )
        for post, attachment_count in rows
    ]


async def _get_resource_post_or_404(db: AsyncSession, post_id: uuid.UUID) -> ResourcePost:
    result = await db.execute(
        select(ResourcePost)
        .options(selectinload(ResourcePost.author), selectinload(ResourcePost.attachments))
        .where(ResourcePost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "자료를 찾을 수 없습니다.")
    return post


@router.get("/{post_id}", response_model=ResourcePostOut)
async def get_resource_post(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResourcePost:
    post = await _get_resource_post_or_404(db, post_id)
    if post.status != ResourceStatus.published and not await is_admin(db, user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "자료를 찾을 수 없습니다.")
    return post


@router.patch("/{post_id}", response_model=ResourcePostOut)
async def update_resource_post(
    post_id: uuid.UUID,
    payload: ResourcePostUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ResourcePost:
    post = await _get_resource_post_or_404(db, post_id)
    data = payload.model_dump(exclude_unset=True)
    attachments = data.pop("attachments", None)
    for field, value in data.items():
        setattr(post, field, value)
    if attachments is not None:
        post.attachments = [ResourceAttachment(**a) for a in attachments]

    await db.commit()
    await db.refresh(post, attribute_names=["attachments", "updated_at"])
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource_post(
    post_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    post = await _get_resource_post_or_404(db, post_id)
    await db.delete(post)
    await db.commit()
