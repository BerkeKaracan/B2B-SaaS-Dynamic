'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Network,
  ZoomIn,
  ZoomOut,
  Download,
  GripHorizontal,
} from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';

type MindNode = {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  color?: string;
  page_id?: string;
};

export default function MindMapBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('MindMapBoard');
  const containerRef = useRef<HTMLDivElement>(null);
  const metadata = useCanvasStore((s) => s.metadata);
  const pages = useCanvasStore((s) => s.pages);
  const updateMetadata = useCanvasStore((s) => s.updateMetadata);
  const updatePageSettings = useCanvasStore((s) => s.updatePageSettings);

  // Standalone mindmap project → global metadata; frame on the infinite canvas
  // → that page's own settings (keyed by page.id) so frames stay isolated.
  const canvasPage = useMemo(
    () => pages.find((p) => p.id === projectId),
    [pages, projectId]
  );
  const isPageScoped = !!canvasPage;
  const storedNodes = useMemo(() => {
    const raw = isPageScoped
      ? ((canvasPage?.settings || {}) as Record<string, unknown>).mindmapNodes
      : metadata.mindmapNodes;
    return (raw as MindNode[] | undefined) || undefined;
  }, [isPageScoped, canvasPage?.settings, metadata.mindmapNodes]);

  const persistNodes = useCallback(
    (next: MindNode[]) => {
      if (isPageScoped) {
        updatePageSettings(projectId, { mindmapNodes: next });
      } else {
        updateMetadata({ mindmapNodes: next });
      }
    },
    [isPageScoped, projectId, updatePageSettings, updateMetadata]
  );

  const [isMounted, setIsMounted] = useState(false);
  const [nodes, setNodes] = useState<MindNode[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (storedNodes && storedNodes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodes(storedNodes);
    }
  }, [storedNodes, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (!storedNodes || storedNodes.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodes((prev) =>
        prev.length > 0
          ? prev
          : [
              {
                id: 'root',
                text: t('centralIdea'),
                x: window.innerWidth / 2 - 100,
                y: window.innerHeight / 2 - 100,
                parentId: null,
                color: 'bg-zinc-900',
              },
            ]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Live bridge: AI chat may append nodes while local state already has a root.
  useEffect(() => {
    const handleAiNode = (event: Event) => {
      const detail = (event as CustomEvent<MindNode>).detail;
      if (!detail?.id || !detail?.text) return;
      // On the infinite canvas, only the targeted frame reacts.
      if (isPageScoped && detail.page_id && detail.page_id !== projectId) {
        return;
      }
      setNodes((prev) => {
        if (prev.some((n) => n.id === detail.id)) return prev;
        const next = [...prev, detail];
        persistNodes(next);
        return next;
      });
    };
    window.addEventListener('onAiMindmapNodeCreated', handleAiNode);
    return () =>
      window.removeEventListener('onAiMindmapNodeCreated', handleAiNode);
  }, [persistNodes, isPageScoped, projectId]);

  const saveNodes = (newNodes: MindNode[]) => {
    setNodes(newNodes);
    persistNodes(newNodes);
  };

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.mind-node')) return;
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      saveNodes(
        nodes.map((n) =>
          n.id === draggingNodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n
        )
      );
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDraggingCanvas) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
  };

  const addChildNode = (parentId: string, parentX: number, parentY: number) => {
    const newId = `node-${Date.now()}`;
    const siblingsCount = nodes.filter((n) => n.parentId === parentId).length;
    const angle = siblingsCount * 45 * (Math.PI / 180);
    const radius = 220;

    const newX = parentX + radius * Math.cos(angle);
    const newY = parentY + radius * Math.sin(angle);

    saveNodes([
      ...nodes,
      {
        id: newId,
        text: t('newNode') || 'New Idea',
        x: newX,
        y: newY,
        parentId,
        color: 'bg-white dark:bg-zinc-800',
      },
    ]);
    setEditingNodeId(newId);
  };

  const updateNodeText = (id: string, newText: string) => {
    saveNodes(nodes.map((n) => (n.id === id ? { ...n, text: newText } : n)));
  };

  if (!isMounted) return null;

  const showEmptyHint = nodes.length <= 1;

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent overflow-hidden transition-colors duration-300">
      <div className="h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            {typeof metadata.name === 'string' && metadata.name
              ? metadata.name
              : t('title')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors"
              title={t('zoomOut')}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300 w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors"
              title={t('zoomIn')}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <button
            type="button"
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={t('exportMap')}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 w-full h-full relative overflow-hidden outline-none ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute inset-0 opacity-[0.18] dark:opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#71717a 1.25px, transparent 1.25px)',
            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {showEmptyHint && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-5 pointer-events-none text-center px-4">
            <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 tracking-tight">
              {t('emptyTitle')}
            </p>
            <p className="mt-1 text-[11px] font-medium text-zinc-400/90 dark:text-zinc-600 leading-relaxed max-w-xs">
              {t('emptyHint')}
            </p>
          </div>
        )}

        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {nodes.map((node) => {
              if (!node.parentId) return null;
              const parent = nodes.find((n) => n.id === node.parentId);
              if (!parent) return null;

              const startX = parent.x + 80;
              const startY = parent.y + 24;
              const endX = node.x + 80;
              const endY = node.y + 24;

              return (
                <line
                  key={`line-${node.id}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  className="stroke-zinc-300 dark:stroke-zinc-600"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        </svg>

        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              className="mind-node absolute flex items-center justify-center group pointer-events-auto"
              style={{ left: node.x, top: node.y }}
            >
              <div
                className={`relative px-4 py-3 rounded-xl shadow-sm border-2 transition-all w-40 flex items-center justify-center
                  ${
                    draggingNodeId === node.id
                      ? 'scale-105 shadow-md z-50 ring-2 ring-zinc-400/30 dark:ring-zinc-500/30'
                      : 'hover:border-zinc-400 dark:hover:border-zinc-500'
                  }
                  ${
                    node.parentId === null
                      ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-900'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                  }`}
              >
                <div
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                  className="absolute -top-3 right-2 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  title={t('dragNode')}
                >
                  <GripHorizontal size={12} />
                </div>

                {editingNodeId === node.id ? (
                  <input
                    autoFocus
                    value={node.text}
                    onChange={(e) => updateNodeText(node.id, e.target.value)}
                    onBlur={() => setEditingNodeId(null)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setEditingNodeId(null)
                    }
                    className="w-full bg-transparent text-center font-semibold text-sm outline-none"
                    placeholder={t('typePlaceholder')}
                  />
                ) : (
                  <span
                    onClick={() => setEditingNodeId(node.id)}
                    className="font-semibold text-sm text-center truncate w-full cursor-default select-none"
                  >
                    {node.text}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addChildNode(node.id, node.x, node.y);
                }}
                className="absolute -left-3 -bottom-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-900 hover:border-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:border-zinc-100 dark:hover:text-zinc-900 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20"
                title={t('addNode')}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
