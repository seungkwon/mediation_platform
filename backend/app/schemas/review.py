import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class ReviewCreate(BaseModel):
    service_request_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    content: str = Field(min_length=1)


class ReviewOut(ORMBase):
    id: uuid.UUID
    service_request_id: uuid.UUID
    reviewer: UserPublic
    reviewee_id: uuid.UUID
    rating: int
    content: str
    created_at: datetime
