"use client";
import React, { useRef, useEffect, useState, memo } from "react";
import { BlockContent } from "@/types/record";
import { fetchAPI } from "@/services/api";
import ReactMarkdown from "react-markdown";
import {
  MoreHorizontal,
  X,
  Sparkles,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
} from "lucide-react";

interface TextBlockProps {
  block: BlockContent;
  onUpdate: (val: string) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
}

function TextBlock({ block, onUpdate, onSettingsChange }: TextBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textValue = typeof block.value === "string" ? block.value : "";
  const [text, setText] = useState(textValue);

  const [isEditing, setIsEditing] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isBold = block.settings?.isBold as boolean;
  const isItalic = block.settings?.isItalic as boolean;
  const isUnderline = block.settings?.isUnderline as boolean;
  const fontSize = (block.settings?.fontSize as string) || "15px";
  const color = (block.settings?.color as string) || "#27272a";
  const textAlign =
    (block.settings?.textAlign as "left" | "center" | "right") || "left";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (textValue !== text) setText(textValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textValue]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, fontSize, isEditing]);

  const toggleSetting = (key: string, currentValue: unknown) => {
    if (onSettingsChange)
      onSettingsChange({ ...block.settings, [key]: !currentValue });
  };

  const setSetting = (key: string, value: unknown) => {
    if (onSettingsChange) onSettingsChange({ ...block.settings, [key]: value });
  };

  const handleAiAction = async (action: string) => {
    if (!text.trim() || !action) return;
    setIsAiLoading(true);
    try {
      const res = await fetchAPI("/api/ai/magic-wand", {
        method: "POST",
        body: JSON.stringify({ text, action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setText(data.result);
          onUpdate(data.result);
        }
      }
    } catch (error) {
      console.error("AI Action Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsEditing(false);
      setIsToolbarOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      tabIndex={-1}
      className="relative w-full h-full flex flex-col group/block pb-4 outline-none"
    >
      <div className="absolute -left-5 top-1 bottom-1 w-0.5 bg-zinc-400 rounded-full opacity-0 group-focus-within/block:opacity-100 transition-opacity duration-200 pointer-events-none" />

      {isToolbarOpen && onSettingsChange && (
        <div className="absolute top-0 -right-4 translate-x-full w-60 bg-white border border-zinc-200 rounded-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] p-3 flex flex-col gap-3.5 z-100 animate-in slide-in-from-left-2 fade-in duration-200 cursor-default">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Block Options
            </span>
            <button
              onClick={() => setIsToolbarOpen(false)}
              className="text-zinc-400 hover:text-zinc-800 transition-colors p-1 rounded-md hover:bg-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> AI Assistant
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleAiAction("improve")}
                disabled={isAiLoading}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-50 text-[11px] font-semibold py-1.5 rounded-lg transition-colors flex justify-center items-center"
              >
                {isAiLoading ? "Thinking..." : "Improve"}
              </button>
              <button
                onClick={() => handleAiAction("summarize")}
                disabled={isAiLoading}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-50 text-[11px] font-semibold py-1.5 rounded-lg transition-colors flex justify-center items-center"
              >
                {isAiLoading ? "Thinking..." : "Summarize"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Typography
            </span>
            <div className="flex bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => toggleSetting("isBold", isBold)}
                className={`flex-1 flex justify-center items-center py-1.5 rounded-md transition-colors ${isBold ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200/60"}`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleSetting("isItalic", isItalic)}
                className={`flex-1 flex justify-center items-center py-1.5 rounded-md transition-colors ${isItalic ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200/60"}`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleSetting("isUnderline", isUnderline)}
                className={`flex-1 flex justify-center items-center py-1.5 rounded-md transition-colors ${isUnderline ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200/60"}`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setSetting("textAlign", "left")}
              className={`flex-1 flex justify-center items-center py-1.5 rounded-md transition-colors ${textAlign === "left" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200/60"}`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSetting("textAlign", "center")}
              className={`flex-1 flex justify-center items-center py-1.5 rounded-md transition-colors ${textAlign === "center" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200/60"}`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSetting("textAlign", "right")}
              className={`flex-1 flex justify-center items-center py-1.5 rounded-md transition-colors ${textAlign === "right" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200/60"}`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg flex items-center px-2 py-1.5 transition-colors">
              <Type className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
              <select
                value={fontSize}
                onChange={(e) => setSetting("fontSize", e.target.value)}
                className="w-full bg-transparent text-[11px] font-semibold text-zinc-700 outline-none cursor-pointer appearance-none"
              >
                <option value="12px">Small text</option>
                <option value="15px">Medium text</option>
                <option value="18px">Large text</option>
                <option value="24px">Title text</option>
              </select>
            </div>
            <div
              className="relative w-8 h-8 rounded-lg border border-zinc-200 hover:border-zinc-300 flex items-center justify-center overflow-hidden shrink-0 transition-colors"
              title="Color Picker"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-400 absolute pointer-events-none" />
              <input
                type="color"
                value={color}
                onChange={(e) => setSetting("color", e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {isEditing || text.length === 0 ? (
        <textarea
          ref={textareaRef}
          value={text}
          autoFocus
          onChange={(e) => {
            setText(e.target.value);
            onUpdate(e.target.value);
          }}
          style={{
            fontSize,
            color,
            textAlign,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
            textDecoration: isUnderline ? "underline" : "none",
          }}
          className={`w-full h-full bg-transparent resize-none overflow-hidden focus:outline-none leading-relaxed p-1 placeholder-zinc-300 transition-all allow-text-select ${isAiLoading ? "opacity-50 animate-pulse" : ""}`}
          placeholder="Type something or use AI..."
          spellCheck={false}
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={`w-full h-full cursor-text p-1 leading-relaxed allow-text-select ${isAiLoading ? "opacity-50 animate-pulse" : ""}`}
          style={{
            fontSize,
            color,
            textAlign,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
            textDecoration: isUnderline ? "underline" : "none",
          }}
        >
          <div className="space-y-1">
            <ReactMarkdown
              components={{
                strong: ({ ...props }) => (
                  <span className="font-bold" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc ml-4 mt-1" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal ml-4 mt-1" {...props} />
                ),
                li: ({ ...props }) => (
                  <li className="mt-0.5" {...props} />
                ),
                p: ({ ...props }) => (
                  <p className="mb-2 last:mb-0" {...props} />
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsToolbarOpen(!isToolbarOpen)}
        className="absolute -right-2 top-0 opacity-0 group-hover/block:opacity-100 flex items-center justify-center w-6 h-6 bg-white border border-zinc-200 text-zinc-500 rounded-md shadow-sm hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900 transition-colors z-60"
        title="Options"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
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
