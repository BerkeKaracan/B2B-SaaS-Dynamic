"""Unit tests for canvas collaboration WebSocket security (fail-closed JWT + room-tenant binding)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch
import pytest

from api.routers.canvas_collab import (
    _allow_insecure_canvas_ws,
    _resolve_room_access,
    _validate_room_project_access,
    _validate_room_tenant_access,
)
from core.project_access import Permission


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


class TestValidateRoomProjectAccess:
    """Project-level VIEW required for canvas rooms."""

    @patch("api.routers.canvas_collab.build_access_context_for_user")
    @patch("api.routers.canvas_collab.has_project_permission")
    @patch("api.routers.canvas_collab.supabase_admin")
    def test_granted_when_user_has_project_view(
        self, mock_supabase, mock_has_perm, mock_build_ctx
    ):
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "room-1", "tenant_id": "tenant-123", "module_name": "projects"}
        ]
        mock_build_ctx.return_value = MagicMock()
        mock_has_perm.return_value = True

        assert _validate_room_project_access("room-1", "user-1", "u@example.com") is True
        assert mock_has_perm.call_count >= 1

    @patch("api.routers.canvas_collab.has_project_permission")
    @patch("api.routers.canvas_collab.supabase_admin")
    def test_denied_without_project_permission(self, mock_supabase, mock_has_perm):
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "room-1", "tenant_id": "tenant-123", "module_name": "projects"}
        ]
        mock_has_perm.return_value = False

        assert _validate_room_project_access("room-1", "user-1", "u@example.com") is False

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_room_not_found(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        assert _validate_room_project_access("missing", "user-1", "u@example.com") is False


    @patch("api.routers.canvas_collab.build_access_context_for_user")
    @patch("api.routers.canvas_collab.has_project_permission")
    @patch("api.routers.canvas_collab.supabase_admin")
    def test_view_only_cannot_edit(
        self, mock_supabase, mock_has_perm, mock_build_ctx
    ):
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "room-1", "tenant_id": "tenant-123", "module_name": "projects"}
        ]
        mock_build_ctx.return_value = MagicMock()
        mock_has_perm.side_effect = lambda _ctx, _rec, perm: perm == Permission.VIEW

        access = _resolve_room_access("room-1", "user-1", "u@example.com")
        assert access.allowed is True
        assert access.can_edit is False


class TestValidateRoomTenantAccess:
    """Test room-tenant binding validation."""

    @patch("api.routers.canvas_collab._validate_room_project_access")
    def test_valid_room_and_tenant_access(self, mock_project_access):
        """Deprecated alias delegates to project access validation."""
        mock_project_access.return_value = True
        result = _validate_room_tenant_access("room-456", "user-789")
        assert result is True
        mock_project_access.assert_called_once_with("room-456", "user-789", "")

    @patch("api.routers.canvas_collab._validate_room_project_access")
    def test_room_not_found(self, mock_project_access):
        mock_project_access.return_value = False
        result = _validate_room_tenant_access("nonexistent-room", "user-789")
        assert result is False

    @patch("api.routers.canvas_collab._validate_room_project_access")
    def test_user_not_tenant_member(self, mock_project_access):
        mock_project_access.return_value = False
        result = _validate_room_tenant_access("room-456", "user-789")
        assert result is False

    @patch("api.routers.canvas_collab.supabase_admin")
    def test_database_error_returns_false(self, mock_supabase):
        mock_supabase.table.side_effect = Exception("Database connection failed")
        result = _validate_room_project_access("room-456", "user-789", "u@example.com")
        assert result is False
