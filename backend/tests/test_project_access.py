"""Unit tests for project-level RBAC (core.project_access)."""

from __future__ import annotations

from unittest.mock import patch
import pytest
from fastapi import HTTPException

from core.project_access import (
    AccessContext,
    Permission,
    assert_project_access,
    filter_accessible_projects,
    has_project_permission,
    resolve_visibility_mode,
    sync_visibility_to_record_data,
)


def _ctx(
    *,
    user_id: str = "user-a",
    email: str = "a@example.com",
    tenant_id: str = "tenant-1",
    tenant_role: str = "employee",
    department_id: str | None = None,
    custom_role_id: str | None = None,
) -> AccessContext:
    return AccessContext(
        user_id=user_id,
        email=email,
        tenant_id=tenant_id,
        tenant_role=tenant_role,
        department_id=department_id,
        custom_role_id=custom_role_id,
    )


def _project(
    *,
    project_id: str = "proj-1",
    tenant_id: str = "tenant-1",
    visibility_mode: str = "private",
    owner_user_id: str | None = "user-b",
    record_data: dict | None = None,
) -> dict:
    data = record_data or {}
    return {
        "id": project_id,
        "tenant_id": tenant_id,
        "module_name": "projects",
        "visibility_mode": visibility_mode,
        "owner_user_id": owner_user_id,
        "record_data": data,
    }


class TestResolveVisibilityMode:
    def test_column_takes_precedence(self):
        rec = {"visibility_mode": "open", "record_data": {"visibility": "private"}}
        assert resolve_visibility_mode(rec) == "open"

    def test_legacy_public_maps_to_open(self):
        rec = {"record_data": {"visibility": "public"}}
        assert resolve_visibility_mode(rec) == "open"

    def test_legacy_just_admin_maps_to_admin_only(self):
        rec = {"record_data": {"visibility": "just_admin"}}
        assert resolve_visibility_mode(rec) == "admin_only"

    def test_default_private(self):
        assert resolve_visibility_mode({}) == "private"


class TestHasProjectPermission:
    def test_admin_bypass(self):
        ctx = _ctx(tenant_role="admin")
        rec = _project(visibility_mode="private", owner_user_id="other")
        assert has_project_permission(ctx, rec, Permission.DELETE, grants=[])

    def test_wrong_tenant_denied(self):
        ctx = _ctx(tenant_id="tenant-2")
        rec = _project(tenant_id="tenant-1")
        assert not has_project_permission(ctx, rec, Permission.VIEW, grants=[])

    def test_private_project_stranger_denied(self):
        ctx = _ctx(user_id="user-a", email="a@example.com")
        rec = _project(owner_user_id="user-b")
        assert not has_project_permission(ctx, rec, Permission.VIEW, grants=[])

    def test_owner_full_access(self):
        ctx = _ctx(user_id="user-b", email="b@example.com")
        rec = _project(owner_user_id="user-b")
        assert has_project_permission(ctx, rec, Permission.DELETE, grants=[])

    def test_collaborator_editor_can_edit(self):
        ctx = _ctx(email="editor@example.com")
        rec = _project(
            owner_user_id="user-b",
            record_data={"collaborators": [{"email": "editor@example.com", "role": "editor"}]},
        )
        assert has_project_permission(ctx, rec, Permission.EDIT, grants=[])

    def test_collaborator_viewer_cannot_edit(self):
        ctx = _ctx(email="viewer@example.com")
        rec = _project(
            owner_user_id="user-b",
            record_data={"collaborators": [{"email": "viewer@example.com", "role": "viewer"}]},
        )
        assert has_project_permission(ctx, rec, Permission.VIEW, grants=[])
        assert not has_project_permission(ctx, rec, Permission.EDIT, grants=[])

    def test_department_grant_view(self):
        ctx = _ctx(department_id="dept-1")
        grants = [
            {"subject_type": "department", "subject_id": "dept-1", "permission": "view"},
        ]
        rec = _project(owner_user_id="user-b")
        assert has_project_permission(ctx, rec, Permission.VIEW, grants)

    def test_department_grant_view_only_no_edit(self):
        ctx = _ctx(department_id="dept-1")
        grants = [
            {"subject_type": "department", "subject_id": "dept-1", "permission": "view"},
        ]
        rec = _project(owner_user_id="user-b")
        assert not has_project_permission(ctx, rec, Permission.EDIT, grants)

    def test_department_grant_edit(self):
        ctx = _ctx(department_id="dept-1")
        grants = [
            {"subject_type": "department", "subject_id": "dept-1", "permission": "edit"},
        ]
        rec = _project(owner_user_id="user-b")
        assert has_project_permission(ctx, rec, Permission.EDIT, grants)

    def test_open_mode_tenant_member_view(self):
        ctx = _ctx()
        rec = _project(visibility_mode="open", owner_user_id="user-b")
        assert has_project_permission(ctx, rec, Permission.VIEW, grants=[])

    def test_open_mode_tenant_member_no_edit(self):
        ctx = _ctx()
        rec = _project(visibility_mode="open", owner_user_id="user-b")
        assert not has_project_permission(ctx, rec, Permission.EDIT, grants=[])

    def test_department_mode_listed_department_view(self):
        ctx = _ctx(department_id="dept-1")
        rec = _project(
            visibility_mode="department",
            owner_user_id="user-b",
            record_data={"department_ids": ["dept-1"]},
        )
        assert has_project_permission(ctx, rec, Permission.VIEW, grants=[])

    def test_user_grant_manage(self):
        ctx = _ctx(user_id="user-a")
        grants = [{"subject_type": "user", "subject_id": "user-a", "permission": "manage"}]
        rec = _project(owner_user_id="user-b")
        assert has_project_permission(ctx, rec, Permission.MANAGE, grants)


class TestAssertProjectAccess:
    def test_raises_403_when_denied(self):
        ctx = _ctx()
        rec = _project(owner_user_id="user-b")
        with pytest.raises(HTTPException) as exc:
            assert_project_access(ctx, rec, Permission.EDIT, grants=[])
        assert exc.value.status_code == 403


class TestFilterAccessibleProjects:
    @patch("core.project_access.load_grants_for_projects")
    def test_filters_private_projects(self, mock_load_grants):
        mock_load_grants.return_value = {"p1": [], "p2": []}
        ctx = _ctx(user_id="user-a", email="a@example.com")
        owned = _project(project_id="p1", owner_user_id="user-a")
        foreign = _project(
            project_id="p2",
            owner_user_id="user-b",
            record_data={"collaborators": []},
        )
        result = filter_accessible_projects(ctx, [owned, foreign], Permission.VIEW)
        ids = {r["id"] for r in result}
        assert "p1" in ids
        assert "p2" not in ids


class TestSyncVisibility:
    def test_sync_maps_open_to_public_legacy(self):
        out = sync_visibility_to_record_data({}, "open")
        assert out["visibility_mode"] == "open"
        assert out["visibility"] == "public"
