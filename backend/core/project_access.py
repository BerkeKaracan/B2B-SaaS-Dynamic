"""Project-level access control (tenant + visibility + grants + collaborators)."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any

from fastapi import HTTPException

from core.database import supabase_admin

PERM_RANK = {"view": 1, "edit": 2, "manage": 3, "delete": 4}
COLLAB_RANK = {"viewer": 1, "editor": 2, "admin": 3}

SYSTEM_MODULES = frozenset({"workspace_modules", "activity_logs"})


class Permission(str, Enum):
    VIEW = "view"
    EDIT = "edit"
    MANAGE = "manage"
    DELETE = "delete"


@dataclass
class AccessContext:
    user_id: str
    email: str
    tenant_id: str
    tenant_role: str
    department_id: str | None = None
    custom_role_id: str | None = None


def is_system_module(module_name: str | None) -> bool:
    if not module_name:
        return False
    if module_name in SYSTEM_MODULES:
        return True
    return module_name.startswith("timeline_data_")


def resolve_visibility_mode(record: dict[str, Any]) -> str:
    mode = (record.get("visibility_mode") or "").strip().lower()
    if mode in ("private", "open", "admin_only", "department"):
        return mode
    record_data = record.get("record_data") or {}
    if not isinstance(record_data, dict):
        record_data = {}
    legacy = str(record_data.get("visibility_mode") or record_data.get("visibility") or "private").lower()
    if legacy in ("public", "open"):
        return "open"
    if legacy in ("just_admin", "admin_only"):
        return "admin_only"
    if legacy == "department":
        return "department"
    return "private"


def _perm_rank(perm: Permission | str) -> int:
    key = perm.value if isinstance(perm, Permission) else str(perm).lower()
    return PERM_RANK.get(key, 1)


def _collab_rank(role: str) -> int:
    return COLLAB_RANK.get(str(role or "editor").lower(), 2)


def _normalize_email(email: str | None) -> str:
    return str(email or "").lower().strip()


def build_access_context(user: dict[str, Any], tenant_id: str) -> AccessContext:
    tenant_str = str(tenant_id)
    membership = (user.get("tenant_memberships") or {}).get(tenant_str) or {}
    role = str(
        membership.get("role") or user.get("tenant_roles", {}).get(tenant_str) or "employee"
    ).lower()
    return AccessContext(
        user_id=str(user["user_id"]),
        email=_normalize_email(user.get("email")),
        tenant_id=tenant_str,
        tenant_role=role,
        department_id=membership.get("department_id"),
        custom_role_id=membership.get("custom_role_id"),
    )


def build_access_context_for_user(
    user_id: str,
    email: str,
    tenant_id: str,
) -> AccessContext:
    res = (
        supabase_admin.table("tenant_users")
        .select("role, department_id, custom_role_id, email")
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=403, detail="Workspace access denied.")
    row = res.data[0]
    return AccessContext(
        user_id=str(user_id),
        email=_normalize_email(email or row.get("email")),
        tenant_id=str(tenant_id),
        tenant_role=str(row.get("role") or "employee").lower(),
        department_id=str(row["department_id"]) if row.get("department_id") else None,
        custom_role_id=str(row["custom_role_id"]) if row.get("custom_role_id") else None,
    )


def load_grants_for_projects(project_ids: list[str]) -> dict[str, list[dict[str, Any]]]:
    if not project_ids:
        return {}
    res = (
        supabase_admin.table("project_access_grants")
        .select("project_id, subject_type, subject_id, permission")
        .in_("project_id", project_ids)
        .execute()
    )
    grouped: dict[str, list[dict[str, Any]]] = {pid: [] for pid in project_ids}
    for row in res.data or []:
        pid = str(row.get("project_id"))
        if pid in grouped:
            grouped[pid].append(row)
    return grouped


def _best_grant_perm(
    ctx: AccessContext, grants: list[dict[str, Any]]
) -> int:
    best = 0
    for g in grants:
        st = str(g.get("subject_type") or "")
        sid = str(g.get("subject_id") or "")
        perm = _perm_rank(str(g.get("permission") or "view"))
        if st == "user" and sid == ctx.user_id:
            best = max(best, perm)
        elif st == "department" and ctx.department_id and sid == ctx.department_id:
            best = max(best, perm)
        elif st == "custom_role" and ctx.custom_role_id and sid == ctx.custom_role_id:
            best = max(best, perm)
    return best


def _collaborator_rank(ctx: AccessContext, record_data: dict[str, Any]) -> int:
    best = 0
    for c in record_data.get("collaborators") or []:
        if not isinstance(c, dict):
            continue
        if _normalize_email(c.get("email")) != ctx.email:
            continue
        best = max(best, _collab_rank(str(c.get("role") or "editor")))
    return best


def _is_project_owner(ctx: AccessContext, record: dict[str, Any]) -> bool:
    owner_uid = record.get("owner_user_id")
    if owner_uid and str(owner_uid) == ctx.user_id:
        return True
    record_data = record.get("record_data") or {}
    if isinstance(record_data, dict):
        owner_email = _normalize_email(record_data.get("owner_email"))
        if owner_email and owner_email == ctx.email:
            return True
    return False


def _department_listed(ctx: AccessContext, record_data: dict[str, Any]) -> bool:
    if not ctx.department_id:
        return False
    for raw in record_data.get("department_ids") or []:
        if str(raw) == ctx.department_id:
            return True
    return False


def has_project_permission(
    ctx: AccessContext,
    record: dict[str, Any],
    permission: Permission,
    grants: list[dict[str, Any]] | None = None,
) -> bool:
    if str(record.get("tenant_id")) != ctx.tenant_id:
        return False

    module_name = record.get("module_name")
    if is_system_module(str(module_name) if module_name else None):
        return ctx.tenant_role in ("owner", "admin", "employee")

    need = _perm_rank(permission)

    if ctx.tenant_role in ("owner", "admin"):
        return True

    if _is_project_owner(ctx, record):
        return True

    record_data = record.get("record_data") or {}
    if not isinstance(record_data, dict):
        record_data = {}

    if grants is None:
        grants = load_grants_for_projects([str(record.get("id"))]).get(str(record.get("id")), [])

    grant_rank = _best_grant_perm(ctx, grants)
    if grant_rank >= need:
        return True

    collab_rank = _collaborator_rank(ctx, record_data)
    if collab_rank >= need:
        return True
    if need == _perm_rank(Permission.VIEW) and collab_rank >= 1:
        return True

    mode = resolve_visibility_mode(record)
    if mode == "open" and need == _perm_rank(Permission.VIEW):
        return True
    if mode == "department" and need == _perm_rank(Permission.VIEW):
        if _department_listed(ctx, record_data):
            return True

    return False


def assert_project_access(
    ctx: AccessContext,
    record: dict[str, Any],
    permission: Permission,
    grants: list[dict[str, Any]] | None = None,
) -> None:
    if not has_project_permission(ctx, record, permission, grants):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this project.",
        )


def filter_accessible_projects(
    ctx: AccessContext,
    records: list[dict[str, Any]],
    permission: Permission,
) -> list[dict[str, Any]]:
    project_ids = [str(r.get("id")) for r in records if r.get("id")]
    grants_map = load_grants_for_projects(project_ids)
    out: list[dict[str, Any]] = []
    for record in records:
        pid = str(record.get("id"))
        if has_project_permission(ctx, record, permission, grants_map.get(pid, [])):
            out.append(record)
    return out


def sync_visibility_to_record_data(record_data: dict[str, Any], visibility_mode: str) -> dict[str, Any]:
    legacy = {
        "private": "private",
        "open": "public",
        "admin_only": "just_admin",
        "department": "department",
    }
    record_data = dict(record_data)
    record_data["visibility_mode"] = visibility_mode
    record_data["visibility"] = legacy.get(visibility_mode, "private")
    return record_data


def is_global_public_flags(record_data: dict[str, Any]) -> bool:
    shared = str(record_data.get("is_global_shared", "false")).lower()
    public = str(record_data.get("is_global_public", "false")).lower()
    return shared in ("true", "1") or public in ("true", "1")


def patch_changes_manage_fields(payload_data: dict[str, Any], current_data: dict[str, Any]) -> bool:
    manage_keys = {
        "collaborators",
        "visibility",
        "visibility_mode",
        "department_ids",
        "department_grants",
        "is_global_shared",
        "is_global_public",
    }
    for key in manage_keys:
        if key in payload_data and payload_data.get(key) != current_data.get(key):
            return True
    return False
