import uuid
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.common import ORMBase


class UserPublic(ORMBase):
    id: uuid.UUID
    name: str
    profile_image_path: str | None = None


class UserMe(ORMBase):
    id: uuid.UUID
    email: EmailStr
    name: str
    phone: str | None = None
    profile_image_path: str | None = None
    is_active: bool
    created_at: datetime
    has_seller_profile: bool = False
    is_admin: bool = False


class UserUpdate(ORMBase):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = None
    profile_image_path: str | None = None
