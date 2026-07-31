"""Unit tests for AI security: role whitelisting and rate limiting."""

from __future__ import annotations

from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
import sys

# Mock groq module to avoid import errors in test environment
sys.modules['groq'] = MagicMock()
sys.modules['groq.AsyncGroq'] = MagicMock()

from api.routers.ai import require_premium_or_admin_role, get_ai_rate_limit_key


class TestRequirePremiumOrAdminRole:
    """Test role whitelisting for AI history endpoints."""

    @patch("api.routers.ai.supabase_admin")
    @patch("api.routers.ai.get_tenant_tier")
    def test_admin_role_allowed(self, mock_get_tier, mock_supabase):
        """Admin users should always have access regardless of tier."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"role": "admin"}
        ]
        
        # Should not raise exception
        require_premium_or_admin_role("tenant-123", "user-456")
        
    @patch("api.routers.ai.supabase_admin")
    @patch("api.routers.ai.get_tenant_tier")
    def test_owner_role_allowed(self, mock_get_tier, mock_supabase):
        """Owner users should always have access regardless of tier."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"role": "owner"}
        ]
        
        # Should not raise exception
        require_premium_or_admin_role("tenant-123", "user-456")

    @patch("api.routers.ai.supabase_admin")
    @patch("api.routers.ai.get_tenant_tier")
    def test_advanced_tier_employee_allowed(self, mock_get_tier, mock_supabase):
        """Employee in advanced tier should have access."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"role": "employee"}
        ]
        mock_get_tier.return_value = "advanced"
        
        # Should not raise exception
        require_premium_or_admin_role("tenant-123", "user-456")

    @patch("api.routers.ai.supabase_admin")
    @patch("api.routers.ai.get_tenant_tier")
    def test_pro_tier_employee_allowed(self, mock_get_tier, mock_supabase):
        """Employee in pro tier should have access."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"role": "employee"}
        ]
        mock_get_tier.return_value = "pro"
        
        # Should not raise exception
        require_premium_or_admin_role("tenant-123", "user-456")

    @patch("api.routers.ai.supabase_admin")
    @patch("api.routers.ai.get_tenant_tier")
    def test_basic_tier_employee_denied(self, mock_get_tier, mock_supabase):
        """Employee in basic tier should be denied."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"role": "employee"}
        ]
        mock_get_tier.return_value = "basic"
        
        with pytest.raises(HTTPException) as exc:
            require_premium_or_admin_role("tenant-123", "user-456")
        assert exc.value.status_code == 403
        assert "premium" in exc.value.detail.lower()

    @patch("api.routers.ai.supabase_admin")
    @patch("api.routers.ai.get_tenant_tier")
    def test_non_member_denied(self, mock_get_tier, mock_supabase):
        """Non-tenant members should be denied."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
        
        with pytest.raises(HTTPException) as exc:
            require_premium_or_admin_role("tenant-123", "user-456")
        assert exc.value.status_code == 403
        assert "access denied" in exc.value.detail.lower()


class TestGetAIRateLimitKey:
    """Test rate limit key generation for AI endpoints."""

    @patch("api.routers.ai.get_real_ip")
    def test_tenant_based_key(self, mock_get_ip):
        """Should use tenant_id when provided."""
        mock_get_ip.return_value = "192.168.1.1"
        
        request = MagicMock()
        key = get_ai_rate_limit_key(request, tenant_id="tenant-123")
        
        assert key == "ai:tenant:tenant-123"
        mock_get_ip.assert_not_called()

    @patch("api.routers.ai.get_real_ip")
    def test_ip_based_key_when_no_tenant(self, mock_get_ip):
        """Should fall back to IP when tenant_id not provided."""
        mock_get_ip.return_value = "192.168.1.1"
        
        request = MagicMock()
        key = get_ai_rate_limit_key(request, tenant_id=None)
        
        assert key == "ai:ip:192.168.1.1"
        mock_get_ip.assert_called_once_with(request)

    @patch("api.routers.ai.get_real_ip")
    def test_ip_based_key_when_empty_tenant(self, mock_get_ip):
        """Should fall back to IP when tenant_id is empty string."""
        mock_get_ip.return_value = "192.168.1.1"
        
        request = MagicMock()
        key = get_ai_rate_limit_key(request, tenant_id="")
        
        assert key == "ai:ip:192.168.1.1"
