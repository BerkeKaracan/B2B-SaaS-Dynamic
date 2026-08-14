"""Unit tests for canvas collaboration WebSocket security (fail-closed JWT + room-tenant binding)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch
import pytest

from api.routers.canvas_collab import _allow_insecure_canvas_ws, _validate_room_tenant_access


class TestAllowInsecureCanvasWs:
    """Test fail-closed JWT validation logic."""

    def test_production_always_requires_jwt(self, monkeypatch: pytest.MonkeyPatch):
        """Production environment should always require JWT (fail-closed)."""
        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.setenv("ALLOW_INSECURE_CANVAS_WS", "true")
        assert _allow_insecure_canvas_ws() is False

    def test_prod_env_variant_always_requires_jwt(self, monkeypatch: pytest.MonkeyPatch):
        """PROD environment variant should always require JWT."""
        monkeypatch.setenv("APP_ENV", "prod")
        monkeypatch.setenv("ALLOW_INSECURE_CANVAS_WS", "1")
        assert _allow_insecure_canvas_ws() is False

    def test_explicit_false_overrides_dev(self, monkeypatch: pytest.MonkeyPatch):
        """Explicit ALLOW_INSECURE_CANVAS_WS=false should override development."""
        monkeypatch.setenv("ENVIRONMENT", "development")
        monkeypatch.setenv("ALLOW_INSECURE_CANVAS_WS", "false")
        assert _allow_insecure_canvas_ws() is False

    def test_development_allows_insecure_by_default(self, monkeypatch: pytest.MonkeyPatch):
        """Development environment should allow insecure by default."""
        monkeypatch.setenv("ENVIRONMENT", "development")
        assert _allow_insecure_canvas_ws() is True

    def test_dev_variant_allows_insecure(self, monkeypatch: pytest.MonkeyPatch):
        """Dev environment variant should allow insecure."""
        monkeypatch.setenv("APP_ENV", "dev")
        assert _allow_insecure_canvas_ws() is True

    def test_local_allows_insecure(self, monkeypatch: pytest.MonkeyPatch):
        """Local environment should allow insecure."""
        monkeypatch.setenv("ENVIRONMENT", "local")
        assert _allow_insecure_canvas_ws() is True

    def test_explicit_true_allows_insecure(self, monkeypatch: pytest.MonkeyPatch):
        """Explicit ALLOW_INSECURE_CANVAS_WS=true should allow insecure."""
        monkeypatch.setenv("ENVIRONMENT", "staging")
        monkeypatch.setenv("ALLOW_INSECURE_CANVAS_WS", "true")
        assert _allow_insecure_canvas_ws() is True

    def test_no_jwt_secret_treats_as_dev(self, monkeypatch: pytest.MonkeyPatch):
        """Missing JWT secret should treat as development (insecure allowed)."""
        monkeypatch.delenv("ENVIRONMENT", raising=False)
        monkeypatch.delenv("APP_ENV", raising=False)
        monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
        assert _allow_insecure_canvas_ws() is True

    def test_with_jwt_secret_but_no_env_treats_as_secure(self, monkeypatch: pytest.MonkeyPatch):
        """With JWT secret but no env, should treat as secure (fail-closed)."""
        monkeypatch.delenv("ENVIRONMENT", raising=False)
        monkeypatch.delenv("APP_ENV", raising=False)
        monkeypatch.setenv("SUPABASE_JWT_SECRET", "some-secret")
        assert _allow_insecure_canvas_ws() is False


class TestValidateRoomTenantAccess:
    """Test room-tenant binding validation."""

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_valid_room_and_tenant_access(self, mock_supabase):
        """Should return True when user belongs to the tenant that owns the room."""
        # Mock record lookup - room exists and has tenant_id
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"tenant_id": "tenant-123"}
        ]
        
        # Mock membership lookup - user is member of tenant
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"role": "admin"}
        ]
        
        result = _validate_room_tenant_access("room-456", "user-789")
        assert result is True

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_room_not_found(self, mock_supabase):
        """Should return False when room doesn't exist."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        result = _validate_room_tenant_access("nonexistent-room", "user-789")
        assert result is False

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_room_has_no_tenant_id(self, mock_supabase):
        """Should return False when room exists but has no tenant_id."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"tenant_id": None}
        ]
        
        result = _validate_room_tenant_access("room-456", "user-789")
        assert result is False

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_user_not_tenant_member(self, mock_supabase):
        """Should return False when user is not a member of the tenant."""
        # Room exists with tenant
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"tenant_id": "tenant-123"}
        ]
        
        # User not a member
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        
        result = _validate_room_tenant_access("room-456", "user-789")
        assert result is False

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_database_error_returns_false(self, mock_supabase):
        """Should return False on database errors (fail-closed)."""
        mock_supabase.table.side_effect = Exception("Database connection failed")
        
        result = _validate_room_tenant_access("room-456", "user-789")
        assert result is False

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_tenant_id_empty_string(self, mock_supabase):
        """Should return False when tenant_id is empty string."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"tenant_id": ""}
        ]
        
        result = _validate_room_tenant_access("room-456", "user-789")
        assert result is False
