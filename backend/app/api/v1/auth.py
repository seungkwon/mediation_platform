import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, is_admin
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_oauth_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    TokenType,
)
from app.db.session import get_db
from app.models.enums import SocialProvider
from app.models.seller import SellerProfile
from app.models.user import SocialAccount, User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    OAuthCallbackRequest,
    OAuthCallbackResult,
    OAuthCompleteSignupRequest,
    OAuthLinkConfirmRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.user import UserMe
from app.services.oauth import exchange_code_and_fetch_profile

router = APIRouter(prefix="/auth", tags=["auth"])


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    visible = local[:2] if len(local) > 2 else local[:1]
    return f"{visible}{'*' * max(len(local) - len(visible), 1)}@{domain}"


def _issued_result(tokens: TokenResponse) -> OAuthCallbackResult:
    return OAuthCallbackResult(
        status="issued",
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        user=tokens.user,
    )


async def _build_user_me(db: AsyncSession, user: User) -> UserMe:
    result = await db.execute(select(SellerProfile.id).where(SellerProfile.user_id == user.id))
    has_seller_profile = result.scalar_one_or_none() is not None
    user_me = UserMe.model_validate(user)
    user_me.has_seller_profile = has_seller_profile
    user_me.is_admin = await is_admin(db, user)
    return user_me


async def _issue_tokens(db: AsyncSession, user: User) -> TokenResponse:
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=await _build_user_me(db, user),
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 가입된 이메일입니다.")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        phone=payload.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return await _issue_tokens(db, user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user is None or user.password_hash is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "비활성화된 계정입니다.")
    return await _issue_tokens(db, user)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> AccessTokenResponse:
    try:
        claims = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다.")
    if claims.get("type") != TokenType.refresh.value:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "리프레시 토큰이 아닙니다.")

    user = await db.get(User, uuid.UUID(claims["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "사용자를 찾을 수 없습니다.")
    return AccessTokenResponse(access_token=create_access_token(user.id))


@router.post("/{provider}/callback", response_model=OAuthCallbackResult)
async def oauth_callback(
    provider: str, payload: OAuthCallbackRequest, db: AsyncSession = Depends(get_db)
) -> OAuthCallbackResult:
    try:
        profile = await exchange_code_and_fetch_profile(payload.provider, payload.code, payload.redirect_uri)
    except ValueError as exc:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, str(exc))
    except Exception:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "소셜 로그인 제공자와 통신에 실패했습니다.")

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.provider == payload.provider,
            SocialAccount.provider_user_id == profile.provider_user_id,
        )
    )
    social_account = result.scalar_one_or_none()

    if social_account is not None:
        user = await db.get(User, social_account.user_id)
        if user is None or not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "비활성화된 계정입니다.")
        return _issued_result(await _issue_tokens(db, user))

    if profile.email is None:
        signup_token = create_oauth_token(
            {
                "provider": payload.provider.value,
                "provider_user_id": profile.provider_user_id,
                "name": profile.name,
            },
            TokenType.oauth_signup,
            expires_minutes=10,
        )
        return OAuthCallbackResult(status="signup_required", signup_token=signup_token, provider=payload.provider)

    existing_result = await db.execute(select(User).where(User.email == profile.email))
    existing_user = existing_result.scalar_one_or_none()

    if existing_user is None:
        user = User(email=profile.email, password_hash=None, name=profile.name)
        db.add(user)
        await db.flush()
        db.add(SocialAccount(user_id=user.id, provider=payload.provider, provider_user_id=profile.provider_user_id))
        await db.commit()
        await db.refresh(user)
        return _issued_result(await _issue_tokens(db, user))

    if not existing_user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "비활성화된 계정입니다.")

    if existing_user.password_hash is not None:
        link_token = create_oauth_token(
            {
                "provider": payload.provider.value,
                "provider_user_id": profile.provider_user_id,
                "user_id": str(existing_user.id),
            },
            TokenType.oauth_link,
            expires_minutes=5,
        )
        return OAuthCallbackResult(
            status="link_required", link_token=link_token, masked_email=_mask_email(existing_user.email)
        )

    # 비밀번호 없이 다른 소셜 계정으로만 만들어진 사용자 — 보호할 자격증명이 없으므로 바로 연결
    db.add(
        SocialAccount(user_id=existing_user.id, provider=payload.provider, provider_user_id=profile.provider_user_id)
    )
    await db.commit()
    await db.refresh(existing_user)
    return _issued_result(await _issue_tokens(db, existing_user))


@router.post("/{provider}/link-confirm", response_model=TokenResponse)
async def oauth_link_confirm(
    provider: str, payload: OAuthLinkConfirmRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    try:
        claims = decode_token(payload.link_token)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않거나 만료된 연결 요청입니다.")
    if claims.get("type") != TokenType.oauth_link.value or claims.get("provider") != provider:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않은 토큰입니다.")

    user = await db.get(User, uuid.UUID(claims["user_id"]))
    if user is None or user.password_hash is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "비밀번호가 올바르지 않습니다.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "비활성화된 계정입니다.")

    provider_enum = SocialProvider(claims["provider"])
    existing = await db.execute(
        select(SocialAccount).where(
            SocialAccount.provider == provider_enum,
            SocialAccount.provider_user_id == claims["provider_user_id"],
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(
            SocialAccount(user_id=user.id, provider=provider_enum, provider_user_id=claims["provider_user_id"])
        )
        await db.commit()
    return await _issue_tokens(db, user)


@router.post("/{provider}/complete-signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def oauth_complete_signup(
    provider: str, payload: OAuthCompleteSignupRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    try:
        claims = decode_token(payload.signup_token)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않거나 만료된 가입 요청입니다.")
    if claims.get("type") != TokenType.oauth_signup.value or claims.get("provider") != provider:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않은 토큰입니다.")

    existing_result = await db.execute(select(User).where(User.email == payload.email))
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "이미 가입된 이메일입니다. 이메일/비밀번호로 로그인 후 계정을 연결해주세요."
        )

    user = User(email=payload.email, password_hash=None, name=payload.name, phone=payload.phone)
    db.add(user)
    await db.flush()
    db.add(
        SocialAccount(
            user_id=user.id,
            provider=SocialProvider(claims["provider"]),
            provider_user_id=claims["provider_user_id"],
        )
    )
    await db.commit()
    await db.refresh(user)
    return await _issue_tokens(db, user)


@router.post("/apple/form-callback", include_in_schema=False)
async def apple_form_callback(
    code: str | None = Form(None), state: str | None = Form(None), error: str | None = Form(None)
) -> RedirectResponse:
    """애플은 name/email 스코프 요청 시 response_mode=form_post로만 콜백을 보낸다.
    SPA는 POST 바디를 읽을 수 없으므로, 백엔드가 대신 받아 code/state를 쿼리스트링으로
    프론트 콜백 라우트(GET)에 302 리다이렉트한다."""
    params: dict[str, str] = {}
    if code:
        params["code"] = code
    if state:
        params["state"] = state
    if error:
        params["error"] = error
    return RedirectResponse(
        f"{settings.frontend_origin}/oauth/callback/apple?{urlencode(params)}",
        status_code=status.HTTP_302_FOUND,
    )


@router.get("/me", response_model=UserMe)
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> UserMe:
    return await _build_user_me(db, user)
