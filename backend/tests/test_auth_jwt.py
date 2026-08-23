"""Unit tests for local JWT verify + GoTrue fallback (no live Supabase)."""

from __future__ import annotations

import time
from unittest.mock import MagicMock

import jwt
import pytest
from fastapi import HTTPException

from conftest import DUMMY_JWT_SECRET
from core import auth_jwt

# Explicit in-file dummy — never a real project JWT secret.
TEST_SECRET = "unit-test-jwt-secret-not-for-prod-32b+"
WRONG_SECRET = "wrong-secret-value-xxxxxxxxxxxxxxxx"


def _mint_token(
    *,
    secret: str = TEST_SECRET,
    exp_offset: int = 3600,
    sub: str = "user-123",
    email: str = "user@example.com",
    audience: str = "authenticated",
) -> str:
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": email,
        "exp": now + exp_offset,
        "iat": now,
        "aud": audience,
        "user_metadata": {"name": "Test"},
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def _clear_jwt_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.setattr(auth_jwt.settings, "supabase_jwt_secret", "", raising=False)
    monkeypatch.setattr(auth_jwt, "get_supabase_jwt_secret", lambda: "")
    # Avoid Redis during blacklist checks unless a test opts in
    mock_redis = MagicMock()
    mock_redis.get.return_value = None
    monkeypatch.setattr(auth_jwt, "redis_client", mock_redis)
    yield


def test_minted_tokens_use_dummy_secret_only():
    assert "unit-test" in TEST_SECRET
    assert "not-for-prod" in TEST_SECRET
    assert "dummy" in DUMMY_JWT_SECRET and "not-real" in DUMMY_JWT_SECRET
    assert not TEST_SECRET.startswith("eyJ")
    assert not WRONG_SECRET.startswith("eyJ")
    assert not DUMMY_JWT_SECRET.startswith("eyJ")


def test_jwt_secret_reads_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", f"  {TEST_SECRET}  ")
    assert auth_jwt._jwt_secret() == TEST_SECRET


def test_jwt_secret_empty_when_unset():
    assert auth_jwt._jwt_secret() == ""


def test_verify_local_jwt_valid():
    token = _mint_token()
    identity = auth_jwt._verify_local_jwt(token, TEST_SECRET)
    assert identity["user_id"] == "user-123"
    assert identity["email"] == "user@example.com"
    assert identity["claims"]["sub"] == "user-123"


def test_verify_local_jwt_expired():
    token = _mint_token(exp_offset=-10)
    with pytest.raises(HTTPException) as exc:
        auth_jwt._verify_local_jwt(token, TEST_SECRET)
    assert exc.value.status_code == 401
    assert "expired" in exc.value.detail.lower()


def test_verify_access_token_local_path(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    token = _mint_token()
    fallback = MagicMock()
    monkeypatch.setattr(auth_jwt, "_verify_via_supabase_auth", fallback)

    identity = auth_jwt.verify_access_token(f"Bearer {token}")
    assert identity["user_id"] == "user-123"
    fallback.assert_not_called()


def test_verify_access_token_empty_secret_falls_back(monkeypatch: pytest.MonkeyPatch):
    token = _mint_token()
    fallback = MagicMock(
        return_value={
            "user_id": "user-123",
            "email": "user@example.com",
            "user_metadata": {},
            "claims": {},
            "exp": None,
        }
    )
    monkeypatch.setattr(auth_jwt, "_verify_via_supabase_auth", fallback)

    identity = auth_jwt.verify_access_token(token)
    assert identity["user_id"] == "user-123"
    fallback.assert_called_once_with(token)


def test_verify_access_token_wrong_secret_falls_back(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", WRONG_SECRET)
    token = _mint_token()
    fallback = MagicMock(
        return_value={
            "user_id": "user-123",
            "email": "user@example.com",
            "user_metadata": {},
            "claims": {},
            "exp": None,
        }
    )
    monkeypatch.setattr(auth_jwt, "_verify_via_supabase_auth", fallback)

    identity = auth_jwt.verify_access_token(token)
    assert identity["user_id"] == "user-123"
    fallback.assert_called_once()


def test_verify_access_token_expired_does_not_fall_back(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    token = _mint_token(exp_offset=-30)
    fallback = MagicMock()
    monkeypatch.setattr(auth_jwt, "_verify_via_supabase_auth", fallback)

    with pytest.raises(HTTPException) as exc:
        auth_jwt.verify_access_token(token)
    assert exc.value.status_code == 401
    fallback.assert_not_called()


def test_verify_access_token_blacklisted(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    token = _mint_token()
    mock_redis = MagicMock()
    mock_redis.get.return_value = "1"
    monkeypatch.setattr(auth_jwt, "redis_client", mock_redis)

    with pytest.raises(HTTPException) as exc:
        auth_jwt.verify_access_token(token, check_blacklist=True)
    assert exc.value.status_code == 401
    assert "revoked" in exc.value.detail.lower()


def test_verify_access_token_rejects_short_token():
    with pytest.raises(HTTPException) as exc:
        auth_jwt.verify_access_token("short")
    assert exc.value.status_code == 401


def test_blacklist_redis_outage_fails_open(monkeypatch: pytest.MonkeyPatch):
    mock_redis = MagicMock()
    mock_redis.get.side_effect = ConnectionError("redis down")
    monkeypatch.setattr(auth_jwt, "redis_client", mock_redis)
    assert auth_jwt.is_token_blacklisted("any-token") is False
