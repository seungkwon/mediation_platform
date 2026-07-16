import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import ServiceRequestStatus
from app.schemas.common import AttachmentInput, ORMBase
from app.schemas.user import UserPublic


class ServiceRequestImageOut(ORMBase):
    id: uuid.UUID
    file_path: str
    sort_order: int


class ServiceRequestAttachmentOut(ORMBase):
    id: uuid.UUID
    file_path: str
    original_filename: str
    size: int


class ServiceRequestCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    category_id: uuid.UUID | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    bid_deadline: datetime
    image_paths: list[str] = []
    attachments: list[AttachmentInput] = []

    @field_validator("bid_deadline")
    @classmethod
    def deadline_must_be_future(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("bid_deadline must include timezone info")
        return v


class ServiceRequestUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category_id: uuid.UUID | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    bid_deadline: datetime | None = None


class ServiceRequestSummary(ORMBase):
    id: uuid.UUID
    buyer: UserPublic
    title: str
    category_id: uuid.UUID | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    bid_deadline: datetime
    status: ServiceRequestStatus
    quote_count: int = 0
    created_at: datetime


class ServiceRequestOut(ORMBase):
    id: uuid.UUID
    buyer: UserPublic
    title: str
    description: str
    category_id: uuid.UUID | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    bid_deadline: datetime
    status: ServiceRequestStatus
    selected_quote_id: uuid.UUID | None = None
    images: list[ServiceRequestImageOut] = []
    attachments: list[ServiceRequestAttachmentOut] = []
    created_at: datetime
    updated_at: datetime
