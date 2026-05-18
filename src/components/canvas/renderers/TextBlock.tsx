"use client";
import React, { useState, useRef, useEffect } from "react";
import { BlockContent } from "@/types/record";

interface TextBlockProps {
  block: BlockContent;
  onUpdate: (val: string) => void;
}

export default function TextBlock({ block, onUpdate }: TextBlockProps) {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [block.value]);

  const textValue = typeof block.value === "string" ? block.value : "";

  return (
    <div className="relative w-full group/text">
      <div className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 p-0 border-none focus:ring-0 text-[15px] leading-relaxed text-zinc-800 bg-transparent outline-none resize-none overflow-hidden placeholder:text-zinc-300"
          value={textValue}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Start typing your content..."
          rows={1}
        />
        <button
          type="button"
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          className="p-1 opacity-0 group-hover/text:opacity-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-all shrink-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {showStyleMenu && (
        <div className="absolute right-0 top-7 z-30 w-40 bg-white border border-zinc-200/80 shadow-xl rounded-xl p-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">
            Text Styles
          </p>
          <button
            type="button"
            className="w-full text-left text-[12px] font-medium px-2 py-1.5 hover:bg-zinc-50 text-zinc-700 rounded-lg transition-colors"
          >
            Bold
          </button>
          <button
            type="button"
            className="w-full text-left text-[12px] font-medium px-2 py-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          >
            Red Text
          </button>
          <button
            type="button"
            className="w-full text-left text-[12px] font-medium px-2 py-1.5 hover:bg-zinc-50 text-zinc-700 rounded-lg transition-colors"
          >
            Small Font
          </button>
        </div>
      )}
    </div>
  );
}
