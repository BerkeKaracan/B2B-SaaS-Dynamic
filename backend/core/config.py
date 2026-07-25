from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Never call load_dotenv(override=True). Process env from Cloud Run must win.


def _should_load_dotenv_file() -> bool:
    """Local/dev only. Cloud Run sets K_SERVICE; production must not read /app/.env."""
    if os.getenv("K_SERVICE"):
        return False
    env = (os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or "").strip().lower()
    if env in {"production", "prod"}:
        return False
    return True


_ENV_FILE: str | None = ".env" if _should_load_dotenv_file() else None


class Settings(BaseSettings):
    """App settings. On Cloud Run, only process environment is used (no .env file)."""

    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = Field(
        default="",
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
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        populate_by_name=True,
        env_ignore_empty=True,
    )


settings = Settings()

_SECRET_MOUNT_DIRS = (
    Path("/secrets"),
    Path("/var/secrets"),
    Path("/etc/secrets"),
    Path(os.getcwd()) / "secrets",
)

_SECRET_FILE_NAMES = (
    "SUPABASE_JWT_SECRET",
    "supabase_jwt_secret",
)


def _read_secret_file(path: Path) -> str:
    try:
        if path.is_file():
            return path.read_text(encoding="utf-8").strip()
    except OSError:
        pass
    return ""


def _iter_secret_mount_files() -> list[Path]:
    found: list[Path] = []
    for base in _SECRET_MOUNT_DIRS:
        try:
            if not base.is_dir():
                continue
            for name in _SECRET_FILE_NAMES:
                candidate = base / name
                if candidate.is_file():
                    found.append(candidate)
            # Also accept any single file whose name looks like the JWT secret key
            for child in base.iterdir():
                if not child.is_file():
                    continue
                upper = child.name.upper()
                if "JWT" in upper and "SECRET" in upper and child not in found:
                    found.append(child)
        except OSError:
            continue
    return found


def get_supabase_jwt_secret() -> str:
    """Resolve JWT secret without mutating os.environ.

    Precedence:
      1) os.environ (Cloud Run / Docker process env) — always first
      2) scan os.environ for *JWT*SECRET*
      3) secret volume mount files
      4) Pydantic Settings (local .env only when enabled)
    """
    # 1) Explicit process env (same pattern as auth dependency)
    secret = os.environ.get("SUPABASE_JWT_SECRET") or ""
    if secret.strip():
        return secret.strip()
    secret = os.environ.get("supabase_jwt_secret") or ""
    if secret.strip():
        return secret.strip()

    # 2) Alternate names already present in the process environment
    for key, value in os.environ.items():
        if "JWT" in key.upper() and "SECRET" in key.upper() and value and value.strip():
            return value.strip()

    # 3) Volume mounts (Cloud Run "mount as volume" — not visible to os.getenv)
    for path in _iter_secret_mount_files():
        mounted = _read_secret_file(path)
        if mounted:
            return mounted

    # Known fixed paths (even if parent listing fails)
    for path in (
        Path("/secrets/SUPABASE_JWT_SECRET"),
        Path("/var/secrets/SUPABASE_JWT_SECRET"),
        Path("/etc/secrets/SUPABASE_JWT_SECRET"),
        Path(os.getcwd()) / "secrets" / "SUPABASE_JWT_SECRET",
    ):
        mounted = _read_secret_file(path)
        if mounted:
            return mounted

    # 4) Settings (populated from process env, or local .env when allowed)
    from_settings = (settings.supabase_jwt_secret or "").strip()
    if from_settings:
        return from_settings

    return ""


def supabase_jwt_secret_diag() -> dict[str, Any]:
    """Safe diagnostics for /api/health/auth — never returns secret values."""
    raw = os.getenv("SUPABASE_JWT_SECRET")
    mount_dirs = [str(p) for p in _SECRET_MOUNT_DIRS if p.is_dir()]
    mount_files = [str(p) for p in _iter_secret_mount_files()]
    dotenv_path = Path("/app/.env")
    if not dotenv_path.exists():
        dotenv_path = Path(os.getcwd()) / ".env"

    return {
        "k_service": os.getenv("K_SERVICE"),
        "dotenv_loading_enabled": _ENV_FILE is not None,
        "dotenv_file_present": dotenv_path.is_file(),
        "dotenv_file_path": str(dotenv_path) if dotenv_path.is_file() else None,
        "supabase_url_getenv_present": os.getenv("SUPABASE_URL") is not None,
        "getenv_present": raw is not None,
        "getenv_non_empty": bool(raw and raw.strip()),
        "getenv_length": len(raw.strip()) if raw and raw.strip() else 0,
        "settings_non_empty": bool((settings.supabase_jwt_secret or "").strip()),
        "secret_mount_dirs": mount_dirs,
        "secret_mount_files": mount_files,
        "resolved": bool(get_supabase_jwt_secret()),
        "environ_jwt_keys": sorted(
            k for k in os.environ if "JWT" in k.upper() and "SECRET" in k.upper()
        ),
    }
