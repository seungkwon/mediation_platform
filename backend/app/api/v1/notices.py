import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_current_user, is_admin
from app.db.session import get_db
from app.models.enums import NoticeStatus
from app.models.notice import Notice
from app.models.user import User
from app.schemas.notice import NoticeCreate, NoticeOut, NoticeSummary, NoticeUpdate

router = APIRouter(prefix="/notices", tags=["notices"])


@router.post("", response_model=NoticeOut, status_code=status.HTTP_201_CREATED)
async def create_notice(
    payload: NoticeCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Notice:
    notice = Notice(author_id=admin.id, **payload.model_dump())
    db.add(notice)
    await db.commit()
    await db.refresh(notice, attribute_names=["author"])
    return notice


@router.get("", response_model=list[NoticeSummary])
async def list_notices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Notice]:
    query = select(Notice).order_by(Notice.created_at.desc())
    if not await is_admin(db, user):
        query = query.where(Notice.status == NoticeStatus.published)
    return list((await db.execute(query)).scalars().all())


async def _get_notice_or_404(db: AsyncSession, notice_id: uuid.UUID) -> Notice:
    result = await db.execute(
        select(Notice).options(selectinload(Notice.author)).where(Notice.id == notice_id)
    )
    notice = result.scalar_one_or_none()
    if notice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "공지사항을 찾을 수 없습니다.")
    return notice


@router.get("/{notice_id}", response_model=NoticeOut)
async def get_notice(
    notice_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Notice:
    notice = await _get_notice_or_404(db, notice_id)
    if notice.status != NoticeStatus.published and not await is_admin(db, user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "공지사항을 찾을 수 없습니다.")
    return notice


@router.patch("/{notice_id}", response_model=NoticeOut)
async def update_notice(
    notice_id: uuid.UUID,
    payload: NoticeUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Notice:
    notice = await _get_notice_or_404(db, notice_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(notice, field, value)
    await db.commit()
    await db.refresh(notice, attribute_names=["updated_at"])
    return notice


@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notice(
    notice_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    notice = await _get_notice_or_404(db, notice_id)
    await db.delete(notice)
    await db.commit()
