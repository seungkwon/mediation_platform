import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import FaqStatus
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class FaqPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str
    status: FaqStatus = FaqStatus.draft


class FaqPostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    status: FaqStatus | None = None


class FaqPostOut(ORMBase):
    id: uuid.UUID
    author: UserPublic
    title: str
    content: str
    status: FaqStatus
    created_at: datetime
    updated_at: datetime


class FaqPostSummary(ORMBase):
    id: uuid.UUID
    title: str
    status: FaqStatus
    created_at: datetime
