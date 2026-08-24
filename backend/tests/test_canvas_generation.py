"""Tests for AI canvas JSON repair, aliases, and page normalization."""

from __future__ import annotations

import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from groq import APIStatusError

from core.ai_prompts import get_canvas_system_prompt, get_canvas_dialog_prompt
from api.routers.ai import (
    CANVAS_CAPACITY_DETAIL,
    CANVAS_GENERATE_FALLBACK_TOKENS,
    CANVAS_GENERATE_MAX_TOKENS,
    CANVAS_INVALID_JSON_DETAIL,
    GROQ_TPM_BUDGET,
    GenerateCanvasRequest,
    CanvasDialogRequest,
    _normalize_dialog_payload,
    canvas_dialog_from_model,
    generate_canvas_from_model,
    groq_canvas_completion,
)
from core.canvas_generation import (
    CanvasJsonError,
    board_metadata_skeleton,
    loads_canvas_payload,
    normalize_generated_page,
    normalize_generated_pages,
    normalize_page_type,
    sanitize_notes_content,
)


def test_aliases_match_store_normalization():
    assert normalize_page_type("notepad") == "notes"
    assert normalize_page_type("table") == "database"
    assert normalize_page_type("db") == "database"
    assert normalize_page_type("retro") == "retrospective"
    assert normalize_page_type("board") == "kanban"
    assert normalize_page_type("calendar") == "calendar"
    assert normalize_page_type("unknown-widget") == "empty"


def test_loads_canvas_payload_strips_fences_and_wraps_lists():
    fenced = '```json\n{"type":"kanban","title":"Sprint"}\n```'
    assert loads_canvas_payload(fenced)["type"] == "kanban"

    wrapped = loads_canvas_payload('[{"type":"text","value":"Hello"}]')
    assert wrapped["type"] == "empty"
    assert wrapped["blocks"][0]["type"] == "text"


def test_truncated_json_raises_instead_of_empty_recovery():
    with pytest.raises(CanvasJsonError):
        loads_canvas_payload('{"type":"kanban","title":"Sprint","metadata":{')


def test_unknown_blocks_are_dropped_and_ids_are_unique():
    page = normalize_generated_page(
        {
            "type": "empty",
            "title": "Intake",
            "blocks": [
                {"type": "wizard", "value": "nope"},
                {"type": "form", "settings": {}},
                {"type": "asset_stream", "settings": {}},
                {
                    "type": "dropdown",
                    "settings": {"label": "Role", "options": "A, B"},
                },
            ],
        },
        x=10,
        y=20,
    )
    types = [block["type"] for block in page["blocks"]]
    assert types == ["form", "dropdown"]
    assert page["blocks"][0]["settings"]["label"] == "Form"
    assert page["blocks"][0]["settings"]["layout"] == "half"
    assert page["blocks"][0]["settings"]["placeholder"] == "Enter form"
    assert page["blocks"][0]["settings"]["backgroundColor"] == "transparent"
    assert page["blocks"][1]["settings"]["layout"] == "half"
    assert page["blocks"][1]["settings"]["options"] == "A, B"
    assert page["blocks"][0]["id"] != page["blocks"][1]["id"]
    assert page["x"] == 10 and page["y"] == 20
    assert page["metadata"]["backgroundColor"] == "#fafafa"


def test_kanban_skeleton_fills_missing_columns():
    page = normalize_generated_page(
        {"type": "board", "title": "Sprint", "blocks": [{"type": "text"}]},
        x=0,
        y=0,
    )
    assert page["type"] == "kanban"
    assert page["blocks"] == []
    assert len(page["metadata"]["kanbanColumns"]) == 3
    assert len(page["metadata"]["kanbanTasks"]) >= 2
    assert all(
        column["color"].startswith("#")
        for column in page["metadata"]["kanbanColumns"]
    )
    assert page["metadata"]["backgroundColor"] == "#f4f4f5"


