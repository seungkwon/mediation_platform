import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import PortfolioStatus
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class SellerProfileCreate(BaseModel):
    headline: str | None = Field(default=None, max_length=255)
    bio: str | None = None
    category_id: uuid.UUID | None = None
    career_years: int | None = None


class SellerProfileUpdate(SellerProfileCreate):
    pass


class SellerProfileOut(ORMBase):
    id: uuid.UUID
    user: UserPublic
    headline: str | None = None
    bio: str | None = None
    category_id: uuid.UUID | None = None
    career_years: int | None = None
    review_count: int = 0
    average_rating: float | None = None
    created_at: datetime


class PortfolioPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str
    status: PortfolioStatus = PortfolioStatus.draft


class PortfolioPostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    status: PortfolioStatus | None = None


class PortfolioPostOut(ORMBase):
    id: uuid.UUID
    seller_profile_id: uuid.UUID
    title: str
    content: str
    status: PortfolioStatus
    created_at: datetime
    updated_at: datetime


class PortfolioPostSummary(ORMBase):
    id: uuid.UUID
    title: str
    status: PortfolioStatus
    thumbnail: str | None = None
    created_at: datetime
