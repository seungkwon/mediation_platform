import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_current_user, is_admin
from app.db.session import get_db
from app.models.enums import QnaStatus
from app.models.qna import QnaPost
from app.models.user import User
from app.schemas.qna import QnaAnswerUpdate, QnaPostCreate, QnaPostOut, QnaPostSummary, QnaPostUpdate

router = APIRouter(prefix="/qna", tags=["qna"])


@router.post("", response_model=QnaPostOut, status_code=status.HTTP_201_CREATED)
async def create_qna_post(
    payload: QnaPostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QnaPost:
    post = QnaPost(author_id=user.id, **payload.model_dump())
    db.add(post)
    await db.commit()
    await db.refresh(post, attribute_names=["author"])
    return post


@router.get("", response_model=list[QnaPostSummary])
async def list_qna_posts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[QnaPost]:
    query = select(QnaPost).order_by(QnaPost.created_at.desc())
    return list((await db.execute(query)).scalars().all())


async def _get_qna_post_or_404(db: AsyncSession, post_id: uuid.UUID) -> QnaPost:
    result = await db.execute(
        select(QnaPost).options(selectinload(QnaPost.author)).where(QnaPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "질문을 찾을 수 없습니다.")
    return post


@router.get("/{post_id}", response_model=QnaPostOut)
async def get_qna_post(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QnaPost:
    return await _get_qna_post_or_404(db, post_id)


@router.patch("/{post_id}", response_model=QnaPostOut)
async def update_qna_post(
    post_id: uuid.UUID,
    payload: QnaPostUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QnaPost:
    post = await _get_qna_post_or_404(db, post_id)
    if post.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 질문만 수정할 수 있습니다.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    await db.commit()
    await db.refresh(post, attribute_names=["updated_at"])
    return post


@router.patch("/{post_id}/answer", response_model=QnaPostOut)
async def answer_qna_post(
    post_id: uuid.UUID,
    payload: QnaAnswerUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> QnaPost:
    post = await _get_qna_post_or_404(db, post_id)
    post.answer = payload.answer
    post.answered_at = datetime.now(timezone.utc)
    post.status = QnaStatus.answered
    await db.commit()
    await db.refresh(post, attribute_names=["updated_at"])
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_qna_post(
    post_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    post = await _get_qna_post_or_404(db, post_id)
    if post.author_id != user.id and not await is_admin(db, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 질문 또는 관리자만 삭제할 수 있습니다.")
    await db.delete(post)
    await db.commit()
