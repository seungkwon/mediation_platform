import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import QuoteStatus
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class QuoteAttachmentOut(ORMBase):
    id: uuid.UUID
    file_path: str
    original_filename: str


class QuoteCreate(BaseModel):
    price: int = Field(gt=0)
    delivery_days: int = Field(gt=0)
    description: str = Field(min_length=1)
    attachment_paths: list[str] = []


class QuoteUpdate(BaseModel):
    price: int | None = Field(default=None, gt=0)
    delivery_days: int | None = Field(default=None, gt=0)
    description: str | None = None


class QuoteSummary(ORMBase):
    """구매자가 견적을 오픈하기 전 목록에서 보는 요약 정보 (가격 등 상세는 오픈 후 공개)"""

    id: uuid.UUID
    seller: UserPublic
    status: QuoteStatus
    created_at: datetime


class QuoteOut(ORMBase):
    id: uuid.UUID
    service_request_id: uuid.UUID
    seller: UserPublic
    price: int
    delivery_days: int
    description: str
    status: QuoteStatus
    opened_at: datetime | None = None
    attachments: list[QuoteAttachmentOut] = []
    created_at: datetime
