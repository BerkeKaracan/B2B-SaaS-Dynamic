'use client';

import { ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import { SURFACE } from './mindmapStyles';

type MindMapToolbarProps = {
  zoom: number;
  labels: {
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    exportMap: string;
  };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onExport: () => void;
};

export default function MindMapToolbar({
  zoom,
  labels,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExport,
}: MindMapToolbarProps) {
  return (
    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className={`flex items-center gap-0.5 rounded-xl p-0.5 ${SURFACE.chrome}`}
      >
        <button
          type="button"
          onClick={onZoomOut}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
          title={labels.zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300 w-11 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
          title={labels.zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
        <button
          type="button"
          onClick={onResetZoom}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
          title={labels.resetZoom}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={onExport}
        className={`p-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors ${SURFACE.chrome}`}
        title={labels.exportMap}
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}
