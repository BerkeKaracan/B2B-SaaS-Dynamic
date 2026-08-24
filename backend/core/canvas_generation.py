"""Normalize and repair AI-generated blank-canvas pages.

Board components read these metadata keys (keep in sync with the UI):

- kanban: kanbanColumns, kanbanTasks / tasks
- notes / document: notepadTitle, notepadContent / documentContent
- whiteboard: whiteboardTitle, whiteboardTexts, whiteboardStrokes
- mindmap: mindmapNodes
- timeline: timelineEvents (monthKey = YYYY-MM-DD)
- database: databaseTitle, databaseProperties, databaseRows
- retrospective: retrospectiveCards (columnId = glad|sad|mad)
- calendar: calendarEvents (date = YYYY-MM-DD)
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import date, timedelta
from typing import Any

ALLOWED_PAGE_TYPES = frozenset(
    {
        "empty",
        "kanban",
        "notes",
        "document",
        "whiteboard",
        "mindmap",
        "timeline",
        "database",
        "retrospective",
        "calendar",
    }
)

PAGE_ALIASES = {
    "empty": "empty",
    "custom": "empty",
    "dashboard": "empty",
    "form": "empty",
    "forms": "empty",
    "kanban": "kanban",
    "board": "kanban",
    "kanban_board": "kanban",
    "notes": "notes",
    "note": "notes",
    "notepad": "notes",
    "document": "document",
    "doc": "document",
    "whiteboard": "whiteboard",
    "mindmap": "mindmap",
    "flow": "mindmap",
    "flowchart": "mindmap",
    "timeline": "timeline",
    "database": "database",
    "table": "database",
    "db": "database",
    "retrospective": "retrospective",
    "retro": "retrospective",
    "calendar": "calendar",
}

ALLOWED_BLOCK_TYPES = frozenset(
    {
        "text",
        "form",
        "date",
        "container",
        "dropdown",
        "checkbox",
        "badge_selector",
        "asset_stream",
    }
)

LABEL_REQUIRED_BLOCKS = ALLOWED_BLOCK_TYPES - {"text", "container"}
KANBAN_PRIORITIES = frozenset({"URGENT", "HIGH", "MEDIUM", "LOW", "NO PRIORITY"})
KANBAN_COLUMN_COLORS = ("#0EA5E9", "#F59E0B", "#10B981", "#8B5CF6")
DEFAULT_KANBAN_COLUMNS = (
    {"id": "TO DO", "title": "TO DO", "color": "#0EA5E9"},
    {"id": "IN PROGRESS", "title": "IN PROGRESS", "color": "#F59E0B"},
    {"id": "DONE", "title": "DONE", "color": "#10B981"},
)
CALENDAR_COLORS = ("zinc", "red", "amber", "emerald", "violet", "rose")
RETRO_COLUMNS = frozenset({"glad", "sad", "mad"})
LAYOUT_WHITELIST = frozenset({"full", "half"})
# Short inputs pair side-by-side; textarea/asset stay full-width.
HALF_LAYOUT_BLOCKS = frozenset(
    {"date", "dropdown", "checkbox", "badge_selector", "form"}
)
FULL_LAYOUT_BLOCKS = frozenset({"asset_stream", "container"})
HEADING_COLOR = "#18181b"
SECTION_COLOR = "#71717a"
HEADING_FONT = "28px"
SECTION_FONT = "13px"
EVENT_SPREAD_DAYS = (1, 3, 7)
MAX_EMPTY_BLOCKS = 12
MAX_GENERATED_PAGES = 3
DEFAULT_PAGE_WIDTH = 1000
MIN_PAGE_HEIGHT = 480
MAX_PAGE_HEIGHT = 2400
# Keep in sync with src/lib/blockTheme.ts (page palette + transparent).
BLOCK_BACKGROUND_TRANSPARENT = "transparent"
BLOCK_THEME_COLORS = frozenset(
    {
        "transparent",
        "#ffffff",
        "#fafafa",
        "#f87171",
        "#fb923c",
        "#facc15",
        "#4ade80",
        "#2dd4bf",
        "#60a5fa",
        "#a855f7",
        "#f472b6",
        "#18181b",
    }
)
# Keep in sync with src/lib/templates.ts PAGE_DEFAULTS (empty generate path is #fafafa).
PAGE_BACKGROUND_DEFAULTS = {
    "empty": "#fafafa",
    "kanban": "#f4f4f5",
    "notes": "#fffdf0",
    "document": "#fffdf0",
    "timeline": "#ffffff",
    "database": "#f8fafc",
    "whiteboard": "#ffffff",
    "mindmap": "#ffffff",
    "retrospective": "#ffffff",
    "calendar": "#fafafa",
}

_FENCE_RE = re.compile(r"^`{3}(?:json)?|`{3}$", re.IGNORECASE | re.MULTILINE)
_HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
_BOARD_LEAK_RE = re.compile(
    r"kanbanColumns|kanbanTasks|timelineEvents|calendarEvents|"
    r"databaseProperties|databaseRows|retrospectiveCards|mindmapNodes|"
    r"whiteboardTexts",
    re.IGNORECASE,
)
_COPY_HINT_RE = re.compile(
    r"paste this|copy this|copy[- ]paste|kopyala[- ]yapıştır|"
    r"paste.{0,24}(next|board|json)|next page",
    re.IGNORECASE,
)


class CanvasJsonError(ValueError):
    """Raised when the model output cannot be parsed as a page object."""


def normalize_page_type(raw: Any) -> str:
    value = str(raw or "empty").lower().strip()
    mapped = PAGE_ALIASES.get(value)
    if mapped:
        return mapped
    if value in ALLOWED_PAGE_TYPES:
        return value
    return "empty"


def extract_json_object(text: str) -> str:
    cleaned = _FENCE_RE.sub("", (text or "").strip()).strip()
    start_idx = next(
        (i for i, char in enumerate(cleaned) if char in "{["),
        -1,
    )
    end_idx = next(
        (i for i in range(len(cleaned) - 1, -1, -1) if cleaned[i] in "}]"),
        -1,
    )
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return cleaned[start_idx : end_idx + 1]
    return cleaned


def loads_canvas_payload(text: str) -> dict[str, Any]:
    raw = extract_json_object(text)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise CanvasJsonError("Model output was not valid JSON.") from exc

    if isinstance(parsed, list):
        return {"type": "empty", "title": "AI Generated Workspace", "blocks": parsed}
    if not isinstance(parsed, dict):
        raise CanvasJsonError("Model output must be a JSON object.")
    if "page" in parsed and isinstance(parsed["page"], dict):
        parsed = parsed["page"]
    return parsed


def _uid(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _clamp_int(value: Any, default: int, lo: int, hi: int) -> int:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, number))


def _iso_day(value: Any, fallback: date) -> str:
    text = str(value or "").strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return text
    return fallback.isoformat()


def _spread_day(today: date, index: int) -> date:
    return today + timedelta(days=EVENT_SPREAD_DAYS[index % len(EVENT_SPREAD_DAYS)])


def _hex_color(value: Any, fallback: str) -> str:
    text = str(value or "").strip()
    if _HEX_COLOR_RE.fullmatch(text):
        return text
    return fallback


def _page_background(page_type: str, raw_meta: dict[str, Any], payload: dict[str, Any]) -> str:
    candidate = raw_meta.get("backgroundColor") or payload.get("backgroundColor")
    default = PAGE_BACKGROUND_DEFAULTS.get(page_type, "#fafafa")
    return _hex_color(candidate, default)


def _block_background(value: Any) -> str:
    text = str(value or "").strip().lower()
    if text in BLOCK_THEME_COLORS:
        return text
    return BLOCK_BACKGROUND_TRANSPARENT


def _apply_layout_hint(settings: dict[str, Any], block_type: str) -> None:
    layout = str(settings.get("layout") or "").lower().strip()
    if layout in LAYOUT_WHITELIST:
        settings["layout"] = layout
        return
    settings.pop("layout", None)
    input_type = str(settings.get("inputType") or settings.get("input_type") or "").lower()
    if block_type == "form" and input_type in {"textarea", "multiline", "long"}:
        settings["layout"] = "full"
        return
    if block_type in HALF_LAYOUT_BLOCKS:
        settings["layout"] = "half"
    elif block_type in FULL_LAYOUT_BLOCKS:
        settings["layout"] = "full"


def _apply_text_design(settings: dict[str, Any], *, heading: bool) -> None:
    if heading:
        settings["isBold"] = True
        settings["fontSize"] = HEADING_FONT
        settings["color"] = HEADING_COLOR
        settings["layout"] = "full"
        return
    settings["isBold"] = False
    settings["fontSize"] = SECTION_FONT
    settings["color"] = SECTION_COLOR
    settings["layout"] = "full"


def _is_explicit_section(settings: dict[str, Any]) -> bool:
    font_size = str(settings.get("fontSize") or "")
    color = str(settings.get("color") or "").lower()
    role = str(settings.get("role") or settings.get("textRole") or "").lower()
    return (
        font_size == SECTION_FONT
        or color == SECTION_COLOR
        or role in {"section", "label", "caption"}
    )


def _is_explicit_heading(settings: dict[str, Any]) -> bool:
    font_size = str(settings.get("fontSize") or "")
    role = str(settings.get("role") or settings.get("textRole") or "").lower()
    return bool(settings.get("isBold")) or font_size == HEADING_FONT or role in {
        "heading",
        "hero",
        "title",
    }


def _ensure_field_copy(settings: dict[str, Any], block_type: str) -> None:
    label = str(settings.get("label") or block_type.replace("_", " ").title()).strip()
    if block_type == "form" and not str(settings.get("placeholder") or "").strip():
        settings["placeholder"] = f"Enter {label.lower()}"

    if block_type not in {"dropdown", "badge_selector"}:
        return
    raw = settings.get("options")
    if isinstance(raw, list) and any(str(item).strip() for item in raw):
        return
    if isinstance(raw, str) and raw.strip():
        return

    key = label.lower()
    if any(token in key for token in ("role", "title", "position")):
        options = "Engineer, Designer, Product, Ops"
    elif any(token in key for token in ("status", "state", "stage")):
        options = "Not started, In progress, Done"
    elif any(token in key for token in ("priority", "urgency")):
        options = "High, Medium, Low"
    elif any(token in key for token in ("type", "category", "kind")):
        options = "Bug, Feature, Chore"
    else:
        options = f"{label} A, {label} B, {label} C"
    settings["options"] = options


def notes_content_is_leaked(content: str) -> bool:
    text = content or ""
    return bool(_BOARD_LEAK_RE.search(text) or _COPY_HINT_RE.search(text))


def sanitize_notes_content(content: str, heading: str) -> str:
    text = (content or "").strip()
    if not notes_content_is_leaked(text):
        return text
    first_line = text.split("\n", 1)[0].strip()
    if first_line.startswith("#") and not notes_content_is_leaked(first_line):
        return first_line + "\n"
    return f"# {heading}\n"


def _normalize_empty_blocks(raw_blocks: Any) -> list[dict[str, Any]]:
    positioned: list[dict[str, Any]] = []
    saw_heading = False
    for item in _as_list(raw_blocks):
        if len(positioned) >= MAX_EMPTY_BLOCKS:
            break
        if not isinstance(item, dict):
            continue
        block_type = str(item.get("type") or "").lower().strip()
        if block_type not in ALLOWED_BLOCK_TYPES:
            continue
        settings = dict(_as_dict(item.get("settings")))
        label = str(settings.get("label") or "").strip()
        if block_type == "asset_stream" and not label:
            continue
        if block_type in LABEL_REQUIRED_BLOCKS and not label:
            settings["label"] = block_type.replace("_", " ").title()
        value = item.get("value")
        if value is None:
            value = ""
        if block_type == "text":
            if not saw_heading:
                _apply_text_design(settings, heading=True)
                saw_heading = True
            elif _is_explicit_heading(settings):
                _apply_text_design(settings, heading=True)
            elif _is_explicit_section(settings):
                _apply_text_design(settings, heading=False)
            else:
                settings.setdefault("layout", "full")
            saw_heading = True
        else:
            _apply_layout_hint(settings, block_type)
            _ensure_field_copy(settings, block_type)
        settings["backgroundColor"] = _block_background(
            settings.get("backgroundColor")
        )
        positioned.append(
            {
                "id": _uid("block"),
                "type": block_type,
                "value": value,
                "x": 0,
                "y": 0,
                "settings": settings,
            }
        )
    return positioned


def _kanban_metadata(meta: dict[str, Any], title: str) -> dict[str, Any]:
    columns = []
    for index, column in enumerate(_as_list(meta.get("kanbanColumns"))):
        data = _as_dict(column)
        col_title = str(data.get("title") or data.get("id") or f"Column {index + 1}")
        columns.append(
            {
                "id": str(data.get("id") or col_title),
                "title": col_title,
                "color": _hex_color(
                    data.get("color"),
                    KANBAN_COLUMN_COLORS[index % len(KANBAN_COLUMN_COLORS)],
                ),
            }
        )
    raw_tasks = _as_list(meta.get("kanbanTasks") or meta.get("tasks"))
    if not columns or (len(columns) == 1 and not raw_tasks):
        columns = [dict(column) for column in DEFAULT_KANBAN_COLUMNS]

    valid_status = {str(col["id"]) for col in columns}
    tasks = []
    for index, task in enumerate(raw_tasks):
        data = _as_dict(task)
        priority = str(data.get("priority") or "MEDIUM").upper()
        if priority not in KANBAN_PRIORITIES:
            priority = "MEDIUM"
        status = str(data.get("status") or data.get("columnId") or columns[0]["id"])
        if status not in valid_status:
            status = columns[0]["id"]
        tasks.append(
            {
                "id": str(data.get("id") or _uid("task")),
                "title": str(data.get("title") or data.get("content") or f"Task {index + 1}"),
                "description": str(data.get("description") or ""),
                "priority": priority,
                "status": status,
            }
        )
    if not tasks:
        tasks = [
            {
                "id": _uid("task"),
                "title": "Define scope",
                "description": "",
                "priority": "HIGH",
                "status": columns[0]["id"],
            },
            {
                "id": _uid("task"),
                "title": "First deliverable",
                "description": "",
                "priority": "MEDIUM",
                "status": columns[1]["id"] if len(columns) > 1 else columns[0]["id"],
            },
        ]
    return {
        "kanbanColumns": columns,
        "kanbanTasks": tasks,
        "tasks": tasks,
        "title": title,
    }


def _notes_metadata(meta: dict[str, Any], title: str) -> dict[str, Any]:
    content = str(
        meta.get("notepadContent")
        or meta.get("documentContent")
        or ""
    ).strip()
    if not content:
        texts = [
            str(item.get("content") if isinstance(item, dict) else item).strip()
            for item in _as_list(meta.get("notepadTexts"))
        ]
        content = "\n\n".join(part for part in texts if part)
    heading = str(meta.get("notepadTitle") or meta.get("documentTitle") or title)
    cleaned = sanitize_notes_content(content, heading) if content else f"# {heading}\n"
    return {
        "notepadTitle": heading,
        "notepadContent": cleaned,
        "documentContent": cleaned,
    }


def _whiteboard_metadata(meta: dict[str, Any], title: str) -> dict[str, Any]:
    texts = []
    for index, item in enumerate(_as_list(meta.get("whiteboardTexts"))):
        data = _as_dict(item)
        content = str(data.get("content") or data.get("text") or "").strip()
        if not content:
            continue
        texts.append(
            {
                "id": str(data.get("id") or _uid("wb")),
                "x": _clamp_int(data.get("x"), 80 + index * 24, 20, 900),
                "y": _clamp_int(data.get("y"), 80 + index * 70, 20, 700),
                "content": content,
                "color": str(data.get("color") or "#18181b"),
                "size": _clamp_int(data.get("size"), 18, 14, 48),
                "font": str(data.get("font") or "Inter"),
            }
        )
    return {
        "whiteboardTitle": str(meta.get("whiteboardTitle") or title),
        "whiteboardTexts": texts,
        "whiteboardStrokes": [],
    }


def _mindmap_metadata(meta: dict[str, Any], title: str) -> dict[str, Any]:
    nodes = []
    for index, item in enumerate(_as_list(meta.get("mindmapNodes"))):
        data = _as_dict(item)
        text = str(data.get("text") or data.get("label") or "").strip()
        if not text:
            continue
        parent = data.get("parentId")
        nodes.append(
            {
                "id": str(data.get("id") or _uid("node")),
                "text": text,
                "x": _clamp_int(data.get("x"), 220 + (index % 3) * 180, 40, 900),
                "y": _clamp_int(data.get("y"), 120 + (index // 3) * 110, 40, 700),
                "parentId": str(parent) if parent not in (None, "", "null") else None,
            }
        )
    if not nodes:
        nodes = [
            {
                "id": _uid("node"),
                "text": title,
                "x": 320,
                "y": 180,
                "parentId": None,
            }
        ]
    else:
        nodes[0]["parentId"] = None
    return {"mindmapNodes": nodes}


def _timeline_metadata(meta: dict[str, Any]) -> dict[str, Any]:
    today = date.today()
    events = []
    for index, item in enumerate(_as_list(meta.get("timelineEvents"))):
        data = _as_dict(item)
        title = str(data.get("title") or "").strip()
        if not title:
            continue
        day = _iso_day(data.get("monthKey") or data.get("date"), _spread_day(today, index))
        priority = str(data.get("priority") or "MEDIUM").upper()
        if priority not in KANBAN_PRIORITIES:
            priority = "MEDIUM"
        events.append(
            {
                "id": str(data.get("id") or _uid("evt")),
                "monthKey": day,
                "title": title,
                "description": str(data.get("description") or ""),
                "priority": priority,
                "isDetailed": bool(data.get("isDetailed", False)),
            }
        )
    if len(events) < 3:
        used_days = {event["monthKey"] for event in events}
        defaults = (
            ("Kickoff", "HIGH"),
            ("Checkpoint", "MEDIUM"),
            ("Review", "MEDIUM"),
        )
        for index, (title, priority) in enumerate(defaults):
            if len(events) >= 3:
                break
            day = _spread_day(today, index).isoformat()
            if any(event["title"] == title for event in events):
                continue
            if day in used_days and index < 2:
                day = _spread_day(today, index + 1).isoformat()
            events.append(
                {
                    "id": _uid("evt"),
                    "monthKey": day,
                    "title": title,
                    "description": "",
                    "priority": priority,
                    "isDetailed": False,
                }
            )
            used_days.add(day)
    return {"timelineEvents": events}


def _database_metadata(meta: dict[str, Any], title: str) -> dict[str, Any]:
    properties = []
    for index, item in enumerate(_as_list(meta.get("databaseProperties"))):
        data = _as_dict(item)
        prop_type = str(data.get("type") or "text").lower()
        if prop_type not in {"text", "number", "select", "date", "checkbox"}:
            prop_type = "text"
        properties.append(
            {
                "id": str(data.get("id") or f"prop-{index + 1}"),
                "name": str(data.get("name") or f"Field {index + 1}"),
                "type": prop_type,
            }
        )
    if not properties:
        properties = [{"id": "prop-title", "name": "Name", "type": "text"}]
    existing_ids = {prop["id"] for prop in properties}
    existing_names = {str(prop["name"]).lower() for prop in properties}
    for extra in (
        {"id": "prop-status", "name": "Status", "type": "select"},
        {"id": "prop-due", "name": "Due", "type": "date"},
    ):
        if len(properties) >= 3:
            break
        if extra["id"] in existing_ids or extra["name"].lower() in existing_names:
            continue
        properties.append(extra)

    first_prop = properties[0]["id"]
    rows = []
    for index, item in enumerate(_as_list(meta.get("databaseRows"))):
        data = _as_dict(item)
        row: dict[str, Any] = {"id": str(data.get("id") or _uid("row"))}
        for prop in properties:
            row[prop["id"]] = data.get(prop["id"], data.get(prop["name"], ""))
        if first_prop not in row or row[first_prop] in (None, ""):
            row[first_prop] = str(data.get("title") or data.get("name") or f"Row {index + 1}")
        rows.append(row)
    today = date.today()
    samples = (
        ("Acme rollout", "In progress", _spread_day(today, 0).isoformat()),
        ("Q3 review", "Planned", _spread_day(today, 1).isoformat()),
        ("Kickoff notes", "Done", _spread_day(today, 2).isoformat()),
    )
    while len(rows) < 3:
        name, status, due = samples[len(rows)]
        row: dict[str, Any] = {"id": _uid("row")}
        for prop in properties:
            if prop["type"] == "date":
                row[prop["id"]] = due
            elif prop["type"] == "select":
                row[prop["id"]] = status
            elif prop["id"] == first_prop or prop["type"] == "text":
                row[prop["id"]] = name if prop["id"] == first_prop else ""
            else:
                row[prop["id"]] = ""
        row[first_prop] = name
        rows.append(row)
    return {
        "databaseTitle": str(meta.get("databaseTitle") or title),
        "databaseProperties": properties,
        "databaseRows": rows,
    }


def _retrospective_metadata(meta: dict[str, Any]) -> dict[str, Any]:
    cards = []
    raw_cards = meta.get("retrospectiveCards") or meta.get("retroCards")
    for index, item in enumerate(_as_list(raw_cards)):
        data = _as_dict(item)
        content = str(data.get("content") or data.get("text") or "").strip()
        if not content:
            continue
        column = str(data.get("columnId") or "glad").lower()
        if column not in RETRO_COLUMNS:
            column = "glad"
        cards.append(
            {
                "id": str(data.get("id") or _uid("retro")),
                "columnId": column,
                "content": content,
                "author": str(data.get("author") or "AI"),
                "createdAt": int(data.get("createdAt") or index),
            }
        )
    return {"retrospectiveCards": cards}


def _calendar_metadata(meta: dict[str, Any]) -> dict[str, Any]:
    today = date.today()
    events = []
    for index, item in enumerate(_as_list(meta.get("calendarEvents"))):
        data = _as_dict(item)
        title = str(data.get("title") or "").strip()
        if not title:
            continue
        color = str(data.get("color") or "red").lower()
        if color not in CALENDAR_COLORS:
            color = "red"
        events.append(
            {
                "id": str(data.get("id") or _uid("cal")),
                "title": title,
                "date": _iso_day(data.get("date"), _spread_day(today, index)),
                "allDay": bool(data.get("allDay", True)),
                "startTime": data.get("startTime"),
                "endTime": data.get("endTime"),
                "notes": str(data.get("notes") or ""),
                "color": color,
            }
        )
    if len(events) < 3:
        used_days = {event["date"] for event in events}
        defaults = (
            ("Planning", "red"),
            ("Checkpoint", "amber"),
            ("Review", "emerald"),
        )
        for index, (title, color) in enumerate(defaults):
            if len(events) >= 3:
                break
            if any(event["title"] == title for event in events):
                continue
            day = _spread_day(today, index).isoformat()
            if day in used_days:
                day = _spread_day(today, index + 1).isoformat()
            events.append(
                {
                    "id": _uid("cal"),
                    "title": title,
                    "date": day,
                    "allDay": True,
                    "color": color,
                }
            )
            used_days.add(day)
    return {"calendarEvents": events}


def board_metadata_skeleton(page_type: str, title: str, raw_meta: Any) -> dict[str, Any]:
    meta = _as_dict(raw_meta)
    if page_type == "kanban":
        return _kanban_metadata(meta, title)
    if page_type in {"notes", "document"}:
        return _notes_metadata(meta, title)
    if page_type == "whiteboard":
        return _whiteboard_metadata(meta, title)
    if page_type == "mindmap":
        return _mindmap_metadata(meta, title)
    if page_type == "timeline":
        return _timeline_metadata(meta)
    if page_type == "database":
        return _database_metadata(meta, title)
    if page_type == "retrospective":
        return _retrospective_metadata(meta)
    if page_type == "calendar":
        return _calendar_metadata(meta)
    return {}


def normalize_generated_page(
    payload: dict[str, Any],
    *,
    x: float,
    y: float,
) -> dict[str, Any]:
    page_type = normalize_page_type(payload.get("type"))
    title = str(payload.get("title") or "AI Generated Workspace").strip()[:80]
    if not title:
        title = "AI Generated Workspace"

    width = _clamp_int(payload.get("width"), DEFAULT_PAGE_WIDTH, 640, 1400)
    height = _clamp_int(payload.get("height"), 800, MIN_PAGE_HEIGHT, MAX_PAGE_HEIGHT)
    is_board = page_type != "empty"
    raw_meta = _as_dict(payload.get("metadata"))
    metadata = board_metadata_skeleton(page_type, title, raw_meta)
    metadata["backgroundColor"] = _page_background(page_type, raw_meta, payload)
    blocks = [] if is_board else _normalize_empty_blocks(payload.get("blocks"))

    return {
        "type": page_type,
        "title": title,
        "x": x,
        "y": y,
        "width": width,
        "height": max(height, MIN_PAGE_HEIGHT),
        "blocks": blocks,
        "metadata": metadata,
    }


def _page_candidates(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        # Bare lists are treated as empty-page blocks (legacy model output).
        return [{"type": "empty", "title": "AI Generated Workspace", "blocks": payload}]

    if not isinstance(payload, dict):
        raise CanvasJsonError("Model output must be a JSON object.")

    if "page" in payload and isinstance(payload["page"], dict) and "pages" not in payload:
        payload = payload["page"]

    raw_pages = payload.get("pages")
    if isinstance(raw_pages, list):
        pages = [item for item in raw_pages if isinstance(item, dict)]
        if pages:
            return pages

    # Single page object
    return [payload]


def normalize_generated_pages(
    payload: Any,
    *,
    x: float,
    y: float,
) -> dict[str, Any]:
    """Normalize one or many generated pages. Caps at MAX_GENERATED_PAGES."""
    candidates = _page_candidates(payload)
    if not candidates:
        candidates = [{"type": "empty", "title": "AI Generated Workspace", "blocks": []}]

    pages: list[dict[str, Any]] = []
    for item in candidates[:MAX_GENERATED_PAGES]:
        # Placement offsets are applied on the client; keep host origin here.
        pages.append(normalize_generated_page(item, x=x, y=y))

    return {"pages": pages}
