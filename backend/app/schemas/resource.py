import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ResourceStatus
from app.schemas.common import AttachmentInput, ORMBase
from app.schemas.user import UserPublic


class ResourceAttachmentOut(ORMBase):
    id: uuid.UUID
    file_path: str
    original_filename: str
    size: int
    sort_order: int


class ResourceAttachmentCreate(AttachmentInput):
    sort_order: int = 0


class ResourcePostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str
    status: ResourceStatus = ResourceStatus.draft
    attachments: list[ResourceAttachmentCreate] = []


class ResourcePostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    status: ResourceStatus | None = None
    attachments: list[ResourceAttachmentCreate] | None = None


class ResourcePostOut(ORMBase):
    id: uuid.UUID
    author: UserPublic
    title: str
    content: str
    status: ResourceStatus
    attachments: list[ResourceAttachmentOut] = []
    created_at: datetime
    updated_at: datetime


class ResourcePostSummary(ORMBase):
    id: uuid.UUID
    title: str
    status: ResourceStatus
    attachment_count: int = 0
    created_at: datetime
