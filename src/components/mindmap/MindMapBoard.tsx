'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import { useTranslations } from 'next-intl';
import { GitBranch, Network } from 'lucide-react';
import type { MindNode } from './types';
import {
  SURFACE,
  LINK,
  connectionPath,
  getNodeCenter,
  getNodeDim,
  getNodeTier,
} from './mindmapStyles';
import MindMapNode from './MindMapNode';
import MindMapToolbar from './MindMapToolbar';

function MindMapBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('MindMapBoard');
  const containerRef = useRef<HTMLDivElement>(null);
  const { isReadonly, isPageScoped, dataSource, metadata, persist } =
    useBoardPersistence(projectId);

  const storedNodes = useMemo(() => {
    return (dataSource.mindmapNodes as MindNode[] | undefined) || undefined;
  }, [dataSource.mindmapNodes]);

  const persistNodes = useCallback(
    (next: MindNode[]) => {
      persist({ mindmapNodes: next });
    },
    [persist]
  );

  const [isMounted, setIsMounted] = useState(false);
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

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
                x: window.innerWidth / 2 - 98,
                y: window.innerHeight / 2 - 100,
                parentId: null,
                color: 'bg-sky-600',
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
      setJustAddedId(detail.id);
    };
    window.addEventListener('onAiMindmapNodeCreated', handleAiNode);
    return () =>
      window.removeEventListener('onAiMindmapNodeCreated', handleAiNode);
  }, [persistNodes, isPageScoped, projectId]);

  useEffect(() => {
    if (!justAddedId) return;
    const timer = window.setTimeout(() => setJustAddedId(null), 400);
    return () => window.clearTimeout(timer);
  }, [justAddedId]);

  const saveNodes = (newNodes: MindNode[]) => {
    setNodes(newNodes);
    persistNodes(newNodes);
  };

  const nodesById = useMemo(() => {
    const map = new Map<string, MindNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Store-free node drag: translate3d on the DOM node; setNodes + persist
  // only once on pointer-up (avoids re-rendering the whole board per move).
  const dragLastClientRef = useRef({ x: 0, y: 0 });
  const pendingDragClientRef = useRef<{ x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const nodeDragAccumRef = useRef({ dx: 0, dy: 0 });
  const nodeDragOriginRef = useRef({ x: 0, y: 0 });
  const nodesSnapshotRef = useRef<MindNode[]>([]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.mind-node')) return;
    setIsDraggingCanvas(true);
    dragLastClientRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    if (isReadonly) return;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    dragLastClientRef.current = { x: e.clientX, y: e.clientY };
    nodeDragAccumRef.current = { dx: 0, dy: 0 };
    nodeDragOriginRef.current = { x: node.x, y: node.y };
    nodesSnapshotRef.current = nodes;
  };

  const applyNodeDomDrag = (nodeId: string, dx: number, dy: number) => {
    const el = document.querySelector(
      `[data-mind-node-id="${nodeId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.style.willChange = 'transform';
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }

    const snap = nodesSnapshotRef.current;
    const byId = new Map(snap.map((n) => [n.id, n]));
    const dragged = byId.get(nodeId);
    if (!dragged) return;

    const live: MindNode = { ...dragged, x: dragged.x + dx, y: dragged.y + dy };
    const liveCenter = getNodeCenter(live, byId);

    if (dragged.parentId) {
      const path = document.querySelector(
        `[data-mind-line-id="${nodeId}"]`
      ) as SVGPathElement | null;
      if (path) {
        const parent = byId.get(dragged.parentId);
        if (parent) {
          const pc = getNodeCenter(parent, byId);
          path.setAttribute(
            'd',
            connectionPath(pc.x, pc.y, liveCenter.x, liveCenter.y)
          );
        }
      }
    }

    for (const child of snap) {
      if (child.parentId !== nodeId) continue;
      const path = document.querySelector(
        `[data-mind-line-id="${child.id}"]`
      ) as SVGPathElement | null;
      if (!path) continue;
      const childCenter = getNodeCenter(child, byId);
      path.setAttribute(
        'd',
        connectionPath(liveCenter.x, liveCenter.y, childCenter.x, childCenter.y)
      );
    }
  };

  const clearNodeDomDrag = (nodeId: string) => {
    const el = document.querySelector(
      `[data-mind-node-id="${nodeId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.style.transform = '';
      el.style.willChange = '';
    }
  };

  const flushDrag = () => {
    dragRafRef.current = null;
    const pt = pendingDragClientRef.current;
    if (!pt) return;
    pendingDragClientRef.current = null;

    const dx = pt.x - dragLastClientRef.current.x;
    const dy = pt.y - dragLastClientRef.current.y;
    if (dx === 0 && dy === 0) return;
    dragLastClientRef.current = { x: pt.x, y: pt.y };

    if (draggingNodeId) {
      const worldDx = dx / zoom;
      const worldDy = dy / zoom;
      nodeDragAccumRef.current.dx += worldDx;
      nodeDragAccumRef.current.dy += worldDy;
      applyNodeDomDrag(
        draggingNodeId,
        nodeDragAccumRef.current.dx,
        nodeDragAccumRef.current.dy
      );
    } else if (isDraggingCanvas) {
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingNodeId && !isDraggingCanvas) return;
    pendingDragClientRef.current = { x: e.clientX, y: e.clientY };
    if (dragRafRef.current == null) {
      dragRafRef.current = requestAnimationFrame(flushDrag);
    }
  };

  const handlePointerUp = () => {
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current);
      flushDrag();
    }
    if (draggingNodeId) {
      const { dx, dy } = nodeDragAccumRef.current;
      clearNodeDomDrag(draggingNodeId);
      if (dx !== 0 || dy !== 0) {
        const id = draggingNodeId;
        const next = nodesSnapshotRef.current.map((n) =>
          n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n
        );
        setNodes(next);
        persistNodes(next);
      }
      nodeDragAccumRef.current = { dx: 0, dy: 0 };
    }
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
  };

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom((z) => Math.min(2, Math.max(0.3, z + delta)));
        return;
      }
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    },
    []
  );

  const addChildNode = (parentId: string, parentX: number, parentY: number) => {
    if (isReadonly) return;
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
        color: 'bg-sky-50',
      },
    ]);
    setEditingNodeId(newId);
    setJustAddedId(newId);
  };

  const updateNodeText = (id: string, newText: string) => {
    if (isReadonly) return;
    saveNodes(nodes.map((n) => (n.id === id ? { ...n, text: newText } : n)));
  };

  const exportMindMapPng = useCallback(() => {
    if (nodes.length === 0) return;

    const pad = 56;
    const byId = new Map(nodes.map((n) => [n.id, n]));

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const dim = getNodeDim(node, byId);
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + dim.w);
      maxY = Math.max(maxY, node.y + dim.h);
    }

    const width = Math.max(320, maxX - minX + pad * 2);
    const height = Math.max(240, maxY - minY + pad * 2);
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = LINK.exportBg;
    ctx.fillRect(0, 0, width, height);

    // Soft grid
    ctx.strokeStyle = 'rgba(113,113,122,0.08)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 32) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    const ox = pad - minX;
    const oy = pad - minY;

    ctx.strokeStyle = LINK.strokeHexLight;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const node of nodes) {
      if (!node.parentId) continue;
      const parent = byId.get(node.parentId);
      if (!parent) continue;
      const pCenter = getNodeCenter(parent, byId);
      const cCenter = getNodeCenter(node, byId);
      const x1 = pCenter.x + ox;
      const y1 = pCenter.y + oy;
      const x2 = cCenter.x + ox;
      const y2 = cCenter.y + oy;
      const dx = Math.abs(x2 - x1);
      const tension = Math.max(48, Math.min(160, dx * 0.45));
      const c1x = x1 + (x2 >= x1 ? tension : -tension);
      const c2x = x2 - (x2 >= x1 ? tension : -tension);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(c1x, y1, c2x, y2, x2, y2);
      ctx.stroke();
    }

    for (const node of nodes) {
      const dim = getNodeDim(node, byId);
      const x = node.x + ox;
      const y = node.y + oy;
      const tier = getNodeTier(node, byId);
      const r = tier === 'root' ? 16 : 14;

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + dim.w, y, x + dim.w, y + dim.h, r);
      ctx.arcTo(x + dim.w, y + dim.h, x, y + dim.h, r);
      ctx.arcTo(x, y + dim.h, x, y, r);
      ctx.arcTo(x, y, x + dim.w, y, r);
      ctx.closePath();

      if (tier === 'root') {
        ctx.fillStyle = LINK.exportRootFill;
        ctx.fill();
        ctx.strokeStyle = LINK.exportRootStroke;
      } else if (tier === 'branch') {
        ctx.fillStyle = LINK.exportBranchFill;
        ctx.fill();
        ctx.strokeStyle = LINK.exportBranchStroke;
      } else {
        ctx.fillStyle = LINK.exportLeafFill;
        ctx.fill();
        ctx.strokeStyle = LINK.exportLeafStroke;
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      // Accent rail
      ctx.fillStyle =
        tier === 'root'
          ? 'rgba(255,255,255,0.35)'
          : tier === 'branch'
            ? '#0ea5e9'
            : '#06b6d4';
      ctx.fillRect(x, y + 4, 5, dim.h - 8);

      ctx.fillStyle =
        tier === 'root' ? LINK.exportRootText : LINK.exportBranchText;
      ctx.font =
        tier === 'root'
          ? '600 14px system-ui, sans-serif'
          : '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = (node.text || 'Untitled').slice(0, 24);
      ctx.fillText(label, x + dim.w / 2 + 2, y + dim.h / 2, dim.w - 22);
    }

    const fileBase =
      typeof metadata.name === 'string' && metadata.name.trim()
        ? metadata.name
            .trim()
            .replace(/[^\w\-]+/g, '_')
            .slice(0, 48)
        : 'mindmap';
    const link = document.createElement('a');
    link.download = `${fileBase}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [nodes, metadata.name]);

  if (!isMounted) return null;

  const showEmptyHint = nodes.length <= 1;
  const branchCount = Math.max(0, nodes.length - 1);
  const gridSize = 28 * zoom;

  return (
    <div
      className={`absolute inset-0 flex flex-col h-full min-h-0 overflow-hidden transition-colors duration-300 ${SURFACE.stage}`}
    >
      <div className="flex-1 relative w-full h-full min-h-0 p-2.5 sm:p-3.5 md:p-4">
        <div
          className={`absolute inset-2.5 sm:inset-3.5 md:inset-4 rounded-2xl overflow-hidden border border-zinc-300/70 dark:border-zinc-700/80 ${SURFACE.paper}`}
        >
          {/* Canvas grid — pans/zooms with viewport */}
          <div
            className="absolute inset-0 opacity-[0.55] dark:opacity-[0.35] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px),
                radial-gradient(rgba(113,113,122,0.28) 0.9px, transparent 0.9px)
              `,
              backgroundSize: `${gridSize * 1.6}px ${gridSize * 1.6}px, ${gridSize * 1.6}px ${gridSize * 1.6}px, ${gridSize}px ${gridSize}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />
          {/* Soft vignette */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-70"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 52%, rgba(24,24,27,0.07) 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.32) 100%)',
            }}
          />

          <div
            ref={containerRef}
            className={`absolute inset-0 outline-none ${
              isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
          >
            {showEmptyHint && (
              <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none animate-in fade-in duration-500">
                <div className="text-center px-6 max-w-sm">
                  <div className="relative mx-auto mb-3 w-12 h-12">
                    <div className="absolute inset-0 rounded-2xl bg-sky-400/20 blur-md animate-pulse" />
                    <div className="relative w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-sm">
                      <Network className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 tracking-tight">
                    {t('emptyTitle')}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">
                    {t('emptyHint')}
                  </p>
                </div>
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
                  const parent = nodesById.get(node.parentId);
                  if (!parent) return null;
                  const start = getNodeCenter(parent, nodesById);
                  const end = getNodeCenter(node, nodesById);
                  return (
                    <path
                      key={`line-${node.id}`}
                      data-mind-line-id={node.id}
                      d={connectionPath(start.x, start.y, end.x, end.y)}
                      className={`fill-none ${LINK.strokeClass}`}
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
                <MindMapNode
                  key={node.id}
                  node={node}
                  tier={getNodeTier(node, nodesById)}
                  isDragging={draggingNodeId === node.id}
                  isEditing={editingNodeId === node.id}
                  isJustAdded={justAddedId === node.id}
                  isReadonly={isReadonly}
                  labels={{
                    dragNode: t('dragNode'),
                    addNode: t('addNode'),
                    typePlaceholder: t('typePlaceholder'),
                  }}
                  onPointerDown={handleNodePointerDown}
                  onStartEdit={setEditingNodeId}
                  onEndEdit={() => setEditingNodeId(null)}
                  onChangeText={updateNodeText}
                  onAddChild={addChildNode}
                />
              ))}
            </div>

            {/* Status chip */}
            <div className="absolute bottom-4 left-4 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className={SURFACE.chip}>
                <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.18)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {t('statusLabel')}
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums">
                  · {t('nodeCount', { count: nodes.length })}
                </span>
                {branchCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                    <GitBranch size={10} />
                    {t('branchCount', { count: branchCount })}
                  </span>
                )}
                {isReadonly && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                    · {t('readonlyBadge')}
                  </span>
                )}
              </div>
            </div>

            <MindMapToolbar
              zoom={zoom}
              labels={{
                zoomIn: t('zoomIn'),
                zoomOut: t('zoomOut'),
                resetZoom: t('resetZoom'),
                exportMap: t('exportMap'),
              }}
              onZoomIn={() => setZoom((z) => Math.min(2, z + 0.1))}
              onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              onResetZoom={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              onExport={exportMindMapPng}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(MindMapBoard);
