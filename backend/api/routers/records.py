from fastapi import APIRouter, HTTPException, Query, Depends, Header, BackgroundTasks, Request
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
import json
import logging
import redis

from core.config import settings
from core.database import supabase_admin, get_auth_client
from core.auth_jwt import verify_access_token
from core.project_access import (
    Permission,
    build_access_context,
    assert_project_access,
    filter_accessible_projects,
    is_system_module,
    is_global_public_flags,
    load_grants_for_projects,
    patch_changes_manage_fields,
    resolve_visibility_mode,
    sync_global_public_flags,
    sync_visibility_to_record_data,
    timeline_parent_project_id,
)
from models.record import (
    RecordCreate,
    RecordUpdate,
    RecordResponse,
    ProjectAccessUpdate,
)

router = APIRouter(
    prefix="/api/records",
    tags=["Dynamic Records"],
)

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
CACHE_TTL_SECONDS = 120
logger = logging.getLogger(__name__)


def _roles_cache_key(user_id: str) -> str:
    return f"auth_roles:{user_id}"


def invalidate_user_role_cache(user_id: str | None) -> None:
    if not user_id:
        return
    try:
        redis_client.delete(_roles_cache_key(str(user_id)))
    except Exception as e:
        print(f"Redis invalidate role cache error: {e}")


