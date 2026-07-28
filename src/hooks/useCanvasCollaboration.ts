'use client';

import { useEffect, useId, useRef, useState } from 'react';
import * as Y from 'yjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
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
  /** When false (default): presence + cursors only — no Yjs Realtime storm. */
  enableDocSync?: boolean;
};

const Y_ORIGIN_REMOTE = 'remote';
const OUTBOUND_COALESCE_MS = 80;

export function useCanvasCollaboration(
  roomId: string,
  user: { name: string; color: string },
  options: CanvasCollaborationOptions = {}
) {
  const enableDocSync = Boolean(options.enableDocSync);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<RealtimeChannel | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});
  // useId is render-safe (no Math.random / randomUUID during render)
  const reactId = useId().replace(/:/g, '');
  const clientIdRef = useRef(`client-${reactId}`);

  useEffect(() => {
    if (!roomId || roomId === 'default-room') {
      // Keep initial nulls; previous effect cleanup clears an active session.
      return;
    }

    let cancelled = false;
    const ydoc = enableDocSync ? new Y.Doc() : null;

    const channel = supabase.channel(`canvas-${roomId}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: user.name },
      },
    });

    let coalesceTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingUpdates: Uint8Array[] = [];

    const flushOutbound = () => {
      coalesceTimer = null;
      if (!ydoc || pendingUpdates.length === 0) return;
      const merged =
        pendingUpdates.length === 1
          ? pendingUpdates[0]
          : Y.mergeUpdates(pendingUpdates);
      pendingUpdates.length = 0;

      const encoded = encodeYUpdateForBroadcast(merged);
      if (!encoded.ok) {
        if (encoded.reason === 'too_large') {
          console.warn(
            '[collab] dropped oversized y-update',
            encoded.byteLength
          );
        }
        return;
      }

      void channel.send({
        type: 'broadcast',
        event: 'y-update',
        payload: {
          from: clientIdRef.current,
          update: encoded.base64,
        },
      });
    };

    const onLocalYUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === Y_ORIGIN_REMOTE) return;
      pendingUpdates.push(update);
      if (coalesceTimer == null) {
        coalesceTimer = setTimeout(flushOutbound, OUTBOUND_COALESCE_MS);
      }
    };

    if (ydoc) {
      ydoc.on('update', onLocalYUpdate);

      channel.on('broadcast', { event: 'y-update' }, ({ payload }) => {
        if (!payload || payload.from === clientIdRef.current) return;
        const bytes = decodeYUpdateFromBroadcast(payload.update);
        if (!bytes) return;
        Y.applyUpdate(ydoc, bytes, Y_ORIGIN_REMOTE);
      });

      channel.on('broadcast', { event: 'y-sync-request' }, ({ payload }) => {
        if (!payload || payload.from === clientIdRef.current) return;
        let stateVector: Uint8Array | undefined;
        if (typeof payload.stateVector === 'string') {
          try {
            stateVector = base64ToUint8(payload.stateVector);
          } catch {
            stateVector = undefined;
          }
        }
        const update = Y.encodeStateAsUpdate(ydoc, stateVector);
        const encoded = encodeYUpdateForBroadcast(update);
        if (!encoded.ok) {
          console.warn(
            '[collab] skipped y-sync-response (too large)',
            encoded.byteLength
          );
          return;
        }
        void channel.send({
          type: 'broadcast',
          event: 'y-update',
          payload: {
            from: clientIdRef.current,
            update: encoded.base64,
          },
        });
      });
    }

    channel.on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
      if (!payload?.userKey) return;
      setCursors((prev) => {
        const existing = prev[payload.userKey];
        if (!existing) {
          return {
            ...prev,
            [payload.userKey]: {
              user: payload.userKey,
              color: payload.color || '#6366f1',
              cursor: payload.cursor ?? null,
            },
          };
        }
        return {
          ...prev,
          [payload.userKey]: {
            ...existing,
            cursor: payload.cursor ?? null,
          },
        };
      });
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const active: Record<string, CursorState> = {};
      for (const key of Object.keys(state)) {
        const row = state[key]?.[0] as unknown as CursorState | undefined;
        if (!row) continue;
        active[key] = {
          user: row.user || key,
          color: row.color || '#6366f1',
          cursor: row.cursor ?? null,
        };
      }
      setCursors((prev) => {
        const merged = { ...active };
        for (const [key, cur] of Object.entries(prev)) {
          if (merged[key] && cur.cursor) {
            merged[key] = { ...merged[key], cursor: cur.cursor };
          }
        }
        return merged;
      });
    });

    channel.subscribe((status: string) => {
      if (cancelled || status !== 'SUBSCRIBED') return;
      // External system ready — safe place to publish React state
      setDoc(ydoc);
      setProvider(channel);
      setIsSynced(true);
      // Sparse presence: identity only — not every mousemove.
      void channel.track({
        user: user.name,
        color: user.color,
        cursor: null,
      });

      if (ydoc) {
        void channel.send({
          type: 'broadcast',
          event: 'y-sync-request',
          payload: {
            from: clientIdRef.current,
            stateVector: uint8ToBase64(Y.encodeStateVector(ydoc)),
          },
        });
      }
    });

    return () => {
      cancelled = true;
      if (coalesceTimer != null) clearTimeout(coalesceTimer);
      if (ydoc) {
        ydoc.off('update', onLocalYUpdate);
        ydoc.destroy();
      }
      void channel.unsubscribe();
      // Defer so we do not sync-setState in the effect body / cleanup path
      queueMicrotask(() => {
        setDoc(null);
        setProvider(null);
        setIsSynced(false);
        setCursors({});
      });
    };
  }, [roomId, user.name, user.color, enableDocSync]);

  return { doc, provider, isSynced, cursors };
}
