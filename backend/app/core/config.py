from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://mediation:mediation@localhost:5432/mediation_platform"

    jwt_secret_key: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    frontend_origin: str = "http://localhost:5174"

    upload_dir: str = "uploads"
    max_image_size_mb: int = 10
    max_video_size_mb: int = 100
    max_resource_size_mb: int = 500

    # redirect_uri는 프론트가 매 요청마다 계산해 백엔드로 함께 보내므로 여기서는 보관하지 않는다.
    # 각 Provider 콘솔에 등록할 값은 .env.example의 안내 주석을 참고.
    naver_client_id: str = ""
    naver_client_secret: str = ""

    kakao_client_id: str = ""
    kakao_client_secret: str = ""

    google_client_id: str = ""
    google_client_secret: str = ""

    apple_client_id: str = ""
    apple_team_id: str = ""
    apple_key_id: str = ""
    apple_private_key_path: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
