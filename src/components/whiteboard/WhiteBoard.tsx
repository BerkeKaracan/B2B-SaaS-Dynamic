'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useCanvasStore } from '@/store/useCanvasStore';
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

  const pages = useCanvasStore((state) => state.pages);
  const updatePageSettings = useCanvasStore(
    (state) => state.updatePageSettings
  );

  const currentPage = pages.find((p) => p.id === projectId);
  const settings = currentPage?.settings || {};

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
    if (settings.whiteboardTexts)
      setTexts(settings.whiteboardTexts as FloatingText[]);
    if (settings.whiteboardTitle) setTitle(settings.whiteboardTitle as string);
  }, [
    settings.whiteboardStrokes,
    settings.whiteboardTexts,
    settings.whiteboardTitle,
  ]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const saveStrokes = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    updatePageSettings(projectId, { whiteboardStrokes: newStrokes });
  };

  const saveTexts = (newTexts: FloatingText[]) => {
    setTexts(newTexts);
    updatePageSettings(projectId, { whiteboardTexts: newTexts });
  };

  const saveTitle = (newTitle: string) => {
    setTitle(newTitle);
    updatePageSettings(projectId, { whiteboardTitle: newTitle });
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

  return (
    <div className="absolute inset-0 flex flex-col bg-[#fdfdfc] dark:bg-[#121212] overflow-hidden select-none transition-colors duration-300">
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 shrink-0 shadow-sm flex items-center justify-between relative z-20 transition-colors duration-300">
        <div className="flex items-center gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-4 h-full">
          <button
            onClick={() => setActiveTool('hand')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'hand'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title={t('pan')}
          >
            <Hand size={18} strokeWidth={2.5} />
          </button>

          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

          <button
            onClick={() => setActiveTool('pen')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'pen'
                ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title={t('pen')}
          >
            <Pen size={18} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'highlighter'
                ? 'bg-yellow-400 dark:bg-yellow-500/80 text-yellow-950 shadow-md'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title={t('highlighter')}
          >
            <Highlighter size={18} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'eraser'
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-inner'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title={t('eraser')}
          >
            <Eraser size={18} strokeWidth={2.5} />
          </button>

          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-2"></div>

          <button
            onClick={() => setActiveTool('text')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'text'
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title={t('text')}
          >
            <Type size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 px-4 flex items-center justify-start gap-4">
          {activeTool === 'text' ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-200 bg-blue-50/50 dark:bg-blue-900/20 p-1.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <div className="flex flex-col px-2">
                <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-0.5">
                  {t('font')}
                </span>
                <select
                  value={activeFont}
                  onChange={(e) => setActiveFont(e.target.value)}
                  className="bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none cursor-pointer"
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
              <div className="w-px h-6 bg-blue-200 dark:bg-blue-800 mx-1"></div>
              <div className="flex flex-col px-2">
                <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-0.5">
                  {t('size')}
                </span>
                <select
                  value={activeFontSize}
                  onChange={(e) => setActiveFontSize(Number(e.target.value))}
                  className="bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none cursor-pointer"
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
              <div className="w-px h-6 bg-blue-200 dark:bg-blue-800 mx-1"></div>
              <div className="flex items-center gap-1.5 px-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      activeColor === color
                        ? 'scale-110 border-blue-400 shadow-sm'
                        : 'border-transparent dark:border-zinc-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === 'pen' || activeTool === 'highlighter' ? (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t('thickness')}
                </span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-24 accent-zinc-950 dark:accent-zinc-100"
                />
              </div>
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-2"></div>
              <div className="flex items-center gap-1.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      activeColor === color
                        ? 'scale-110 border-zinc-400 dark:border-zinc-500 shadow-sm'
                        : 'border-transparent dark:border-zinc-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === 'eraser' ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
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
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-4">
          <button
            onClick={() => toast.success('Image module ready to implement.')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:flex"
          >
            <ImageIcon size={14} /> Image
          </button>
          <button
            onClick={() =>
              toast('Widget module ready to implement.', { icon: '🧩' })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:flex"
          >
            <Blocks size={14} /> Widget
          </button>
          <button
            onClick={() => toast.error('Link module is under construction.')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:flex"
          >
            <Link2 size={14} /> Link
          </button>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <button
            onClick={handleClearBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />{' '}
            <span className="hidden lg:inline">{t('clear')}</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 relative w-full h-full ${
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
          className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        ></div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        />

        <div className="absolute top-6 left-6 z-30">
          <input
            type="text"
            value={title}
            onChange={(e) => saveTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 w-[500px]"
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
                className={`absolute -top-12 left-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md rounded-full flex items-center gap-1 px-1.5 py-1 transition-all duration-200 z-50 
        after:absolute after:content-[''] after:w-full after:h-8 after:-bottom-8 after:left-0
        ${
          activeTool === 'hand' || activeTool === 'text'
            ? 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0'
            : 'opacity-0 pointer-events-none'
        }`}
              >
                <div
                  onPointerDown={(e) => startTextDrag(e, text)}
                  className={`p-1.5 rounded-full cursor-grab active:cursor-grabbing hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors ${
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

                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-600"></div>

                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleDeleteText(text.id)}
                  className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                className="bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 border-dashed focus:border-blue-200 dark:focus:border-blue-500/50 focus:border-solid rounded-3xl outline-none resize-none overflow-hidden p-3 transition-all select-text"
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
