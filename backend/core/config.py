from __future__ import annotations

import os
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings. Env vars win over .env (Cloud Run injects process env at start)."""

    # snake_case fields ← SUPABASE_URL / SUPABASE_KEY / ... (case-insensitive)
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = Field(
        default="",
        # Explicit aliases — do not rely on name mangling alone
        validation_alias=AliasChoices(
            "SUPABASE_JWT_SECRET",
            "supabase_jwt_secret",
            "Supabase_Jwt_Secret",
        ),
    )

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
        # Allow both field name and validation_alias to populate
        populate_by_name=True,
        # Empty "" from a baked .env must not override a real value from later sources
        env_ignore_empty=True,
    )


settings = Settings()


def _read_secret_file(path: str) -> str:
    try:
        p = Path(path)
        if p.is_file():
            return p.read_text(encoding="utf-8").strip()
    except OSError:
        pass
    return ""


def get_supabase_jwt_secret() -> str:
    """Always resolve JWT secret from the live process environment first.

    Cloud Run injects vars into os.environ — read them with os.getenv explicitly.
    Also support Secret Manager volume mounts and Pydantic Settings as fallbacks.
    """
    # 1) Hard os.getenv (what Cloud Run / Docker actually inject)
    for key in (
        "SUPABASE_JWT_SECRET",
        "supabase_jwt_secret",
        "SUPABASE_JWT_SECRET".lower(),
    ):
        value = os.getenv(key)
        if value is not None and value.strip():
            return value.strip()

    # 2) Scan environ for any JWT-related key (typos / alternate names)
    for key, value in os.environ.items():
        if "JWT" in key.upper() and "SECRET" in key.upper() and value and value.strip():
            return value.strip()

    # 3) Cloud Run secret volume mounts (when not exposed as env vars)
    for path in (
        "/secrets/SUPABASE_JWT_SECRET",
        "/var/secrets/SUPABASE_JWT_SECRET",
        "/etc/secrets/SUPABASE_JWT_SECRET",
        os.path.join(os.getcwd(), "secrets", "SUPABASE_JWT_SECRET"),
    ):
        mounted = _read_secret_file(path)
        if mounted:
            return mounted

    # 4) Pydantic Settings (after aliases / .env)
    from_settings = (settings.supabase_jwt_secret or "").strip()
    if from_settings:
        return from_settings

    return ""


def supabase_jwt_secret_diag() -> dict:
    """Safe diagnostics for /health — never returns the secret value."""
    raw = os.getenv("SUPABASE_JWT_SECRET")
    return {
        "getenv_present": raw is not None,
        "getenv_non_empty": bool(raw and raw.strip()),
        "getenv_length": len(raw.strip()) if raw and raw.strip() else 0,
        "settings_non_empty": bool((settings.supabase_jwt_secret or "").strip()),
        "resolved": bool(get_supabase_jwt_secret()),
        "environ_jwt_keys": sorted(
            k
            for k in os.environ
            if "JWT" in k.upper() and "SECRET" in k.upper()
        ),
    }
