"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
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
} from "lucide-react";

type Point = { x: number; y: number; pressure: number };

type Stroke = {
  id: string;
  tool: "pen" | "highlighter" | "eraser";
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
  "#18181b",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
];
const FONTS = ["Inter", "serif", "monospace", "Comic Sans MS"];
const SIZES = [14, 18, 24, 32, 48, 64];

export default function NotepadBoard({
  projectId: _projectId,
}: {
  projectId: string;
}) {
  const { metadata, updateMetadata } = useCanvasStore();

  // Veritabanı State'leri
  const [strokes, setStrokes] = useState<Stroke[]>(
    (metadata.notepadStrokes as Stroke[]) || [],
  );
  const [texts, setTexts] = useState<FloatingText[]>(
    (metadata.notepadTexts as FloatingText[]) || [],
  );

  // Arayüz ve Araç State'leri
  const [activeTool, setActiveTool] = useState<
    "hand" | "pen" | "highlighter" | "eraser" | "text"
  >("hand");
  const [activeColor, setActiveColor] = useState<string>(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [activeFont, setActiveFont] = useState<string>(FONTS[0]);
  const [activeFontSize, setActiveFontSize] = useState<number>(24);
  const [title, setTitle] = useState<string>(
    (metadata.notepadTitle as string) || "Untitled Note",
  );

  // Yazı Taşıma (Drag & Drop Text) Stateleri
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Çizim Referansları
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);

  // --- ÇİZİM MOTORU ---
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = stroke.width * 15;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.tool === "highlighter" ? 0.3 : 1.0;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];

        if (stroke.tool !== "eraser") {
          ctx.lineWidth = stroke.width * (p.pressure || 1);
        }

        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });
  }, [strokes]);

  // BUG FIX: ResizeObserver entegrasyonu ile menü açılıp kapandığında tam responsive uyum sağlar
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!canvasRef.current || !containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvasRef.current.width = width * dpr;
      canvasRef.current.height = height * dpr;

      const ctx = canvasRef.current.getContext("2d");
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
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pointerType === "pen" ? e.pressure || 1 : 1,
    };
  };

  // --- POINTER ETKİLEŞİMLERİ ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === "hand") return;

    if (activeTool === "text") {
      // Eğer bir text kutusunun içine tıklanmadıysa yeni text kutusu aç
      if ((e.target as HTMLElement).closest(".text-block-wrapper")) return;

      const coords = getCoordinates(e);
      const newText: FloatingText = {
        id: "text-" + Date.now(),
        x: coords.x,
        y: coords.y - 30, // Mini kontrol barının yüksekliğini hesaba katıyoruz
        content: "",
        color: activeColor,
        size: activeFontSize,
        font: activeFont,
      };
      const updatedTexts = [...texts, newText];
      setTexts(updatedTexts);
      updateMetadata({ notepadTexts: updatedTexts });
      return;
    }

    isDrawing.current = true;
    const coords = getCoordinates(e);
    currentStroke.current = {
      id: "stroke-" + Date.now(),
      tool: activeTool,
      color: activeColor,
      width: strokeWidth,
      points: [coords],
    };

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && activeTool !== "eraser") {
      ctx.beginPath();
      ctx.fillStyle = activeColor;
      ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. Durum: Yazı sürükleme/taşıma aktifse
    if (draggingTextId) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left - dragOffset.current.x;
      const currentY = e.clientY - rect.top - dragOffset.current.y;

      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === draggingTextId ? { ...t, x: currentX, y: currentY } : t,
        ),
      );
      return;
    }

    // 2. Durum: Çizim yapılıyorsa
    if (
      !isDrawing.current ||
      !currentStroke.current ||
      activeTool === "text" ||
      activeTool === "hand"
    )
      return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    const lastPoint =
      currentStroke.current.points[currentStroke.current.points.length - 1];

    currentStroke.current.points.push(coords);

    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = strokeWidth * 15;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = activeColor;
      ctx.globalAlpha = activeTool === "highlighter" ? 0.3 : 1.0;
      ctx.lineWidth = strokeWidth * (coords.pressure || 1);
    }

    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const handlePointerUp = () => {
    // Yazı taşımayı bitir ve veritabanına mühürle
    if (draggingTextId) {
      setDraggingTextId(null);
      updateMetadata({ notepadTexts: texts });
      return;
    }

    // Çizimi bitir
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;

    const updatedStrokes = [...strokes, currentStroke.current];
    setStrokes(updatedStrokes);
    updateMetadata({ notepadStrokes: updatedStrokes });
    currentStroke.current = null;
  };

  // --- YAZI ELEMENTİ SÜRÜKLEME BAŞLANGICI ---
  const startTextDrag = (e: React.PointerEvent, textItem: FloatingText) => {
    e.preventDefault();
    setDraggingTextId(textItem.id);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Tıklanan noktanın yazı kutusunun sol üst köşesine olan mesafesini kaydet
    dragOffset.current = {
      x: e.clientX - rect.left - textItem.x,
      y: e.clientY - rect.top - textItem.y,
    };
  };

  const handleTextChange = (id: string, newContent: string) => {
    const updatedTexts = texts.map((t) =>
      t.id === id ? { ...t, content: newContent } : t,
    );
    setTexts(updatedTexts);
    updateMetadata({ notepadTexts: updatedTexts });
  };

  const handleDeleteText = (id: string) => {
    const updatedTexts = texts.filter((t) => t.id !== id);
    setTexts(updatedTexts);
    updateMetadata({ notepadTexts: updatedTexts });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    updateMetadata({ notepadTitle: e.target.value });
  };

  const handleNotImplemented = (feature: string) => {
    alert(`${feature} modülü sisteme eklendiğinde buradan tetiklenecek.`);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#fdfdfc] overflow-hidden select-none">
      {/* ÜST BAR (TOOLBAR) */}
      <div className="h-16 border-b border-zinc-200 bg-white px-4 shrink-0 shadow-sm flex items-center justify-between relative z-20">
        {/* GRUP 1: Çizim Araçları */}
        <div className="flex items-center gap-1 border-r border-zinc-200 pr-4">
          <button
            onClick={() => setActiveTool("hand")}
            className={`p-2.5 rounded-xl transition-all ${activeTool === "hand" ? "bg-zinc-950 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
            title="Pan / Select (Hand Mode for Moving Text)"
          >
            <Hand size={18} strokeWidth={2.5} />
          </button>
          <div className="w-px h-6 bg-zinc-200 mx-1"></div>
          <button
            onClick={() => setActiveTool("pen")}
            className={`p-2.5 rounded-xl transition-all ${activeTool === "pen" ? "bg-zinc-950 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
            title="Pen (Stylus Supported)"
          >
            <Pen size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setActiveTool("highlighter")}
            className={`p-2.5 rounded-xl transition-all ${activeTool === "highlighter" ? "bg-yellow-400 text-yellow-950 shadow-md" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
            title="Highlighter"
          >
            <Highlighter size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setActiveTool("eraser")}
            className={`p-2.5 rounded-xl transition-all ${activeTool === "eraser" ? "bg-zinc-200 text-zinc-900 shadow-inner" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
            title="Eraser"
          >
            <Eraser size={18} strokeWidth={2.5} />
          </button>
          <div className="w-px h-8 bg-zinc-200 mx-2"></div>
          <button
            onClick={() => setActiveTool("text")}
            className={`p-2.5 rounded-xl transition-all ${activeTool === "text" ? "bg-blue-600 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
            title="Add Text"
          >
            <Type size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* GRUP 2: Dinamik Ayar Paneli */}
        <div className="flex-1 px-4 flex items-center justify-start gap-4">
          {activeTool === "text" ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-200 bg-blue-50/50 p-1.5 rounded-xl border border-blue-100">
              <div className="flex flex-col px-2">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">
                  Font
                </span>
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

              <div className="w-px h-6 bg-blue-200 mx-1"></div>

              <div className="flex flex-col px-2">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">
                  Size (PX)
                </span>
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

              <div className="w-px h-6 bg-blue-200 mx-1"></div>

              <div className="flex items-center gap-1.5 px-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === color ? "scale-110 border-blue-400 shadow-sm" : "border-transparent hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === "pen" || activeTool === "highlighter" ? (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Thickness
                </span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-24 accent-zinc-950"
                />
              </div>

              <div className="w-px h-6 bg-zinc-200 mx-2"></div>

              <div className="flex items-center gap-1.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === color ? "scale-110 border-zinc-400 shadow-sm" : "border-transparent hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : activeTool === "eraser" ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Eraser Size
              </span>
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

        {/* GRUP 3: Ekleme Menüsü */}
        <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
          <button
            onClick={() => handleNotImplemented("Resim Ekleme")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <ImageIcon size={14} /> Image
          </button>
          <button
            onClick={() => handleNotImplemented("Widget Eklentisi")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Blocks size={14} /> Widget
          </button>
          <button
            onClick={() => handleNotImplemented("Bağlantı Ekleme")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Link2 size={14} /> Link
          </button>
        </div>
      </div>

      {/* ANA ÇİZİM VE ÇALIŞMA ALANI */}
      <div
        ref={containerRef}
        className={`flex-1 relative w-full h-full ${activeTool === "hand" ? "cursor-default" : activeTool === "text" ? "cursor-text" : "cursor-crosshair"}`}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        />

        {/* BAŞLIK (TITLE) */}
        <div className="absolute top-6 left-6 z-30">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="TITLE..."
            className="text-4xl font-black tracking-tighter text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-300 w-[500px]"
            style={{ pointerEvents: "auto" }}
          />
        </div>

        {/* METİN KATMANI (BUG FIX: İçiçe geçmeyi, silinememeyi ve taşmayı önleyen yeni yapışkan toolbar tasarımı) */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {texts.map((text) => (
            <div
              key={text.id}
              className="absolute text-block-wrapper flex flex-col group border border-transparent hover:border-zinc-200 hover:bg-white/60 focus-within:border-zinc-300 focus-within:bg-white rounded-xl p-1 transition-all duration-150 shadow-xs hover:shadow-md"
              style={{
                left: text.x,
                top: text.y,
                pointerEvents: "auto",
                zIndex: draggingTextId === text.id ? 50 : 20,
              }}
            >
              {/* İÇ KONTROL ÇUBUĞU (Kutunun tepesinde kalır, asla ekrandan dışarı taşmaz ve yan yana kutularda çakışmaz) */}
              <div className="h-6 flex items-center justify-between px-1 bg-zinc-100 rounded-lg mb-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 shrink-0">
                {/* Sürükleme Kulpu (Sadece Hand modundaysa aktifleşir) */}
                <div
                  onPointerDown={(e) => startTextDrag(e, text)}
                  className={`flex items-center gap-1 px-1 py-0.5 rounded cursor-grab active:cursor-grabbing hover:bg-zinc-200 ${activeTool !== "hand" ? "pointer-events-none opacity-40" : ""}`}
                  title={
                    activeTool === "hand"
                      ? "Drag to move text"
                      : "Switch to Hand Tool to move"
                  }
                >
                  <GripHorizontal size={12} className="text-zinc-500" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    Move
                  </span>
                </div>

                {/* Bağımsız Silme Butonu */}
                <button
                  onClick={() => handleDeleteText(text.id)}
                  className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete text block"
                >
                  <Trash2 size={12} strokeWidth={2.5} />
                </button>
              </div>

              <textarea
                value={text.content}
                onChange={(e) => handleTextChange(text.id, e.target.value)}
                autoFocus={text.content === ""}
                className="bg-transparent border-none outline-none resize-none overflow-hidden p-1 select-text"
                style={{
                  color: text.color,
                  fontSize: `${text.size}px`,
                  fontFamily: text.font,
                  lineHeight: "1.2",
                  minWidth: "180px",
                  minHeight: "40px",
                }}
                placeholder="Type here..."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
