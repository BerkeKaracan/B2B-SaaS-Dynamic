"use client";
import React, { useRef, useEffect } from "react";
import { BlockContent } from "@/types/record";

interface TextBlockProps {
  block: BlockContent;
  onUpdate: (val: string) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
}

export default function TextBlock({
  block,
  onUpdate,
  onSettingsChange,
}: TextBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textValue = typeof block.value === "string" ? block.value : "";

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
      onSettingsChange({ [key]: !currentValue });
    }
  };

  const setSetting = (key: string, value: unknown) => {
    if (onSettingsChange) {
      onSettingsChange({ [key]: value });
    }
  };

  return (
    <div className="relative w-full group/text space-y-2">
      {onSettingsChange && (
        <div className="absolute -top-11 left-0 z-30 flex items-center gap-1 bg-zinc-900 text-white p-1 rounded-lg shadow-xl opacity-0 group-hover/text:opacity-100 focus-within:opacity-100 transition-opacity">
          <select
            value={fontSize}
            onChange={(e) => setSetting("fontSize", e.target.value)}
            className="bg-transparent text-[11px] font-medium focus:outline-none cursor-pointer hover:bg-zinc-800 px-1 py-1 rounded appearance-none"
          >
            <option value="12px">12px</option>
            <option value="15px">15px</option>
            <option value="18px">18px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
          </select>
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <button
            type="button"
            onClick={() => toggleSetting("isBold", isBold)}
            className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${isBold ? "bg-zinc-700 text-blue-400" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => toggleSetting("isItalic", isItalic)}
            className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${isItalic ? "bg-zinc-700 text-blue-400" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="19" y1="4" x2="10" y2="4" />
              <line x1="14" y1="20" x2="5" y2="20" />
              <line x1="15" y1="4" x2="9" y2="20" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => toggleSetting("isUnderline", isUnderline)}
            className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${isUnderline ? "bg-zinc-700 text-blue-400" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
              <line x1="4" y1="21" x2="20" y2="21" />
            </svg>
          </button>
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <button
            type="button"
            onClick={() => setSetting("textAlign", "left")}
            className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${textAlign === "left" ? "bg-zinc-700 text-blue-400" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="15" y1="12" x2="3" y2="12" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setSetting("textAlign", "center")}
            className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${textAlign === "center" ? "bg-zinc-700 text-blue-400" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="19" y1="12" x2="5" y2="12" />
              <line x1="21" y1="18" x2="3" y2="18" />
            </svg>
          </button>
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <div className="relative flex items-center justify-center p-1 rounded hover:bg-zinc-700 transition-colors cursor-pointer overflow-hidden w-6 h-6">
            <input
              type="color"
              value={color}
              onChange={(e) => setSetting("color", e.target.value)}
              className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-0 p-0"
            />
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="w-full p-0 border-none focus:ring-0 leading-relaxed bg-transparent outline-none resize-none overflow-hidden placeholder:text-zinc-300 transition-all"
        style={{
          fontWeight: isBold ? "bold" : "normal",
          fontStyle: isItalic ? "italic" : "normal",
          textDecoration: isUnderline ? "underline" : "none",
          fontSize: fontSize,
          color: color,
          textAlign: textAlign,
        }}
        value={textValue}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Start typing your content..."
        rows={1}
      />
    </div>
  );
}
