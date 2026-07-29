'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import {
  acquireCanvasCollab,
  type CollabConnectionStatus,
  type CursorState,
} from '@/lib/canvasCollabSession';
import {
  decodeYUpdateFromBroadcast,
  encodeYUpdateForBroadcast,
  uint8ToBase64,
  base64ToUint8,
} from '@/lib/canvasCollabCodec';

export type { CursorState, CollabConnectionStatus };

export type CanvasCollaborationOptions = {
  enableDocSync?: boolean;
};

const Y_ORIGIN_REMOTE = 'remote';
const OUTBOUND_CURSOR_MIN_MS = 50;
const OUTBOUND_Y_COALESCE_MS = 80;
const MAX_WS_Y_BYTES = 400_000;

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
  const [selfKey, setSelfKey] = useState('client');

  const enableDocSyncRef = useRef(enableDocSync);
  const ydocRef = useRef<Y.Doc | null>(null);
  const yBoundRef = useRef(false);
  const pendingYRef = useRef<Uint8Array[]>([]);
  const yTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCursorSentRef = useRef(0);
  const sendRef = useRef<(payload: Record<string, unknown>) => void>(() => undefined);
  const publishRef = useRef<
    (cursor: { x: number; y: number } | null) => void
  >(() => undefined);
  const selfKeyRef = useRef(selfKey);

  useEffect(() => {
    enableDocSyncRef.current = enableDocSync;
  }, [enableDocSync]);
  useEffect(() => {
    selfKeyRef.current = selfKey;
  }, [selfKey]);

  const flushYOutbound = useCallback(() => {
    yTimerRef.current = null;
    const ydoc = ydocRef.current;
    const pending = pendingYRef.current;
    if (!ydoc || pending.length === 0) return;

    const merged =
      pending.length === 1 ? pending[0] : Y.mergeUpdates(pending);
    pendingYRef.current = [];

    const encoded = encodeYUpdateForBroadcast(merged, MAX_WS_Y_BYTES);
    if (!encoded.ok) return;

    sendRef.current({
      type: 'y-update',
      from: selfKeyRef.current,
      update: encoded.base64,
    });
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

  const attachYjs = useCallback(() => {
    if (ydocRef.current) return;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    ydoc.on('update', onLocalYUpdate);
    yBoundRef.current = true;
    queueMicrotask(() => setDoc(ydoc));

    sendRef.current({
      type: 'y-sync-request',
      from: selfKeyRef.current,
      stateVector: uint8ToBase64(Y.encodeStateVector(ydoc)),
    });
  }, [onLocalYUpdate]);

  useEffect(() => {
    if (!roomId || roomId === 'default-room') return;

    const handleMessage = (msg: Record<string, unknown>) => {
      if (msg.type === 'ready') {
        if (enableDocSyncRef.current) attachYjs();
        return;
      }
      if (msg.type === 'y-update') {
        const ydoc = ydocRef.current;
        const from = typeof msg.from === 'string' ? msg.from : '';
        if (!ydoc || from === selfKeyRef.current) return;
        const bytes = decodeYUpdateFromBroadcast(msg.update, MAX_WS_Y_BYTES);
        if (!bytes) return;
        Y.applyUpdate(ydoc, bytes, Y_ORIGIN_REMOTE);
        return;
      }
      if (msg.type === 'y-sync-request') {
        const ydoc = ydocRef.current;
        const from = typeof msg.from === 'string' ? msg.from : '';
        if (!ydoc || from === selfKeyRef.current) return;
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
        if (!encoded.ok) return;
        sendRef.current({
          type: 'y-update',
          from: selfKeyRef.current,
          update: encoded.base64,
        });
      }
    };

    const { selfKey: key, publishCursor, send, release } = acquireCanvasCollab(
      roomId,
      user,
      {
        onStatus: (st) => {
          queueMicrotask(() => {
            setConnectionStatus(st);
            setIsSynced(st === 'subscribed');
          });
        },
        onCursors: (c) => {
          queueMicrotask(() => setCursors(c));
        },
        onMessage: handleMessage,
      }
    );

    setSelfKey(key);
    selfKeyRef.current = key;
    sendRef.current = send;
    publishRef.current = publishCursor;

    return () => {
      detachYjs();
      release();
    };
    // user identity updates via session user object; reconnect only on room change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, attachYjs, detachYjs]);

  useEffect(() => {
    if (connectionStatus !== 'subscribed') return;
    if (enableDocSync) attachYjs();
    else detachYjs();
  }, [enableDocSync, connectionStatus, attachYjs, detachYjs]);

  const publishCursor = useCallback(
    (cursor: { x: number; y: number } | null) => {
      const now = Date.now();
      if (now - lastCursorSentRef.current < OUTBOUND_CURSOR_MIN_MS) return;
      lastCursorSentRef.current = now;
      publishRef.current(cursor);
    },
    []
  );

  return {
    doc,
    isSynced,
    cursors,
    selfKey,
    connectionStatus,
    publishCursor,
  };
}
