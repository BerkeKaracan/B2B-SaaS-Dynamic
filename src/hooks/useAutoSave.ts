'use client';
import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';

export function useAutoSave(tenantId: string, recordId: string | null) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!recordId || !tenantId) return;

    isInitialLoad.current = true;
    const initTimer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 1000);

    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      if (isInitialLoad.current) return;
      const hasDataChanged =
        state.pages !== prevState.pages ||
        state.connections !== prevState.connections ||
        state.metadata !== prevState.metadata ||
        state.title !== prevState.title ||
        state.description !== prevState.description;

      if (hasDataChanged) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          useCanvasStore.getState().saveProject(tenantId);
        }, 1500);
      }
    });

    return () => {
      unsubscribe(); 
      clearTimeout(initTimer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tenantId, recordId]);
}
