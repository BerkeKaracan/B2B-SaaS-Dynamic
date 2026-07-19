import os
import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from groq import AsyncGroq
from datetime import datetime

from core.database import supabase, supabase_admin

logger = logging.getLogger("saas_engine")
from core.ai_prompts import (
    get_magic_wand_prompt,
    get_canvas_system_prompt,
    get_chat_prompt,
)

router = APIRouter(prefix="/api/ai", tags=["AI Support"])
security = HTTPBearer()

# ---------------------------------------------------------------------------
# Tool schemas (module-specific toolsets selected at runtime)
# ---------------------------------------------------------------------------

CREATE_TASK_TOOL = {
    "type": "function",
    "function": {
        "name": "create_task",
        "description": (
            "Create a real Kanban task bound to the active board/module. "
            "ALWAYS use this when the user asks to create or add a task."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Short task title."},
                "description": {
                    "type": "string",
                    "description": "Optional details / acceptance criteria.",
                },
                "status": {
                    "type": "string",
                    "enum": ["todo", "in_progress", "done"],
                    "description": "Defaults to todo.",
                },
                "priority": {
                    "type": "string",
                    "enum": ["URGENT", "HIGH", "MEDIUM", "LOW", "NO PRIORITY"],
                    "description": "Defaults to MEDIUM.",
                },
            },
            "required": ["title"],
            "additionalProperties": False,
        },
    },
}

MOVE_TASK_TOOL = {
    "type": "function",
    "function": {
        "name": "move_task",
        "description": (
            "Move an existing Kanban task to a new status/column "
            "(todo, in_progress, done)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Title (or unique fragment) of the task to move.",
                },
                "status": {
                    "type": "string",
                    "enum": ["todo", "in_progress", "done"],
                    "description": "Target workflow status.",
                },
            },
            "required": ["title", "status"],
            "additionalProperties": False,
        },
    },
}

ADD_MINDMAP_NODE_TOOL = {
    "type": "function",
    "function": {
        "name": "add_mindmap_node",
        "description": "Add a new idea/node to the active mind map.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Node label text."},
                "parent_text": {
                    "type": "string",
                    "description": "Optional parent node text to nest under.",
                },
            },
            "required": ["text"],
            "additionalProperties": False,
        },
    },
}

FORMAT_NOTEPAD_TOOL = {
    "type": "function",
    "function": {
        "name": "format_notepad_text",
        "description": (
            "Write or rewrite notepad/document content as Markdown. "
            "Use replace for full rewrite, append to add a section."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "Markdown content to write.",
                },
                "mode": {
                    "type": "string",
                    "enum": ["replace", "append"],
                    "description": "Defaults to replace.",
                },
                "title": {
                    "type": "string",
                    "description": "Optional note title update.",
                },
            },
            "required": ["content"],
            "additionalProperties": False,
        },
    },
}

ADD_WHITEBOARD_NOTE_TOOL = {
    "type": "function",
    "function": {
        "name": "add_whiteboard_note",
        "description": "Add a sticky note / text card to the whiteboard.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Note text."},
                "x": {"type": "number", "description": "Optional X position."},
                "y": {"type": "number", "description": "Optional Y position."},
            },
            "required": ["text"],
            "additionalProperties": False,
        },
    },
}

MODULE_TOOLSETS: Dict[str, List[Dict[str, Any]]] = {
    "kanban": [CREATE_TASK_TOOL, MOVE_TASK_TOOL],
    "mindmap": [ADD_MINDMAP_NODE_TOOL],
    "notepad": [FORMAT_NOTEPAD_TOOL],
    "notes": [FORMAT_NOTEPAD_TOOL],
    "document": [FORMAT_NOTEPAD_TOOL],
    "whiteboard": [ADD_WHITEBOARD_NOTE_TOOL],
}

KANBAN_STATUS_MAP = {
    "todo": "TO DO",
    "in_progress": "IN PROGRESS",
    "done": "DONE",
}
BACKEND_STATUS_SET = {"todo", "in_progress", "done"}
PRIORITY_SET = {"URGENT", "HIGH", "MEDIUM", "LOW", "NO PRIORITY"}


def verify_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")
        return user_res.user
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized: Session not found")


