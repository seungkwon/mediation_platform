"""애플 로그인의 client_secret은 정적 문자열이 아니라, 팀ID/키ID/개인키(.p8)로 서명한
ES256 JWT(만료 6개월 이내)여야 한다. 매 호출마다 짧게 만료되는 JWT를 새로 발급한다.
"""

from datetime import datetime, timedelta, timezone
from pathlib import Path

from jose import jwt

from app.core.config import settings

APPLE_AUDIENCE = "https://appleid.apple.com"


def generate_apple_client_secret() -> str:
    if not (settings.apple_team_id and settings.apple_key_id and settings.apple_private_key_path):
        raise ValueError("Apple OAuth 클라이언트 설정이 없습니다. 백엔드 .env를 확인하세요.")

    private_key_path = Path(settings.apple_private_key_path)
    if not private_key_path.is_file():
        raise ValueError(f"Apple 개인키 파일을 찾을 수 없습니다: {private_key_path}")

    private_key = private_key_path.read_text()
    now = datetime.now(timezone.utc)
    claims = {
        "iss": settings.apple_team_id,
        "iat": now,
        "exp": now + timedelta(minutes=5),
        "aud": APPLE_AUDIENCE,
        "sub": settings.apple_client_id,
    }
    return jwt.encode(claims, private_key, algorithm="ES256", headers={"kid": settings.apple_key_id})
