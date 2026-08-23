#!/usr/bin/env python3
"""
Provision Playwright E2E fixtures in Supabase and write repo-root `.env.e2e`.

Requires backend/.env with valid SUPABASE_* service role keys.
Run: npm run test:e2e:setup   (or: python backend/scripts/e2e_seed.py)
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

BACKEND = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

from core.database import supabase_admin  # noqa: E402

E2E_PASSWORD = os.environ.get("E2E_SEED_PASSWORD", "E2eLocalPass123!")
E2E_SLUG = "e2e-playwright"
E2E_TENANT_NAME = "E2E Playwright Fixtures"
E2E_INVITE_POOL_SLUG = "e2e-invite-pool"
E2E_INVITE_TARGET_EMAIL = "e2e-invite-target@example.com"
E2E_BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:3000")

USERS: dict[str, tuple[str, str, str]] = {
    "admin": ("e2e-admin@example.com", "owner", "E2E Admin"),
    "employee": ("e2e-employee@example.com", "employee", "E2E Employee"),
    "editor": ("e2e-editor@example.com", "employee", "E2E Editor"),
    "viewer": ("e2e-viewer@example.com", "employee", "E2E Viewer"),
}

MINIMAL_BLANK_PAGES = [
    {
        "id": "e2e-page-1",
        "title": "Page 1",
        "type": "empty",
        "x": 0,
        "y": 0,
        "width": 1200,
        "height": 800,
        "blocks": [],
    }
]


def _log(msg: str) -> None:
    print(f"[e2e-seed] {msg}")


def _find_user_id_by_email(email: str) -> str | None:
    normalized = email.lower().strip()
    page = 1
    while page <= 20:
        try:
            listed = supabase_admin.auth.admin.list_users(page=page, per_page=200)
        except TypeError:
            listed = supabase_admin.auth.admin.list_users()
        users = getattr(listed, "users", None) or listed
        if not users:
            break
        for user in users:
            user_email = (getattr(user, "email", None) or "").lower().strip()
            if user_email == normalized:
                return str(getattr(user, "id", "") or "")
        if len(users) < 200:
            break
        page += 1
    row = (
        supabase_admin.table("tenant_users")
        .select("user_id")
        .ilike("email", normalized)
        .limit(1)
        .execute()
    )
    if row.data:
        return str(row.data[0]["user_id"])
    return None


def _ensure_auth_user(email: str, full_name: str) -> str:
    existing = _find_user_id_by_email(email)
    if existing:
        try:
            supabase_admin.auth.admin.update_user_by_id(
                existing,
                {
                    "password": E2E_PASSWORD,
                    "email_confirm": True,
                    "user_metadata": {"full_name": full_name},
                },
            )
        except Exception as exc:
            _log(f"warn: could not refresh password for {email}: {exc}")
        return existing

    created = supabase_admin.auth.admin.create_user(
        {
            "email": email,
            "password": E2E_PASSWORD,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name},
        }
    )
    user = getattr(created, "user", None) or created
    user_id = getattr(user, "id", None)
    if not user_id:
        raise RuntimeError(f"Failed to create auth user {email}")
    return str(user_id)


def _ensure_tenant(slug: str, name: str) -> str:
    found = (
        supabase_admin.table("tenants")
        .select("id, slug")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    if found.data:
        return str(found.data[0]["id"])

    inserted = (
        supabase_admin.table("tenants")
        .insert(
            {
                "name": name,
                "slug": slug,
                "tier": "advanced",
                "usage_type": "team",
            }
        )
        .execute()
    )
    return str(inserted.data[0]["id"])


def _remove_membership(tenant_id: str, email: str) -> None:
    supabase_admin.table("tenant_users").delete().eq("tenant_id", tenant_id).ilike(
        "email", email.lower().strip()
    ).execute()


def _ensure_membership(tenant_id: str, user_id: str, email: str, role: str) -> None:
    existing = (
        supabase_admin.table("tenant_users")
        .select("id, role")
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    payload = {
        "tenant_id": tenant_id,
        "user_id": user_id,
        "email": email.lower().strip(),
        "role": role,
    }
    if existing.data:
        supabase_admin.table("tenant_users").update({"role": role, "email": payload["email"]}).eq(
            "id", existing.data[0]["id"]
        ).execute()
    else:
        supabase_admin.table("tenant_users").insert(payload).execute()


def _find_fixture(tenant_id: str, fixture_key: str) -> dict[str, Any] | None:
    res = (
        supabase_admin.table("custom_records")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("module_name", "projects")
        .eq("record_data->>e2e_fixture_key", fixture_key)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def _upsert_project(
    tenant_id: str,
    fixture_key: str,
    record_data: dict[str, Any],
    *,
    visibility_mode: str = "private",
    owner_user_id: str | None = None,
    is_global_public: bool = False,
) -> str:
    record_data = {**record_data, "e2e_fixture_key": fixture_key}
    existing = _find_fixture(tenant_id, fixture_key)
    row = {
        "tenant_id": tenant_id,
        "module_name": "projects",
        "record_data": record_data,
        "visibility_mode": visibility_mode,
        "owner_user_id": owner_user_id,
        "is_global_public": is_global_public,
    }
    if existing:
        supabase_admin.table("custom_records").update(row).eq("id", existing["id"]).execute()
        return str(existing["id"])

    inserted = supabase_admin.table("custom_records").insert(row).execute()
    return str(inserted.data[0]["id"])


def _write_env_e2e(
    tenant_id: str,
    project_ids: dict[str, str],
) -> Path:
    lines = [
        "# Auto-generated by backend/scripts/e2e_seed.py — do not commit secrets if customized.",
        f'E2E_BASE_URL="{E2E_BASE_URL}"',
        f'E2E_TENANT_SLUG="{E2E_SLUG}"',
        f'E2E_TENANT_ID="{tenant_id}"',
        f'E2E_EMPLOYEE_EMAIL="{USERS["employee"][0]}"',
        f'E2E_EMPLOYEE_PASSWORD="{E2E_PASSWORD}"',
        f'E2E_EDITOR_EMAIL="{USERS["editor"][0]}"',
        f'E2E_EDITOR_PASSWORD="{E2E_PASSWORD}"',
        f'E2E_VIEWER_EMAIL="{USERS["viewer"][0]}"',
        f'E2E_VIEWER_PASSWORD="{E2E_PASSWORD}"',
        f'E2E_ADMIN_EMAIL="{USERS["admin"][0]}"',
        f'E2E_ADMIN_PASSWORD="{E2E_PASSWORD}"',
        f'E2E_INVITE_TARGET_EMAIL="{E2E_INVITE_TARGET_EMAIL}"',
        f'E2E_PRIVATE_PROJECT_ID="{project_ids["private"]}"',
        f'E2E_OPEN_PROJECT_ID="{project_ids["open"]}"',
        f'E2E_TIMELINE_PROJECT_ID="{project_ids["timeline"]}"',
        f'E2E_KANBAN_PROJECT_ID="{project_ids["kanban"]}"',
        f'E2E_COLLAB_CANVAS_PROJECT_ID="{project_ids["collab_canvas"]}"',
        f'E2E_VIEWER_DENIED_PROJECT_ID="{project_ids["viewer_denied"]}"',
        f'E2E_PUBLIC_SHARE_PROJECT_ID="{project_ids["public_share"]}"',
        "",
    ]
    out = REPO_ROOT / ".env.e2e"
    out.write_text("\n".join(lines), encoding="utf-8")
    return out


def main() -> int:
    try:
        _log("Ensuring E2E auth users...")
        user_ids = {
            key: _ensure_auth_user(email, name)
            for key, (email, _role, name) in USERS.items()
        }

        tenant_id = _ensure_tenant(E2E_SLUG, E2E_TENANT_NAME)
        _log(f"Tenant {E2E_SLUG} id={tenant_id}")

        invite_target_id = _ensure_auth_user(E2E_INVITE_TARGET_EMAIL, "E2E Invite Target")
        invite_pool_id = _ensure_tenant(E2E_INVITE_POOL_SLUG, "E2E Invite Pool")
        _ensure_membership(invite_pool_id, invite_target_id, E2E_INVITE_TARGET_EMAIL, "employee")
        _remove_membership(tenant_id, E2E_INVITE_TARGET_EMAIL)
        _log(f"Invite target ready ({E2E_INVITE_TARGET_EMAIL}) - not in main tenant")

        for key, (email, role, _name) in USERS.items():
            _ensure_membership(tenant_id, user_ids[key], email, role)

        admin_email = USERS["admin"][0]
        employee_email = USERS["employee"][0]
        editor_email = USERS["editor"][0]
        viewer_email = USERS["viewer"][0]

        _log("Upserting fixture projects...")
        project_ids = {
            "private": _upsert_project(
                tenant_id,
                "private",
                {
                    "name": "E2E Private Project",
                    "template": "blank",
                    "visibility": "private",
                    "visibility_mode": "private",
                    "owner_email": employee_email,
                    "collaborators": [{"email": employee_email, "role": "admin"}],
                    "pages": MINIMAL_BLANK_PAGES,
                    "connections": [],
                },
                visibility_mode="private",
                owner_user_id=user_ids["employee"],
            ),
            "open": _upsert_project(
                tenant_id,
                "open",
                {
                    "name": "E2E Open Project",
                    "template": "blank",
                    "visibility": "public",
                    "visibility_mode": "open",
                    "owner_email": admin_email,
                    "collaborators": [{"email": admin_email, "role": "admin"}],
                    "pages": MINIMAL_BLANK_PAGES,
                    "connections": [],
                },
                visibility_mode="open",
                owner_user_id=user_ids["admin"],
            ),
            "timeline": _upsert_project(
                tenant_id,
                "timeline",
                {
                    "name": "E2E Timeline Project",
                    "template": "timeline",
                    "visibility": "private",
                    "visibility_mode": "private",
                    "owner_email": employee_email,
                    "collaborators": [{"email": employee_email, "role": "admin"}],
                    "timelineEvents": [],
                    "timelineViews": [],
                },
                visibility_mode="private",
                owner_user_id=user_ids["employee"],
            ),
            "kanban": _upsert_project(
                tenant_id,
                "kanban",
                {
                    "name": "E2E Kanban Project",
                    "template": "kanban",
                    "visibility": "private",
                    "visibility_mode": "private",
                    "owner_email": employee_email,
                    "collaborators": [{"email": employee_email, "role": "admin"}],
                    "tasks": [],
                    "columns": [
                        {"id": "todo", "title": "To Do", "color": "bg-zinc-100"},
                        {"id": "in_progress", "title": "In Progress", "color": "bg-sky-100"},
                        {"id": "done", "title": "Done", "color": "bg-emerald-100"},
                    ],
                },
                visibility_mode="private",
                owner_user_id=user_ids["employee"],
            ),
            "collab_canvas": _upsert_project(
                tenant_id,
                "collab_canvas",
                {
                    "name": "E2E Collab Canvas",
                    "template": "blank",
                    "visibility": "private",
                    "visibility_mode": "private",
                    "owner_email": admin_email,
                    "collaborators": [
                        {"email": admin_email, "role": "admin"},
                        {"email": editor_email, "role": "editor"},
                        {"email": viewer_email, "role": "viewer"},
                    ],
                    "pages": MINIMAL_BLANK_PAGES,
                    "connections": [],
                },
                visibility_mode="private",
                owner_user_id=user_ids["admin"],
            ),
            "viewer_denied": _upsert_project(
                tenant_id,
                "viewer_denied",
                {
                    "name": "E2E Viewer Denied",
                    "template": "blank",
                    "visibility": "private",
                    "visibility_mode": "private",
                    "owner_email": admin_email,
                    "collaborators": [{"email": admin_email, "role": "admin"}],
                    "pages": MINIMAL_BLANK_PAGES,
                    "connections": [],
                },
                visibility_mode="private",
                owner_user_id=user_ids["admin"],
            ),
            "public_share": _upsert_project(
                tenant_id,
                "public_share",
                {
                    "name": "E2E Public Share",
                    "template": "blank",
                    "visibility": "public",
                    "visibility_mode": "open",
                    "is_global_public": "true",
                    "is_global_shared": "true",
                    "owner_email": admin_email,
                    "collaborators": [{"email": admin_email, "role": "admin"}],
                    "pages": MINIMAL_BLANK_PAGES,
                    "connections": [],
                },
                visibility_mode="open",
                owner_user_id=user_ids["admin"],
                is_global_public=True,
            ),
        }

        env_path = _write_env_e2e(tenant_id, project_ids)
        _log(f"Wrote {env_path}")
        _log("Done. Run: npm run test:e2e")
        print(json.dumps({"tenant_id": tenant_id, "projects": project_ids}, indent=2))
        return 0
    except Exception as exc:
        _log(f"FAILED: {exc}")
        _log(
            "Ensure backend/.env has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and "
            "docker compose is up (localhost:3000)."
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
