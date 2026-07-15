"""소셜 로그인(OAuth2 Authorization Code) 연동.

각 Provider의 client_id/secret/redirect_uri는 .env에서 주입되며, 값이 비어있으면
해당 Provider 로그인은 501로 응답한다 (콘솔에서 앱 등록 후 .env에 채워 넣으면 바로 동작).
"""

import httpx

from app.core.config import settings
from app.models.enums import SocialProvider

TOKEN_URLS = {
    SocialProvider.naver: "https://nid.naver.com/oauth2.0/token",
    SocialProvider.kakao: "https://kauth.kakao.com/oauth/token",
    SocialProvider.google: "https://oauth2.googleapis.com/token",
    SocialProvider.apple: "https://appleid.apple.com/auth/token",
}

USERINFO_URLS = {
    SocialProvider.naver: "https://openapi.naver.com/v1/nid/me",
    SocialProvider.kakao: "https://kapi.kakao.com/v2/user/me",
    SocialProvider.google: "https://openidconnect.googleapis.com/v1/userinfo",
}


class OAuthProfile:
    def __init__(self, provider_user_id: str, email: str | None, name: str):
        self.provider_user_id = provider_user_id
        self.email = email
        self.name = name


def _client_credentials(provider: SocialProvider) -> tuple[str, str, str]:
    mapping = {
        SocialProvider.naver: (settings.naver_client_id, settings.naver_client_secret, settings.naver_redirect_uri),
        SocialProvider.kakao: (settings.kakao_client_id, settings.kakao_client_secret, settings.kakao_redirect_uri),
        SocialProvider.google: (
            settings.google_client_id,
            settings.google_client_secret,
            settings.google_redirect_uri,
        ),
        SocialProvider.apple: (settings.apple_client_id, settings.apple_client_secret, settings.apple_redirect_uri),
    }
    return mapping[provider]


async def exchange_code_and_fetch_profile(
    provider: SocialProvider, code: str, redirect_uri: str
) -> OAuthProfile:
    client_id, client_secret, _default_redirect = _client_credentials(provider)
    if not client_id or not client_secret:
        raise ValueError(f"{provider.value} OAuth 클라이언트 설정이 없습니다. 백엔드 .env를 확인하세요.")

    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            TOKEN_URLS[provider],
            data={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        token_resp.raise_for_status()
        token_data = token_resp.json()
        access_token = token_data["access_token"]

        if provider == SocialProvider.apple:
            # Apple은 id_token(JWT)에 사용자 정보가 포함됨 - 간이 디코드(서명 검증은 프로덕션에서 추가 필요)
            import jose.jwt as jose_jwt

            claims = jose_jwt.get_unverified_claims(token_data["id_token"])
            return OAuthProfile(
                provider_user_id=claims["sub"], email=claims.get("email"), name=claims.get("email", "Apple User")
            )

        userinfo_resp = await client.get(
            USERINFO_URLS[provider], headers={"Authorization": f"Bearer {access_token}"}
        )
        userinfo_resp.raise_for_status()
        data = userinfo_resp.json()

    if provider == SocialProvider.naver:
        info = data["response"]
        return OAuthProfile(provider_user_id=info["id"], email=info.get("email"), name=info.get("name", "Naver User"))
    if provider == SocialProvider.kakao:
        account = data.get("kakao_account", {})
        profile = account.get("profile", {})
        return OAuthProfile(
            provider_user_id=str(data["id"]),
            email=account.get("email"),
            name=profile.get("nickname", "Kakao User"),
        )
    if provider == SocialProvider.google:
        return OAuthProfile(
            provider_user_id=data["sub"], email=data.get("email"), name=data.get("name", "Google User")
        )

    raise ValueError(f"지원하지 않는 provider: {provider}")
