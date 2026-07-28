"""Session-wide dummy credentials for pytest.

Prevents local `backend/.env` / developer shell secrets from leaking into tests.
Values mirror CI (`.github/workflows/ci.yml`) and placeholders in `.env.example`.
Must run at import time — before any `from main import app` / Settings load.
"""

from __future__ import annotations

import os
import sys

# core.config disables .env file loading when K_SERVICE is set (Cloud Run marker).
os.environ["K_SERVICE"] = "pytest"

# Align with CI + .env.example placeholders — never real project keys.
DUMMY_SUPABASE_URL = "https://dummy12345.supabase.co"
DUMMY_SUPABASE_KEY = "dummy-service-key-for-ci"
DUMMY_SUPABASE_SERVICE_ROLE_KEY = "dummy-service-role-key-for-ci"
DUMMY_JWT_SECRET = "dummy-jwt-secret-for-tests-not-real-32b+"
DUMMY_REDIS_URL = "redis://localhost:6379"
DUMMY_INTERNAL_API_SECRET = "change-me-to-a-long-random-string"
DUMMY_DATABASE_URL = "sqlite:///./test.db"

_DUMMY_ENV = {
    "DATABASE_URL": DUMMY_DATABASE_URL,
    "SUPABASE_URL": DUMMY_SUPABASE_URL,
    "SUPABASE_KEY": DUMMY_SUPABASE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY": DUMMY_SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_JWT_SECRET": DUMMY_JWT_SECRET,
    "REDIS_URL": DUMMY_REDIS_URL,
    "INTERNAL_API_SECRET": DUMMY_INTERNAL_API_SECRET,
}

for _key, _value in _DUMMY_ENV.items():
    os.environ[_key] = _value

# Drop alternate JWT secret env names that a developer shell might export.
for _key in list(os.environ):
    upper = _key.upper()
    if "JWT" in upper and "SECRET" in upper and _key != "SUPABASE_JWT_SECRET":
        os.environ.pop(_key, None)

_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)
