import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def test_root_endpoint():
    """
    Test the root endpoint to ensure the API is accessible and returning the correct alive status.
    This is crucial for initial connectivity checks.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "alive", "message": "SaaS Engine API is running"}

def test_health_check_endpoint():
    """
    Test the /health endpoint.
    This endpoint is typically used by Kubernetes, Docker, or Load Balancers to verify container health.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    api_response = client.get("/api/health")
    assert api_response.status_code == 200
    assert api_response.json() == {"status": "ok"}


def test_health_auth_diag_endpoint():
    """Auth env diagnostics stay on a separate path so /health payload remains stable."""
    response = client.get("/api/health/auth")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "auth" in body
    auth = body["auth"]
    assert "resolved" in auth
    assert "getenv_present" in auth
    assert "dotenv_loading_enabled" in auth
    assert "supabase_url_getenv_present" in auth
    assert "secret_mount_files" in auth

def test_unauthorized_access_to_records():
    """
    Ensure that protected routes like /api/records/ block unauthenticated users.
    Should return 401 (Unauthorized) or 429 (Too Many Requests due to rate limiter).
    """
    response = client.get("/api/records/?tenant_id=test-123")
    assert response.status_code in [401, 429]

def test_auth_me_requires_token():
    """
    Ensure the /auth/me endpoint rejects requests missing a valid Bearer token.
    """
    response = client.get("/api/auth/me")
    assert response.status_code in [401, 403, 422, 429]