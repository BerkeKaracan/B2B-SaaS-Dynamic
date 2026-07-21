'use client';

import { useCallback, useMemo } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useProjectEditMode } from '@/hooks/useProjectEditMode';

/**
 * Shared scope for boards that run both standalone and as Blank canvas pages.
 *
 * - Standalone: `projectId` is the record id → data in `metadata`
 * - Embedded: `projectId` is the page id → data in `page.settings`
 *
 * Never falls back to "first page of type" (that mis-binds multi-frame canvases).
 */
export function useBoardPersistence(projectId: string) {
  const { isReadonly } = useProjectEditMode();
  const metadata = useCanvasStore((s) => s.metadata);
  const pages = useCanvasStore((s) => s.pages);
  const updateMetadata = useCanvasStore((s) => s.updateMetadata);
  const updatePageSettings = useCanvasStore((s) => s.updatePageSettings);

  const canvasPage = useMemo(
    () => pages.find((p) => p.id === projectId),
    [pages, projectId]
  );

  const isPageScoped = !!canvasPage;

  const pageSettings = useMemo(
    () => (canvasPage?.settings || {}) as Record<string, unknown>,
    [canvasPage?.settings]
  );

  const dataSource = useMemo(
    () => (isPageScoped ? pageSettings : metadata),
    [isPageScoped, pageSettings, metadata]
  );

  const persist = useCallback(
    (partial: Record<string, unknown>) => {
      if (isReadonly) return;
      if (isPageScoped) {
        updatePageSettings(projectId, partial);
      } else {
        updateMetadata(partial);
      }
    },
    [isReadonly, isPageScoped, projectId, updatePageSettings, updateMetadata]
  );

  /**
   * One-shot migrate legacy top-level metadata keys into this frame when the
   * frame has no data yet and no other frame already owns those keys.
   */
  const migrateLegacyKeys = useCallback(
    (keys: string[]) => {
      if (!isPageScoped) return;
      const alreadyHas = keys.some((k) => pageSettings[k] !== undefined);
      if (alreadyHas) return;
      const hasLegacy = keys.some((k) => metadata[k] !== undefined);
      if (!hasLegacy) return;
      const otherOwns = pages.some((p) => {
        if (p.id === projectId) return false;
        const s = (p.settings || {}) as Record<string, unknown>;
        return keys.some((k) => s[k] !== undefined);
      });
      if (otherOwns) return;
      const patch: Record<string, unknown> = {};
      for (const k of keys) {
        if (metadata[k] !== undefined) patch[k] = metadata[k];
      }
      if (Object.keys(patch).length > 0) {
        updatePageSettings(projectId, patch);
      }
    },
    [
      isPageScoped,
      pageSettings,
      metadata,
      pages,
      projectId,
      updatePageSettings,
    ]
  );

  return {
    isReadonly,
    isPageScoped,
    canvasPage,
    pageSettings,
    metadata,
    dataSource,
    pages,
    persist,
    migrateLegacyKeys,
    updateMetadata,
    updatePageSettings,
  };
}
