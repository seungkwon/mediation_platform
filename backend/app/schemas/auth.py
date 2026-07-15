from pydantic import BaseModel, EmailStr, Field

from app.models.enums import SocialProvider
from app.schemas.common import ORMBase
from app.schemas.user import UserMe


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    name: str = Field(min_length=1, max_length=100)
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(ORMBase):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserMe


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(ORMBase):
    access_token: str
    token_type: str = "bearer"


class OAuthCallbackRequest(BaseModel):
    provider: SocialProvider
    code: str
    redirect_uri: str
