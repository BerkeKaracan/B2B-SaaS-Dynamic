'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useProjectEditMode } from '@/hooks/useProjectEditMode';
import toast from 'react-hot-toast';
import {
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Type,
  Image as ImageIcon,
  Link2,
  Blocks,
  Trash2,
  GripHorizontal,
} from 'lucide-react';

type Point = { x: number; y: number; pressure: number };

type Stroke = {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  points: Point[];
};

type FloatingText = {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  size: number;
  font: string;
};

const COLORS = [
  '#18181b',
  '#ffffff',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
];
const FONTS = ['Inter', 'serif', 'monospace', 'Comic Sans MS'];
const SIZES = [14, 18, 24, 32, 48, 64];

export default function WhiteboardBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('WhiteboardBoard');
  const { isReadonly } = useProjectEditMode();

  const pages = useCanvasStore((state) => state.pages);
  const metadata = useCanvasStore((state) => state.metadata);
  const updatePageSettings = useCanvasStore(
    (state) => state.updatePageSettings
  );
  const updateMetadata = useCanvasStore((state) => state.updateMetadata);

  const currentPage =
    pages.find((p) => p.id === projectId) ||
    pages.find((p) => p.type === 'whiteboard') ||
    pages[0];
  const settings = currentPage?.settings || {};
  const pageKey = currentPage?.id || projectId;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<FloatingText[]>([]);
  const [title, setTitle] = useState<string>('');

  const [activeTool, setActiveTool] = useState<
    'hand' | 'pen' | 'highlighter' | 'eraser' | 'text'
  >('hand');
  const [activeColor, setActiveColor] = useState<string>(COLORS[3]);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [activeFont, setActiveFont] = useState<string>(FONTS[0]);
  const [activeFontSize, setActiveFontSize] = useState<number>(24);

  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const draggedPosRef = useRef<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);

  const strokesRef = useRef<Stroke[]>(strokes);

  useEffect(() => {
    if (settings.whiteboardStrokes)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStrokes(settings.whiteboardStrokes as Stroke[]);

    const rawTexts =
      (settings.whiteboardTexts as Array<Record<string, unknown>> | undefined) ||
      (metadata.whiteboardTexts as Array<Record<string, unknown>> | undefined) ||
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
    if (settings.whiteboardTitle || metadata.whiteboardTitle) {
      setTitle(
        String(settings.whiteboardTitle || metadata.whiteboardTitle || '')
      );
    }
  }, [
    settings.whiteboardStrokes,
    settings.whiteboardTexts,
    settings.whiteboardTitle,
    metadata.whiteboardTexts,
    metadata.whiteboardTitle,
  ]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const saveStrokes = (newStrokes: Stroke[]) => {
    if (isReadonly) return;
    setStrokes(newStrokes);
    if (currentPage) {
      updatePageSettings(pageKey, { whiteboardStrokes: newStrokes });
    }
    updateMetadata({ whiteboardStrokes: newStrokes });
  };

  const saveTexts = (newTexts: FloatingText[]) => {
    if (isReadonly) return;
    setTexts(newTexts);
    if (currentPage) {
      updatePageSettings(pageKey, { whiteboardTexts: newTexts });
    }
    updateMetadata({ whiteboardTexts: newTexts });
  };

  const saveTitle = (newTitle: string) => {
    if (isReadonly) return;
    setTitle(newTitle);
    if (currentPage) {
      updatePageSettings(pageKey, { whiteboardTitle: newTitle });
    }
    updateMetadata({ whiteboardTitle: newTitle });
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
        const newTexts = texts.map((t) =>
          t.id === textItem.id ? { ...t, x: currentX, y: currentY } : t
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
    } catch (err) {}

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
    } catch (err) {}

    if (!isDrawing.current || !currentStroke.current) return;

    saveStrokes([...strokes, currentStroke.current]);

    isDrawing.current = false;
    currentStroke.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (!isDrawing.current || !currentStroke.current) return;

    saveStrokes([...strokes, currentStroke.current]);

    isDrawing.current = false;
    currentStroke.current = null;
  };

  const handleTextChange = (id: string, newContent: string) => {
    const updatedTexts = texts.map((t) =>
      t.id === id ? { ...t, content: newContent } : t
    );
    saveTexts(updatedTexts);
  };

  const handleDeleteText = (id: string) => {
    const updatedTexts = texts.filter((t) => t.id !== id);
    saveTexts(updatedTexts);
  };

  const handleClearBoard = () => {
    if (window.confirm(t('clearConfirm'))) {
      saveStrokes([]);
      saveTexts([]);
      redrawCanvas();
    }
  };

  const isBoardEmpty = strokes.length === 0 && texts.length === 0;
  const toolBtnBase =
    'p-2 rounded-lg transition-colors';
  const toolBtnIdle =
    'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100';
  const toolBtnActive =
    'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900';

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent overflow-hidden select-none transition-colors duration-300">
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-3 sm:px-4 shrink-0 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-800 pr-3 h-full">
          <button
            type="button"
            onClick={() => setActiveTool('hand')}
            className={`${toolBtnBase} ${
              activeTool === 'hand' ? toolBtnActive : toolBtnIdle
            }`}
            title={t('pan')}
          >
            <Hand size={17} strokeWidth={2.25} />
          </button>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

          <button
            type="button"
            onClick={() => setActiveTool('pen')}
            className={`${toolBtnBase} ${
              activeTool === 'pen' ? toolBtnActive : toolBtnIdle
            }`}
            title={t('pen')}
          >
            <Pen size={17} strokeWidth={2.25} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('highlighter')}
            className={`${toolBtnBase} ${
              activeTool === 'highlighter'
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200'
                : toolBtnIdle
            }`}
            title={t('highlighter')}
          >
            <Highlighter size={17} strokeWidth={2.25} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`${toolBtnBase} ${
              activeTool === 'eraser'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : toolBtnIdle
            }`}
            title={t('eraser')}
          >
            <Eraser size={17} strokeWidth={2.25} />
          </button>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1.5" />

          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`${toolBtnBase} ${
              activeTool === 'text' ? toolBtnActive : toolBtnIdle
            }`}
            title={t('text')}
          >
            <Type size={17} strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex-1 px-3 flex items-center justify-start gap-3 min-w-0">
          {activeTool === 'text' ? (
            <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200 bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex flex-col px-1.5">
                <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                  {t('font')}
                </span>
                <select
                  value={activeFont}
                  onChange={(e) => setActiveFont(e.target.value)}
                  className="bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {FONTS.map((font) => (
                    <option
                      key={font}
                      value={font}
                      style={{ fontFamily: font }}
                      className="dark:bg-zinc-800"
                    >
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex flex-col px-1.5">
                <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                  {t('size')}
                </span>
                <select
                  value={activeFontSize}
                  onChange={(e) => setActiveFontSize(Number(e.target.value))}
                  className="bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {SIZES.map((size) => (
                    <option
                      key={size}
                      value={size}
                      className="dark:bg-zinc-800"
                    >
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex items-center gap-1.5 px-1.5">
                {COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      activeColor === color
                        ? 'scale-110 border-zinc-500 dark:border-zinc-400 shadow-sm'
                        : 'border-transparent dark:border-zinc-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === 'pen' || activeTool === 'highlighter' ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t('thickness')}
                </span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-24 accent-zinc-900 dark:accent-zinc-100"
                />
              </div>
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex items-center gap-1.5">
                {COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      activeColor === color
                        ? 'scale-110 border-zinc-500 dark:border-zinc-400 shadow-sm'
                        : 'border-transparent dark:border-zinc-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === 'eraser' ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {t('eraserSize')}
              </span>
              <input
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-24 accent-zinc-500 dark:accent-zinc-400"
              />
            </div>
          ) : (
            <span className="hidden md:inline text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wide truncate">
              {t('panHint')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-3 shrink-0">
          <button
            type="button"
            onClick={() => toast.success('Image module ready to implement.')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ImageIcon size={14} /> Image
          </button>
          <button
            type="button"
            onClick={() =>
              toast('Widget module ready to implement.', { icon: '🧩' })
            }
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Blocks size={14} /> Widget
          </button>
          <button
            type="button"
            onClick={() => toast.error('Link module is under construction.')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Link2 size={14} /> Link
          </button>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <button
            type="button"
            onClick={handleClearBoard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <Trash2 size={14} />
            <span className="hidden lg:inline">{t('clear')}</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 relative w-full h-full min-h-0 ${
          activeTool === 'hand'
            ? 'cursor-default'
            : activeTool === 'text'
              ? 'cursor-text'
              : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(rgba(113,113,122,0.45) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        />

        {isBoardEmpty && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="text-center px-6 max-w-sm">
              <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 tracking-tight">
                {t('emptyTitle')}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-zinc-400/90 dark:text-zinc-600 leading-relaxed">
                {t('emptyHint')}
              </p>
            </div>
          </div>
        )}

        <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-30">
          <input
            type="text"
            value={title}
            onChange={(e) => saveTitle(e.target.value)}
            readOnly={isReadonly}
            placeholder={t('titlePlaceholder')}
            className={`text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 w-[min(500px,70vw)] ${isReadonly ? 'cursor-default' : ''}`}
            style={{ pointerEvents: 'auto' }}
          />
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none">
          {texts.map((text) => (
            <div
              key={text.id}
              id={`text-node-${projectId}-${text.id}`}
              tabIndex={0}
              className="absolute text-block-wrapper flex flex-col group outline-none"
              style={{
                left: text.x,
                top: text.y,
                pointerEvents: 'auto',
                zIndex: draggingTextId === text.id ? 50 : 20,
              }}
              onKeyDown={(e) => {
                if (
                  (e.key === 'Delete' || e.key === 'Backspace') &&
                  document.activeElement === e.currentTarget
                ) {
                  e.preventDefault();
                  handleDeleteText(text.id);
                }
              }}
            >
              <div
                className={`absolute -top-11 left-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] rounded-full flex items-center gap-0.5 px-1 py-0.5 transition-all duration-200 z-50 
        after:absolute after:content-[''] after:w-full after:h-8 after:-bottom-8 after:left-0
        ${
          activeTool === 'hand' || activeTool === 'text'
            ? 'opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0'
            : 'opacity-0 pointer-events-none'
        }`}
              >
                <div
                  onPointerDown={(e) => startTextDrag(e, text)}
                  className={`p-1.5 rounded-full cursor-grab active:cursor-grabbing hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors ${
                    activeTool !== 'hand' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={
                    activeTool === 'hand'
                      ? 'Drag to move'
                      : 'Switch to Hand (H) to move'
                  }
                >
                  <GripHorizontal size={14} />
                </div>

                <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-700" />

                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleDeleteText(text.id)}
                  className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  title="Delete Text"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={text.content}
                onChange={(e) => {
                  handleTextChange(text.id, e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' && text.content === '') {
                    e.preventDefault();
                    handleDeleteText(text.id);
                  }
                  if (e.key === 'Escape') {
                    e.currentTarget.blur();
                  }
                }}
                autoFocus={text.content === ''}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                className="bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 border-dashed focus:border-zinc-300 dark:focus:border-zinc-500 focus:border-solid rounded-2xl outline-none resize-none overflow-hidden p-3 transition-colors allow-text-select"
                style={{
                  color: text.color,
                  fontSize: `${text.size}px`,
                  fontFamily: text.font,
                  lineHeight: '1.2',
                  minWidth: '100px',
                  minHeight: '40px',
                }}
                placeholder={t('typePlaceholder')}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
