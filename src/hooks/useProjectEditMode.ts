'use client';

import { useCanvasStore } from '@/store/useCanvasStore';

/** Shared Edit/View (design/readonly) flag for project templates. */
export function useProjectEditMode() {
  const mode = useCanvasStore((state) => state.mode);
  const isReadonly = mode === 'readonly';
  return {
    mode,
    isReadonly,
    canEdit: !isReadonly,
  };
}
