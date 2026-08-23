"""Unit tests for project-level RBAC (core.project_access)."""

from __future__ import annotations

from unittest.mock import MagicMock, call, patch
from uuid import UUID
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
    timeline_parent_project_id,
)
from api.routers.records import (
    RECORD_PAGE_SIZE,
    _sync_collaborator_grants,
    get_records,
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


class TestSystemAndTimelineModules:
    def test_timeline_parent_id_extracted(self):
        assert timeline_parent_project_id("timeline_data_proj-1") == "proj-1"
        assert timeline_parent_project_id("projects") is None

    def test_employee_views_workspace_modules_but_cannot_edit(self):
        ctx = _ctx(tenant_role="employee")
        rec = {
            "id": "cfg-1",
            "tenant_id": "tenant-1",
            "module_name": "workspace_modules",
            "visibility_mode": "private",
            "owner_user_id": "user-b",
            "record_data": {},
        }
        assert has_project_permission(ctx, rec, Permission.VIEW, grants=[])
        assert not has_project_permission(ctx, rec, Permission.EDIT, grants=[])
        assert not has_project_permission(ctx, rec, Permission.DELETE, grants=[])

    def test_admin_can_edit_activity_logs(self):
        ctx = _ctx(tenant_role="admin")
        rec = {
            "id": "log-1",
            "tenant_id": "tenant-1",
            "module_name": "activity_logs",
            "visibility_mode": "private",
            "owner_user_id": "user-b",
            "record_data": {},
        }
        assert has_project_permission(ctx, rec, Permission.DELETE, grants=[])

    @patch("core.project_access.load_grants_for_projects")
    @patch("core.project_access._load_projects_by_ids")
    def test_timeline_inherits_parent_view_not_edit(self, mock_load, mock_grants):
        parent = _project(
            project_id="proj-1",
            visibility_mode="open",
            owner_user_id="user-b",
        )
        mock_load.return_value = {"proj-1": parent}
        mock_grants.return_value = {"proj-1": []}
        ctx = _ctx()
        timeline = {
            "id": "tl-1",
            "tenant_id": "tenant-1",
            "module_name": "timeline_data_proj-1",
            "visibility_mode": "private",
            "owner_user_id": "user-b",
            "record_data": {},
        }
        assert has_project_permission(ctx, timeline, Permission.VIEW, grants=[])
        assert not has_project_permission(ctx, timeline, Permission.EDIT, grants=[])

    @patch("core.project_access.load_grants_for_projects")
    @patch("core.project_access._load_projects_by_ids")
    def test_timeline_private_parent_denied(self, mock_load, mock_grants):
        parent = _project(project_id="proj-1", owner_user_id="user-b")
        mock_load.return_value = {"proj-1": parent}
        mock_grants.return_value = {"proj-1": []}
        ctx = _ctx(user_id="user-a")
        timeline = {
            "id": "tl-1",
            "tenant_id": "tenant-1",
            "module_name": "timeline_data_proj-1",
            "visibility_mode": "private",
            "owner_user_id": "user-b",
            "record_data": {},
        }
        assert not has_project_permission(ctx, timeline, Permission.VIEW, grants=[])


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


class TestSyncCollaboratorGrants:
    @patch("api.routers.records.supabase_admin")
    def test_removing_all_collaborators_deletes_user_grants(self, mock_admin):
        grants_table = MagicMock()
        mock_admin.table.return_value = grants_table

        _sync_collaborator_grants("tenant-1", "project-1", [], "owner-1")

        grants_table.delete.assert_called_once_with()
        grants_table.insert.assert_not_called()

    @patch("api.routers.records.supabase_admin")
    def test_demotion_replaces_existing_grants_with_view(self, mock_admin):
        tenant_table = MagicMock()
        grants_table = MagicMock()
        membership_result = MagicMock()
        membership_result.data = [{"user_id": "viewer-1"}]
        (
            tenant_table.select.return_value.eq.return_value.ilike.return_value.limit.return_value.execute
        ).return_value = membership_result

        def table_for(name: str):
            return tenant_table if name == "tenant_users" else grants_table

        mock_admin.table.side_effect = table_for

        _sync_collaborator_grants(
            "tenant-1",
            "project-1",
            [{"email": "viewer@example.com", "role": "viewer"}],
            "owner-1",
        )

        assert mock_admin.table.call_args_list == [
            call("tenant_users"),
            call("project_access_grants"),
            call("project_access_grants"),
        ]
        grants_table.insert.assert_called_once_with(
            [
                {
                    "tenant_id": "tenant-1",
                    "project_id": "project-1",
                    "subject_type": "user",
                    "subject_id": "viewer-1",
                    "permission": "view",
                    "created_by": "owner-1",
                }
            ]
        )


class TestRecordPagination:
    @patch("api.routers.records.filter_accessible_projects")
    @patch("api.routers.records.build_access_context")
    @patch("api.routers.records.supabase_admin")
    def test_scans_later_batches_until_accessible_page_is_filled(
        self, mock_admin, mock_build_context, mock_filter
    ):
        tenant_id = UUID("00000000-0000-0000-0000-000000000001")
        query = MagicMock()
        ranged_query = query.select.return_value.eq.return_value.order.return_value.range
        first_response = MagicMock()
        first_response.data = [{"id": f"hidden-{i}"} for i in range(RECORD_PAGE_SIZE)]
        second_response = MagicMock()
        second_response.data = [{"id": "visible"}]
        ranged_query.return_value.execute.side_effect = [
            first_response,
            second_response,
        ]
        mock_admin.table.return_value = query
        mock_build_context.return_value = MagicMock()
        mock_filter.side_effect = [[], [{"id": "visible"}]]

        result = get_records(
            tenant_id=tenant_id,
            module_name=None,
            limit=1,
            offset=0,
            user={"tenant_roles": {str(tenant_id): "employee"}},
        )

        assert result == [{"id": "visible"}]
        assert ranged_query.call_count == 2
