import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import NoticeStatus
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class NoticeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str
    status: NoticeStatus = NoticeStatus.draft


class NoticeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    status: NoticeStatus | None = None


class NoticeOut(ORMBase):
    id: uuid.UUID
    author: UserPublic
    title: str
    content: str
    status: NoticeStatus
    created_at: datetime
    updated_at: datetime


class NoticeSummary(ORMBase):
    id: uuid.UUID
    title: str
    status: NoticeStatus
    created_at: datetime
