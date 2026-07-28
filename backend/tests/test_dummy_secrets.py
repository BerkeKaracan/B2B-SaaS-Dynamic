"""Guard: pytest must never run against real developer / production secrets."""

from __future__ import annotations

import os

from conftest import (
    DUMMY_INTERNAL_API_SECRET,
    DUMMY_JWT_SECRET,
    DUMMY_SUPABASE_KEY,
    DUMMY_SUPABASE_SERVICE_ROLE_KEY,
    DUMMY_SUPABASE_URL,
)


def test_env_uses_only_dummy_credentials():
    assert os.environ.get("K_SERVICE") == "pytest"
    assert os.environ["SUPABASE_URL"] == DUMMY_SUPABASE_URL
    assert os.environ["SUPABASE_KEY"] == DUMMY_SUPABASE_KEY
    assert os.environ["SUPABASE_SERVICE_ROLE_KEY"] == DUMMY_SUPABASE_SERVICE_ROLE_KEY
    assert os.environ["SUPABASE_JWT_SECRET"] == DUMMY_JWT_SECRET
    assert os.environ["INTERNAL_API_SECRET"] == DUMMY_INTERNAL_API_SECRET

    # Real Supabase JWTs / service keys are typically JWT-shaped (eyJ…).
    for value in (
        os.environ["SUPABASE_KEY"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        os.environ["SUPABASE_JWT_SECRET"],
        os.environ["INTERNAL_API_SECRET"],
    ):
        assert not value.startswith("eyJ")
        assert "dummy" in value or value == DUMMY_INTERNAL_API_SECRET or "not-real" in value or "change-me" in value


def test_settings_and_jwt_helper_see_dummies_only():
    from core.config import get_supabase_jwt_secret, settings

    assert settings.supabase_url == DUMMY_SUPABASE_URL
    assert settings.supabase_key == DUMMY_SUPABASE_KEY
    assert get_supabase_jwt_secret() == DUMMY_JWT_SECRET
