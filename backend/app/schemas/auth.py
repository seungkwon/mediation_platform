from typing import Literal

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


class OAuthCallbackResult(ORMBase):
    status: Literal["issued", "link_required", "signup_required"]
    # status == "issued"
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: UserMe | None = None
    # status == "link_required"
    link_token: str | None = None
    masked_email: str | None = None
    # status == "signup_required" (link_required도 provider를 함께 내려줌)
    signup_token: str | None = None
    provider: SocialProvider | None = None


class OAuthLinkConfirmRequest(BaseModel):
    link_token: str
    password: str


class OAuthCompleteSignupRequest(BaseModel):
    signup_token: str
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    phone: str | None = None