def test_kanban_tasks_keep_valid_status_and_priority():
    meta = board_metadata_skeleton(
        "kanban",
        "Sprint",
        {
            "kanbanColumns": [{"id": "TO DO", "title": "TO DO"}],
            "kanbanTasks": [
                {"title": "Ship", "status": "DONE", "priority": "critical"}
            ],
        },
    )
    assert meta["kanbanTasks"][0]["status"] == "TO DO"
    assert meta["kanbanTasks"][0]["priority"] == "MEDIUM"
    assert meta["tasks"] == meta["kanbanTasks"]


def test_notes_and_retro_use_board_reader_keys():
    notes = board_metadata_skeleton(
        "notes",
        "Spec",
        {"notepadTexts": ["Intro", "Scope"]},
    )
    assert "notepadContent" in notes
    assert "documentContent" in notes
    assert "Intro" in notes["notepadContent"]

    retro = board_metadata_skeleton(
        "retrospective",
        "Retro",
        {"retroCards": [{"text": "Shipped on time", "columnId": "glad"}]},
    )
    assert retro["retrospectiveCards"][0]["columnId"] == "glad"
    assert retro["retrospectiveCards"][0]["content"] == "Shipped on time"


def test_prompt_covers_human_intent_and_calendar():
    prompt = get_canvas_system_prompt("2026-08-24", 12.0, 34.0)
    assert "everyday language" in prompt
    assert "calendar" in prompt
    assert "notepad→notes" in prompt
    assert "asset_stream" in prompt
    assert "12.0" in prompt
    assert "up to 3 pages" in prompt
    assert "half" in prompt
    assert "paste this next" in prompt
    assert "transparent" in prompt


def test_dialog_prompt_and_normalize():
    prompt = get_canvas_dialog_prompt("2026-08-24")
    assert "generate" in prompt
    assert "reply" in prompt
    assert _normalize_dialog_payload(
        {"action": "GENERATE", "message": "Building a board", "prompt": ""}
    ) == {
        "action": "generate",
        "message": "Building a board",
        "prompt": "Building a board",
    }
    reply = _normalize_dialog_payload({"action": "nope", "message": ""})
    assert reply["action"] == "reply"
    assert reply["message"]


def test_canvas_dialog_returns_generate_action():
    client = MagicMock()
    client.chat.completions.create = AsyncMock(
        return_value=_completion(
            json.dumps(
                {
                    "action": "generate",
                    "message": "I'll add a sprint kanban.",
                    "prompt": "Q3 sprint kanban with 4 columns",
                }
            )
        )
    )
    result = asyncio.run(
        canvas_dialog_from_model(
            client,
            CanvasDialogRequest(
                message="sprint board yap",
                tenant_id="11111111-1111-1111-1111-111111111111",
            ),
        )
    )
    assert result["action"] == "generate"
    assert "kanban" in result["prompt"].lower() or "sprint" in result["prompt"].lower()


def _completion(text: str) -> SimpleNamespace:
    message = SimpleNamespace(content=text)
    choice = SimpleNamespace(message=message)
    return SimpleNamespace(choices=[choice])


def test_groq_canvas_completion_uses_8k_and_json_object():
    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=_completion("{}"))

    text = asyncio.run(
        groq_canvas_completion(
            client, [{"role": "user", "content": "sprint board"}]
        )
    )
    assert text == "{}"
    kwargs = client.chat.completions.create.await_args.kwargs
    assert kwargs["max_tokens"] == CANVAS_GENERATE_MAX_TOKENS == 6800
    assert GROQ_TPM_BUDGET == 8000
    assert kwargs["response_format"] == {"type": "json_object"}


def test_groq_canvas_completion_retries_without_json_object():
    client = MagicMock()
    client.chat.completions.create = AsyncMock(
        side_effect=[
            TypeError("response_format is not supported"),
            _completion('{"ok":true}'),
        ]
    )

    text = asyncio.run(
        groq_canvas_completion(
            client, [{"role": "user", "content": "form"}]
        )
    )
    assert text == '{"ok":true}'
    assert client.chat.completions.create.await_count == 2
    assert "response_format" not in client.chat.completions.create.await_args.kwargs


