'use client';

import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import {
  Connection,
  PageWithSettings,
  useCanvasStore,
} from '@/store/useCanvasStore';

/**
 * Incremental Zustand ↔ Yjs bridge.
 * Uses Y.Map keyed by id so a single page/block drag emits a small update —
 * never delete+reinsert the entire pages array (that melted Realtime before).
 *
 * Pass `null` when collab.canvas_sync is off — no-op, zero broadcast risk.
 */
export function useZustandYjsSync(ydoc: Y.Doc | null) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!ydoc) return;

    const yPages = ydoc.getMap<PageWithSettings>('canvas-pages');
    const yConnections = ydoc.getMap<Connection>('canvas-connections');

    const applyYjsToStore = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        const pages = Array.from(yPages.values());
        const connections = Array.from(yConnections.values());
        useCanvasStore.setState({ pages, connections });
      } finally {
        isSyncingRef.current = false;
      }
    };

    yPages.observe(applyYjsToStore);
    yConnections.observe(applyYjsToStore);

    let prevPages = useCanvasStore.getState().pages;
    let prevConnections = useCanvasStore.getState().connections;

    // Seed empty doc from local store once (join with existing canvas).
    if (yPages.size === 0 && prevPages.length > 0) {
      isSyncingRef.current = true;
      try {
        ydoc.transact(() => {
          for (const page of prevPages) {
            yPages.set(page.id, page);
          }
          for (const conn of prevConnections) {
            yConnections.set(conn.id, conn);
          }
        }, 'local-seed');
      } finally {
        isSyncingRef.current = false;
      }
    } else if (yPages.size > 0) {
      applyYjsToStore();
      prevPages = useCanvasStore.getState().pages;
      prevConnections = useCanvasStore.getState().connections;
    }

    const SYNC_DEBOUNCE_MS = 100;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushToYjs = () => {
      flushTimer = null;
      const state = useCanvasStore.getState();
      if (state.pages === prevPages && state.connections === prevConnections) {
        return;
      }

      const prevPageById = new Map(prevPages.map((p) => [p.id, p]));
      const prevConnById = new Map(prevConnections.map((c) => [c.id, c]));
      const nextPageIds = new Set(state.pages.map((p) => p.id));
      const nextConnIds = new Set(state.connections.map((c) => c.id));

      isSyncingRef.current = true;
      try {
        ydoc.transact(() => {
          for (const id of Array.from(yPages.keys())) {
            if (!nextPageIds.has(id)) yPages.delete(id);
          }
          for (const page of state.pages) {
            if (prevPageById.get(page.id) !== page) {
              yPages.set(page.id, page);
            }
          }

          for (const id of Array.from(yConnections.keys())) {
            if (!nextConnIds.has(id)) yConnections.delete(id);
          }
          for (const conn of state.connections) {
            if (prevConnById.get(conn.id) !== conn) {
              yConnections.set(conn.id, conn);
            }
          }
        }, 'local');
      } finally {
        prevPages = state.pages;
        prevConnections = state.connections;
        isSyncingRef.current = false;
      }
    };

    const unsubscribeZustand = useCanvasStore.subscribe((state) => {
      if (isSyncingRef.current) {
        prevPages = state.pages;
        prevConnections = state.connections;
        return;
      }
      if (state.pages === prevPages && state.connections === prevConnections) {
        return;
      }
      if (flushTimer == null) {
        flushTimer = setTimeout(flushToYjs, SYNC_DEBOUNCE_MS);
      }
    });

    return () => {
      yPages.unobserve(applyYjsToStore);
      yConnections.unobserve(applyYjsToStore);
      unsubscribeZustand();
      if (flushTimer != null) {
        clearTimeout(flushTimer);
        flushToYjs();
      }
    };
  }, [ydoc]);
}
