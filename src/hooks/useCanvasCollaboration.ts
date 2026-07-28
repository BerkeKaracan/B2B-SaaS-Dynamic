'use client';

import { useEffect, useId, useRef, useState } from 'react';
import * as Y from 'yjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createAuthedSupabaseClient } from '@/lib/supabaseAuthedClient';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';
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
  const selfKey = `client-${useId().replace(/:/g, '')}`;
  const sessionGenRef = useRef(0);

  useEffect(() => {
    if (!roomId || roomId === 'default-room') {
      return;
    }

    let cancelled = false;
    const sessionGen = ++sessionGenRef.current;
    let client: ReturnType<typeof createAuthedSupabaseClient> = null;
    let channel: RealtimeChannel | null = null;
    let ydoc: Y.Doc | null = null;
    let coalesceTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingUpdates: Uint8Array[] = [];

    const clearSessionState = () => {
      // Ignore stale cleanups from a previous effect generation
      if (sessionGenRef.current !== sessionGen) return;
      setDoc(null);
      setProvider(null);
      setIsSynced(false);
      setCursors({});
    };

    void (async () => {
      const token = await fetchRealtimeAccessToken();
      if (cancelled || !token) {
        console.warn('[collab] realtime token missing — cursors/sync disabled');
        return;
      }

      client = createAuthedSupabaseClient(token);
      if (cancelled || !client) {
        console.warn('[collab] authed supabase client failed');
        return;
      }

      ydoc = enableDocSync ? new Y.Doc() : null;

      channel = client.channel(`canvas-${roomId}`, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: selfKey },
        },
      });

      const flushOutbound = () => {
        coalesceTimer = null;
        if (!ydoc || !channel || pendingUpdates.length === 0) return;
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
            from: selfKey,
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
          if (!payload || payload.from === selfKey || !ydoc) return;
          const bytes = decodeYUpdateFromBroadcast(payload.update);
          if (!bytes) return;
          Y.applyUpdate(ydoc, bytes, Y_ORIGIN_REMOTE);
        });

        channel.on('broadcast', { event: 'y-sync-request' }, ({ payload }) => {
          if (!payload || payload.from === selfKey || !ydoc || !channel) return;
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
              from: selfKey,
              update: encoded.base64,
            },
          });
        });
      }

      channel.on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        if (!payload?.userKey || payload.userKey === selfKey) return;
        setCursors((prev) => ({
          ...prev,
          [payload.userKey]: {
            user: payload.user || payload.userKey,
            color: payload.color || '#6366f1',
            cursor: payload.cursor ?? null,
          },
        }));
      });

      channel.on('presence', { event: 'sync' }, () => {
        if (!channel) return;
        const state = channel.presenceState();
        setCursors((prev) => {
          const next: Record<string, CursorState> = {};
          for (const key of Object.keys(state)) {
            if (key === selfKey) continue;
            const row = state[key]?.[0] as unknown as CursorState | undefined;
            if (!row) continue;
            next[key] = {
              user: row.user || key,
              color: row.color || '#6366f1',
              // Keep last broadcast cursor if presence has null
              cursor: prev[key]?.cursor ?? row.cursor ?? null,
            };
          }
          return next;
        });
      });

      channel.subscribe((status: string) => {
        if (cancelled || status !== 'SUBSCRIBED' || !channel) return;

        setDoc(ydoc);
        setProvider(channel);
        setIsSynced(true);

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
              from: selfKey,
              stateVector: uint8ToBase64(Y.encodeStateVector(ydoc)),
            },
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      if (coalesceTimer != null) clearTimeout(coalesceTimer);
      if (ydoc) {
        ydoc.destroy();
        ydoc = null;
      }
      if (client && channel) {
        void client.removeChannel(channel);
      }
      channel = null;
      client = null;
      queueMicrotask(clearSessionState);
    };
  }, [roomId, user.name, user.color, enableDocSync, selfKey]);

  return {
    doc,
    provider,
    isSynced,
    cursors,
    selfKey,
  };
}
