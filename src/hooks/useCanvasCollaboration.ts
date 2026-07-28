'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import * as Y from 'yjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSharedRealtimeClient } from '@/lib/realtimeClient';
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

  const channelRef = useRef<RealtimeChannel | null>(null);
  const readyRef = useRef(false);
  const ydocRef = useRef<Y.Doc | null>(null);
  const enableDocSyncRef = useRef(enableDocSync);
  const userRef = useRef(user);
  const selfKeyRef = useRef(selfKey);
  const pendingUpdatesRef = useRef<Uint8Array[]>([]);
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yBoundRef = useRef(false);

  // Keep latest values for callbacks without reconnecting the channel
  useEffect(() => {
    enableDocSyncRef.current = enableDocSync;
  }, [enableDocSync]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    selfKeyRef.current = selfKey;
  }, [selfKey]);

  const flushOutbound = useCallback(() => {
    coalesceTimerRef.current = null;
    const channel = channelRef.current;
    const ydoc = ydocRef.current;
    const pending = pendingUpdatesRef.current;
    if (!channel || !ydoc || !readyRef.current || pending.length === 0) return;

    const merged =
      pending.length === 1 ? pending[0] : Y.mergeUpdates(pending);
    pendingUpdatesRef.current = [];

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
        from: selfKeyRef.current,
        update: encoded.base64,
      },
    });
  }, []);

  const onLocalYUpdate = useCallback(
    (update: Uint8Array, origin: unknown) => {
      if (origin === Y_ORIGIN_REMOTE) return;
      pendingUpdatesRef.current.push(update);
      if (coalesceTimerRef.current == null) {
        coalesceTimerRef.current = setTimeout(
          flushOutbound,
          OUTBOUND_COALESCE_MS
        );
      }
    },
    [flushOutbound]
  );

  const detachYjs = useCallback(() => {
    const ydoc = ydocRef.current;
    if (ydoc && yBoundRef.current) {
      ydoc.off('update', onLocalYUpdate);
      yBoundRef.current = false;
    }
    if (coalesceTimerRef.current != null) {
      clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = null;
    }
    pendingUpdatesRef.current = [];
    if (ydoc) {
      ydoc.destroy();
      ydocRef.current = null;
    }
    queueMicrotask(() => setDoc(null));
  }, [onLocalYUpdate]);

  const attachYjs = useCallback(
    (channel: RealtimeChannel) => {
      if (ydocRef.current) return;
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      ydoc.on('update', onLocalYUpdate);
      yBoundRef.current = true;
      queueMicrotask(() => setDoc(ydoc));

      if (readyRef.current) {
        void channel.send({
          type: 'broadcast',
          event: 'y-sync-request',
          payload: {
            from: selfKeyRef.current,
            stateVector: uint8ToBase64(Y.encodeStateVector(ydoc)),
          },
        });
      }
    },
    [onLocalYUpdate]
  );

  const publishCursor = useCallback(
    (cursor: { x: number; y: number } | null) => {
      const channel = channelRef.current;
      if (!channel || !readyRef.current) return;
      const u = userRef.current;
      void channel.track({
        user: u.name,
        color: u.color,
        cursor,
      });
    },
    []
  );

  // Connect / disconnect only when room changes
  useEffect(() => {
    if (!roomId || roomId === 'default-room') {
      return;
    }

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    const syncCursorsFromPresence = () => {
      if (!channel) return;
      const key = selfKeyRef.current;
      const state = channel.presenceState();
      const next: Record<string, CursorState> = {};
      for (const presenceKey of Object.keys(state)) {
        if (presenceKey === key) continue;
        const row = state[presenceKey]?.[0] as unknown as
          | (CursorState & { user?: string; color?: string })
          | undefined;
        if (!row) continue;
        next[presenceKey] = {
          user: row.user || presenceKey,
          color: row.color || '#6366f1',
          cursor: row.cursor ?? null,
        };
      }
      setCursors(next);
    };

    void (async () => {
      setConnectionStatus('connecting');
      const client = await getSharedRealtimeClient();
      if (cancelled) return;
      if (!client) {
        console.warn('[collab] realtime token missing — cursors/sync disabled');
        setConnectionStatus('no-token');
        return;
      }

      channel = client.channel(`canvas-${roomId}`, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: selfKeyRef.current },
        },
      });
      channelRef.current = channel;

      channel.on('broadcast', { event: 'y-update' }, ({ payload }) => {
        const ydoc = ydocRef.current;
        if (!payload || payload.from === selfKeyRef.current || !ydoc) return;
        const bytes = decodeYUpdateFromBroadcast(payload.update);
        if (!bytes) return;
        Y.applyUpdate(ydoc, bytes, Y_ORIGIN_REMOTE);
      });

      channel.on('broadcast', { event: 'y-sync-request' }, ({ payload }) => {
        const ydoc = ydocRef.current;
        if (!payload || payload.from === selfKeyRef.current || !ydoc || !channel)
          return;
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
            from: selfKeyRef.current,
            update: encoded.base64,
          },
        });
      });

      channel.on('presence', { event: 'sync' }, syncCursorsFromPresence);
      channel.on('presence', { event: 'join' }, syncCursorsFromPresence);
      channel.on('presence', { event: 'leave' }, syncCursorsFromPresence);

      channel.subscribe((status: string, err?: Error) => {
        if (cancelled) return;

        if (status === 'SUBSCRIBED') {
          readyRef.current = true;
          setIsSynced(true);
          setConnectionStatus('subscribed');

          const u = userRef.current;
          void channel?.track({
            user: u.name,
            color: u.color,
            cursor: null,
          });

          if (enableDocSyncRef.current && channel) {
            attachYjs(channel);
          }
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          readyRef.current = false;
          setConnectionStatus('error');
          console.warn('[collab] realtime channel status', status, err ?? '');
          return;
        }

        // CLOSED during intentional cleanup must not flash as error
        if (status === 'CLOSED' && !cancelled) {
          readyRef.current = false;
          setConnectionStatus('connecting');
        }
      });
    })();

    return () => {
      cancelled = true;
      readyRef.current = false;
      detachYjs();
      const ch = channel;
      channelRef.current = null;
      void (async () => {
        const client = await getSharedRealtimeClient();
        if (client && ch) {
          client.removeChannel(ch);
        }
        setIsSynced(false);
        setCursors({});
        setConnectionStatus('idle');
      })();
    };
  }, [roomId, attachYjs, detachYjs]);

  // Toggle Yjs on the existing channel when the feature flag flips
  useEffect(() => {
    const channel = channelRef.current;
    if (!readyRef.current || !channel) return;

    if (enableDocSync) {
      attachYjs(channel);
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
