from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    # Keep snake_case field names — pydantic-settings maps SUPABASE_URL → supabase_url, etc.
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str
    # Cloud Run / .env: SUPABASE_JWT_SECRET (must match other supabase_* naming)
    supabase_jwt_secret: str = Field(default="")

    REDIS_URL: str

    SENTRY_DSN: str | None = None

    AWS_REGION: str | None = None
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_S3_BUCKET_NAME: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        # Empty values in a baked .env must not block real process env
        env_ignore_empty=True,
    )


settings = Settings()


def get_supabase_jwt_secret() -> str:
    """Resolve JWT secret with process env first (Cloud Run), then Settings.

    Prefer os.environ so a missing/empty Settings default or image .env cannot
    hide SUPABASE_JWT_SECRET that is injected at runtime.
    """
    for key in ("SUPABASE_JWT_SECRET", "supabase_jwt_secret"):
        raw = os.environ.get(key)
        if raw is not None and str(raw).strip():
            return str(raw).strip()
    return (settings.supabase_jwt_secret or "").strip()