def test_groq_413_retries_with_smaller_cap_then_maps_to_429():
    limited = APIStatusError(
        "Request too large",
        response=MagicMock(status_code=413, headers={}),
        body={"error": {"code": "rate_limit_exceeded"}},
    )
    limited.status_code = 413
    client = MagicMock()
    client.chat.completions.create = AsyncMock(
        side_effect=[limited, _completion('{"type":"empty","blocks":[]}')]
    )

    text = asyncio.run(
        groq_canvas_completion(client, [{"role": "user", "content": "form"}])
    )
    assert '"type"' in text
    assert (
        client.chat.completions.create.await_args.kwargs["max_tokens"]
        == CANVAS_GENERATE_FALLBACK_TOKENS
    )

    client.chat.completions.create = AsyncMock(side_effect=[limited, limited])
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            groq_canvas_completion(
                client, [{"role": "user", "content": "form"}]
            )
        )
    assert exc.value.status_code == 429
    assert exc.value.detail == CANVAS_CAPACITY_DETAIL


def test_generate_canvas_retries_truncated_json_then_returns_page():
    client = MagicMock()
    client.chat.completions.create = AsyncMock(
        side_effect=[
            _completion('{"type":"kanban","title":"Sprint","metadata":{'),
            _completion('{"type":"kanban","title":"Sprint","metadata":{}}'),
        ]
    )

    result = asyncio.run(
        generate_canvas_from_model(
            client,
            GenerateCanvasRequest(
                prompt="sprint board yap",
                x=100,
                y=80,
                tenant_id="11111111-1111-1111-1111-111111111111",
            ),
        )
    )

    assert result["pages"][0]["type"] == "kanban"
    assert result["pages"][0]["title"] == "Sprint"
    assert result["pages"][0]["blocks"] == []
    assert result["pages"][0]["metadata"]["kanbanColumns"]
    assert client.chat.completions.create.await_count == 2


def test_generate_canvas_returns_422_when_repair_also_fails():
    client = MagicMock()
    client.chat.completions.create = AsyncMock(
        return_value=_completion("not-json-at-all")
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            generate_canvas_from_model(
                client,
                GenerateCanvasRequest(
                    prompt="???",
                    x=0,
                    y=0,
                    tenant_id="11111111-1111-1111-1111-111111111111",
                ),
            )
        )

    assert exc.value.status_code == 422
    assert exc.value.detail == CANVAS_INVALID_JSON_DETAIL


def test_generate_canvas_accepts_valid_empty_dashboard():
    payload = {
        "type": "empty",
        "title": "Applicant intake",
        "blocks": [
            {"type": "text", "value": "Apply"},
            {"type": "form", "settings": {"label": "Name"}},
        ],
    }
    client = MagicMock()
    client.chat.completions.create = AsyncMock(
        return_value=_completion(json.dumps(payload))
    )

    result = asyncio.run(
        generate_canvas_from_model(
            client,
            GenerateCanvasRequest(
                prompt="aday başvuru formu",
                x=5,
                y=6,
                tenant_id="11111111-1111-1111-1111-111111111111",
            ),
        )
    )

    assert len(result["pages"]) == 1
    page = result["pages"][0]
    assert page["type"] == "empty"
    assert [block["type"] for block in page["blocks"]] == ["text", "form"]
    assert page["x"] == 5
    assert page["blocks"][0]["settings"]["isBold"] is True
    assert page["blocks"][0]["settings"]["fontSize"] == "28px"
    assert page["blocks"][0]["settings"]["backgroundColor"] == "transparent"
    assert page["blocks"][1]["settings"]["backgroundColor"] == "transparent"


