'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
];
const FONTS = ['Inter', 'serif', 'monospace', 'Comic Sans MS'];
const SIZES = [14, 18, 24, 32, 48, 64];

export default function WhiteboardBoard({ projectId }: { projectId: string }) {
  const pages = useCanvasStore((state) => state.pages);
  const updatePageSettings = useCanvasStore(
    (state) => state.updatePageSettings
  );

  const currentPage = pages.find((p) => p.id === projectId);
  const settings = currentPage?.settings || {};

  const [isMounted, setIsMounted] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<FloatingText[]>([]);
  const [title, setTitle] = useState<string>('Untitled Whiteboard');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    if (settings.whiteboardStrokes) {
      setStrokes(settings.whiteboardStrokes as Stroke[]);
    }
    if (settings.whiteboardTexts) {
      const rawTexts = settings.whiteboardTexts as FloatingText[];
      const safeTexts = rawTexts.map((t) => ({
        ...t,
        id: t.id.includes('-')
          ? t.id
          : `${t.id}-${Math.random().toString(36).substring(2, 9)}`,
      }));
      setTexts(safeTexts);
    }
    if (settings.whiteboardTitle) {
      setTitle(settings.whiteboardTitle as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const saveTexts = (newTexts: FloatingText[]) => {
    setTexts(newTexts);
    updatePageSettings(projectId, { whiteboardTexts: newTexts });
  };

  const saveStrokes = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    updatePageSettings(projectId, { whiteboardStrokes: newStrokes });
  };

  const saveTitle = (newTitle: string) => {
    setTitle(newTitle);
    updatePageSettings(projectId, { whiteboardTitle: newTitle });
  };

  const [activeTool, setActiveTool] = useState<
    'hand' | 'pen' | 'highlighter' | 'eraser' | 'text'
  >('hand');
  const [activeColor, setActiveColor] = useState<string>(COLORS[0]);
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
    strokesRef.current = strokes;
    redrawCanvas();
  }, [strokes, redrawCanvas]);

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

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (!canvasRef.current || !containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = width * dpr;
      canvasRef.current.height = height * dpr;
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
    return {
      x: Math.round((e.clientX - rect.left) * 10) / 10,
      y: Math.round((e.clientY - rect.top) * 10) / 10,
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

    const el = document.getElementById(
      `wb-text-node-${projectId}-${textItem.id}`
    );

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!moveEvent.isPrimary) return;
      currentX = initialX + (moveEvent.clientX - startX);
      currentY = initialY + (moveEvent.clientY - startY);
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
        id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#fdfdfc] overflow-hidden select-none">
      <div className="h-16 border-b border-zinc-200 bg-white px-4 shrink-0 shadow-sm flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1 border-r border-zinc-200 pr-4">
          <button
            onClick={() => setActiveTool('hand')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'hand' ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            title="Pan & Move (V / H)"
          >
            <Hand size={18} strokeWidth={2.5} />
          </button>
          <div className="w-px h-6 bg-zinc-200 mx-1"></div>
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'pen' ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            title="Pen (P)"
          >
            <Pen size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'highlighter' ? 'bg-yellow-400 text-yellow-950 shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            title="Highlighter"
          >
            <Highlighter size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            title="Eraser (E)"
          >
            <Eraser size={18} strokeWidth={2.5} />
          </button>
          <div className="w-px h-8 bg-zinc-200 mx-2"></div>
          <button
            onClick={() => setActiveTool('text')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'text' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            title="Add Text (T)"
          >
            <Type size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 px-4 flex items-center justify-start gap-4">
          {activeTool === 'text' ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-200 bg-blue-50/50 p-1.5 rounded-xl border border-blue-100">
              <div className="flex flex-col px-2">
                <select
                  value={activeFont}
                  onChange={(e) => setActiveFont(e.target.value)}
                  className="bg-transparent text-zinc-800 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {FONTS.map((font) => (
                    <option
                      key={font}
                      value={font}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col px-2">
                <select
                  value={activeFontSize}
                  onChange={(e) => setActiveFontSize(Number(e.target.value))}
                  className="bg-transparent text-zinc-800 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 px-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === color ? 'scale-110 border-blue-400 shadow-sm' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === 'pen' || activeTool === 'highlighter' ? (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-24 accent-zinc-950"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === color ? 'scale-110 border-zinc-400 shadow-sm' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === 'eraser' ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
              <input
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-24 accent-zinc-500"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 relative w-full h-full ${activeTool === 'hand' ? 'cursor-default' : activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
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

        <div className="absolute top-6 left-6 z-30">
          <input
            type="text"
            value={title}
            onChange={(e) => saveTitle(e.target.value)}
            placeholder="TITLE..."
            className="text-4xl font-black tracking-tighter text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-300 w-[500px]"
            style={{ pointerEvents: 'auto' }}
          />
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none">
          {texts.map((text) => (
            <div
              key={text.id}
              id={`wb-text-node-${projectId}-${text.id}`}
              tabIndex={0}
              className="absolute text-block-wrapper flex flex-col group outline-none"
              style={{
                left: text.x,
                top: text.y,
                pointerEvents: 'auto',
                zIndex: draggingTextId === text.id ? 50 : 20,
              }}
            >
              <div
                className={`absolute -top-12 left-0 bg-white border border-zinc-200 shadow-md rounded-full flex items-center gap-1 px-1.5 py-1 transition-all duration-200 z-50 ${activeTool === 'hand' || activeTool === 'text' ? 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0' : 'opacity-0 pointer-events-none'}`}
              >
                <div
                  onPointerDown={(e) => startTextDrag(e, text)}
                  className="p-1.5 rounded-full cursor-grab hover:bg-zinc-100 text-zinc-400"
                >
                  <GripHorizontal size={14} />
                </div>
                <div className="w-px h-4 bg-zinc-200"></div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() =>
                    saveTexts(texts.filter((t) => t.id !== text.id))
                  }
                  className="p-1.5 rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={text.content}
                onChange={(e) =>
                  saveTexts(
                    texts.map((t) =>
                      t.id === text.id ? { ...t, content: e.target.value } : t
                    )
                  )
                }
                className="bg-transparent border border-transparent hover:border-zinc-300 border-dashed focus:border-blue-200 focus:border-solid rounded-3xl outline-none resize-none overflow-hidden p-3 transition-all select-text"
                style={{
                  color: text.color,
                  fontSize: `${text.size}px`,
                  fontFamily: text.font,
                  lineHeight: '1.2',
                  minWidth: '100px',
                  minHeight: '40px',
                }}
                placeholder="Type..."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
