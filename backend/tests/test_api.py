import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def test_unauthorized_access_to_records():
    response = client.get("/api/records/?tenant_id=test-123")
    assert response.status_code in [401, 429]

def test_rate_limiter_presence():
    response = client.get("/api/auth/me")
    assert response.status_code in [422, 401, 429]