def test_empty_heading_and_section_tokens():
    page = normalize_generated_page(
        {
            "type": "empty",
            "title": "Intake",
            "blocks": [
                {"type": "text", "value": "Apply now"},
                {
                    "type": "text",
                    "value": "Details",
                    "settings": {"fontSize": "13px", "color": "#71717a"},
                },
                {"type": "text", "value": "Short body stays body copy"},
                {
                    "type": "dropdown",
                    "settings": {"label": "Role", "layout": "wide"},
                },
                {"type": "date", "settings": {"label": "Start"}},
            ],
        },
        x=0,
        y=0,
    )
    heading, section, body, dropdown, date_block = page["blocks"]
    assert heading["settings"]["isBold"] is True
    assert heading["settings"]["fontSize"] == "28px"
    assert heading["settings"]["color"] == "#18181b"
    assert heading["settings"]["layout"] == "full"
    assert heading["settings"]["backgroundColor"] == "transparent"
    assert section["settings"]["backgroundColor"] == "transparent"
    assert dropdown["settings"]["backgroundColor"] == "transparent"
    assert section["settings"]["fontSize"] == "13px"
    assert section["settings"]["color"] == "#71717a"
    assert body["settings"].get("fontSize") != "13px"
    assert body["settings"].get("isBold") is not True
    assert dropdown["settings"]["layout"] == "half"
    assert dropdown["settings"]["options"] == "Engineer, Designer, Product, Ops"
    assert date_block["settings"]["layout"] == "half"


def test_empty_block_keeps_palette_background():
    page = normalize_generated_page(
        {
            "type": "empty",
            "title": "Tinted",
            "blocks": [
                {
                    "type": "text",
                    "value": "Hello",
                    "settings": {"backgroundColor": "#60a5fa"},
                },
            ],
        },
        x=0,
        y=0,
    )
    assert page["blocks"][0]["settings"]["backgroundColor"] == "#60a5fa"


def test_notes_reject_leaked_board_json():
    leaked = (
        "# Sprint\n\nPaste this next into a kanban:\n"
        '{"kanbanColumns":[{"id":"TO DO"}],"kanbanTasks":[]}'
    )
    cleaned = sanitize_notes_content(leaked, "Sprint")
    assert "kanbanColumns" not in cleaned
    assert "paste this" not in cleaned.lower()

    page = normalize_generated_page(
        {
            "type": "notes",
            "title": "Sprint notes",
            "metadata": {"notepadContent": leaked},
        },
        x=0,
        y=0,
    )
    assert "kanbanColumns" not in page["metadata"]["notepadContent"]
    assert "kanbanColumns" not in page["metadata"]["documentContent"]


def test_board_skeletons_fill_color_and_spread():
    timeline = board_metadata_skeleton("timeline", "Roadmap", {})
    assert len(timeline["timelineEvents"]) >= 3
    days = {event["monthKey"] for event in timeline["timelineEvents"]}
    assert len(days) >= 2

    calendar = board_metadata_skeleton("calendar", "Month", {})
    assert len(calendar["calendarEvents"]) >= 3

    database = board_metadata_skeleton("database", "CRM", {})
    assert len(database["databaseProperties"]) >= 3
    assert len(database["databaseRows"]) >= 3


def test_normalize_generated_pages_wraps_single_and_caps_at_three():
    single = normalize_generated_pages(
        {"type": "kanban", "title": "Sprint"},
        x=10,
        y=20,
    )
    assert len(single["pages"]) == 1
    assert single["pages"][0]["type"] == "kanban"
    assert single["pages"][0]["x"] == 10

    multi = normalize_generated_pages(
        {
            "pages": [
                {"type": "kanban", "title": "Board"},
                {"type": "timeline", "title": "Roadmap"},
                {"type": "notes", "title": "Notes"},
                {"type": "calendar", "title": "Extra"},
            ]
        },
        x=0,
        y=0,
    )
    assert len(multi["pages"]) == 3
    assert [page["type"] for page in multi["pages"]] == [
        "kanban",
        "timeline",
        "notes",
    ]
