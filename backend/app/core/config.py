from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://mediation:mediation@localhost:5432/mediation_platform"

    jwt_secret_key: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    frontend_origin: str = "http://localhost:5173"

    upload_dir: str = "uploads"
    max_image_size_mb: int = 10
    max_video_size_mb: int = 100
    max_resource_size_mb: int = 500

    naver_client_id: str = ""
    naver_client_secret: str = ""
    naver_redirect_uri: str = ""

    kakao_client_id: str = ""
    kakao_client_secret: str = ""
    kakao_redirect_uri: str = ""

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""

    apple_client_id: str = ""
    apple_client_secret: str = ""
    apple_redirect_uri: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
