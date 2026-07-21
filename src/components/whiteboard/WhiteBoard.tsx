'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import toast from 'react-hot-toast';
import { PenLine, Keyboard } from 'lucide-react';
import type { Point, Stroke, FloatingText, ActiveTool } from './types';
import { COLORS, FONTS, SIZES } from './types';
import { SURFACE } from './whiteboardStyles';
import WhiteboardToolbar from './WhiteboardToolbar';
import FloatingTextNode from './FloatingTextNode';
import ClearConfirmDialog from './ClearConfirmDialog';

function WhiteboardBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('WhiteboardBoard');
  const { isReadonly, dataSource, persist } = useBoardPersistence(projectId);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<FloatingText[]>([]);
  const [title, setTitle] = useState<string>('');

  const [activeTool, setActiveTool] = useState<ActiveTool>('hand');
  const [activeColor, setActiveColor] = useState<string>(COLORS[3]);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [activeFont, setActiveFont] = useState<string>(FONTS[0]);
  const [activeFontSize, setActiveFontSize] = useState<number>(SIZES[2]);

  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const draggedPosRef = useRef<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);

  const strokesRef = useRef<Stroke[]>(strokes);

  useEffect(() => {
    if (dataSource.whiteboardStrokes)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStrokes(dataSource.whiteboardStrokes as Stroke[]);

    const rawTexts =
      (dataSource.whiteboardTexts as Array<Record<string, unknown>> | undefined) ||
      [];
    if (rawTexts.length > 0) {
      setTexts(
        rawTexts.map((item) => ({
          id: String(item.id || crypto.randomUUID()),
          x: Number(item.x || 0),
          y: Number(item.y || 0),
          content: String(item.content || item.text || ''),
          color: String(item.color || '#fef3c7'),
          size: Number(item.size || 18),
          font: String(item.font || 'sans-serif'),
        }))
      );
    }
    if (dataSource.whiteboardTitle) {
      setTitle(String(dataSource.whiteboardTitle));
    }
  }, [
    dataSource.whiteboardStrokes,
    dataSource.whiteboardTexts,
    dataSource.whiteboardTitle,
  ]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const saveStrokes = (newStrokes: Stroke[]) => {
    if (isReadonly) return;
    strokesRef.current = newStrokes;
    setStrokes(newStrokes);
    persist({ whiteboardStrokes: newStrokes });
  };

  const saveTexts = (newTexts: FloatingText[]) => {
    if (isReadonly) return;
    setTexts(newTexts);
    persist({ whiteboardTexts: newTexts });
  };

  const saveTitle = (newTitle: string) => {
    if (isReadonly) return;
    setTitle(newTitle);
    persist({ whiteboardTitle: newTitle });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
        case 'h':
          setActiveTool('hand');
          break;
        case 'p':
          setActiveTool('pen');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 't':
          setActiveTool('text');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      if (stroke.tool === 'eraser') {
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width * 15;
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.3 : 1.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let currentPressure = stroke.points[0].pressure || 1;
        ctx.lineWidth = stroke.width * currentPressure;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          const p = stroke.points[i];

          if (p.pressure !== currentPressure) {
            ctx.stroke();
            currentPressure = p.pressure;
            ctx.lineWidth = stroke.width * currentPressure;
            ctx.beginPath();
            ctx.moveTo(stroke.points[i - 1].x, stroke.points[i - 1].y);
          }
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!canvasRef.current || !containerRef.current) return;

      const logicalWidth = containerRef.current.offsetWidth || 1000;
      const logicalHeight = containerRef.current.offsetHeight || 800;
      const dpr = window.devicePixelRatio || 1;

      canvasRef.current.width = logicalWidth * dpr;
      canvasRef.current.height = logicalHeight * dpr;

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      redrawCanvas();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const getCoordinates = (e: React.PointerEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0, pressure: 1 };

    const rect = containerRef.current.getBoundingClientRect();
    const logicalWidth = containerRef.current.offsetWidth || 1;
    const logicalHeight = containerRef.current.offsetHeight || 1;

    const scaleX = rect.width / logicalWidth;
    const scaleY = rect.height / logicalHeight;

    return {
      x: Math.round(((e.clientX - rect.left) / scaleX) * 10) / 10,
      y: Math.round(((e.clientY - rect.top) / scaleY) * 10) / 10,
      pressure:
        e.pointerType === 'pen' ? Number((e.pressure || 1).toFixed(2)) : 1,
    };
  };

  const startTextDrag = (e: React.PointerEvent, textItem: FloatingText) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadonly) return;

    if (!e.isPrimary) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = textItem.x;
    const initialY = textItem.y;

    let currentX = initialX;
    let currentY = initialY;

    const el = document.getElementById(`text-node-${projectId}-${textItem.id}`);

    setDraggingTextId(textItem.id);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!moveEvent.isPrimary || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = rect.width / (containerRef.current.offsetWidth || 1);
      const scaleY = rect.height / (containerRef.current.offsetHeight || 1);

      const dx = (moveEvent.clientX - startX) / scaleX;
      const dy = (moveEvent.clientY - startY) / scaleY;

      currentX = initialX + dx;
      currentY = initialY + dy;

      if (el) {
        el.style.left = `${currentX}px`;
        el.style.top = `${currentY}px`;
      }
      draggedPosRef.current = { x: currentX, y: currentY };
    };

    const onPointerUpOrCancel = (upEvent: PointerEvent) => {
      if (!upEvent.isPrimary) return;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);

      if (draggedPosRef.current) {
        const newTexts = texts.map((item) =>
          item.id === textItem.id
            ? { ...item, x: currentX, y: currentY }
            : item
        );
        saveTexts(newTexts);
      }
      setDraggingTextId(null);
      draggedPosRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUpOrCancel);
    window.addEventListener('pointercancel', onPointerUpOrCancel);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    if (isReadonly) return;
    if (activeTool === 'hand') return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    if (activeTool === 'text') {
      if ((e.target as HTMLElement).closest('.text-block-wrapper')) return;

      const coords = getCoordinates(e);
      const newText: FloatingText = {
        id:
          'text-' +
          Date.now() +
          '-' +
          Math.random().toString(36).substring(2, 6),
        x: coords.x,
        y: coords.y - 10,
        content: '',
        color: activeColor,
        size: activeFontSize,
        font: activeFont,
      };

      saveTexts([...texts, newText]);
      return;
    }

    isDrawing.current = true;
    const coords = getCoordinates(e);
    currentStroke.current = {
      id:
        'stroke-' +
        Date.now() +
        '-' +
        Math.random().toString(36).substring(2, 6),
      tool: activeTool,
      color: activeColor,
      width: strokeWidth,
      points: [coords],
    };

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && activeTool !== 'eraser') {
      ctx.beginPath();
      ctx.fillStyle = activeColor;
      ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    if (
      !isDrawing.current ||
      !currentStroke.current ||
      activeTool === 'text' ||
      activeTool === 'hand' ||
      draggingTextId
    )
      return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    const lastPoint =
      currentStroke.current.points[currentStroke.current.points.length - 1];
    const dx = coords.x - lastPoint.x;
    const dy = coords.y - lastPoint.y;
    if (dx * dx + dy * dy < 4) return;

    currentStroke.current.points.push(coords);

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 15;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeColor;
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.3 : 1.0;
      ctx.lineWidth = strokeWidth * (coords.pressure || 1);
    }

    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (!isDrawing.current || !currentStroke.current) return;

    saveStrokes([...strokes, currentStroke.current]);

    isDrawing.current = false;
    currentStroke.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (!isDrawing.current || !currentStroke.current) return;

    saveStrokes([...strokes, currentStroke.current]);

    isDrawing.current = false;
    currentStroke.current = null;
  };

  const handleTextChange = (id: string, newContent: string) => {
    const updatedTexts = texts.map((item) =>
      item.id === id ? { ...item, content: newContent } : item
    );
    saveTexts(updatedTexts);
  };

  const handleDeleteText = (id: string) => {
    const updatedTexts = texts.filter((item) => item.id !== id);
    saveTexts(updatedTexts);
  };

  const isBoardEmpty = strokes.length === 0 && texts.length === 0;

  const handleClearBoard = () => {
    if (isReadonly) {
      toast.error(t('readonlyClear'));
      return;
    }
    if (isBoardEmpty) return;
    setShowClearConfirm(true);
  };

  const confirmClearBoard = () => {
    if (isReadonly) return;
    strokesRef.current = [];
    currentStroke.current = null;
    isDrawing.current = false;
    saveStrokes([]);
    saveTexts([]);
    redrawCanvas();
    setShowClearConfirm(false);
  };

  const hasToolbarSlot = useHasProjectToolbarSlot();

  const toolbarLabels = {
    pan: t('pan'),
    pen: t('pen'),
    highlighter: t('highlighter'),
    eraser: t('eraser'),
    text: t('text'),
    font: t('font'),
    size: t('size'),
    thickness: t('thickness'),
    eraserSize: t('eraserSize'),
    panHint: t('panHint'),
    clear: t('clear'),
    image: t('image'),
    widget: t('widget'),
    link: t('link'),
    tools: t('tools'),
    ink: t('ink'),
  };

  const toolbarActions = (
    <WhiteboardToolbar
      activeTool={activeTool}
      activeColor={activeColor}
      strokeWidth={strokeWidth}
      activeFont={activeFont}
      activeFontSize={activeFontSize}
      isReadonly={isReadonly}
      isBoardEmpty={isBoardEmpty}
      labels={toolbarLabels}
      onToolChange={setActiveTool}
      onColorChange={setActiveColor}
      onStrokeWidthChange={setStrokeWidth}
      onFontChange={setActiveFont}
      onFontSizeChange={setActiveFontSize}
      onClear={handleClearBoard}
      onImageClick={() => toast.success(t('imageReady'))}
      onWidgetClick={() => toast(t('widgetReady'), { icon: '🧩' })}
      onLinkClick={() => toast.error(t('linkSoon'))}
    />
  );

  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  const toolCursor =
    activeTool === 'hand'
      ? 'cursor-default'
      : activeTool === 'text'
        ? 'cursor-text'
        : 'cursor-crosshair';

  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden select-none transition-colors duration-300 ${SURFACE.stage}`}
    >
      {portaledToolbar}
      <ClearConfirmDialog
        open={showClearConfirm}
        title={t('clear')}
        description={t('clearConfirm')}
        cancelLabel={t('cancel')}
        confirmLabel={t('clear')}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={confirmClearBoard}
      />
      {!hasToolbarSlot && (
        <div className="h-14 border-b border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 sm:px-4 shrink-0 flex items-center justify-between relative z-20 overflow-visible">
          <div className="hidden sm:flex items-center gap-2.5 min-w-0 mr-3">
            <div className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800/50 shrink-0">
              <PenLine className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                {t('boardLabel')}
              </p>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                {t('boardSub')}
              </p>
            </div>
          </div>
          {toolbarActions}
        </div>
      )}

      <div className="flex-1 relative w-full h-full min-h-0 p-2.5 sm:p-3.5 md:p-4">
        {/* Studio frame */}
        <div
          className={`absolute inset-2.5 sm:inset-3.5 md:inset-4 rounded-2xl overflow-hidden border border-zinc-300/70 dark:border-zinc-700/80 ${SURFACE.paper}`}
        >
          {/* Paper grain + grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.55] dark:opacity-[0.35]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(113,113,122,0.07) 1px, transparent 1px),
                linear-gradient(90deg, rgba(113,113,122,0.07) 1px, transparent 1px),
                radial-gradient(rgba(113,113,122,0.22) 0.8px, transparent 0.8px)
              `,
              backgroundSize: '48px 48px, 48px 48px, 20px 20px',
            }}
          />
          {/* Soft vignette */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-80"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 55%, rgba(24,24,27,0.06) 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none dark:opacity-100 opacity-0"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)',
            }}
          />

          <div
            ref={containerRef}
            className={`absolute inset-0 ${toolCursor}`}
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-10 w-full h-full pointer-events-none"
            />

            {isBoardEmpty && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none animate-in fade-in duration-500">
                <div className="text-center px-6 max-w-sm">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-sm">
                    <PenLine className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 tracking-tight">
                    {t('emptyTitle')}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">
                    {t('emptyHint')}
                  </p>
                  <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                    <Keyboard size={12} className="opacity-70" />
                    <span>{t('shortcutsHint')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-30 max-w-[min(520px,72vw)]">
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => saveTitle(e.target.value)}
                  readOnly={isReadonly}
                  placeholder={t('titlePlaceholder')}
                  className={`text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 w-full ${isReadonly ? 'cursor-default' : ''}`}
                  style={{ pointerEvents: 'auto' }}
                />
                <div className="mt-2 h-[3px] w-16 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 opacity-80" />
              </div>
            </div>

            {/* Active tool chip */}
            <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTool === 'pen'
                      ? 'bg-sky-500'
                      : activeTool === 'highlighter'
                        ? 'bg-amber-400'
                        : activeTool === 'eraser'
                          ? 'bg-emerald-500'
                          : activeTool === 'text'
                            ? 'bg-sky-600'
                            : 'bg-zinc-400'
                  }`}
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {t(`toolChip.${activeTool}`)}
                </span>
                {isReadonly ? (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                    · {t('readonlyBadge')}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="absolute inset-0 z-20 pointer-events-none">
              {texts.map((text) => (
                <FloatingTextNode
                  key={text.id}
                  projectId={projectId}
                  text={text}
                  activeTool={activeTool}
                  isDragging={draggingTextId === text.id}
                  isReadonly={isReadonly}
                  dragTitle={t('dragToMove')}
                  dragHintTitle={t('switchToHand')}
                  deleteTitle={t('deleteText')}
                  placeholder={t('typePlaceholder')}
                  onStartDrag={startTextDrag}
                  onChange={handleTextChange}
                  onDelete={handleDeleteText}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(WhiteboardBoard);
