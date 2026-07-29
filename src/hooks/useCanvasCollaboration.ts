'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';
import { getCanvasCollabWsUrl } from '@/lib/collabWsUrl';
import {
  decodeYUpdateFromBroadcast,
  encodeYUpdateForBroadcast,
  uint8ToBase64,
  base64ToUint8,
} from '@/lib/canvasCollabCodec';

export type CursorState = {
  user: string;
  color: string;
  cursor: { x: number; y: number } | null;
};

export type CanvasCollaborationOptions = {
  /** When true: incremental Yjs sync over the same WebSocket as cursors. */
  enableDocSync?: boolean;
};

export type CollabConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'subscribed'
  | 'error'
  | 'no-token';

const Y_ORIGIN_REMOTE = 'remote';
const OUTBOUND_CURSOR_MIN_MS = 50;
const OUTBOUND_Y_COALESCE_MS = 80;
const RECONNECT_MS = 900;
const MAX_RECONNECT = 8;
/** Soft cap for our own WS (not Supabase Realtime). */
const MAX_WS_Y_BYTES = 400_000;

function getOrCreateTabSelfKey(): string {
  if (typeof window === 'undefined') return 'client-ssr';
  try {
    const k = 'b2b-collab-tab-key';
    const existing = sessionStorage.getItem(k);
    if (existing) return existing;
    const next = `client-${crypto.randomUUID().slice(0, 12)}`;
    sessionStorage.setItem(k, next);
    return next;
  } catch {
    return `client-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Live cursors + optional Yjs doc sync over FastAPI WebSocket.
 */
export function useCanvasCollaboration(
  roomId: string,
  user: { name: string; color: string },
  options: CanvasCollaborationOptions = {}
) {
  const enableDocSync = Boolean(options.enableDocSync);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});
  const [connectionStatus, setConnectionStatus] =
    useState<CollabConnectionStatus>('idle');

  const [selfKey] = useState(() => getOrCreateTabSelfKey());
  const selfKeyRef = useRef(selfKey);

  const wsRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const userRef = useRef(user);
  const enableDocSyncRef = useRef(enableDocSync);
  const ydocRef = useRef<Y.Doc | null>(null);
  const yBoundRef = useRef(false);
  const pendingYRef = useRef<Uint8Array[]>([]);
  const yTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCursorSentRef = useRef(0);

  useEffect(() => {
    selfKeyRef.current = selfKey;
  }, [selfKey]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    enableDocSyncRef.current = enableDocSync;
  }, [enableDocSync]);

  const flushYOutbound = useCallback(() => {
    yTimerRef.current = null;
    const ws = wsRef.current;
    const ydoc = ydocRef.current;
    const pending = pendingYRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !readyRef.current) return;
    if (!ydoc || pending.length === 0) return;

    const merged =
      pending.length === 1 ? pending[0] : Y.mergeUpdates(pending);
    pendingYRef.current = [];

    const encoded = encodeYUpdateForBroadcast(merged, MAX_WS_Y_BYTES);
    if (!encoded.ok) {
      if (encoded.reason === 'too_large') {
        console.warn('[collab] dropped oversized y-update', encoded.byteLength);
      }
      return;
    }
    try {
      ws.send(
        JSON.stringify({
          type: 'y-update',
          from: selfKeyRef.current,
          update: encoded.base64,
        })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const onLocalYUpdate = useCallback(
    (update: Uint8Array, origin: unknown) => {
      if (origin === Y_ORIGIN_REMOTE) return;
      pendingYRef.current.push(update);
      if (yTimerRef.current == null) {
        yTimerRef.current = setTimeout(flushYOutbound, OUTBOUND_Y_COALESCE_MS);
      }
    },
    [flushYOutbound]
  );

  const detachYjs = useCallback(() => {
    const ydoc = ydocRef.current;
    if (ydoc && yBoundRef.current) {
      ydoc.off('update', onLocalYUpdate);
      yBoundRef.current = false;
    }
    if (yTimerRef.current != null) {
      clearTimeout(yTimerRef.current);
      yTimerRef.current = null;
    }
    pendingYRef.current = [];
    if (ydoc) {
      ydoc.destroy();
      ydocRef.current = null;
    }
    queueMicrotask(() => setDoc(null));
  }, [onLocalYUpdate]);

  const attachYjs = useCallback(
    (ws: WebSocket) => {
      if (ydocRef.current) return;
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      ydoc.on('update', onLocalYUpdate);
      yBoundRef.current = true;
      queueMicrotask(() => setDoc(ydoc));

      if (readyRef.current && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({
              type: 'y-sync-request',
              from: selfKeyRef.current,
              stateVector: uint8ToBase64(Y.encodeStateVector(ydoc)),
            })
          );
        } catch {
          /* ignore */
        }
      }
    },
    [onLocalYUpdate]
  );

  const attachYjsRef = useRef(attachYjs);
  const detachYjsRef = useRef(detachYjs);
  useEffect(() => {
    attachYjsRef.current = attachYjs;
  }, [attachYjs]);
  useEffect(() => {
    detachYjsRef.current = detachYjs;
  }, [detachYjs]);

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
          if (enableDocSyncRef.current && ws) {
            attachYjsRef.current(ws);
          }
          return;
        }

        if (type === 'y-update') {
          const ydoc = ydocRef.current;
          const from = typeof msg.from === 'string' ? msg.from : '';
          if (!ydoc || from === selfKeyRef.current) return;
          const bytes = decodeYUpdateFromBroadcast(msg.update, MAX_WS_Y_BYTES);
          if (!bytes) return;
          Y.applyUpdate(ydoc, bytes, Y_ORIGIN_REMOTE);
          return;
        }

        if (type === 'y-sync-request') {
          const ydoc = ydocRef.current;
          const from = typeof msg.from === 'string' ? msg.from : '';
          if (!ydoc || !ws || from === selfKeyRef.current) return;
          let stateVector: Uint8Array | undefined;
          if (typeof msg.stateVector === 'string') {
            try {
              stateVector = base64ToUint8(msg.stateVector);
            } catch {
              stateVector = undefined;
            }
          }
          const update = Y.encodeStateAsUpdate(ydoc, stateVector);
          const encoded = encodeYUpdateForBroadcast(update, MAX_WS_Y_BYTES);
          if (!encoded.ok) {
            console.warn(
              '[collab] skipped y-sync-response',
              encoded.byteLength
            );
            return;
          }
          try {
            ws.send(
              JSON.stringify({
                type: 'y-update',
                from: selfKeyRef.current,
                update: encoded.base64,
              })
            );
          } catch {
            /* ignore */
          }
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
                  : type === 'join'
                    ? null
                    : (prev[key]?.cursor ?? null),
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

      ws.onclose = (ev) => {
        readyRef.current = false;
        detachYjsRef.current();
        if (wsRef.current === ws) wsRef.current = null;
        if (cancelled) return;

        if (ev.code === 1008) {
          console.warn('[collab] ws auth/policy rejected');
          queueMicrotask(() => {
            if (!cancelled) setConnectionStatus('error');
          });
          return;
        }

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
      detachYjsRef.current();
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

  useEffect(() => {
    const ws = wsRef.current;
    if (!readyRef.current || !ws || ws.readyState !== WebSocket.OPEN) return;
    if (enableDocSync) {
      attachYjs(ws);
    } else {
      detachYjs();
    }
  }, [enableDocSync, attachYjs, detachYjs]);

  return {
    doc,
    isSynced,
    cursors,
    selfKey,
    connectionStatus,
    publishCursor,
  };
}