def get_user_role(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = authorization.replace("Bearer ", "")

    try:
        identity = verify_access_token(token)
        user_id = identity["user_id"]
        email = identity["email"] or f"{user_id}@unknown"
        full_name = email.split("@")[0] if "@" in email else user_id[:8]

        cached = None
        try:
            cached = redis_client.get(_roles_cache_key(user_id))
        except Exception as e:
            print(f"Redis Read Error: {str(e)}")

        tenant_roles: dict[str, str] = {}
        tenant_memberships: dict[str, dict] = {}

        if cached:
            payload = json.loads(cached)
            if isinstance(payload, dict) and "tenant_memberships" in payload:
                tenant_memberships = payload.get("tenant_memberships") or {}
                tenant_roles = payload.get("tenant_roles") or {}
            else:
                tenant_roles = payload if isinstance(payload, dict) else {}

        if not tenant_memberships:
            role_res = (
                supabase_admin.table("tenant_users")
                .select("role, tenant_id, department_id, custom_role_id")
                .eq("user_id", user_id)
                .execute()
            )
            tenant_roles = {}
            tenant_memberships = {}
            for row in role_res.data or []:
                tid = str(row.get("tenant_id"))
                tenant_roles[tid] = str(row.get("role", "employee")).lower()
                tenant_memberships[tid] = {
                    "role": tenant_roles[tid],
                    "department_id": str(row["department_id"]) if row.get("department_id") else None,
                    "custom_role_id": str(row["custom_role_id"]) if row.get("custom_role_id") else None,
                }
            try:
                redis_client.setex(
                    _roles_cache_key(user_id),
                    CACHE_TTL_SECONDS,
                    json.dumps(
                        {
                            "tenant_roles": tenant_roles,
                            "tenant_memberships": tenant_memberships,
                        }
                    ),
                )
            except Exception as e:
                print(f"Redis Write Error: {str(e)}")

        if not tenant_roles:
            raise HTTPException(
                status_code=403, detail="User does not belong to any workspace"
            )

        return {
            "user_id": user_id,
            "full_name": full_name,
            "email": email,
            "tenant_roles": tenant_roles,
            "tenant_memberships": tenant_memberships,
            "client": get_auth_client(token),
            "token": token,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token or session expired")


def _fetch_record(record_id: str) -> dict:
    res = (
        supabase_admin.table("custom_records")
        .select("*")
        .eq("id", record_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Record not found")
    return res.data[0]


def _sync_department_grants(
    tenant_id: str,
    project_id: str,
    department_grants: list[dict],
    created_by: str,
) -> None:
    supabase_admin.table("project_access_grants").delete().eq(
        "project_id", project_id
    ).eq("subject_type", "department").execute()
    rows = []
    for item in department_grants or []:
        dept_id = str(item.get("department_id") or item.get("subject_id") or "")
        if not dept_id:
            continue
        perm = str(item.get("permission") or "view").lower()
        if perm not in ("view", "edit"):
            perm = "view"
        rows.append(
            {
                "tenant_id": tenant_id,
                "project_id": project_id,
                "subject_type": "department",
                "subject_id": dept_id,
                "permission": perm,
                "created_by": created_by,
            }
        )
    if rows:
        supabase_admin.table("project_access_grants").insert(rows).execute()


def _resolve_department_grants(body: ProjectAccessUpdate) -> list[dict]:
    if body.department_grants:
        return [
            {"department_id": str(g.department_id), "permission": g.permission}
            for g in body.department_grants
        ]
    return [
        {"department_id": str(d), "permission": "view"} for d in body.department_ids
    ]


def _sync_collaborator_grants(
    tenant_id: str,
    project_id: str,
    collaborators: list,
    created_by: str,
) -> None:
    safe_collaborators = collaborators if isinstance(collaborators, list) else []
    grants_by_user: dict[str, str] = {}
    for c in safe_collaborators:
        if not isinstance(c, dict) or not c.get("email"):
            continue
        email = str(c.get("email")).lower().strip()
        tu = (
            supabase_admin.table("tenant_users")
            .select("user_id")
            .eq("tenant_id", tenant_id)
            .ilike("email", email)
            .limit(1)
            .execute()
        )
        if not tu.data:
            continue
        uid = tu.data[0]["user_id"]
        role = str(c.get("role") or "editor").lower()
        perm = "edit"
        if role == "viewer":
            perm = "view"
        elif role == "admin":
            perm = "manage"
        grants_by_user[str(uid)] = perm

    # Collaborators are the source of truth for user grants. Replacing the full
    # set removes access for deleted collaborators and clears higher permissions
    # when a collaborator is demoted.
    supabase_admin.table("project_access_grants").delete().eq(
        "project_id", project_id
    ).eq("subject_type", "user").execute()

    rows = [
        {
            "tenant_id": tenant_id,
            "project_id": project_id,
            "subject_type": "user",
            "subject_id": user_id,
            "permission": permission,
            "created_by": created_by,
        }
        for user_id, permission in grants_by_user.items()
    ]
    if rows:
        supabase_admin.table("project_access_grants").insert(rows).execute()


@router.post("/", response_model=RecordResponse)
def create_record(record: RecordCreate, user: dict = Depends(get_user_role)):
    try:
        data = record.model_dump(mode="json")
        req_tenant = str(data.get("tenant_id"))
        req_module = data.get("module_name", "projects")

        if req_tenant not in user["tenant_roles"]:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to create records in this workspace.",
            )

        ctx = build_access_context(user, req_tenant)
        parent_id = timeline_parent_project_id(req_module)
        if parent_id:
            parent = _fetch_record(parent_id)
            if str(parent.get("tenant_id")) != req_tenant:
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to access this project.",
                )
            assert_project_access(ctx, parent, Permission.EDIT)

        if not is_system_module(req_module):
            tenant_res = (
                supabase_admin.table("tenants")
                .select("tier")
                .eq("id", req_tenant)
                .execute()
            )
            if not tenant_res.data:
                raise HTTPException(status_code=404, detail="Workspace not found")

            current_tier = (tenant_res.data[0].get("tier") or "basic").lower()
            if current_tier == "free":
                current_tier = "basic"

            count_res = (
                supabase_admin.table("custom_records")
                .select("id", count="exact")
                .eq("tenant_id", req_tenant)
                .neq("module_name", "workspace_modules")
                .neq("module_name", "activity_logs")
                .not_.like("module_name", "timeline_data_%")
                .execute()
            )
            current_project_count = (
                count_res.count if count_res.count is not None else len(count_res.data)
            )
            project_limits = {"basic": 5, "advanced": 100, "pro": float("inf")}
            limit = project_limits.get(current_tier, 5)
            if current_project_count >= limit:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"Project limit reached! Found {current_project_count} projects. "
                        f"Your {current_tier.capitalize()} plan allows up to {limit}."
                    ),
                )

        if "record_data" not in data or not data["record_data"]:
            data["record_data"] = {}

        visibility_mode = resolve_visibility_mode(
            {"record_data": data["record_data"], "visibility_mode": "private"}
        )
        if not is_system_module(req_module) and visibility_mode not in (
            "private",
            "open",
            "admin_only",
            "department",
        ):
            visibility_mode = "private"

        data["record_data"] = sync_visibility_to_record_data(
            data["record_data"], visibility_mode
        )
        data["record_data"]["updated_at"] = datetime.now(timezone.utc).isoformat()
        data["record_data"]["updated_by"] = user["full_name"]
        data["record_data"]["owner_email"] = user["email"]
        data["record_data"]["collaborators"] = [
            {"email": user["email"], "role": "admin"}
        ]
        data["visibility_mode"] = visibility_mode
        data["owner_user_id"] = user["user_id"]
        data["is_global_public"] = False

        response = supabase_admin.table("custom_records").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create record")

        created = response.data[0]
        if not is_system_module(req_module):
            _sync_collaborator_grants(
                req_tenant,
                str(created["id"]),
                data["record_data"]["collaborators"],
                user["user_id"],
            )
            raw_dept_grants = data["record_data"].get("department_grants") or []
            if visibility_mode == "department":
                if raw_dept_grants:
                    dept_grants = [
                        {
                            "department_id": str(g.get("department_id")),
                            "permission": g.get("permission", "view"),
                        }
                        for g in raw_dept_grants
                        if isinstance(g, dict) and g.get("department_id")
                    ]
                else:
                    dept_ids = data["record_data"].get("department_ids") or []
                    dept_grants = [
                        {"department_id": str(d), "permission": "view"} for d in dept_ids
                    ]
                if dept_grants:
                    _sync_department_grants(
                        req_tenant,
                        str(created["id"]),
                        dept_grants,
                        user["user_id"],
                    )
        return created
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create record")
        raise HTTPException(status_code=500, detail="Failed to create record") from e