def assert_tenant_access(tenant_id: str, user_id: str) -> None:
    member_check = (
        supabase_admin.table("tenant_users")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not member_check.data:
        raise HTTPException(status_code=403, detail="Workspace access denied.")


def normalize_module(raw: Optional[str]) -> str:
    key = (raw or "general").strip().lower()
    aliases = {
        "note": "notepad",
        "notes": "notepad",
        "doc": "document",
        "docs": "document",
        "todo": "kanban",
        "tasks": "kanban",
        "board": "kanban",
    }
    return aliases.get(key, key)


def normalize_status(raw: Optional[str]) -> str:
    if not raw:
        return "todo"
    value = raw.strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "to_do": "todo",
        "todo": "todo",
        "inprogress": "in_progress",
        "in_progress": "in_progress",
        "done": "done",
        "complete": "done",
        "completed": "done",
    }
    mapped = aliases.get(value, value)
    return mapped if mapped in BACKEND_STATUS_SET else "todo"


def normalize_priority(raw: Optional[str]) -> str:
    if not raw:
        return "MEDIUM"
    value = raw.strip().upper()
    if value == "NO_PRIORITY":
        value = "NO PRIORITY"
    return value if value in PRIORITY_SET else "MEDIUM"


def resolve_actor(user) -> str:
    actor = getattr(user, "email", None) or "AI Assistant"
    try:
        meta = getattr(user, "user_metadata", None) or {}
        if isinstance(meta, dict):
            actor = (
                meta.get("full_name")
                or meta.get("name")
                or meta.get("user_name")
                or actor
            )
    except Exception:
        pass
    return actor


