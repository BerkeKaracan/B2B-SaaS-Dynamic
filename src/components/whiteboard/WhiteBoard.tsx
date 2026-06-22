"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PenTool, Eraser, Trash2 } from "lucide-react";

export default function WhiteboardBoard({ projectId }: { projectId: string }) {
  const t = useTranslations("WhiteboardBoard");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3b82f6");
  const [mode, setMode] = useState<"draw" | "erase">("draw");

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const ctx = canvas.getContext("2d");

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (canvas.width > 0 && canvas.height > 0 && tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      if (ctx && tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0);
      }
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.lineWidth = mode === "erase" ? 25 : 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-300 overflow-hidden w-full h-full">
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 flex items-center justify-center gap-4 shrink-0 z-10">
        <button
          onClick={() => setMode("draw")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "draw" ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
        >
          <PenTool className="w-4 h-4" /> {t("draw")}
        </button>

        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm hover:scale-105 transition-transform cursor-pointer">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setMode("draw");
            }}
            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
            title={t("color")}
          />
        </div>

        <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2"></div>

        <button
          onClick={() => setMode("erase")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "erase" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shadow-sm" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
        >
          <Eraser className="w-4 h-4" /> {t("eraser")}
        </button>

        <button
          onClick={clearBoard}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ml-auto"
        >
          <Trash2 className="w-4 h-4" />{" "}
          <span className="hidden sm:inline">{t("clear")}</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative cursor-crosshair touch-none"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(#cbd5e1 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        ></div>
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="absolute inset-0 w-full h-full block"
        />
      </div>
    </div>
  );
}
