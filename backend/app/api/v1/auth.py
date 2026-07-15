import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    TokenType,
)
from app.db.session import get_db
from app.models.seller import SellerProfile
from app.models.user import SocialAccount, User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    OAuthCallbackRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.user import UserMe
from app.services.oauth import exchange_code_and_fetch_profile

router = APIRouter(prefix="/auth", tags=["auth"])


async def _build_user_me(db: AsyncSession, user: User) -> UserMe:
    result = await db.execute(select(SellerProfile.id).where(SellerProfile.user_id == user.id))
    has_seller_profile = result.scalar_one_or_none() is not None
    user_me = UserMe.model_validate(user)
    user_me.has_seller_profile = has_seller_profile
    return user_me


async def _issue_tokens(db: AsyncSession, user: User) -> TokenResponse:
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


@router.post("/{provider}/callback", response_model=TokenResponse)
async def oauth_callback(
    provider: str, payload: OAuthCallbackRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
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
    else:
        user = None
        if profile.email:
            existing = await db.execute(select(User).where(User.email == profile.email))
            user = existing.scalar_one_or_none()
        if user is None:
            user = User(
                email=profile.email or f"{payload.provider.value}_{profile.provider_user_id}@social.local",
                password_hash=None,
                name=profile.name,
            )
            db.add(user)
            await db.flush()
        db.add(SocialAccount(user_id=user.id, provider=payload.provider, provider_user_id=profile.provider_user_id))
        await db.commit()
        await db.refresh(user)

    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "비활성화된 계정입니다.")
    return await _issue_tokens(db, user)


@router.get("/me", response_model=UserMe)
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> UserMe:
    return await _build_user_me(db, user)