def load_module_record(tenant_id: str, module_id: str) -> Dict[str, Any]:
    """Fetch the custom_records row for this module, tenant-isolated."""
    res = (
        supabase_admin.table("custom_records")
        .select("id, tenant_id, record_data")
        .eq("id", module_id)
        .eq("tenant_id", tenant_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="Module/project not found in this workspace.",
        )
    return res.data[0]


def save_module_record_data(
    tenant_id: str, module_id: str, record_data: Dict[str, Any]
) -> None:
    supabase_admin.table("custom_records").update(
        {"record_data": record_data}
    ).eq("id", module_id).eq("tenant_id", tenant_id).execute()


PAGE_TYPE_ALIASES: Dict[str, List[str]] = {
    "kanban": ["kanban"],
    "mindmap": ["mindmap"],
    "notepad": ["notes", "notepad", "document"],
    "document": ["document", "notes", "notepad"],
    "whiteboard": ["whiteboard"],
}


def resolve_target_page(
    record_data: Dict[str, Any],
    page_id: Optional[str] = None,
    preferred_types: Optional[List[str]] = None,
) -> Optional[Dict[str, Any]]:
    """Find the canvas page/frame to mutate for template tools."""
    pages = list(record_data.get("pages") or [])
    if not pages:
        return None
    if page_id:
        match = next((p for p in pages if str(p.get("id")) == str(page_id)), None)
        if match:
            return match
    if preferred_types:
        wanted = {t.lower() for t in preferred_types}
        for page in pages:
            if str(page.get("type") or "").lower() in wanted:
                return page
    return pages[0]


def upsert_page_in_record(
    record_data: Dict[str, Any], page: Dict[str, Any]
) -> Dict[str, Any]:
    pages = list(record_data.get("pages") or [])
    page_id = page.get("id")
    replaced = False
    for i, existing in enumerate(pages):
        if existing.get("id") == page_id:
            pages[i] = page
            replaced = True
            break
    if not replaced:
        pages.append(page)
    record_data["pages"] = pages
    return record_data


def mirror_list_to_page_settings(
    record_data: Dict[str, Any],
    page: Optional[Dict[str, Any]],
    key: str,
    values: List[Dict[str, Any]],
) -> None:
    """Keep top-level metadata and page.settings in sync for template UIs."""
    record_data[key] = values
    if page is None:
        return
    settings = dict(page.get("settings") or {})
    settings[key] = values
    # AI-generated pages historically used metadata nested under settings
    if key == "kanbanTasks":
        settings["tasks"] = values
    page["settings"] = settings
    upsert_page_in_record(record_data, page)


def detect_forced_tool(
    current_module: str, last_user_text: str
) -> Optional[str]:
    """When the user clearly wants an action, force the matching tool."""
    text = (last_user_text or "").strip().lower()
    if not text:
        return None

    create_hints = (
        "add",
        "create",
        "new task",
        "todo",
        "to-do",
        "to do",
        "task",
        "card",
        "schedule",
        "log a",
        "make a",
        "görev",
        "ekle",
        "oluştur",
    )
    move_hints = (
        "move",
        "mark as",
        "to done",
        "to in progress",
        "start working",
        "complete",
        "taşı",
        "tamamla",
    )
    mindmap_hints = ("node", "idea", "branch", "mindmap", "mind map", "düğüm", "fikir")
    note_hints = (
        "write",
        "rewrite",
        "format",
        "summarize",
        "append",
        "note",
        "document",
        "yaz",
        "özet",
    )
    whiteboard_hints = ("sticky", "whiteboard", "note card", "label", "yapışkan")

    module = normalize_module(current_module)

    if module == "kanban":
        if any(h in text for h in move_hints) and not any(
            h in text for h in ("add", "create", "new task", "ekle", "oluştur")
        ):
            return "move_task"
        if any(h in text for h in create_hints):
            return "create_task"
        # Short imperative titles: "fix login bug"
        if len(text.split()) <= 8 and not text.endswith("?"):
            return "create_task"
        return None

    if module == "mindmap" and any(h in text for h in mindmap_hints + create_hints):
        return "add_mindmap_node"
    if module in ("notepad", "document", "notes") and any(
        h in text for h in note_hints + create_hints
    ):
        return "format_notepad_text"
    if module == "whiteboard" and any(
        h in text for h in whiteboard_hints + create_hints
    ):
        return "add_whiteboard_note"

    # Blank canvas with task language → create_task
    if module in ("general", "blank", "empty", "canvas"):
        if any(h in text for h in ("task", "todo", "kanban", "görev")):
            return "create_task"
    return None


def get_tools_for_module(current_module: Optional[str], tenant_id: Optional[str]):
    if not tenant_id:
        return None
    key = normalize_module(current_module)
    tools = MODULE_TOOLSETS.get(key)
    # Fallback: allow common actions on blank/infinite canvas
    if not tools and key in ("general", "blank", "empty", "canvas"):
        return [
            CREATE_TASK_TOOL,
            ADD_MINDMAP_NODE_TOOL,
            FORMAT_NOTEPAD_TOOL,
            ADD_WHITEBOARD_NOTE_TOOL,
        ]
    return tools


# ---------------------------------------------------------------------------
# Tool executors
# ---------------------------------------------------------------------------

def execute_create_task(
    *,
    args: Dict[str, Any],
    tenant_id: str,
    module_id: Optional[str],
    page_id: Optional[str] = None,
    user,
) -> Dict[str, Any]:
    """Create a Kanban task: mirror onto project board metadata (+ optional page)."""
    assert_tenant_access(tenant_id, user.id)

    title = (args.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Task title is required.")

    description = (args.get("description") or "").strip()
    status = normalize_status(args.get("status"))
    priority = normalize_priority(args.get("priority"))
    kanban_status = KANBAN_STATUS_MAP[status]
    actor = resolve_actor(user)
    project_name = "Workspace"
    db_id = str(uuid.uuid4())

    try:
        if module_id:
            row = load_module_record(tenant_id, module_id)
            record_data_preview = row.get("record_data") or {}
            if isinstance(record_data_preview, dict):
                project_name = (
                    record_data_preview.get("name")
                    or record_data_preview.get("title")
                    or "Project Board"
                )

        # 1) Prefer real INSERT into `records` — fall back to local id if it fails
        created_row: Optional[Dict[str, Any]] = None
        try:
            insert_res = supabase_admin.table("records").insert(
                {
                    "tenant_id": tenant_id,
                    "module_name": "tasks",
                    "record_data": {
                        "project_id": module_id or "",
                        "module_id": module_id or "",
                        "project_name": project_name,
                        "title": title,
                        "description": description,
                        "status": status,
                        "priority": priority,
                        "due_date": None,
                        "assigned_to": "Unassigned",
                        "created_by": actor,
                        "kanban_status": kanban_status,
                    },
                }
            ).execute()
            created_row = (insert_res.data or [None])[0]
            if created_row and created_row.get("id"):
                db_id = str(created_row["id"])
                record_payload = dict(created_row.get("record_data") or {})
                record_payload["id"] = db_id
                supabase_admin.table("records").update(
                    {"record_data": record_payload}
                ).eq("id", db_id).eq("tenant_id", tenant_id).execute()
                created_row = {**created_row, "record_data": record_payload}
        except Exception as insert_exc:
            print(f"create_task records INSERT soft-failed, mirroring board only: {insert_exc}")

        kanban_task: Dict[str, Any] = {
            "id": db_id,
            "db_id": db_id,
            "title": title,
            "description": description,
            "status": kanban_status,
            "priority": priority,
            "assignee": "Unassigned",
            "createdBy": actor,
            "updatedBy": actor,
            "module_id": module_id,
            "project_id": module_id,
            "page_id": page_id,
            "board_id": page_id,
            "project_name": project_name,
            "backend_status": status,
        }

        # 2) Mirror onto the project board document for Kanban UI
        if module_id:
            row = load_module_record(tenant_id, module_id)
            record_data = row.get("record_data") or {}
            if not isinstance(record_data, dict):
                record_data = {}

            existing_tasks: List[Dict[str, Any]] = list(
                record_data.get("tasks")
                or record_data.get("kanbanTasks")
                or []
            )
            page = resolve_target_page(
                record_data, page_id, PAGE_TYPE_ALIASES["kanban"]
            )
            if page:
                settings = page.get("settings") or {}
                page_tasks = list(
                    settings.get("tasks")
                    or settings.get("kanbanTasks")
                    or []
                )
                if page_tasks and not existing_tasks:
                    existing_tasks = page_tasks

            task_row = {
                "id": db_id,
                "title": title,
                "description": description,
                "status": kanban_status,
                "priority": priority,
                "assignee": "Unassigned",
                "createdBy": actor,
                "updatedBy": actor,
            }
            if not any(str(t.get("id")) == db_id for t in existing_tasks):
                existing_tasks.append(task_row)

            record_data["tasks"] = existing_tasks
            record_data["kanbanTasks"] = existing_tasks
            mirror_list_to_page_settings(
                record_data, page, "kanbanTasks", existing_tasks
            )
            if page:
                settings = dict(page.get("settings") or {})
                settings["tasks"] = existing_tasks
                settings["kanbanTasks"] = existing_tasks
                page["settings"] = settings
                upsert_page_in_record(record_data, page)

            save_module_record_data(tenant_id, module_id, record_data)

        return {
            **kanban_task,
            "db_record": created_row,
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("create_task DB error", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while creating the task.",
        )


def execute_move_task(
    *,
    args: Dict[str, Any],
    tenant_id: str,
    module_id: Optional[str],
    page_id: Optional[str] = None,
    user,
) -> Dict[str, Any]:
    assert_tenant_access(tenant_id, user.id)
    if not module_id:
        raise HTTPException(status_code=400, detail="module_id is required to move tasks.")

    title_query = (args.get("title") or "").strip().lower()
    if not title_query:
        raise HTTPException(status_code=400, detail="Task title is required.")

    status = normalize_status(args.get("status"))
    kanban_status = KANBAN_STATUS_MAP[status]
    actor = resolve_actor(user)

    try:
        row = load_module_record(tenant_id, module_id)
        record_data = row.get("record_data") or {}
        existing_tasks: List[Dict[str, Any]] = list(
            record_data.get("tasks") or record_data.get("kanbanTasks") or []
        )
        page = resolve_target_page(
            record_data, page_id, PAGE_TYPE_ALIASES["kanban"]
        )
        if page and not existing_tasks:
            settings = page.get("settings") or {}
            existing_tasks = list(
                settings.get("tasks") or settings.get("kanbanTasks") or []
            )

        matched = None
        for task in existing_tasks:
            t_title = str(task.get("title") or "").lower()
            if title_query in t_title or t_title in title_query:
                matched = task
                break

        if not matched:
            raise HTTPException(
                status_code=404,
                detail=f"No task matching '{args.get('title')}' found on this board.",
            )

        matched["status"] = kanban_status
        matched["updatedBy"] = actor
        record_data["tasks"] = existing_tasks
        record_data["kanbanTasks"] = existing_tasks
        mirror_list_to_page_settings(
            record_data, page, "kanbanTasks", existing_tasks
        )
        if page:
            settings = dict(page.get("settings") or {})
            settings["tasks"] = existing_tasks
            settings["kanbanTasks"] = existing_tasks
            page["settings"] = settings
            upsert_page_in_record(record_data, page)
        save_module_record_data(tenant_id, module_id, record_data)

        return {
            **matched,
            "module_id": module_id,
            "page_id": page_id,
            "board_id": page_id,
            "backend_status": status,
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("move_task DB error", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while moving the task.",
        )


def execute_add_mindmap_node(
    *,
    args: Dict[str, Any],
    tenant_id: str,
    module_id: Optional[str],
    page_id: Optional[str] = None,
    user,
) -> Dict[str, Any]:
    assert_tenant_access(tenant_id, user.id)
    if not module_id:
        raise HTTPException(status_code=400, detail="module_id is required.")

    text = (args.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Node text is required.")

    parent_text = (args.get("parent_text") or "").strip().lower()
    node_id = f"mm-{uuid.uuid4().hex[:10]}"

    try:
        row = load_module_record(tenant_id, module_id)
        record_data = row.get("record_data") or {}
        page = resolve_target_page(
            record_data, page_id, PAGE_TYPE_ALIASES["mindmap"]
        )
        nodes: List[Dict[str, Any]] = list(record_data.get("mindmapNodes") or [])
        if page and not nodes:
            settings = page.get("settings") or {}
            nodes = list(settings.get("mindmapNodes") or [])

        parent_id = None
        if parent_text:
            for n in nodes:
                if parent_text in str(n.get("text") or "").lower():
                    parent_id = n.get("id")
                    break

        base_x, base_y = 420, 280
        if parent_id:
            parent = next((n for n in nodes if n.get("id") == parent_id), None)
            if parent:
                base_x = float(parent.get("x") or base_x) + 180
                base_y = float(parent.get("y") or base_y) + 40 * (len(nodes) % 5)
        elif nodes:
            base_x = float(nodes[-1].get("x") or base_x) + 160
            base_y = float(nodes[-1].get("y") or base_y) + 40

        node = {
            "id": node_id,
            "text": text,
            "x": base_x,
            "y": base_y,
            "parentId": parent_id,
            "color": "bg-indigo-600",
        }
        nodes.append(node)
        record_data["mindmapNodes"] = nodes
        mirror_list_to_page_settings(record_data, page, "mindmapNodes", nodes)
        save_module_record_data(tenant_id, module_id, record_data)
        return {**node, "module_id": module_id, "page_id": page_id}
    except HTTPException:
        raise
    except Exception:
        logger.error("Mindmap update failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while updating the mindmap.",
        )


def execute_format_notepad(
    *,
    args: Dict[str, Any],
    tenant_id: str,
    module_id: Optional[str],
    page_id: Optional[str] = None,
    user,
) -> Dict[str, Any]:
    assert_tenant_access(tenant_id, user.id)
    if not module_id:
        raise HTTPException(status_code=400, detail="module_id is required.")

    content = (args.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="content is required.")

    mode = (args.get("mode") or "replace").strip().lower()
    title = (args.get("title") or "").strip() or None

    try:
        row = load_module_record(tenant_id, module_id)
        record_data = row.get("record_data") or {}
        page = resolve_target_page(
            record_data, page_id, PAGE_TYPE_ALIASES["notepad"]
        )

        if page is not None:
            # Frame on the infinite canvas → write the page's own settings, then
            # mirror to top-level so standalone views stay in sync.
            settings = dict(page.get("settings") or {})
            existing = (
                settings.get("notepadContent")
                or settings.get("documentContent")
                or ""
            )
            settings["notepadContent"] = (
                f"{existing.rstrip()}\n\n{content}".strip()
                if mode == "append"
                else content
            )
            if title:
                settings["notepadTitle"] = title
                page["title"] = title
            page["settings"] = settings
            upsert_page_in_record(record_data, page)

            record_data["notepadContent"] = settings["notepadContent"]
            if title:
                record_data["notepadTitle"] = title
        else:
            # Standalone notepad project → top-level record_data only.
            existing_meta = record_data.get("notepadContent") or ""
            record_data["notepadContent"] = (
                f"{existing_meta.rstrip()}\n\n{content}".strip()
                if mode == "append"
                else content
            )
            if title:
                record_data["notepadTitle"] = title

        save_module_record_data(tenant_id, module_id, record_data)
        return {
            "mode": mode,
            "title": title,
            "content": content,
            "module_id": module_id,
            "page_id": (page or {}).get("id") if page else page_id,
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Notepad update failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while updating the notepad.",
        )


def execute_add_whiteboard_note(
    *,
    args: Dict[str, Any],
    tenant_id: str,
    module_id: Optional[str],
    page_id: Optional[str] = None,
    user,
) -> Dict[str, Any]:
    assert_tenant_access(tenant_id, user.id)
    if not module_id:
        raise HTTPException(status_code=400, detail="module_id is required.")

    text = (args.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required.")

    note_id = f"wb-{uuid.uuid4().hex[:10]}"
    x = float(args.get("x") or 120 + (uuid.uuid4().int % 280))
    y = float(args.get("y") or 100 + (uuid.uuid4().int % 220))

    # WhiteboardBoard uses `content`; keep `text` for chat payloads.
    note = {
        "id": note_id,
        "text": text,
        "content": text,
        "x": x,
        "y": y,
        "color": "#fef3c7",
        "font": "sans-serif",
        "size": 18,
    }

    try:
        row = load_module_record(tenant_id, module_id)
        record_data = row.get("record_data") or {}
        page = resolve_target_page(
            record_data, page_id, PAGE_TYPE_ALIASES["whiteboard"]
        )

        texts: List[Dict[str, Any]] = list(record_data.get("whiteboardTexts") or [])
        if page is not None:
            settings = dict(page.get("settings") or {})
            page_texts = list(settings.get("whiteboardTexts") or [])
            if page_texts and not texts:
                texts = page_texts
            texts.append(note)
            settings["whiteboardTexts"] = texts
            page["settings"] = settings
            upsert_page_in_record(record_data, page)
        else:
            texts.append(note)

        record_data["whiteboardTexts"] = texts
        save_module_record_data(tenant_id, module_id, record_data)
        return {**note, "module_id": module_id, "page_id": (page or {}).get("id") if page else page_id}
    except HTTPException:
        raise
    except Exception:
        logger.error("Whiteboard update failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while updating the whiteboard.",
        )


TOOL_ACTION_MAP = {
    "create_task": "TASK_ADDED",
    "move_task": "TASK_MOVED",
    "add_mindmap_node": "MINDMAP_NODE_ADDED",
    "format_notepad_text": "NOTEPAD_UPDATED",
    "add_whiteboard_note": "WHITEBOARD_NOTE_ADDED",
}


class MagicWandRequest(BaseModel):
    text: str
    action: str


class GenerateCanvasRequest(BaseModel):
    prompt: str
    x: float
    y: float
    tenant_id: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    workspace_context: str = ""
    tenant_id: Optional[str] = None
    project_id: Optional[str] = None
    current_module: Optional[str] = None
    module_id: Optional[str] = None
    page_id: Optional[str] = None
    board_id: Optional[str] = None


@router.post("/magic-wand")
async def magic_wand(req: MagicWandRequest, user=Depends(verify_user)):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend")

    client = AsyncGroq(api_key=api_key)
    system_prompt = get_magic_wand_prompt()

    if req.action == "summarize":
        user_prompt = f"Please summarize the following text professionally:\n\n{req.text}"
    elif req.action == "brainstorm":
        user_prompt = f"Generate 5 creative and insightful ideas/points about the following topic:\n\n{req.text}"
    elif req.action == "improve":
        user_prompt = f"Proofread the following text, fix grammar, and rewrite it with a more professional and impactful tone:\n\n{req.text}"
    else:
        user_prompt = req.text

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model="openai/gpt-oss-120b",
            temperature=0.6,
            max_tokens=1024,
        )
        return {"result": chat_completion.choices[0].message.content}
    except Exception as e:
        print(f"Magic Wand Error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during the AI request.")


@router.post("/generate-canvas")
async def generate_canvas(req: GenerateCanvasRequest, user=Depends(verify_user)):
    from core.feature_gate import AI_CANVAS_GENERATOR, require_feature

    require_feature(AI_CANVAS_GENERATOR, req.tenant_id, user.id)

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    client = AsyncGroq(api_key=api_key)
    current_date = datetime.now().strftime("%Y-%m-%d")
    system_prompt = get_canvas_system_prompt(current_date, req.x, req.y)

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.prompt},
            ],
            model="openai/gpt-oss-120b",
            temperature=0.5,
            max_tokens=2500,
        )

        result_text = chat_completion.choices[0].message.content.strip()
        result_text = re.sub(r"^`{3}(?:json)?|`{3}$", "", result_text, flags=re.IGNORECASE).strip()

        start_idx, end_idx = -1, -1
        for i, char in enumerate(result_text):
            if char in ["{", "["]:
                start_idx = i
                break
        for i in range(len(result_text) - 1, -1, -1):
            if result_text[i] in ["}", "]"]:
                end_idx = i
                break
        if start_idx != -1 and end_idx != -1:
            result_text = result_text[start_idx : end_idx + 1]

        try:
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError:
            parsed_json = {"type": "empty", "title": "AI Error Recovery", "blocks": []}

        if isinstance(parsed_json, list):
            parsed_json = {"type": "empty", "title": "AI Generated Workspace", "blocks": parsed_json}
        if "blocks" not in parsed_json:
            parsed_json["blocks"] = []
        if "type" not in parsed_json:
            parsed_json["type"] = "empty"
        return parsed_json
    except Exception as e:
        print(f"--- AI FATAL ERROR ---\n{str(e)}\n-------------------------")
        raise HTTPException(status_code=500, detail="An internal error occurred while generating the canvas.")


@router.post("/chat")
async def chat_with_canvas(req: ChatRequest, user=Depends(verify_user)):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    if req.tenant_id:
        assert_tenant_access(req.tenant_id, user.id)

    current_module = normalize_module(req.current_module)
    module_id = req.module_id or req.project_id
    page_id = req.page_id or req.board_id

    client = AsyncGroq(api_key=api_key)
    system_prompt = get_chat_prompt(req.workspace_context, current_module)

    groq_messages: List[Dict[str, Any]] = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        groq_messages.append({"role": msg.role, "content": msg.content})

    last_user_text = ""
    for msg in reversed(req.messages):
        if msg.role == "user":
            last_user_text = msg.content or ""
            break

    tools = get_tools_for_module(current_module, req.tenant_id)
    forced_tool = detect_forced_tool(current_module, last_user_text) if tools else None

    try:
        completion_kwargs: Dict[str, Any] = {
            "messages": groq_messages,
            "model": "openai/gpt-oss-120b",
            "temperature": 0.2,
            "max_tokens": 1024,
        }
        if tools:
            completion_kwargs["tools"] = tools
            if forced_tool and any(
                t.get("function", {}).get("name") == forced_tool for t in tools
            ):
                completion_kwargs["tool_choice"] = {
                    "type": "function",
                    "function": {"name": forced_tool},
                }
            else:
                completion_kwargs["tool_choice"] = "auto"

        completion = await client.chat.completions.create(**completion_kwargs)
        message = completion.choices[0].message
        tool_calls = list(getattr(message, "tool_calls", None) or [])

        # Retry once with a forced tool if the model answered in text only
        if (
            not tool_calls
            and tools
            and forced_tool
            and any(t.get("function", {}).get("name") == forced_tool for t in tools)
        ):
            retry_kwargs = {
                **completion_kwargs,
                "tool_choice": {
                    "type": "function",
                    "function": {"name": forced_tool},
                },
            }
            completion = await client.chat.completions.create(**retry_kwargs)
            message = completion.choices[0].message
            tool_calls = list(getattr(message, "tool_calls", None) or [])

        if not tool_calls:
            reply = (message.content or "").strip() or "How can I help with your workspace?"
            return {
                "message": reply,
                "reply": reply,
                "tool_executed": False,
                "action": None,
                "action_type": None,
                "payload": None,
                "actions": [],
                "errors": [],
                "current_module": current_module,
                "module_id": module_id,
                "page_id": page_id,
            }

        if not req.tenant_id:
            raise HTTPException(
                status_code=400,
                detail="tenant_id is required to execute workspace tools.",
            )

        groq_messages.append(
            {
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            }
        )

        executed_actions: List[Dict[str, Any]] = []
        tool_errors: List[str] = []
        primary_action: Optional[str] = None
        primary_payload: Optional[Dict[str, Any]] = None

        for tool_call in tool_calls:
            fn_name = tool_call.function.name
            try:
                args = json.loads(tool_call.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}

            # If forced create_task and title missing, derive from user text
            if fn_name == "create_task" and not (args.get("title") or "").strip():
                args["title"] = (last_user_text or "New task").strip()[:120]

            if fn_name == "add_mindmap_node" and not (args.get("text") or "").strip():
                args["text"] = (last_user_text or "New idea").strip()[:80]

            if fn_name == "add_whiteboard_note" and not (args.get("text") or "").strip():
                args["text"] = (last_user_text or "Note").strip()[:120]

            if fn_name == "format_notepad_text" and not (args.get("content") or "").strip():
                args["content"] = last_user_text or ""
                args["mode"] = args.get("mode") or "append"

            try:
                if fn_name == "create_task":
                    payload = execute_create_task(
                        args=args,
                        tenant_id=req.tenant_id,
                        module_id=module_id,
                        page_id=page_id,
                        user=user,
                    )
                elif fn_name == "move_task":
                    payload = execute_move_task(
                        args=args,
                        tenant_id=req.tenant_id,
                        module_id=module_id,
                        page_id=page_id,
                        user=user,
                    )
                elif fn_name == "add_mindmap_node":
                    payload = execute_add_mindmap_node(
                        args=args,
                        tenant_id=req.tenant_id,
                        module_id=module_id,
                        page_id=page_id,
                        user=user,
                    )
                elif fn_name == "format_notepad_text":
                    payload = execute_format_notepad(
                        args=args,
                        tenant_id=req.tenant_id,
                        module_id=module_id,
                        page_id=page_id,
                        user=user,
                    )
                elif fn_name == "add_whiteboard_note":
                    payload = execute_add_whiteboard_note(
                        args=args,
                        tenant_id=req.tenant_id,
                        module_id=module_id,
                        page_id=page_id,
                        user=user,
                    )
                else:
                    raise HTTPException(status_code=400, detail=f"Unknown tool: {fn_name}")

                action = TOOL_ACTION_MAP.get(fn_name, fn_name.upper())
                executed_actions.append(
                    {"action": action, "action_type": action, "payload": payload}
                )
                if primary_action is None:
                    primary_action = action
                    primary_payload = payload

                tool_result = json.dumps({"ok": True, "action": action, "payload": payload})
            except HTTPException as http_exc:
                # Intentional API errors (validation / not found) are safe for the model.
                err = str(http_exc.detail)
                tool_errors.append(err)
                tool_result = json.dumps({"ok": False, "error": err})
            except Exception:
                logger.error(
                    "Workspace tool execution failed (tool=%s)",
                    fn_name,
                    exc_info=True,
                )
                safe_err = "An internal error occurred while running that action."
                tool_errors.append(safe_err)
                tool_result = json.dumps({"ok": False, "error": safe_err})

            groq_messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": fn_name,
                    "content": tool_result,
                }
            )

        follow_up = await client.chat.completions.create(
            messages=groq_messages,
            model="openai/gpt-oss-120b",
            temperature=0.3,
            max_tokens=512,
        )
        reply = (follow_up.choices[0].message.content or "").strip()
        if not reply and primary_action == "TASK_ADDED" and primary_payload:
            reply = f"Task added! Created **{primary_payload.get('title')}**."
        if not reply and tool_errors:
            reply = "I couldn't complete that action. Please try again."
        if not reply:
            reply = "Done — workspace updated."

        return {
            "message": reply,
            "reply": reply,
            "tool_executed": bool(executed_actions),
            "action": primary_action,
            "action_type": primary_action,
            "payload": primary_payload,
            "actions": executed_actions,
            "errors": tool_errors,
            "current_module": current_module,
            "module_id": module_id,
            "page_id": page_id,
        }

    except HTTPException:
        raise
    except Exception:
        logger.error("Chat endpoint error", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred. Please try again later.",
        )
