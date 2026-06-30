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

    const unsubscribeZustand = useCanvasStore.subscribe((state) => {
      if (isSyncingRef.current) return;
      if (state.pages !== prevPages || state.connections !== prevConnections) {
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
      }
    });

    return () => {
      yPages.unobserveDeep(handleYjsUpdate);
      yConnections.unobserveDeep(handleYjsUpdate);
      unsubscribeZustand();
    };
  }, [ydoc]);
}
