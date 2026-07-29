'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import * as Y from 'yjs';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';
import { getCanvasCollabWsUrl } from '@/lib/collabWsUrl';

export type CursorState = {
  user: string;
  color: string;
  cursor: { x: number; y: number } | null;
};

export type CanvasCollaborationOptions = {
  /**
   * Reserved for future CRDT sync over the same WS.
   * Currently cursors-only — enableDocSync does not open a Realtime storm.
   */
  enableDocSync?: boolean;
};

export type CollabConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'subscribed'
  | 'error'
  | 'no-token';

const OUTBOUND_CURSOR_MIN_MS = 50;
const RECONNECT_MS = 900;
const MAX_RECONNECT = 8;

/**
 * Live cursors via our FastAPI WebSocket hub — not Supabase Realtime.
 * Avoids CHANNEL_ERROR / CLOSED races from supabase-js presence.
 */
export function useCanvasCollaboration(
  roomId: string,
  user: { name: string; color: string },
  _options: CanvasCollaborationOptions = {}
) {
  const [doc] = useState<Y.Doc | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});
  const [connectionStatus, setConnectionStatus] =
    useState<CollabConnectionStatus>('idle');
  const selfKey = `client-${useId().replace(/:/g, '')}`;

  const wsRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const userRef = useRef(user);
  const selfKeyRef = useRef(selfKey);
  const lastCursorSentRef = useRef(0);

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    selfKeyRef.current = selfKey;
  }, [selfKey]);

  const publishCursor = useCallback(
    (cursor: { x: number; y: number } | null) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !readyRef.current) return;
      const now = Date.now();
      if (now - lastCursorSentRef.current < OUTBOUND_CURSOR_MIN_MS) return;
      lastCursorSentRef.current = now;
      try {
        ws.send(JSON.stringify({ type: 'cursor', cursor }));
      } catch {
        /* ignore */
      }
    },
    []
  );

  useEffect(() => {
    if (!roomId || roomId === 'default-room') {
      return;
    }

    const wsUrl = getCanvasCollabWsUrl(roomId);
    if (!wsUrl) {
      queueMicrotask(() => setConnectionStatus('error'));
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let openedOnce = false;

    const clearReconnect = () => {
      if (reconnectTimer != null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const applyPeers = (
      peers: Array<{
        selfKey?: string;
        user?: string;
        color?: string;
        cursor?: { x: number; y: number } | null;
      }>
    ) => {
      const next: Record<string, CursorState> = {};
      for (const p of peers) {
        if (!p?.selfKey || p.selfKey === selfKeyRef.current) continue;
        next[p.selfKey] = {
          user: p.user || p.selfKey,
          color: p.color || '#6366f1',
          cursor: p.cursor ?? null,
        };
      }
      setCursors(next);
    };

    const connect = async () => {
      if (cancelled) return;
      queueMicrotask(() => {
        if (!cancelled) setConnectionStatus('connecting');
      });

      const token = await fetchRealtimeAccessToken();
      if (cancelled) return;
      if (!token) {
        queueMicrotask(() => {
          if (!cancelled) setConnectionStatus('no-token');
        });
        return;
      }

      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        console.warn('[collab] ws construct failed', err);
        queueMicrotask(() => {
          if (!cancelled) setConnectionStatus('error');
        });
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled || !ws) return;
        const u = userRef.current;
        ws.send(
          JSON.stringify({
            type: 'auth',
            token,
            selfKey: selfKeyRef.current,
            user: u.name,
            color: u.color,
          })
        );
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(event.data)) as Record<string, unknown>;
        } catch {
          return;
        }

        const type = msg.type;
        if (type === 'ready') {
          openedOnce = true;
          attempt = 0;
          readyRef.current = true;
          applyPeers(
            Array.isArray(msg.peers)
              ? (msg.peers as Array<{
                  selfKey?: string;
                  user?: string;
                  color?: string;
                  cursor?: { x: number; y: number } | null;
                }>)
              : []
          );
          queueMicrotask(() => {
            if (cancelled) return;
            setIsSynced(true);
            setConnectionStatus('subscribed');
          });
          return;
        }

        if (type === 'cursor' || type === 'join') {
          const key = typeof msg.selfKey === 'string' ? msg.selfKey : '';
          if (!key || key === selfKeyRef.current) return;
          setCursors((prev) => ({
            ...prev,
            [key]: {
              user:
                (typeof msg.user === 'string' && msg.user) ||
                prev[key]?.user ||
                key,
              color:
                (typeof msg.color === 'string' && msg.color) ||
                prev[key]?.color ||
                '#6366f1',
              cursor:
                msg.cursor &&
                typeof msg.cursor === 'object' &&
                msg.cursor !== null &&
                'x' in (msg.cursor as object) &&
                'y' in (msg.cursor as object)
                  ? {
                      x: Number((msg.cursor as { x: number }).x),
                      y: Number((msg.cursor as { y: number }).y),
                    }
                  : null,
            },
          }));
          return;
        }

        if (type === 'leave') {
          const key = typeof msg.selfKey === 'string' ? msg.selfKey : '';
          if (!key) return;
          setCursors((prev) => {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          });
          return;
        }

        if (type === 'error') {
          console.warn('[collab] server error', msg.reason);
          queueMicrotask(() => {
            if (!cancelled) setConnectionStatus('error');
          });
        }
      };

      ws.onerror = () => {
        /* onclose handles status */
      };

      ws.onclose = () => {
        readyRef.current = false;
        if (wsRef.current === ws) wsRef.current = null;
        if (cancelled) return;

        if (attempt < MAX_RECONNECT) {
          attempt += 1;
          queueMicrotask(() => {
            if (!cancelled) setConnectionStatus('connecting');
          });
          clearReconnect();
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            if (!cancelled) void connect();
          }, RECONNECT_MS * Math.min(attempt, 4));
          if (openedOnce) {
            console.warn('[collab] ws closed — reconnecting', attempt);
          }
        } else {
          queueMicrotask(() => {
            if (!cancelled) setConnectionStatus('error');
          });
          console.warn('[collab] ws give up after reconnects');
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      clearReconnect();
      readyRef.current = false;
      const socket = ws;
      wsRef.current = null;
      if (socket && socket.readyState <= WebSocket.OPEN) {
        try {
          socket.close(1000, 'unmount');
        } catch {
          /* ignore */
        }
      }
      queueMicrotask(() => {
        setIsSynced(false);
        setCursors({});
        setConnectionStatus('idle');
      });
    };
  }, [roomId]);

  return {
    doc,
    isSynced,
    cursors,
    selfKey,
    connectionStatus,
    publishCursor,
  };
}
