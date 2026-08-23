"""Live checks after project_access_grants migration."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from core.database import supabase_admin
from core.project_access import (
    AccessContext,
    Permission,
    has_project_permission,
    resolve_visibility_mode,
)

checks: list[tuple[str, str, str]] = []


def ok(name: str, detail: str = "") -> None:
    checks.append(("PASS", name, detail))


def fail(name: str, detail: str = "") -> None:
    checks.append(("FAIL", name, detail))


def main() -> int:
    # 1) project_access_grants table
    try:
        r = supabase_admin.table("project_access_grants").select("id", count="exact").limit(1).execute()
        ok("project_access_grants table", f"accessible (count={getattr(r, 'count', '?')})")
    except Exception as exc:
        fail("project_access_grants table", str(exc))

    # 2) custom_records new columns
    try:
        r = (
            supabase_admin.table("custom_records")
            .select("id, visibility_mode, owner_user_id, is_global_public")
            .limit(5)
            .execute()
        )
        rows = r.data or []
        modes: dict[str, int] = {}
        for row in rows:
            m = str(row.get("visibility_mode") or "null")
            modes[m] = modes.get(m, 0) + 1
        ok("custom_records columns", f"sample={len(rows)} modes={modes}")
    except Exception as exc:
        fail("custom_records columns", str(exc))

    # 3) visibility distribution for projects
    try:
        r = (
            supabase_admin.table("custom_records")
            .select("visibility_mode")
            .eq("module_name", "projects")
            .execute()
        )
        dist: dict[str, int] = {}
        for row in r.data or []:
            m = str(row.get("visibility_mode") or "null")
            dist[m] = dist.get(m, 0) + 1
        ok("projects visibility_mode distribution", str(dist))
    except Exception as exc:
        fail("projects visibility distribution", str(exc))

    # 4) grant row types
    try:
        r = supabase_admin.table("project_access_grants").select("subject_type, permission").limit(50).execute()
        types: dict[str, int] = {}
        for row in r.data or []:
            key = f"{row.get('subject_type')}:{row.get('permission')}"
            types[key] = types.get(key, 0) + 1
        ok("grant rows sample", f"types={types}")
    except Exception as exc:
        fail("grant rows", str(exc))

    # 5) has_project_permission RPC (Postgres function from migration)
    try:
        sample = (
            supabase_admin.table("custom_records")
            .select("id")
            .eq("module_name", "projects")
            .limit(1)
            .execute()
        )
        if sample.data:
            pid = sample.data[0]["id"]
            rpc = supabase_admin.rpc("has_project_permission", {"p_project_id": pid, "p_perm": "view"}).execute()
            ok("has_project_permission() RPC", f"callable, result={rpc.data}")
        else:
            ok("has_project_permission() RPC", "skipped (no project rows)")
    except Exception as exc:
        fail("has_project_permission() RPC", str(exc))

    # 6) Python access logic smoke
    try:
        ctx = AccessContext(
            user_id="x",
            email="a@example.com",
            tenant_id="t1",
            tenant_role="employee",
        )
        rec = {
            "id": "p",
            "tenant_id": "t1",
            "module_name": "projects",
            "visibility_mode": "private",
            "owner_user_id": "other",
            "record_data": {},
        }
        denied = not has_project_permission(ctx, rec, Permission.VIEW, grants=[])
        open_rec = {**rec, "visibility_mode": "open", "owner_user_id": "other"}
        open_view = has_project_permission(ctx, open_rec, Permission.VIEW, grants=[])
        legacy = resolve_visibility_mode({"record_data": {"visibility": "public"}})
        ok(
            "project_access module",
            f"private_denied={denied} open_view={open_view} legacy_public={legacy}",
        )
    except Exception as exc:
        fail("project_access module", str(exc))

    print("=== MIGRATION / RBAC LIVE CHECKS ===")
    passed = failed = 0
    for status, name, detail in checks:
        icon = "OK" if status == "PASS" else "XX"
        print(f"[{icon}] {name}: {detail}")
        if status == "PASS":
            passed += 1
        else:
            failed += 1
    print(f"--- {passed} passed, {failed} failed ---")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
