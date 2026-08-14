"""Ephemeral canvas live-cursor rooms over WebSocket (no Supabase Realtime)."""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass, field
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi import status as http_status

from core.auth_jwt import verify_access_token
from core.database import supabase_admin
import os

logger = logging.getLogger("saas_engine.canvas_ws")

router = APIRouter(tags=["canvas-collab"])

AUTH_TIMEOUT_SEC = 8.0
MAX_ROOMS = 500
MAX_CLIENTS_PER_ROOM = 40


def _allow_insecure_canvas_ws() -> bool:
    """Local Docker: skip JWT verify so LIVE works without SUPABASE_JWT_SECRET.
    
    PRODUCTION IS FAIL-CLOSED: JWT validation is always required in production.
    Only allows insecure mode in explicit development environments.
    """
    env = (os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or "").strip().lower()
    
    # Fail-closed in production - always require JWT regardless of other settings
    if env in {"production", "prod"}:
        return False
    
    # Explicit false overrides everything else
    raw = (os.getenv("ALLOW_INSECURE_CANVAS_WS") or "").strip().lower()
    if raw in {"0", "false", "no", "off"}:
        return False
    
    # Explicit true allows insecure in non-production environments
    if raw in {"1", "true", "yes", "on"}:
        return True
    
    # Only allow insecure in development environments by default
    if env in {"development", "dev", "local"}:
        return True
    
    # No JWT secret configured → treat as local/dev (Cloud Run should set the secret)
    secret = (os.getenv("SUPABASE_JWT_SECRET") or "").strip()
    return not secret


# Boot visibility for operators
logger.info(
    "canvas_collab: insecure_ws=%s env=%s",
    _allow_insecure_canvas_ws(),
    (os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or "").strip() or "(unset)",
)


@dataclass
class Peer:
    ws: WebSocket
    self_key: str
    user: str
    color: str
    cursor: dict[str, float] | None = None


@dataclass
class Room:
    peers: dict[str, Peer] = field(default_factory=dict)


class CanvasHub:
    def __init__(self) -> None:
        self._rooms: dict[str, Room] = {}
        self._lock = asyncio.Lock()

    async def join(self, room_id: str, peer: Peer) -> list[dict[str, Any]]:
        async with self._lock:
            if room_id not in self._rooms and len(self._rooms) >= MAX_ROOMS:
                raise RuntimeError("too_many_rooms")
            room = self._rooms.setdefault(room_id, Room())
            if len(room.peers) >= MAX_CLIENTS_PER_ROOM:
                raise RuntimeError("room_full")
            # Replace same self_key (refresh / Strict Mode remount)
            room.peers[peer.self_key] = peer
            return [
                {
                    "selfKey": p.self_key,
                    "user": p.user,
                    "color": p.color,
                    "cursor": p.cursor,
                }
                for k, p in room.peers.items()
                if k != peer.self_key
            ]

    async def leave(self, room_id: str, self_key: str) -> None:
        async with self._lock:
            room = self._rooms.get(room_id)
            if not room:
                return
            room.peers.pop(self_key, None)
            if not room.peers:
                self._rooms.pop(room_id, None)

    async def update_cursor(
        self, room_id: str, self_key: str, cursor: dict[str, float] | None
    ) -> None:
        async with self._lock:
            room = self._rooms.get(room_id)
            peer = room.peers.get(self_key) if room else None
            if peer:
                peer.cursor = cursor

    async def broadcast(
        self,
        room_id: str,
        message: dict[str, Any],
        *,
        exclude: str | None = None,
    ) -> None:
        async with self._lock:
            room = self._rooms.get(room_id)
            peers = list(room.peers.values()) if room else []

        dead: list[str] = []
        for peer in peers:
            if exclude and peer.self_key == exclude:
                continue
            try:
                await peer.ws.send_json(message)
            except Exception:
                dead.append(peer.self_key)

        for key in dead:
            await self.leave(room_id, key)


hub = CanvasHub()


def _safe_str(value: Any, *, max_len: int = 80) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_len]


def _validate_room_tenant_access(room_id: str, user_id: str) -> bool:
    """Validate that the user has access to the tenant that owns this room.
    
    Rooms are project IDs (custom_records.id). Each record has a tenant_id.
    Users can only join rooms for tenants they belong to.
    
    Returns True if user has access, False otherwise.
    """
    try:
        # Get the tenant_id for this room (project)
        record_res = supabase_admin.table("custom_records").select("tenant_id").eq("id", room_id).execute()
        if not record_res.data:
            logger.warning("Room %s not found in custom_records", room_id)
            return False
        
        tenant_id = record_res.data[0].get("tenant_id")
        if not tenant_id:
            logger.warning("Room %s has no tenant_id", room_id)
            return False
        
        # Check if user belongs to this tenant
        membership_res = supabase_admin.table("tenant_users").select("role").eq("tenant_id", tenant_id).eq("user_id", user_id).execute()
        if not membership_res.data:
            logger.warning("User %s not a member of tenant %s for room %s", user_id, tenant_id, room_id)
            return False
        
        return True
    except Exception as exc:
        logger.error("Error validating room tenant access for room %s, user %s: %s", room_id, user_id, exc)
        return False


