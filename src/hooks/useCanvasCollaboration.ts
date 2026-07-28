'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
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

export type CollabConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'subscribed'
  | 'error'
  | 'no-token';

const Y_ORIGIN_REMOTE = 'remote';
const OUTBOUND_COALESCE_MS = 80;

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
  const selfKey = `client-${useId().replace(/:/g, '')}`;
  const sessionGenRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const readyRef = useRef(false);

  const publishCursor = useCallback(
    (cursor: { x: number; y: number } | null) => {
      const channel = channelRef.current;
      if (!channel || !readyRef.current) return;
      void channel.track({
        user: user.name,
        color: user.color,
        cursor,
      });
    },
    [user.name, user.color]
  );

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
      if (sessionGenRef.current !== sessionGen) return;
      channelRef.current = null;
      readyRef.current = false;
      setDoc(null);
      setIsSynced(false);
      setCursors({});
      setConnectionStatus('idle');
    };

    // Async path only — avoid sync setState in effect body
    void (async () => {
      setConnectionStatus('connecting');
      const token = await fetchRealtimeAccessToken();
      if (cancelled) return;
      if (!token) {
        console.warn('[collab] realtime token missing — cursors/sync disabled');
        setConnectionStatus('no-token');
        return;
      }

      client = createAuthedSupabaseClient(token);
      if (cancelled || !client) {
        console.warn('[collab] authed supabase client failed');
        setConnectionStatus('error');
        return;
      }

      ydoc = enableDocSync ? new Y.Doc() : null;

      channel = client.channel(`canvas-${roomId}`, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: selfKey },
        },
      });
      channelRef.current = channel;

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

      const syncCursorsFromPresence = () => {
        if (!channel) return;
        const state = channel.presenceState();
        const next: Record<string, CursorState> = {};
        for (const key of Object.keys(state)) {
          if (key === selfKey) continue;
          const row = state[key]?.[0] as unknown as
            | (CursorState & { user?: string; color?: string })
            | undefined;
          if (!row) continue;
          next[key] = {
            user: row.user || key,
            color: row.color || '#6366f1',
            cursor: row.cursor ?? null,
          };
        }
        setCursors(next);
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

      channel.on('presence', { event: 'sync' }, syncCursorsFromPresence);
      channel.on('presence', { event: 'join' }, syncCursorsFromPresence);
      channel.on('presence', { event: 'leave' }, syncCursorsFromPresence);

      channel.subscribe((status: string, err?: Error) => {
        if (cancelled) return;

        if (status === 'SUBSCRIBED') {
          readyRef.current = true;
          setDoc(ydoc);
          setIsSynced(true);
          setConnectionStatus('subscribed');

          void channel?.track({
            user: user.name,
            color: user.color,
            cursor: null,
          });

          if (ydoc && channel) {
            void channel.send({
              type: 'broadcast',
              event: 'y-sync-request',
              payload: {
                from: selfKey,
                stateVector: uint8ToBase64(Y.encodeStateVector(ydoc)),
              },
            });
          }
          return;
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          readyRef.current = false;
          setConnectionStatus('error');
          console.warn('[collab] realtime channel status', status, err ?? '');
        }
      });
    })();

    return () => {
      cancelled = true;
      readyRef.current = false;
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
  }, [roomId, enableDocSync, selfKey, user.name, user.color]);

  return {
    doc,
    isSynced,
    cursors,
    selfKey,
    connectionStatus,
    publishCursor,
  };
}
