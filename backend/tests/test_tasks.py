"""Authorization regression tests for task synchronization."""

import asyncio
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from api.routers.tasks import SyncRequest, TaskData, sync_tasks


def test_sync_rejects_tasks_for_a_different_project_before_writes():
    payload = SyncRequest(
        tenant_id="tenant-1",
        project_id="authorized-project",
        tasks=[
            TaskData(
                project_id="unauthorized-project",
                project_name="Other",
                title="Injected task",
                status="todo",
                priority="high",
                assigned_to="user@example.com",
            )
        ],
    )
    user = SimpleNamespace(id="user-1", email="user@example.com")

    with (
        patch("api.routers.tasks.supabase_admin") as mock_admin,
        patch(
            "api.routers.tasks.build_access_context_for_user",
            return_value=MagicMock(),
        ),
        patch("api.routers.tasks._load_project", return_value={"id": "authorized-project"}),
        patch("api.routers.tasks.assert_project_access"),
    ):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(sync_tasks(payload, user))

    assert exc.value.status_code == 400
    mock_admin.table.assert_not_called()
