'use client';
import React, {
  useRef,
  useState,
  useEffect,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
} from 'react';
import { useParams } from 'next/navigation';
import { useCanvasStore, PageWithSettings } from '@/store/useCanvasStore';
import { BlockContent, BlockType, PageContent } from '@/types/record';
import { getBlockDefaultHeight } from '@/lib/blockConfig';
import { ConnectionLayer, ConnectionPreviewLayer } from './ConnectionLayer';
import { CanvasPassiveLayers } from './CanvasPassiveLayers';
import { LassoLayer } from './LassoLayer';
import { fetchAPI } from '@/services/api';

import TextBlock from './TextBlock';
import FormBlock from './FormBlock';
import DateBlock from './DateBlock';
import DropdownBlock from './DropdownBlock';
import ToggleSwitchBlock from './ToggleSwitchBlock';
import BadgeSelectorBlock from './BadgeSelectorBlock';
import AssetStreamBlock from './AssetStreamBlock';
import BlockResizer from './BlockResizer';
import StaticKanbanBoard from '@/components/kanban/StaticKanbanBoard';
import { Sparkles, Minus, Plus, Maximize, MousePointer2 } from 'lucide-react';

import NotepadBoard from '@/components/notepad/NotepadBoard';
import WhiteboardBoard from '@/components/whiteboard/WhiteBoard';
import MindMapBoard from '@/components/mindmap/MindMapBoard';
import TimelineBoard from '@/components/timeline/TimelineBoard';
import DatabaseBoard from '@/components/database/DatabaseBoard';
import RetrospectiveBoard from '@/components/retrospective/RetrospectiveBoard';

import { useCanvasCollaboration } from '@/hooks/useCanvasCollaboration';
import { useZustandYjsSync } from '@/hooks/useZustandYjsSync';
import { useCanvasNavigation } from '@/hooks/useCanvasNavigation';
import {
  useVisibleWorldRect,
  rectsIntersect,
} from '@/hooks/useVisibleWorldRect';
import { LiveCursors } from '../LiveCursors';

const MIN_ZOOM = 10;
const MAX_ZOOM = 400;

/**
 * Board pages own client state / fetched data — never unmount them for
 * culling (remount would refetch). They are hidden with visibility+contain.
 */
const BOARD_PAGE_TYPES = new Set([
  'kanban',
  'notes',
  'document',
  'whiteboard',
  'mindmap',
  'timeline',
  'database',
  'retrospective',
]);

/** Content can overflow page.height (it is a minHeight) — cull generously. */
const PAGE_CULL_HEIGHT_FACTOR = 1.5;
const BLOCK_CULL_PAD = 100;

type CanvasWorldProps = {
  pages: PageWithSettings[];
  connections: ReturnType<typeof useCanvasStore.getState>['connections'];
  renderedPages: React.ReactNode;
  onRemoveConnection: (id: string) => void;
};

/**
 * Isolated from pan/zoom so viewport transforms do not re-reconcile
 * pages/blocks. High-frequency layers (live cursors, lasso, connection
 * preview) render as siblings — passing them through here as props broke
 * this memo up to 60 times per second.
 */
const CanvasWorld = React.memo(function CanvasWorld({
  connections,
  pages,
  renderedPages,
  onRemoveConnection,
}: CanvasWorldProps) {
  return (
    <>
      <ConnectionLayer
        connections={connections}
        pages={pages}
        onRemoveConnection={onRemoveConnection}
      />
      {renderedPages}
    </>
  );
});

