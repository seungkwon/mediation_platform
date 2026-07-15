import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import QuoteStatus
from app.schemas.common import AttachmentInput, ORMBase
from app.schemas.user import UserPublic


class QuoteAttachmentOut(ORMBase):
    id: uuid.UUID
    file_path: str
    original_filename: str


class QuoteCreate(BaseModel):
    price: int = Field(gt=0)
    delivery_days: int = Field(gt=0)
    description: str = Field(min_length=1)
    attachments: list[AttachmentInput] = []


class QuoteOut(ORMBase):
    """price/delivery_days/description/attachments는 구매자가 아직 오픈하지 않은(submitted) 견적의 경우
    비공개(None/빈 배열)로 마스킹되어 내려간다. 견적을 제출한 판매자 본인 또는 오픈/선택된 견적은 항상 전체 공개."""

    id: uuid.UUID
    service_request_id: uuid.UUID
    seller: UserPublic
    price: int | None = None
    delivery_days: int | None = None
    description: str | None = None
    status: QuoteStatus
    opened_at: datetime | None = None
    attachments: list[QuoteAttachmentOut] = []
    created_at: datetime
