"use client";
import React, { useRef, useEffect, useState, memo } from "react";
import { BlockContent } from "@/types/record";

interface TextBlockProps {
  block: BlockContent;
  onUpdate: (val: string) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
}

function TextBlock({ block, onUpdate, onSettingsChange }: TextBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textValue = typeof block.value === "string" ? block.value : "";

  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  const isBold = block.settings?.isBold as boolean;
  const isItalic = block.settings?.isItalic as boolean;
  const isUnderline = block.settings?.isUnderline as boolean;
  const fontSize = (block.settings?.fontSize as string) || "15px";
  const color = (block.settings?.color as string) || "#27272a";
  const textAlign =
    (block.settings?.textAlign as "left" | "center" | "right") || "left";

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textValue, fontSize]);

  const toggleSetting = (key: string, currentValue: unknown) => {
    if (onSettingsChange) {
      onSettingsChange({ ...block.settings, [key]: !currentValue });
    }
  };

  const setSetting = (key: string, value: unknown) => {
    if (onSettingsChange) {
      onSettingsChange({ ...block.settings, [key]: value });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col group/block pb-4">
      {isToolbarOpen && onSettingsChange && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-zinc-950 text-white p-1.5 rounded-xl flex items-center gap-1 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap">
          <button
            type="button"
            onClick={() => toggleSetting("isBold", isBold)}
            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-colors ${
              isBold
                ? "bg-zinc-800 text-white"
                : "hover:bg-zinc-800 text-zinc-400"
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => toggleSetting("isItalic", isItalic)}
            className={`w-7 h-7 rounded-lg text-xs font-black italic flex items-center justify-center transition-colors ${
              isItalic
                ? "bg-zinc-800 text-white"
                : "hover:bg-zinc-800 text-zinc-400"
            }`}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => toggleSetting("isUnderline", isUnderline)}
            className={`w-7 h-7 rounded-lg text-xs font-black underline flex items-center justify-center transition-colors ${
              isUnderline
                ? "bg-zinc-800 text-white"
                : "hover:bg-zinc-800 text-zinc-400"
            }`}
            title="Underline"
          >
            U
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          <select
            value={fontSize}
            onChange={(e) => setSetting("fontSize", e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white text-[11px] font-bold rounded-lg px-1.5 py-1 focus:outline-none cursor-pointer"
          >
            <option value="12px">Small</option>
            <option value="15px">Medium</option>
            <option value="18px">Large</option>
            <option value="24px">X-Large</option>
          </select>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          <select
            value={textAlign}
            onChange={(e) => setSetting("textAlign", e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white text-[11px] font-bold rounded-lg px-1.5 py-1 focus:outline-none cursor-pointer"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden rounded-lg hover:bg-zinc-800">
            <input
              type="color"
              value={color}
              onChange={(e) => setSetting("color", e.target.value)}
              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0 bg-transparent"
              title="Text Color"
            />
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={textValue}
        onChange={(e) => onUpdate(e.target.value)}
        style={{
          fontSize,
          color,
          textAlign,
          fontWeight: isBold ? "bold" : "normal",
          fontStyle: isItalic ? "italic" : "normal",
          textDecoration: isUnderline ? "underline" : "none",
        }}
        className="w-full h-full bg-transparent resize-none overflow-hidden focus:outline-none font-medium leading-relaxed p-1 placeholder-zinc-300"
        placeholder="Type something..."
      />

      <button
        type="button"
        onClick={() => setIsToolbarOpen(!isToolbarOpen)}
        className="absolute -bottom-2 -right-2 opacity-0 group-hover/block:opacity-100 flex items-center justify-center w-7 h-7 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 z-10"
        title={isToolbarOpen ? "Aletleri Gizle" : "Aletleri Göster"}
      >
        {isToolbarOpen ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default memo(TextBlock, (prevProps, nextProps) => {
  return (
    prevProps.block.value === nextProps.block.value &&
    prevProps.block.x === nextProps.block.x &&
    prevProps.block.y === nextProps.block.y &&
    prevProps.block.width === nextProps.block.width &&
    prevProps.block.height === nextProps.block.height &&
    JSON.stringify(prevProps.block.settings) ===
      JSON.stringify(nextProps.block.settings)
  );
});