export default function CanvasArea() {
  const mode = useCanvasStore((s) =>
    'mode' in s ? (s as { mode: string }).mode : 'design'
  );

  const params = useParams();
  const routeProjectId = params?.projectId as string;
  const tenantId = params?.tenantId as string | undefined;
  const [hasLoadedPos, setHasLoadedPos] = useState(false);

  const pages = useCanvasStore((s) => s.pages) as PageWithSettings[];
  const connections = useCanvasStore((s) => s.connections);
  const activePageId = useCanvasStore((s) => s.activePageId);
  const activeBlockId = useCanvasStore((s) => s.activeBlockId);
  const selectedBlocks = useCanvasStore((s) => s.selectedBlocks);
  const zoom = useCanvasStore((s) => s.zoom);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const isLoading = useCanvasStore((s) => s.isLoading);

  const [currentUser, setCurrentUser] = useState({
    name: 'Syncing User...',
    color: '#ef4444',
  });

  useEffect(() => {
    const randomNum = Math.floor(Math.random() * 1000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUser({
      name: `Test User ${randomNum}`,
      color: randomNum % 2 === 0 ? '#ef4444' : '#10b981',
    });
  }, []);

  const projectId = activePageId || 'default-room';
  const { doc, provider, cursors } = useCanvasCollaboration(
    projectId,
    currentUser
  );

  useZustandYjsSync(doc);

  const addBlockToPage = useCanvasStore((s) => s.addBlockToPage);
  const updateBlockValue = useCanvasStore((s) => s.updateBlockValue);
  const updateBlockSettings = useCanvasStore((s) => s.updateBlockSettings);
  const setActivePage = useCanvasStore((s) => s.setActivePage);
  const setActiveBlock = useCanvasStore((s) => s.setActiveBlock);
  const setSelectedBlocks = useCanvasStore((s) => s.setSelectedBlocks);
  const removeSelectedBlocks = useCanvasStore((s) => s.removeSelectedBlocks);
  const removePage = useCanvasStore((s) => s.removePage);
  const removeBlockFromPage = useCanvasStore((s) => s.removeBlockFromPage);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);
  const updatePagePosition = useCanvasStore((s) => s.updatePagePosition);
  const updateBlockPosition = useCanvasStore((s) => s.updateBlockPosition);
  const updatePageDimensions = useCanvasStore((s) => s.updatePageDimensions);
  const updatePageTitle = useCanvasStore((s) => s.updatePageTitle);
  const updatePageSettings = useCanvasStore((s) => s.updatePageSettings);
  const addConnection = useCanvasStore((s) => s.addConnection);
  const removeConnection = useCanvasStore((s) => s.removeConnection);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const saveHistory = useCanvasStore((s) => s.saveHistory);
  const duplicateBlock = useCanvasStore((s) => s.duplicateBlock);
  const transferBlockToPage = useCanvasStore((s) => s.transferBlockToPage);
  const addGeneratedBlocks = useCanvasStore((s) => s.addGeneratedBlocks);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const spacePanRafRef = useRef<number | null>(null);
  const pinchRafRef = useRef<number | null>(null);
  const pendingSpaceDeltaRef = useRef({ x: 0, y: 0 });
  const pendingPinchDeltaRef = useRef(0);
  const lastSpaceClientRef = useRef({ x: 0, y: 0 });

  useCanvasNavigation(containerRef, {
    transformRef,
    gridRef,
  });

  // Viewport culling: quantized world rect (stable ref during small pans)
  const visibleRect = useVisibleWorldRect(containerRef);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);
  const [aiMenu, setAiMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [clipboardBlock, setClipboardBlock] = useState<{
    pageId: string;
    blockId: string;
  } | null>(null);

  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{
    pageId: string;
    blockId: string;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [resizingPageId, setResizingPageId] = useState<string | null>(null);
  const [resizeConfig, setResizeConfig] = useState<{
    edge: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startPageX: number;
    startPageY: number;
  } | null>(null);

  const [connectingFrom, setConnectingFrom] = useState<{
    pageId: string;
    blockId: string;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(
    null
  );

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);

  const activePointers = useRef<
    Map<number, { clientX: number; clientY: number }>
  >(new Map());
  const prevTouchDistance = useRef<number | null>(null);

  useEffect(() => {
    if (!routeProjectId || typeof window === 'undefined') return;

    const savedZoom = localStorage.getItem(`canvas_zoom_${routeProjectId}`);
    const savedPanX = localStorage.getItem(`canvas_panX_${routeProjectId}`);
    const savedPanY = localStorage.getItem(`canvas_panY_${routeProjectId}`);

    if (savedZoom) setZoom(parseFloat(savedZoom));
    if (savedPanX && savedPanY)
      setPan(parseFloat(savedPanX), parseFloat(savedPanY));

    setTimeout(() => setHasLoadedPos(true), 100);
  }, [routeProjectId, setZoom, setPan]);

  useEffect(() => {
    if (!hasLoadedPos || !routeProjectId || typeof window === 'undefined')
      return;

    const timeout = setTimeout(() => {
      localStorage.setItem(`canvas_zoom_${routeProjectId}`, zoom.toString());
      localStorage.setItem(`canvas_panX_${routeProjectId}`, panX.toString());
      localStorage.setItem(`canvas_panY_${routeProjectId}`, panY.toString());
    }, 500);

    return () => clearTimeout(timeout);
  }, [zoom, panX, panY, routeProjectId, hasLoadedPos]);

  const handleAiGenerate = async () => {
    if (
      !activePageId ||
      !aiMenu ||
      !aiPrompt.trim() ||
      mode === 'readonly' ||
      !tenantId
    )
      return;
    setIsAiGenerating(true);

    try {
      const res = await fetchAPI('/api/ai/generate-canvas', {
        method: 'POST',
        body: JSON.stringify({
          prompt: aiPrompt,
          x: aiMenu.canvasX,
          y: aiMenu.canvasY,
          tenant_id: tenantId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.blocks && Array.isArray(data.blocks) && addGeneratedBlocks) {
          addGeneratedBlocks(activePageId, data.blocks);
        }
      }
    } catch (e) {
      console.error('AI Generation failed', e);
    } finally {
      setIsAiGenerating(false);
      setAiMenu(null);
      setAiPrompt('');
    }
  };

  useEffect(() => {
    if (!provider) return;
    let lastTrackTime = 0;
    const throttleDelay = 50;

    const handleMouseMove = (e: PointerEvent) => {
      const now = Date.now();
      if (now - lastTrackTime >= throttleDelay) {
        const currentStore = useCanvasStore.getState();
        const currentZoom = (currentStore.zoom ?? 100) / 100;
        const rect = containerRef.current?.getBoundingClientRect() || {
          left: 0,
          top: 0,
        };
        const mouseCanvasX =
          (e.clientX - rect.left - (currentStore.panX ?? 0)) / currentZoom;
        const mouseCanvasY =
          (e.clientY - rect.top - (currentStore.panY ?? 0)) / currentZoom;

        provider.send({
          type: 'broadcast',
          event: 'cursor-move',
          payload: {
            userKey: currentUser.name,
            cursor: { x: mouseCanvasX, y: mouseCanvasY },
          },
        });
        lastTrackTime = now;
      }
    };

    window.addEventListener('pointermove', handleMouseMove);
    return () => window.removeEventListener('pointermove', handleMouseMove);
  }, [provider, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInputActive =
        activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName);

      if (!isInputActive) {
        if (e.code === 'Space' && !e.repeat) {
          e.preventDefault();
          setIsSpacePressed(true);
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          const state = useCanvasStore.getState();
          if (state.activeBlockId && state.activePageId) {
            setClipboardBlock({
              pageId: state.activePageId,
              blockId: state.activeBlockId,
            });
          }
        }

        const storeState = useCanvasStore.getState();
        const currentMode =
          'mode' in storeState
            ? (storeState as { mode: string }).mode
            : 'design';

        if (
          (e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === 'v' &&
          clipboardBlock
        ) {
          if (currentMode === 'readonly') return;
          duplicateBlock(clipboardBlock.pageId, clipboardBlock.blockId, 40, 40);
        }

        if (e.ctrlKey || e.metaKey) {
          if (e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (currentMode === 'readonly') return;
            if (e.shiftKey) redo();
            else undo();
          } else if (e.key.toLowerCase() === 'y') {
            e.preventDefault();
            if (currentMode === 'readonly') return;
            redo();
          }
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          if (currentMode === 'readonly') return;
          const currentState = useCanvasStore.getState();
          if (currentState.selectedBlocks?.length > 0) {
            removeSelectedBlocks();
          } else {
            const pId = currentState.activePageId;
            const bId = currentState.activeBlockId;
            if (pId && bId) removeBlockFromPage(pId, bId);
            else if (pId && !bId) removePage(pId);
          }
        }

        if (e.key === 'Escape') {
          setConnectingFrom(null);
          setContextMenu(null);
          setAiMenu(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsSpacePanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    undo,
    redo,
    removePage,
    removeBlockFromPage,
    removeSelectedBlocks,
    clipboardBlock,
    duplicateBlock,
  ]);

  useEffect(() => {
    // One store write per frame for lasso / page-block drag / resize /
    // connection preview (raw pointermove events fire far above 60Hz).
    let interactionRaf: number | null = null;
    let pendingInteractionPointer: { clientX: number; clientY: number } | null =
      null;

    const flushInteraction = () => {
      interactionRaf = null;
      const pt = pendingInteractionPointer;
      pendingInteractionPointer = null;
      if (!pt) return;

      const state = useCanvasStore.getState();
      const currentZoom = (state.zoom ?? 100) / 100;
      const container = containerRef.current;
      const rect = container
        ? container.getBoundingClientRect()
        : { left: 0, top: 0 };
      const mouseCanvasX =
        (pt.clientX - rect.left - (state.panX ?? 0)) / currentZoom;
      const mouseCanvasY =
        (pt.clientY - rect.top - (state.panY ?? 0)) / currentZoom;

      if (connectingFrom) {
        setMousePos({ x: mouseCanvasX, y: mouseCanvasY });
      }

      if (lassoStart) {
        setLassoEnd({ x: mouseCanvasX, y: mouseCanvasY });
        const minX = Math.min(lassoStart.x, mouseCanvasX);
        const maxX = Math.max(lassoStart.x, mouseCanvasX);
        const minY = Math.min(lassoStart.y, mouseCanvasY);
        const maxY = Math.max(lassoStart.y, mouseCanvasY);

        const newSelected: string[] = [];
        state.pages.forEach((page) => {
          page.blocks.forEach((block) => {
            const bx = page.x + block.x;
            const by = page.y + block.y;
            const bw = block.width || 320;
            if (bx < maxX && bx + bw > minX && by < maxY && by + 150 > minY)
              newSelected.push(block.id);
          });
        });
        // Unchanged selection → skip the store write (it is a dep of the
        // renderedPages memo; a fresh array re-reconciled every page).
        const prevSelected = state.selectedBlocks;
        const sameSelection =
          prevSelected.length === newSelected.length &&
          newSelected.every((id, i) => id === prevSelected[i]);
        if (!sameSelection) setSelectedBlocks(newSelected);
      } else if (draggedPageId) {
        updatePagePosition(
          draggedPageId,
          mouseCanvasX - dragOffset.x,
          mouseCanvasY - dragOffset.y
        );
      } else if (draggedBlockInfo) {
        const targetPage = state.pages.find(
          (p) => p.id === draggedBlockInfo.pageId
        );
        if (targetPage) {
          updateBlockPosition(
            draggedBlockInfo.pageId,
            draggedBlockInfo.blockId,
            mouseCanvasX - targetPage.x - dragOffset.x,
            mouseCanvasY - targetPage.y - dragOffset.y
          );
        }
      } else if (resizingPageId && resizeConfig) {
        const deltaX = (pt.clientX - resizeConfig.startX) / currentZoom;
        const deltaY = (pt.clientY - resizeConfig.startY) / currentZoom;

        let newW = resizeConfig.startW;
        let newH = resizeConfig.startH;
        let newX = resizeConfig.startPageX;
        let newY = resizeConfig.startPageY;

        const edge = resizeConfig.edge;

        if (edge.includes('r')) {
          newW = Math.max(300, resizeConfig.startW + deltaX);
        }
        if (edge.includes('l')) {
          const possibleW = resizeConfig.startW - deltaX;
          if (possibleW >= 300) {
            newW = possibleW;
            newX = resizeConfig.startPageX + deltaX;
          }
        }
        if (edge.includes('b')) {
          newH = Math.max(300, resizeConfig.startH + deltaY);
        }
        if (edge.includes('t')) {
          const possibleH = resizeConfig.startH - deltaY;
          if (possibleH >= 300) {
            newH = possibleH;
            newY = resizeConfig.startPageY + deltaY;
          }
        }

        updatePageDimensions(resizingPageId, newW, newH);
        if (
          newX !== resizeConfig.startPageX ||
          newY !== resizeConfig.startPageY
        ) {
          updatePagePosition(resizingPageId, newX, newY);
        }
      }
    };

    const handleGlobalPointerMove = (e: globalThis.PointerEvent) => {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, {
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }

      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dx = pts[0].clientX - pts[1].clientX;
        const dy = pts[0].clientY - pts[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (prevTouchDistance.current !== null) {
          const delta = distance - prevTouchDistance.current;
          if (Math.abs(delta) > 1) {
            pendingPinchDeltaRef.current += delta;
            if (pinchRafRef.current == null) {
              pinchRafRef.current = requestAnimationFrame(() => {
                pinchRafRef.current = null;
                const pinchDelta = pendingPinchDeltaRef.current;
                pendingPinchDeltaRef.current = 0;
                if (Math.abs(pinchDelta) < 0.5) return;

                const container = containerRef.current;
                if (!container) return;

                const livePts = Array.from(activePointers.current.values());
                if (livePts.length < 2) return;

                const currentStore = useCanvasStore.getState();
                const oldZoom = currentStore.zoom ?? 100;
                const oldPanX = currentStore.panX ?? 0;
                const oldPanY = currentStore.panY ?? 0;

                const zoomFactor = Math.exp(pinchDelta * 0.004);
                const nextZoom = Math.max(
                  MIN_ZOOM,
                  Math.min(MAX_ZOOM, oldZoom * zoomFactor)
                );
                if (nextZoom === oldZoom) return;

                const rect = container.getBoundingClientRect();
                // Zoom around the midpoint between the two fingers.
                const midX =
                  (livePts[0].clientX + livePts[1].clientX) / 2 - rect.left;
                const midY =
                  (livePts[0].clientY + livePts[1].clientY) / 2 - rect.top;
                const scale = oldZoom / 100;
                const nextScale = nextZoom / 100;
                const nextPanX = midX - ((midX - oldPanX) / scale) * nextScale;
                const nextPanY = midY - ((midY - oldPanY) / scale) * nextScale;

                if (transformRef.current) {
                  transformRef.current.style.transform = `translate3d(${nextPanX}px, ${nextPanY}px, 0) scale(${nextScale})`;
                }
                if (gridRef.current) {
                  const cell = 40 * nextScale;
                  gridRef.current.style.backgroundSize = `${cell}px ${cell}px`;
                  gridRef.current.style.backgroundPosition = `${nextPanX}px ${nextPanY}px`;
                }

                useCanvasStore.setState({
                  zoom: nextZoom,
                  panX: nextPanX,
                  panY: nextPanY,
                });
              });
            }
          }
        }
        prevTouchDistance.current = distance;
        return;
      }

      if (isSpacePanning) {
        pendingSpaceDeltaRef.current.x +=
          e.clientX - lastSpaceClientRef.current.x;
        pendingSpaceDeltaRef.current.y +=
          e.clientY - lastSpaceClientRef.current.y;
        lastSpaceClientRef.current = { x: e.clientX, y: e.clientY };

        if (spacePanRafRef.current == null) {
          spacePanRafRef.current = requestAnimationFrame(() => {
            spacePanRafRef.current = null;
            const { x: dx, y: dy } = pendingSpaceDeltaRef.current;
            pendingSpaceDeltaRef.current = { x: 0, y: 0 };
            if (dx === 0 && dy === 0) return;

            const prev = useCanvasStore.getState();
            const nextPanX = (prev.panX ?? 0) + dx;
            const nextPanY = (prev.panY ?? 0) + dy;
            const zoom = prev.zoom ?? 100;

            if (transformRef.current) {
              transformRef.current.style.transform = `translate3d(${nextPanX}px, ${nextPanY}px, 0) scale(${zoom / 100})`;
            }
            if (gridRef.current) {
              const cell = 40 * (zoom / 100);
              gridRef.current.style.backgroundSize = `${cell}px ${cell}px`;
              gridRef.current.style.backgroundPosition = `${nextPanX}px ${nextPanY}px`;
            }

            useCanvasStore.setState({ panX: nextPanX, panY: nextPanY });
          });
        }
      } else if (
        connectingFrom ||
        lassoStart ||
        draggedPageId ||
        draggedBlockInfo ||
        (resizingPageId && resizeConfig)
      ) {
        // rAF-coalesce: raw pointermove can fire far above 60Hz; writing to the
        // store per event replaced `pages` (and re-synced Yjs) per event.
        pendingInteractionPointer = { clientX: e.clientX, clientY: e.clientY };
        if (interactionRaf == null) {
          interactionRaf = requestAnimationFrame(flushInteraction);
        }
      }
    };

    const handleGlobalPointerUp = (e: globalThis.PointerEvent) => {
      // Apply the last sub-frame movement before drag state is cleared,
      // so saveHistory() below captures the final position.
      if (interactionRaf != null) {
        cancelAnimationFrame(interactionRaf);
        flushInteraction();
      }

      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) prevTouchDistance.current = null;

      if (draggedBlockInfo) {
        const state = useCanvasStore.getState();
        const sourcePage = state.pages.find(
          (p) => p.id === draggedBlockInfo.pageId
        );
        const block = sourcePage?.blocks.find(
          (b) => b.id === draggedBlockInfo.blockId
        );

        if (sourcePage && block) {
          const blockAbsX = sourcePage.x + block.x;
          const blockAbsY = sourcePage.y + block.y;
          const blockCenterX = blockAbsX + (block.width || 320) / 2;
          const blockCenterY =
            blockAbsY + (block.height || getBlockDefaultHeight(block.type)) / 2;

          const targetPage = [...state.pages].reverse().find((p) => {
            if (p.id === sourcePage.id) return false;
            return (
              blockCenterX >= p.x &&
              blockCenterX <= p.x + p.width &&
              blockCenterY >= p.y &&
              blockCenterY <= p.y + p.height
            );
          });

          if (targetPage) {
            const newX = blockAbsX - targetPage.x;
            const newY = blockAbsY - targetPage.y;
            if (transferBlockToPage)
              transferBlockToPage(
                block.id,
                sourcePage.id,
                targetPage.id,
                newX,
                newY
              );
          }
        }
      }

      if (draggedPageId || draggedBlockInfo || resizingPageId) saveHistory();
      setDraggedPageId(null);
      setDraggedBlockInfo(null);
      setResizingPageId(null);
      setResizeConfig(null);
      setLassoStart(null);
      setLassoEnd(null);
      setIsSpacePanning(false);
    };

    const handleGlobalPointerCancel = (e: globalThis.PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) prevTouchDistance.current = null;
    };

    const handleTouchEndSync = (e: globalThis.TouchEvent) => {
      if (e.touches.length < activePointers.current.size) {
        activePointers.current.clear();
        prevTouchDistance.current = null;
        setIsSpacePanning(false);
      }
    };

    const handleEmergencyCleanup = () => {
      activePointers.current.clear();
      prevTouchDistance.current = null;
      setIsSpacePanning(false);
      setDraggedPageId(null);
      setDraggedBlockInfo(null);
      setContextMenu(null);
      setAiMenu(null);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerCancel);
    window.addEventListener('touchend', handleTouchEndSync);
    window.addEventListener('touchcancel', handleTouchEndSync);
    window.addEventListener('blur', handleEmergencyCleanup);
    window.addEventListener('contextmenu', handleEmergencyCleanup);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerCancel);
      window.removeEventListener('touchend', handleTouchEndSync);
      window.removeEventListener('touchcancel', handleTouchEndSync);
      window.removeEventListener('blur', handleEmergencyCleanup);
      window.removeEventListener('contextmenu', handleEmergencyCleanup);
      if (interactionRaf != null) {
        cancelAnimationFrame(interactionRaf);
        interactionRaf = null;
      }
    };
  }, [
    draggedPageId,
    draggedBlockInfo,
    resizingPageId,
    resizeConfig,
    connectingFrom,
    lassoStart,
    dragOffset,
    updatePagePosition,
    updateBlockPosition,
    updatePageDimensions,
    saveHistory,
    setSelectedBlocks,
    isSpacePanning,
    transferBlockToPage,
  ]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isCanvasBackground =
      target === containerRef.current ||
      target.classList.contains('canvas-bg') ||
      target.classList.contains('infinite-grid-layer');

    if (isCanvasBackground) {
      setContextMenu(null);
      setAiMenu(null);
    }

    if (isCanvasBackground && e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }

    activePointers.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });
    const isTouch = e.pointerType === 'touch';
    const activeEl = document.activeElement as HTMLElement;

    if (
      activeEl &&
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)
    ) {
      if (!activeEl.contains(target)) activeEl.blur();
    }

    if (activePointers.current.size === 2) {
      setLassoStart(null);
      setIsSpacePanning(false);
      return;
    }

    if (isSpacePressed || isCanvasBackground) {
      if (e.button === 1 || (e.button === 0 && isSpacePressed) || isTouch) {
        e.preventDefault();
        setIsSpacePanning(true);
        lastSpaceClientRef.current = { x: e.clientX, y: e.clientY };
        pendingSpaceDeltaRef.current = { x: 0, y: 0 };
        setActivePage(null);
        setActiveBlock(null);
        setSelectedBlocks([]);
        setConnectingFrom(null);
      } else if (e.button === 0 && !isSpacePressed && !isTouch) {
        const state = useCanvasStore.getState();
        const currentZoom = (state.zoom ?? 100) / 100;
        const rect = containerRef.current?.getBoundingClientRect() || {
          left: 0,
          top: 0,
        };
        const mouseCanvasX =
          (e.clientX - rect.left - (state.panX ?? 0)) / currentZoom;
        const mouseCanvasY =
          (e.clientY - rect.top - (state.panY ?? 0)) / currentZoom;

        setLassoStart({ x: mouseCanvasX, y: mouseCanvasY });
        setLassoEnd({ x: mouseCanvasX, y: mouseCanvasY });
        setActivePage(null);
        setActiveBlock(null);
        setSelectedBlocks([]);
        setConnectingFrom(null);
      }
    }
  };

  const startPageDrag = useCallback(
    (
      e: ReactPointerEvent,
      pageId: string,
      currentX: number,
      currentY: number
    ) => {
      if (
        isSpacePressed ||
        activePointers.current.size > 1 ||
        mode === 'readonly'
      )
        return;
      e.stopPropagation();
      e.preventDefault();
      setActivePage(pageId);

      const state = useCanvasStore.getState();
      const currentZoom = (state.zoom ?? 100) / 100;
      const currentPanX = state.panX ?? 0;
      const currentPanY = state.panY ?? 0;

      const rect = containerRef.current?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      };
      setDraggedPageId(pageId);
      setDragOffset({
        x: (e.clientX - rect.left - currentPanX) / currentZoom - currentX,
        y: (e.clientY - rect.top - currentPanY) / currentZoom - currentY,
      });
    },
    [isSpacePressed, setActivePage, mode]
  );

  const startBlockDrag = useCallback(
    (
      e: ReactPointerEvent,
      pageId: string,
      blockId: string,
      pageX: number,
      pageY: number,
      blockX: number,
      blockY: number
    ) => {
      if (
        isSpacePressed ||
        activePointers.current.size > 1 ||
        mode === 'readonly'
      )
        return;
      e.stopPropagation();
      e.preventDefault();

      let targetBlockId = blockId;
      if (e.altKey) {
        duplicateBlock(pageId, blockId, 0, 0);
        const newState = useCanvasStore.getState();
        if (newState.activeBlockId) targetBlockId = newState.activeBlockId;
      }

      setActivePage(pageId);
      setActiveBlock(targetBlockId);

      const state = useCanvasStore.getState();
      const currentZoom = (state.zoom ?? 100) / 100;
      const currentPanX = state.panX ?? 0;
      const currentPanY = state.panY ?? 0;

      const rect = containerRef.current?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      };
      setDraggedBlockInfo({ pageId, blockId: targetBlockId });
      setDragOffset({
        x: (e.clientX - rect.left - currentPanX) / currentZoom - pageX - blockX,
        y: (e.clientY - rect.top - currentPanY) / currentZoom - pageY - blockY,
      });
    },
    [isSpacePressed, duplicateBlock, setActivePage, setActiveBlock, mode]
  );

  const handleDropOnPage = useCallback(
    (e: DragEvent<HTMLElement>, page: PageContent) => {
      if (mode === 'readonly') return;
      e.preventDefault();
      e.stopPropagation();
      const type = e.dataTransfer.getData('text/plain') as BlockType;
      if (!type || !containerRef.current) return;

      const state = useCanvasStore.getState();
      const currentZoom = (state.zoom ?? 100) / 100;
      const currentPanX = state.panX ?? 0;
      const currentPanY = state.panY ?? 0;

      const rect = containerRef.current.getBoundingClientRect();
      addBlockToPage(
        page.id,
        type,
        (e.clientX - rect.left - currentPanX) / currentZoom - page.x,
        (e.clientY - rect.top - currentPanY) / currentZoom - page.y
      );
      setActivePage(page.id);
    },
    [addBlockToPage, setActivePage, mode]
  );

  const renderBlock = useCallback(
    (pageId: string, block: BlockContent, isActive: boolean) => {
      const hasOptions =
        block.type === 'dropdown' || block.type === 'badge_selector';
      const currentOptions =
        (block.settings?.options as string) ?? 'Option 1, Option 2, Option 3';

      return (
        <div className="flex flex-col gap-3 w-full h-full">
          <div className="w-full h-auto min-h-[40px] overflow-visible relative">
            {block.type === 'text' && (
              <TextBlock
                block={block}
                onUpdate={(val) => {
                  if (mode !== 'readonly')
                    updateBlockValue(pageId, block.id, val);
                }}
                onSettingsChange={(s) => {
                  if (mode !== 'readonly')
                    updateBlockSettings(pageId, block.id, s);
                }}
              />
            )}
            {block.type === 'form' && (
              <FormBlock
                block={block}
                onUpdate={(val) => {
                  if (mode !== 'readonly')
                    updateBlockValue(pageId, block.id, val);
                }}
                onSettingsChange={(s) => {
                  if (mode !== 'readonly')
                    updateBlockSettings(pageId, block.id, s);
                }}
                isActive={isActive}
              />
            )}
            {block.type === 'date' && (
              <DateBlock
                block={block}
                onUpdate={(val) => {
                  if (mode !== 'readonly')
                    updateBlockValue(pageId, block.id, val);
                }}
                onSettingsChange={(s) => {
                  if (mode !== 'readonly')
                    updateBlockSettings(pageId, block.id, s);
                }}
                isActive={isActive}
              />
            )}
            {block.type === 'dropdown' && (
              <DropdownBlock
                block={block}
                onUpdate={(val) => {
                  if (mode !== 'readonly')
                    updateBlockValue(pageId, block.id, val);
                }}
                onSettingsChange={(s) => {
                  if (mode !== 'readonly')
                    updateBlockSettings(pageId, block.id, s);
                }}
                isActive={isActive}
              />
            )}
            {block.type === 'checkbox' && (
              <ToggleSwitchBlock
                block={block}
                onUpdate={(val) => {
                  if (mode !== 'readonly')
                    updateBlockValue(pageId, block.id, val);
                }}
                onSettingsChange={(s) => {
                  if (mode !== 'readonly')
                    updateBlockSettings(pageId, block.id, s);
                }}
                isActive={isActive}
              />
            )}
            {block.type === 'badge_selector' && (
              <BadgeSelectorBlock
                block={block}
                onUpdate={(val) => {
                  if (mode !== 'readonly')
                    updateBlockValue(pageId, block.id, val);
                }}
                onSettingsChange={(s) => {
                  if (mode !== 'readonly')
                    updateBlockSettings(pageId, block.id, s);
                }}
                isActive={isActive}
              />
            )}
            {block.type === 'asset_stream' && (
              <AssetStreamBlock
                block={block}
                onUpdate={(val) => {
                  if (mode !== 'readonly')
                    updateBlockValue(pageId, block.id, val);
                }}
                onSettingsChange={(s) => {
                  if (mode !== 'readonly')
                    updateBlockSettings(pageId, block.id, s);
                }}
                isActive={isActive}
              />
            )}
          </div>
          {isActive && hasOptions && mode !== 'readonly' && (
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5 animate-in fade-in duration-100">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Manage Choices (Comma Separated):
              </label>
              <input
                type="text"
                value={currentOptions}
                onChange={(e) =>
                  updateBlockSettings(pageId, block.id, {
                    options: e.target.value,
                  })
                }
                placeholder="e.g. Critical, High, Normal"
                className="text-[11px] font-medium bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 w-full text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          )}
        </div>
      );
    },
    [updateBlockValue, updateBlockSettings, mode]
  );

  const { nodes: renderedPages, renderedFrameCount } = useMemo(() => {
    // --- Viewport culling (Figma-style: keep in store, skip render) ---
    // First pass: per-page cull decision (also feeds the radar counter).
    const cullStates = pages.map((page: PageWithSettings) => {
      const px = page.x ?? 150;
      const py = page.y ?? 150;
      const pw = page.width ?? 800;
      const ph = Math.max(page.height ?? 500, 500);
      const hasActiveOrSelectedBlock =
        !!activeBlockId || selectedBlocks.length > 0
          ? page.blocks.some(
              (b) => b.id === activeBlockId || selectedBlocks.includes(b.id)
            )
          : false;
      const cullingExempt =
        activePageId === page.id ||
        hasActiveOrSelectedBlock ||
        draggedPageId === page.id ||
        resizingPageId === page.id;
      const isCulled =
        !!visibleRect &&
        !cullingExempt &&
        !rectsIntersect(
          visibleRect,
          px,
          py,
          px + pw,
          py + ph * PAGE_CULL_HEIGHT_FACTOR
        );
      return {
        isCulled,
        isBoardPage: BOARD_PAGE_TYPES.has(String(page.type ?? '')),
      };
    });
    const renderedFrameCount = cullStates.filter((c) => !c.isCulled).length;

    const nodes = pages.map((page: PageWithSettings, pageIndex: number) => {
      const isPageActive = activePageId === page.id;
      const px = page.x ?? 150;
      const py = page.y ?? 150;
      const pageBgColor =
        (page.settings?.backgroundColor as string) || '#ffffff';

      const { isCulled, isBoardPage } = cullStates[pageIndex];

      // Freeform block pages fully unmount — blocks live in the store.
      // Board pages stay mounted (unmount would refetch) but stop painting.
      if (isCulled && !isBoardPage) {
        return null;
      }
      const culledStyle: React.CSSProperties = isCulled
        ? {
            visibility: 'hidden',
            contain: 'strict',
            pointerEvents: 'none',
          }
        : {};

      return (
        <section
          key={page.id}
          role="region"
          aria-label={`Frame: ${page.title}`}
          tabIndex={0}
          onClick={(e) => {
            if (
              !isSpacePressed &&
              !isSpacePanning &&
              activePointers.current.size < 2
            ) {
              e.stopPropagation();
              setActivePage(page.id);
              if (connectingFrom) setConnectingFrom(null);
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => handleDropOnPage(e, page)}
          className={`canvas-bg absolute shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] rounded-2xl focus:outline-none flex flex-col ${
            isPageActive
              ? 'ring-2 ring-indigo-500 shadow-lg z-40'
              : 'ring-1 ring-zinc-200/80 dark:ring-zinc-800/80 z-0'
          } ${pageBgColor === '#ffffff' ? 'bg-white dark:bg-zinc-900' : ''} ${
            isSpacePanning ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          style={{
            left: `${px}px`,
            top: `${py}px`,
            width: `${page.width}px`,
            minHeight: `${page.height}px`,
            backgroundColor:
              pageBgColor === '#ffffff' ? undefined : pageBgColor,
            ...culledStyle,
          }}
        >
          {isPageActive && !activeBlockId ? (
            <div className="absolute -top-14 left-0 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 z-50 transition-colors">
              <input
                type="text"
                readOnly={mode === 'readonly'}
                value={page.title}
                onChange={(e) => {
                  if (mode !== 'readonly')
                    updatePageTitle(page.id, e.target.value);
                }}
                className={`bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold px-3 py-1.5 rounded-lg outline-none w-32 sm:w-40 transition-all border ${
                  mode === 'readonly'
                    ? 'border-transparent cursor-default'
                    : 'border-transparent dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

              <div
                tabIndex={0}
                className="relative group flex items-center justify-center focus:outline-none"
              >
                <div
                  className={`w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm transition-transform ${
                    mode === 'readonly'
                      ? 'cursor-default'
                      : 'cursor-pointer hover:scale-105 group-focus:ring-2 group-focus:ring-indigo-500/50'
                  }`}
                  style={{ backgroundColor: pageBgColor }}
                />

                {mode !== 'readonly' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200 z-[100]">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-2 grid grid-cols-5 gap-1.5 w-max">
                      {[
                        '#ffffff',
                        '#f87171',
                        '#fb923c',
                        '#facc15',
                        '#4ade80',
                        '#2dd4bf',
                        '#60a5fa',
                        '#a855f7',
                        '#f472b6',
                        '#18181b',
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePageSettings(page.id, {
                              backgroundColor: color,
                            });
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                            pageBgColor === color
                              ? 'border-indigo-500 scale-110 shadow-sm'
                              : 'border-zinc-200 dark:border-zinc-700 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              onPointerDown={(e) => startPageDrag(e, page.id, px, py)}
              className={`absolute -top-8 left-0 flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded transition-colors ${
                mode === 'readonly'
                  ? 'cursor-default'
                  : 'cursor-move hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span># {page.title}</span>
            </div>
          )}

          {isPageActive && mode !== 'readonly' && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePage(page.id);
                }}
                className="absolute -top-8 right-0 text-zinc-400 hover:text-red-500 text-[10px] font-bold px-2 py-1 uppercase tracking-widest cursor-pointer transition-colors"
              >
                Delete Frame
              </button>

              {[
                {
                  edge: 't',
                  cursor: 'cursor-n-resize',
                  classes: 'top-0 left-4 right-4 h-2 -mt-1',
                },
                {
                  edge: 'b',
                  cursor: 'cursor-s-resize',
                  classes: 'bottom-0 left-4 right-4 h-2 -mb-1',
                },
                {
                  edge: 'l',
                  cursor: 'cursor-w-resize',
                  classes: 'top-4 bottom-4 left-0 w-2 -ml-1',
                },
                {
                  edge: 'r',
                  cursor: 'cursor-e-resize',
                  classes: 'top-4 bottom-4 right-0 w-2 -mr-1',
                },
                {
                  edge: 'tl',
                  cursor: 'cursor-nw-resize',
                  classes: 'top-0 left-0 w-4 h-4 -mt-1 -ml-1 rounded-tl-xl',
                },
                {
                  edge: 'tr',
                  cursor: 'cursor-ne-resize',
                  classes: 'top-0 right-0 w-4 h-4 -mt-1 -mr-1 rounded-tr-xl',
                },
                {
                  edge: 'bl',
                  cursor: 'cursor-sw-resize',
                  classes: 'bottom-0 left-0 w-4 h-4 -mb-1 -ml-1 rounded-bl-xl',
                },
                {
                  edge: 'br',
                  cursor: 'cursor-se-resize',
                  classes:
                    'bottom-0 right-0 w-6 h-6 bg-indigo-500 opacity-0 hover:opacity-100 rounded-br-xl rounded-tl-xl flex items-center justify-center',
                },
              ].map(({ edge, cursor, classes }) => (
                <div
                  key={edge}
                  className={`absolute z-50 ${cursor} ${classes}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizingPageId(page.id);
                    setResizeConfig({
                      edge,
                      startX: e.clientX,
                      startY: e.clientY,
                      startW: page.width,
                      startH: page.height,
                      startPageX: px,
                      startPageY: py,
                    });
                  }}
                >
                  {edge === 'br' && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <path d="M21 15v6h-6M21 21l-7-7M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7M3 9V3h6M3 3l7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </>
          )}

          {page.type === 'kanban' ? (
            <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-transparent rounded-b-2xl">
              {mode === 'readonly' && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="Read-Only Mode"
                />
              )}
              <StaticKanbanBoard projectId={page.id} />
            </div>
          ) : page.type === 'notes' || page.type === 'document' ? (
            <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-transparent rounded-b-2xl border-t border-zinc-200/50 dark:border-zinc-800/50">
              {mode === 'readonly' && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="Read-Only Mode"
                />
              )}
              <NotepadBoard projectId={page.id} />
            </div>
          ) : page.type === 'whiteboard' ? (
            <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-transparent rounded-b-2xl border-t border-zinc-200/50 dark:border-zinc-800/50">
              {mode === 'readonly' && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="Read-Only Mode"
                />
              )}
              <WhiteboardBoard projectId={page.id} />
            </div>
          ) : page.type === 'mindmap' ? (
            <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-transparent rounded-b-2xl border-t border-zinc-200/50 dark:border-zinc-800/50">
              {mode === 'readonly' && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="Read-Only Mode"
                />
              )}
              <MindMapBoard projectId={page.id} />
            </div>
          ) : page.type === 'timeline' ? (
            <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-transparent rounded-b-2xl border-t border-zinc-200/50 dark:border-zinc-800/50">
              {mode === 'readonly' && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="Read-Only Mode"
                />
              )}
              <TimelineBoard projectId={page.id} />
            </div>
          ) : page.type === 'database' ? (
            <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-transparent rounded-b-2xl border-t border-zinc-200/50 dark:border-zinc-800/50">
              {mode === 'readonly' && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="Read-Only Mode"
                />
              )}
              <DatabaseBoard projectId={page.id} />
            </div>
          ) : page.type === 'retrospective' ? (
            <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-transparent rounded-b-2xl border-t border-zinc-200/50 dark:border-zinc-800/50">
              {mode === 'readonly' && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="Read-Only Mode"
                />
              )}
              <RetrospectiveBoard projectId={page.id} />
            </div>
          ) : (
            <div className="canvas-bg relative w-full h-full p-6 flex-1 overflow-visible">
              {page.blocks.map((block) => {
                const isBlockActive =
                  activeBlockId === block.id ||
                  selectedBlocks.includes(block.id);
                const bx = block.x ?? 20;
                const by = block.y ?? 20;
                const bw = block.width ?? 320;
                const bh = block.height ?? getBlockDefaultHeight(block.type);

                // Block-level culling within a visible page (world = page + offset)
                if (
                  visibleRect &&
                  !isBlockActive &&
                  draggedBlockInfo?.blockId !== block.id &&
                  connectingFrom?.blockId !== block.id &&
                  !rectsIntersect(
                    visibleRect,
                    px + bx - BLOCK_CULL_PAD,
                    py + by - BLOCK_CULL_PAD,
                    px + bx + bw + BLOCK_CULL_PAD,
                    py + by + bh + BLOCK_CULL_PAD
                  )
                ) {
                  return null;
                }

                return (
                  <div
                    key={block.id}
                    onClick={(e) => {
                      if (
                        !isSpacePressed &&
                        !isSpacePanning &&
                        activePointers.current.size < 2
                      ) {
                        e.stopPropagation();
                        setActivePage(page.id);
                        setActiveBlock(block.id);
                        if (
                          mode !== 'readonly' &&
                          connectingFrom &&
                          connectingFrom.blockId !== block.id
                        ) {
                          addConnection({
                            id: crypto.randomUUID(),
                            fromPage: connectingFrom.pageId,
                            fromBlock: connectingFrom.blockId,
                            toPage: page.id,
                            toBlock: block.id,
                          });
                          setConnectingFrom(null);
                        }
                      }
                    }}
                    onPointerUp={(e) => {
                      if (
                        mode !== 'readonly' &&
                        connectingFrom &&
                        connectingFrom.blockId !== block.id
                      ) {
                        e.stopPropagation();
                        addConnection({
                          id: crypto.randomUUID(),
                          fromPage: connectingFrom.pageId,
                          fromBlock: connectingFrom.blockId,
                          toPage: page.id,
                          toBlock: block.id,
                        });
                        setConnectingFrom(null);
                      }
                    }}
                    className={`absolute bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 pt-10 sm:pt-8 cursor-default select-none group ${
                      isBlockActive
                        ? 'ring-2 ring-indigo-500 shadow-lg z-50'
                        : 'shadow-sm z-10'
                    } ${connectingFrom && connectingFrom.blockId !== block.id && mode !== 'readonly' ? 'hover:ring-2 hover:ring-indigo-400' : ''}`}
                    style={{
                      left: `${bx}px`,
                      top: `${by}px`,
                      width: `${bw}px`,
                      minHeight: `${bh}px`,
                    }}
                  >
                    {isBlockActive && mode !== 'readonly' && (
                      <BlockResizer
                        pageId={page.id}
                        blockId={block.id}
                        x={bx}
                        y={by}
                        width={bw}
                        height={bh}
                      />
                    )}

                    <div
                      onPointerDown={(e) => {
                        if (mode !== 'readonly' && !connectingFrom)
                          startBlockDrag(e, page.id, block.id, px, py, bx, by);
                      }}
                      className={`absolute top-0 left-0 right-0 h-8 sm:h-6 bg-transparent rounded-t-2xl flex items-center justify-center transition-colors select-none z-40 touch-none ${
                        mode === 'readonly'
                          ? 'cursor-default'
                          : 'cursor-move hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {mode !== 'readonly' && (
                        <div className="flex gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                        </div>
                      )}
                    </div>

                    {activeBlockId === block.id && mode !== 'readonly' && (
                      <div className="absolute -top-4 -right-4 sm:-top-3 sm:-right-3 flex gap-1.5 sm:gap-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connectingFrom?.blockId === block.id)
                              setConnectingFrom(null);
                            else
                              setConnectingFrom({
                                pageId: page.id,
                                blockId: block.id,
                              });
                          }}
                          className={`w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center bg-white dark:bg-zinc-800 border rounded-full shadow-md transition-colors cursor-pointer select-none ${
                            connectingFrom?.blockId === block.id
                              ? 'border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400'
                          }`}
                        >
                          <svg
                            className="w-4 h-4 sm:w-3 sm:h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlockFromPage(page.id, block.id);
                          }}
                          className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-md transition-colors cursor-pointer select-none"
                        >
                          <svg
                            className="w-4 h-4 sm:w-3 sm:h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-full"
                    >
                      {renderBlock(
                        page.id,
                        block,
                        isBlockActive && mode !== 'readonly'
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      );
    });

    return { nodes, renderedFrameCount };
  }, [
    pages,
    visibleRect,
    draggedPageId,
    draggedBlockInfo,
    activePageId,
    activeBlockId,
    selectedBlocks,
    resizingPageId,
    resizeConfig,
    connectingFrom,
    isSpacePressed,
    isSpacePanning,
    startPageDrag,
    startBlockDrag,
    handleDropOnPage,
    renderBlock,
    updatePageTitle,
    updatePageSettings,
    removePage,
    addConnection,
    removeBlockFromPage,
    mode,
  ]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9FB] dark:bg-zinc-950 z-50 transition-colors duration-300">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-indigo-600 dark:border-t-indigo-500" />
      </div>
    );
  }

  let cursorStyle = 'cursor-default';
  if (isSpacePressed || isSpacePanning)
    cursorStyle = 'cursor-grab active:cursor-grabbing';
  else if (connectingFrom || lassoStart) cursorStyle = 'cursor-crosshair';

  return (
    <div
      ref={containerRef}
      className={`canvas-bg absolute inset-0 overflow-hidden select-none touch-none bg-[#F9F9FB] dark:bg-zinc-950 transition-colors duration-300 transform-gpu ${cursorStyle}`}
      onPointerDown={handlePointerDown}
    >
      {/* Grid + connection curves on one screen-space canvas (no React re-renders). */}
      <CanvasPassiveLayers />

      <div className="absolute top-6 left-6 z-50 bg-white/95 dark:bg-zinc-900/95 px-4 py-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm pointer-events-none hidden sm:flex items-center gap-4 animate-in fade-in duration-300 transition-colors">
        <div className="flex items-center gap-1.5">
          <MousePointer2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Radar
          </span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-700"></div>
        <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
          <span>X: {Math.round(panX)}</span>
          <span>Y: {Math.round(panY)}</span>
          <span
            className="text-emerald-600 dark:text-emerald-400"
            title="Rendered / total frames (viewport culling)"
          >
            {renderedFrameCount}/{pages.length}
          </span>
        </div>
      </div>

      <div
        ref={transformRef}
        className="absolute inset-0 pointer-events-none transform-gpu"
        style={{
          transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom / 100})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <CanvasWorld
          connections={connections}
          pages={pages}
          renderedPages={renderedPages}
          onRemoveConnection={removeConnection}
        />
        <ConnectionPreviewLayer
          pages={pages}
          connectingFrom={connectingFrom}
          mousePos={mousePos}
        />
        <LassoLayer lassoStart={lassoStart} lassoEnd={lassoEnd} />
        <LiveCursors cursors={cursors} currentUserKey={currentUser.name} />
      </div>

      <div className="absolute bottom-24 sm:bottom-8 scale-90 sm:scale-100 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/60 dark:border-zinc-800/60 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-1.5 pointer-events-auto animate-in slide-in-from-bottom-6 fade-in duration-300 transition-colors">
        {mode !== 'readonly' && (
          <>
            <button
              onClick={undo}
              className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
              title="Undo"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              onClick={redo}
              className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
              title="Redo"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </button>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-2" />
          </>
        )}
        <button
          onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - 10))}
          className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 min-w-[48px] text-center tracking-widest px-1">
          {Math.round(zoom)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + 10))}
          className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-2" />
        <button
          onClick={() => setPan(0, 0)}
          className="w-10 h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all"
          title="Reset View"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
