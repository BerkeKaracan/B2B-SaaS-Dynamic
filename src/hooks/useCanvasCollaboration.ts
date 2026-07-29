'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import * as Y from 'yjs';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getCanvasCollabClient } from '@/lib/realtimeClient';
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
const SUBSCRIBE_WATCHDOG_MS = 12000;

/**
 * Serialize join/leave for a topic so React Strict Mode
 * (unmount removeChannel → remount channel) cannot race and kill the new join.
 */
const topicChains = new Map<string, Promise<unknown>>();

function enqueueTopicTask<T>(topic: string, task: () => Promise<T>): Promise<T> {
  const prev = topicChains.get(topic) ?? Promise.resolve();
  const next = prev.then(task, task);
  topicChains.set(
    topic,
    next.then(
      () => undefined,
      () => undefined
    )
  );
  return next;
}

function channelMatchesTopic(ch: RealtimeChannel, topic: string): boolean {
  const name = (ch as RealtimeChannel & { topic?: string }).topic || '';
  return (
    name === topic ||
    name === `realtime:${topic}` ||
    name.endsWith(`:${topic}`)
  );
}

async function removeTopicChannels(
  client: SupabaseClient<Database>,
  topic: string,
  except?: RealtimeChannel | null
): Promise<void> {
  const existing = client.getChannels().filter((ch) => channelMatchesTopic(ch, topic));
  for (const ch of existing) {
    if (except && ch === except) continue;
    try {
      await client.removeChannel(ch);
    } catch {
      /* ignore */
    }
  }
}

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

  const detachYjsImpl = useCallback(() => {
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

  const attachYjsImpl = useCallback(
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

  const attachYjsRef = useRef(attachYjsImpl);
  const detachYjsRef = useRef(detachYjsImpl);
  useEffect(() => {
    attachYjsRef.current = attachYjsImpl;
  }, [attachYjsImpl]);
  useEffect(() => {
    detachYjsRef.current = detachYjsImpl;
  }, [detachYjsImpl]);

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

  // Connect only when room changes. Anon public Realtime — no JWT.
  useEffect(() => {
    if (!roomId || roomId === 'default-room') {
      return;
    }

    const client = getCanvasCollabClient();
    if (!client) {
      queueMicrotask(() => setConnectionStatus('error'));
      return;
    }

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let subscribed = false;
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
    let rejoinTimer: ReturnType<typeof setTimeout> | null = null;
    let joinAttempt = 0;

    const topic = `canvas:${roomId}`;

    const clearWatchdog = () => {
      if (watchdogTimer != null) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
    };

    const markConnecting = () => {
      queueMicrotask(() => {
        if (!cancelled) setConnectionStatus('connecting');
      });
    };

    const markSubscribed = () => {
      queueMicrotask(() => {
        if (cancelled) return;
        setIsSynced(true);
        setConnectionStatus('subscribed');
      });
    };

    const markError = () => {
      queueMicrotask(() => {
        if (!cancelled) setConnectionStatus('error');
      });
    };

    const syncCursorsFromPresence = (ch: RealtimeChannel) => {
      if (cancelled) return;
      const key = selfKeyRef.current;
      const state = ch.presenceState();
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

    const join = () =>
      enqueueTopicTask(topic, async () => {
        if (cancelled) return;
        joinAttempt += 1;
        subscribed = false;
        readyRef.current = false;
        markConnecting();

        // Ensure previous Strict Mode channel is fully gone before joining
        await removeTopicChannels(client, topic);
        if (cancelled) return;

        const ch = client.channel(topic, {
          config: {
            broadcast: { self: false, ack: false },
            presence: { key: selfKeyRef.current },
          },
        });
        channel = ch;
        channelRef.current = ch;

        ch.on('broadcast', { event: 'y-update' }, ({ payload }) => {
          const ydoc = ydocRef.current;
          if (!payload || payload.from === selfKeyRef.current || !ydoc) return;
          const bytes = decodeYUpdateFromBroadcast(payload.update);
          if (!bytes) return;
          Y.applyUpdate(ydoc, bytes, Y_ORIGIN_REMOTE);
        });

        ch.on('broadcast', { event: 'y-sync-request' }, ({ payload }) => {
          const ydoc = ydocRef.current;
          if (!payload || payload.from === selfKeyRef.current || !ydoc) return;
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
          void ch.send({
            type: 'broadcast',
            event: 'y-update',
            payload: {
              from: selfKeyRef.current,
              update: encoded.base64,
            },
          });
        });

        ch.on('presence', { event: 'sync' }, () => syncCursorsFromPresence(ch));
        ch.on('presence', { event: 'join' }, () => syncCursorsFromPresence(ch));
        ch.on('presence', { event: 'leave' }, () => syncCursorsFromPresence(ch));

        clearWatchdog();
        watchdogTimer = setTimeout(() => {
          watchdogTimer = null;
          if (cancelled || subscribed) return;
          readyRef.current = false;
          markError();
          console.warn('[collab] subscribe timed out', { topic, joinAttempt });
        }, SUBSCRIBE_WATCHDOG_MS);

        await new Promise<void>((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };

          ch.subscribe((status, err) => {
            if (cancelled) {
              done();
              return;
            }

            if (status === 'SUBSCRIBED') {
              clearWatchdog();
              subscribed = true;
              readyRef.current = true;
              markSubscribed();

              const u = userRef.current;
              void ch.track({
                user: u.name,
                color: u.color,
                cursor: null,
              });

              if (enableDocSyncRef.current) {
                attachYjsRef.current(ch);
              }
              done();
              return;
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              clearWatchdog();
              readyRef.current = false;
              markError();
              console.warn(
                '[collab] channel',
                status,
                err?.message ?? err ?? ''
              );
              done();
              return;
            }

            // Unexpected CLOSED after we were live — one automatic rejoin
            if (status === 'CLOSED' && subscribed) {
              clearWatchdog();
              subscribed = false;
              readyRef.current = false;
              console.warn('[collab] channel CLOSED unexpectedly — rejoining');
              done();
              if (!cancelled && joinAttempt < 3) {
                rejoinTimer = setTimeout(() => {
                  rejoinTimer = null;
                  if (!cancelled) void join();
                }, 350);
              } else {
                markError();
              }
            }
          });
        });
      });

    void join();

    return () => {
      cancelled = true;
      clearWatchdog();
      if (rejoinTimer != null) {
        clearTimeout(rejoinTimer);
        rejoinTimer = null;
      }
      readyRef.current = false;
      detachYjsRef.current();
      channelRef.current = null;
      const ch = channel;
      void enqueueTopicTask(topic, async () => {
        if (ch) {
          try {
            await client.removeChannel(ch);
          } catch {
            /* ignore */
          }
        }
      });
      queueMicrotask(() => {
        setIsSynced(false);
        setCursors({});
        setConnectionStatus('idle');
      });
    };
  }, [roomId]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!readyRef.current || !channel) return;

    if (enableDocSync) {
      attachYjsImpl(channel);
    } else {
      detachYjsImpl();
    }
  }, [enableDocSync, attachYjsImpl, detachYjsImpl]);

  return {
    doc,
    isSynced,
    cursors,
    selfKey,
    connectionStatus,
    publishCursor,
  };
}
