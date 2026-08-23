"""Local Supabase access-token verification + Redis blacklist.

Prefers HS256 local verify when SUPABASE_JWT_SECRET is set and correct.
On missing/blank/wrong secret, falls back to GoTrue /auth/v1/user so /me
never dies on a bad Cloud Run env value.
"""

from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Any

import httpx
import jwt
import redis
from fastapi import HTTPException

from core.config import settings, get_supabase_jwt_secret

logger = logging.getLogger("saas_engine.auth_jwt")

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

TOKEN_BLACKLIST_PREFIX = "auth_blacklist:"
BLACKLIST_MIN_TTL_SECONDS = 60
BLACKLIST_MAX_TTL_SECONDS = 60 * 60 * 24 * 7
_logged_missing_jwt_secret = False
_logged_local_jwt_fallback = False


def _blacklist_key(token: str) -> str:
    return f"{TOKEN_BLACKLIST_PREFIX}{token}"


def token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]


def remaining_token_ttl_seconds(token: str, fallback: int = 3600) -> int:
    """TTL for blacklist entries = remaining JWT lifetime (clamped)."""
    try:
        unverified = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False},
            algorithms=["HS256", "ES256", "RS256"],
        )
        exp = unverified.get("exp")
        if exp is None:
            return max(BLACKLIST_MIN_TTL_SECONDS, min(fallback, BLACKLIST_MAX_TTL_SECONDS))
        remaining = int(exp) - int(time.time())
        return max(
            BLACKLIST_MIN_TTL_SECONDS,
            min(
                remaining if remaining > 0 else BLACKLIST_MIN_TTL_SECONDS,
                BLACKLIST_MAX_TTL_SECONDS,
            ),
        )
    except Exception:
        return max(BLACKLIST_MIN_TTL_SECONDS, min(fallback, BLACKLIST_MAX_TTL_SECONDS))


def is_token_blacklisted(token: str) -> bool:
    try:
        return bool(redis_client.get(_blacklist_key(token)))
    except Exception as exc:
        # Local Docker often has no Redis. Fail-open so a cache outage
        # cannot log everyone out (middleware + /auth/me would 503 → login).
        logger.error("Redis blacklist read error (fail-open): %s", exc)
        return False


def blacklist_auth_token(token: str | None) -> None:
    """Revoke an access token until its natural expiry."""
    if not token:
        return
    ttl = remaining_token_ttl_seconds(token)
    try:
        redis_client.setex(_blacklist_key(token), ttl, "1")
        redis_client.delete(f"auth_token:{token}")
    except Exception as exc:
        logger.error("Redis blacklist write error: %s", exc)


def _jwt_secret() -> str:
    """Non-empty JWT secret from process env / settings, or ''."""
    for candidate in (
        os.environ.get("SUPABASE_JWT_SECRET"),
        getattr(settings, "supabase_jwt_secret", None),
        get_supabase_jwt_secret(),
    ):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return ""


def _normalize_token(token: str) -> str:
    t = (token or "").strip()
    if t.lower().startswith("bearer "):
        t = t[7:].strip()
    return t


def _identity_from_user_payload(user: dict[str, Any]) -> dict[str, Any]:
    meta = user.get("user_metadata") or {}
    if not isinstance(meta, dict):
        meta = {}
    email = str(user.get("email") or "").lower().strip()
    user_id = user.get("id") or user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    return {
        "user_id": str(user_id),
        "email": email,
        "user_metadata": meta,
        "claims": {},
        "exp": None,
    }


def _verify_via_supabase_auth(token: str) -> dict[str, Any]:
    """Validate token with GoTrue (works without SUPABASE_JWT_SECRET)."""
    base = (settings.supabase_url or "").rstrip("/")
    anon = settings.supabase_key or ""
    if not base or not anon:
        logger.error("Supabase URL/key missing for auth fallback")
        raise HTTPException(status_code=500, detail="Auth provider not configured")

    url = f"{base}/auth/v1/user"
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": anon,
                },
            )
    except Exception as exc:
        logger.error("GoTrue /auth/v1/user request failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid session") from exc

    if res.status_code == 401 or res.status_code == 403:
        raise HTTPException(status_code=401, detail="Invalid session")
    if res.status_code >= 400:
        logger.error("GoTrue /auth/v1/user status=%s body=%s", res.status_code, res.text[:200])
        raise HTTPException(status_code=401, detail="Invalid session")

    try:
        payload = res.json()
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc

    # Some responses nest under "user"
    user = payload.get("user") if isinstance(payload.get("user"), dict) else payload
    if not isinstance(user, dict):
        raise HTTPException(status_code=401, detail="Invalid session")
    return _identity_from_user_payload(user)


def _verify_local_jwt(token: str, secret: str) -> dict[str, Any]:
    try:
        claims = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Session expired") from exc
    except jwt.InvalidAudienceError:
        claims = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        raise

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    email = str(claims.get("email") or "").lower().strip()
    meta = claims.get("user_metadata") or {}
    if not isinstance(meta, dict):
        meta = {}

    return {
        "user_id": str(user_id),
        "email": email,
        "user_metadata": meta,
        "claims": claims,
        "exp": claims.get("exp"),
    }


def verify_access_token(token: str, *, check_blacklist: bool = True) -> dict[str, Any]:
    """Verify signature + exp (local), or GoTrue fallback; then Redis blacklist."""
    token = _normalize_token(token)
    if not token or len(token) < 20:
        raise HTTPException(status_code=401, detail="Invalid session")

    if check_blacklist:
        try:
            if is_token_blacklisted(token):
                raise HTTPException(status_code=401, detail="Session revoked")
        except HTTPException:
            raise

    secret = _jwt_secret()

    if secret:
        try:
            return _verify_local_jwt(token, secret)
        except HTTPException:
            # Expired / revoked-style errors must not fall back
            raise
        except jwt.PyJWTError as exc:
            # Wrong secret, new asymmetric JWT, etc. → Auth API
            global _logged_local_jwt_fallback
            if not _logged_local_jwt_fallback:
                _logged_local_jwt_fallback = True
                logger.warning(
                    "Local JWT verify failed (%s) — falling back to GoTrue /auth/v1/user "
                    "(further failures suppressed)",
                    type(exc).__name__,
                )

    else:
        global _logged_missing_jwt_secret
        if not _logged_missing_jwt_secret:
            _logged_missing_jwt_secret = True
            logger.warning(
                "SUPABASE_JWT_SECRET missing/empty — falling back to GoTrue /auth/v1/user "
                "(further warnings suppressed; set the secret in backend/.env for local speed)"
            )

    return _verify_via_supabase_auth(token)
