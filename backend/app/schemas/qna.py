import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import QnaStatus
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class QnaPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str


class QnaPostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None


class QnaAnswerUpdate(BaseModel):
    answer: str = Field(min_length=1)


class QnaPostOut(ORMBase):
    id: uuid.UUID
    author: UserPublic
    title: str
    content: str
    status: QnaStatus
    answer: str | None = None
    answered_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class QnaPostSummary(ORMBase):
    id: uuid.UUID
    title: str
    status: QnaStatus
    created_at: datetime