@router.websocket("/ws/canvas/{room_id}")
async def canvas_collab_ws(websocket: WebSocket, room_id: str):
    room_id = (room_id or "").strip()[:120]
    if not room_id or room_id == "default-room":
        await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    self_key = ""
    try:
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=AUTH_TIMEOUT_SEC)
        msg = json.loads(raw)
        if not isinstance(msg, dict) or msg.get("type") != "auth":
            await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
            return

        token = _safe_str(msg.get("token"), max_len=4096)
        self_key = _safe_str(msg.get("selfKey"), max_len=64)
        user = _safe_str(msg.get("user"), max_len=64) or "User"
        color = _safe_str(msg.get("color"), max_len=32) or "#6366f1"
        if not self_key:
            await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
            return

        if _allow_insecure_canvas_ws():
            logger.info(
                "canvas ws insecure join room=%s peer=%s (ALLOW_INSECURE_CANVAS_WS / development)",
                room_id,
                self_key,
            )
        else:
            if not token or token == "local-dev":
                await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
                return
            try:
                identity = verify_access_token(token)
                user_id = identity.get("user_id")
                
                # Validate room-tenant binding
                if not _validate_room_tenant_access(room_id, user_id):
                    logger.warning(
                        "canvas ws room-tenant access denied room=%s user=%s",
                        room_id,
                        user_id,
                    )
                    await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
                    return
                    
            except Exception as exc:
                logger.warning(
                    "canvas ws auth failed room=%s err=%s",
                    room_id,
                    type(exc).__name__,
                )
                await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
                return
            logger.info("canvas ws authenticated room=%s peer=%s", room_id, self_key)

        peer = Peer(ws=websocket, self_key=self_key, user=user, color=color)
        try:
            others = await hub.join(room_id, peer)
        except RuntimeError as exc:
            await websocket.send_json({"type": "error", "reason": str(exc)})
            await websocket.close(code=http_status.WS_1013_TRY_AGAIN_LATER)
            return

        await websocket.send_json({"type": "ready", "peers": others})
        await hub.broadcast(
            room_id,
            {
                "type": "join",
                "selfKey": self_key,
                "user": user,
                "color": color,
                "cursor": None,
            },
            exclude=self_key,
        )

        while True:
            payload = await websocket.receive_json()
            if not isinstance(payload, dict):
                continue
            kind = payload.get("type")

            if kind == "cursor":
                cursor_raw = payload.get("cursor")
                cursor: dict[str, float] | None = None
                if isinstance(cursor_raw, dict):
                    try:
                        x = float(cursor_raw.get("x"))
                        y = float(cursor_raw.get("y"))
                        if abs(x) < 1_000_000 and abs(y) < 1_000_000:
                            cursor = {"x": x, "y": y}
                    except (TypeError, ValueError):
                        cursor = None
                await hub.update_cursor(room_id, self_key, cursor)
                await hub.broadcast(
                    room_id,
                    {
                        "type": "cursor",
                        "selfKey": self_key,
                        "user": user,
                        "color": color,
                        "cursor": cursor,
                    },
                    exclude=self_key,
                )
            elif kind == "y-update":
                # Relay CRDT bytes to peers (size-capped)
                update = payload.get("update")
                from_key = _safe_str(payload.get("from"), max_len=64) or self_key
                if not isinstance(update, str) or len(update) > 600_000:
                    continue
                await hub.broadcast(
                    room_id,
                    {
                        "type": "y-update",
                        "from": from_key,
                        "update": update,
                    },
                    exclude=self_key,
                )
            elif kind == "y-sync-request":
                state_vector = payload.get("stateVector")
                from_key = _safe_str(payload.get("from"), max_len=64) or self_key
                if state_vector is not None and not isinstance(state_vector, str):
                    continue
                if isinstance(state_vector, str) and len(state_vector) > 50_000:
                    continue
                await hub.broadcast(
                    room_id,
                    {
                        "type": "y-sync-request",
                        "from": from_key,
                        "stateVector": state_vector,
                    },
                    exclude=self_key,
                )
            elif kind == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except asyncio.TimeoutError:
        try:
            await websocket.close(code=http_status.WS_1008_POLICY_VIOLATION)
        except Exception:
            pass
    except Exception:
        logger.exception("canvas ws error room=%s", room_id)
    finally:
        if self_key:
            await hub.leave(room_id, self_key)
            await hub.broadcast(
                room_id,
                {"type": "leave", "selfKey": self_key},
                exclude=self_key,
            )