@router.get("/", response_model=List[RecordResponse])
def get_records(
    tenant_id: UUID = Query(...),
    module_name: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_user_role),
):
    try:
        tenant_str = str(tenant_id)
        if tenant_str not in user["tenant_roles"]:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this workspace's records.",
            )

        ctx = build_access_context(user, tenant_str)
        # Query with the caller's JWT so Postgres RLS filters inaccessible
        # projects before offset/limit are applied.
        query = (
            user["client"].table("custom_records")
            .select("*")
            .eq("tenant_id", tenant_str)
        )
        if module_name:
            query = query.eq("module_name", module_name)

        response = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return filter_accessible_projects(
            ctx, response.data or [], Permission.VIEW
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list records")
        raise HTTPException(status_code=500, detail="Failed to list records") from e


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(record_id: UUID, user: dict = Depends(get_user_role)):
    try:
        record = _fetch_record(str(record_id))
        rec_tenant = str(record.get("tenant_id"))
        if rec_tenant not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized to access this record")

        ctx = build_access_context(user, rec_tenant)
        assert_project_access(ctx, record, Permission.VIEW)
        return record
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to load record %s", record_id)
        raise HTTPException(status_code=500, detail="Failed to load record") from e


@router.get("/{record_id}/access")
def get_project_access(record_id: UUID, user: dict = Depends(get_user_role)):
    record = _fetch_record(str(record_id))
    rec_tenant = str(record.get("tenant_id"))
    if rec_tenant not in user["tenant_roles"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ctx = build_access_context(user, rec_tenant)
    assert_project_access(ctx, record, Permission.MANAGE)

    grants = (
        supabase_admin.table("project_access_grants")
        .select("*")
        .eq("project_id", str(record_id))
        .execute()
    )
    grant_rows = grants.data or []
    record_data = record.get("record_data") or {}
    department_grants = [
        {
            "department_id": str(g.get("subject_id")),
            "permission": g.get("permission") or "view",
        }
        for g in grant_rows
        if g.get("subject_type") == "department"
    ]
    custom_role_grants = [
        {
            "custom_role_id": str(g.get("subject_id")),
            "permission": g.get("permission") or "view",
        }
        for g in grant_rows
        if g.get("subject_type") == "custom_role"
    ]
    return {
        "visibility_mode": resolve_visibility_mode(record),
        "department_ids": record_data.get("department_ids")
        or [g["department_id"] for g in department_grants],
        "department_grants": department_grants,
        "custom_role_grants": custom_role_grants,
        "grants": grant_rows,
        "collaborators": record_data.get("collaborators") or [],
    }


@router.put("/{record_id}/access")
def update_project_access(
    record_id: UUID,
    body: ProjectAccessUpdate,
    user: dict = Depends(get_user_role),
):
    record = _fetch_record(str(record_id))
    rec_tenant = str(record.get("tenant_id"))
    if rec_tenant not in user["tenant_roles"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ctx = build_access_context(user, rec_tenant)
    assert_project_access(ctx, record, Permission.MANAGE)

    record_data = dict(record.get("record_data") or {})
    dept_grants = _resolve_department_grants(body)
    record_data = sync_visibility_to_record_data(record_data, body.visibility_mode)
    record_data["department_ids"] = [g["department_id"] for g in dept_grants]
    record_data["department_grants"] = dept_grants

    update_payload = {
        "visibility_mode": body.visibility_mode,
        "record_data": record_data,
    }

    supabase_admin.table("custom_records").update(update_payload).eq(
        "id", str(record_id)
    ).execute()
    _sync_department_grants(
        rec_tenant,
        str(record_id),
        dept_grants,
        user["user_id"],
    )
    if body.grants is not None:
        supabase_admin.table("project_access_grants").delete().eq(
            "project_id", str(record_id)
        ).eq("subject_type", "custom_role").execute()
        custom_rows = []
        for g in body.grants:
            if g.subject_type != "custom_role":
                continue
            custom_rows.append(
                {
                    "tenant_id": rec_tenant,
                    "project_id": str(record_id),
                    "subject_type": g.subject_type,
                    "subject_id": str(g.subject_id),
                    "permission": g.permission,
                    "created_by": user["user_id"],
                }
            )
        if custom_rows:
            supabase_admin.table("project_access_grants").insert(custom_rows).execute()

    return {"message": "Project access updated"}


@router.patch("/{record_id}", response_model=RecordResponse)
def update_record(
    record_id: UUID,
    payload: RecordUpdate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_user_role),
):
    try:
        existing = _fetch_record(str(record_id))
        rec_tenant = str(existing.get("tenant_id"))

        if rec_tenant not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized to modify this record")

        ctx = build_access_context(user, rec_tenant)
        current_record_data = existing.get("record_data", {}) or {}
        payload_data = dict(payload.record_data)
        payload_data = sync_global_public_flags(payload_data, current_record_data)
        collaborators_changed = (
            "collaborators" in payload_data
            and payload_data.get("collaborators")
            != current_record_data.get("collaborators")
        )

        needs_manage = patch_changes_manage_fields(payload_data, current_record_data)
        if needs_manage:
            assert_project_access(ctx, existing, Permission.MANAGE)
        else:
            assert_project_access(ctx, existing, Permission.EDIT)

        if (
            "owner_email" in payload_data
            and str(payload_data.get("owner_email") or "").lower().strip()
            != str(current_record_data.get("owner_email") or "").lower().strip()
        ):
            raise HTTPException(
                status_code=403,
                detail="Project ownership cannot be changed through record updates.",
            )

        if "collaborators" not in payload_data:
            payload_data["collaborators"] = current_record_data.get("collaborators", [])

        for key in ("name", "visibility", "visibility_mode", "status", "owner_email"):
            if key not in payload_data and key in current_record_data:
                payload_data[key] = current_record_data[key]

        visibility_mode = resolve_visibility_mode(
            {
                **existing,
                "record_data": payload_data,
                "visibility_mode": payload_data.get(
                    "visibility_mode", existing.get("visibility_mode")
                ),
            }
        )
        payload_data = sync_visibility_to_record_data(payload_data, visibility_mode)

        raw_new_collabs = payload_data.get("collaborators", [])
        raw_old_collabs = current_record_data.get("collaborators", [])
        if not isinstance(raw_new_collabs, list):
            raw_new_collabs = []
        if not isinstance(raw_old_collabs, list):
            raw_old_collabs = []

        old_emails = {
            str(c.get("email", "")).lower().strip()
            for c in raw_old_collabs
            if isinstance(c, dict) and c.get("email")
        }
        added_collabs = [
            c
            for c in raw_new_collabs
            if isinstance(c, dict)
            and c.get("email")
            and str(c.get("email", "")).lower().strip() not in old_emails
        ]

        notifications_to_insert = []
        for collab in added_collabs:
            target_email = str(collab.get("email")).lower().strip()
            if target_email == user["email"]:
                continue
            project_name = payload_data.get(
                "name", payload_data.get("title", "Untitled Canvas")
            )
            notifications_to_insert.append(
                {
                    "target_email": target_email,
                    "type": "invite",
                    "title": "Project Invitation",
                    "message": f"{user['full_name']} invited you to collaborate on '{project_name}'.",
                    "action_url": f"/dashboard/{rec_tenant}/projects/{str(record_id)}",
                }
            )

        if notifications_to_insert:
            background_tasks.add_task(process_invite_notifications, notifications_to_insert)

        payload_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        payload_data["updated_by"] = user["full_name"]

        global_public = is_global_public_flags(payload_data)
        update_row = {
            "record_data": payload_data,
            "visibility_mode": visibility_mode,
            "is_global_public": global_public,
        }

        response = (
            supabase_admin.table("custom_records")
            .update(update_row)
            .eq("id", str(record_id))
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")

        if not is_system_module(str(existing.get("module_name") or "")):
            raw_dept_grants = payload_data.get("department_grants")
            dept_ids = payload_data.get("department_ids")
            if raw_dept_grants is not None or dept_ids is not None:
                if isinstance(raw_dept_grants, list) and raw_dept_grants:
                    dept_grants = [
                        {
                            "department_id": str(g.get("department_id")),
                            "permission": g.get("permission", "view"),
                        }
                        for g in raw_dept_grants
                        if isinstance(g, dict) and g.get("department_id")
                    ]
                elif isinstance(dept_ids, list):
                    dept_grants = [
                        {"department_id": str(d), "permission": "view"} for d in dept_ids
                    ]
                else:
                    dept_grants = []
                _sync_department_grants(
                    rec_tenant,
                    str(record_id),
                    dept_grants,
                    user["user_id"],
                )
            if collaborators_changed:
                _sync_collaborator_grants(
                    rec_tenant,
                    str(record_id),
                    payload_data.get("collaborators", []),
                    user["user_id"],
                )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update record %s", record_id)
        raise HTTPException(status_code=500, detail="Failed to update record") from e


@router.delete("/{record_id}")
def delete_record(record_id: UUID, user: dict = Depends(get_user_role)):
    try:
        record = _fetch_record(str(record_id))
        rec_tenant = str(record.get("tenant_id"))
        if rec_tenant not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized")

        ctx = build_access_context(user, rec_tenant)
        assert_project_access(ctx, record, Permission.DELETE)

        response = (
            supabase_admin.table("custom_records")
            .delete()
            .eq("id", str(record_id))
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"message": "Record permanently deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to delete record %s", record_id)
        raise HTTPException(status_code=500, detail="Failed to delete record") from e


def process_invite_notifications(notifications_to_insert: list):
    if not notifications_to_insert:
        return
    try:
        supabase_admin.table("notifications").insert(notifications_to_insert).execute()
    except Exception as notif_err:
        print(f"Background notification processing error: {notif_err}")
