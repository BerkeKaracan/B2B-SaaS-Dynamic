import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import {
  PageWithSettings,
  Connection,
  useCanvasStore,
} from '@/store/useCanvasStore';

export function useZustandYjsSync(ydoc: Y.Doc | null) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!ydoc) return;

    const yPages = ydoc.getArray('canvas-pages');
    const yConnections = ydoc.getArray('canvas-connections');

    const handleYjsUpdate = () => {
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      try {
        const pagesData = yPages.toArray();
        const connectionsData = yConnections.toArray();

        if (pagesData.length > 0 || connectionsData.length > 0) {
          useCanvasStore.setState({
            pages: pagesData as PageWithSettings[],
            connections: connectionsData as Connection[],
          });
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    yPages.observeDeep(handleYjsUpdate);
    yConnections.observeDeep(handleYjsUpdate);

    let prevPages = useCanvasStore.getState().pages;
    let prevConnections = useCanvasStore.getState().connections;

    // The store→Yjs write is a full delete+insert of the pages array plus a
    // broadcast; doing it per keystroke/drag-frame froze big canvases. Batch
    // it: at most one re-sync per SYNC_DEBOUNCE_MS, always with latest state.
    const SYNC_DEBOUNCE_MS = 120;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushToYjs = () => {
      flushTimer = null;
      const state = useCanvasStore.getState();
      if (state.pages === prevPages && state.connections === prevConnections)
        return;

      isSyncingRef.current = true;
      try {
        ydoc.transact(() => {
          if (state.pages !== prevPages) {
            yPages.delete(0, yPages.length);
            yPages.insert(0, state.pages);
          }
          if (state.connections !== prevConnections) {
            yConnections.delete(0, yConnections.length);
            yConnections.insert(0, state.connections);
          }
        });
      } finally {
        prevPages = state.pages;
        prevConnections = state.connections;
        isSyncingRef.current = false;
      }
    };

    const unsubscribeZustand = useCanvasStore.subscribe((state) => {
      if (isSyncingRef.current) {
        // Change originated from Yjs — already in sync; without this the next
        // unrelated store write re-echoed the whole remote payload.
        prevPages = state.pages;
        prevConnections = state.connections;
        return;
      }
      if (state.pages === prevPages && state.connections === prevConnections)
        return;
      if (flushTimer == null) {
        flushTimer = setTimeout(flushToYjs, SYNC_DEBOUNCE_MS);
      }
    });

    return () => {
      yPages.unobserveDeep(handleYjsUpdate);
      yConnections.unobserveDeep(handleYjsUpdate);
      unsubscribeZustand();
      if (flushTimer != null) {
        clearTimeout(flushTimer);
        flushToYjs();
      }
    };
  }, [ydoc]);
}
