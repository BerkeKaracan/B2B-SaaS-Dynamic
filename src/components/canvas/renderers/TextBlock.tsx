"use client";
import React, { useState, useRef, useEffect } from "react";
import { BlockContent } from "@/types/record";

export default function TextBlock({
  block,
  onUpdate,
}: {
  block: BlockContent;
  onUpdate: (val: string) => void;
}) {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [block.value]);

  return (
    <div className="group relative w-full">
      <div className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 p-0 border-none focus:ring-0 text-[15px] leading-relaxed text-zinc-800 resize-none overflow-hidden bg-transparent outline-none placeholder:text-zinc-300"
          value={typeof block.value === "string" ? block.value : ""}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Start typing your content..."
          rows={1}
        />
        <button
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          className="p-1 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-900 transition-all rounded"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {showStyleMenu && (
        <div className="absolute right-0 top-6 z-20 w-40 bg-white border border-zinc-200 shadow-xl rounded-lg p-2 flex flex-col gap-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase px-2 mb-1">
            Text Styles
          </p>
          <button className="text-left text-[11px] font-medium px-2 py-1.5 hover:bg-zinc-100 rounded transition-colors">
            Bold
          </button>
          <button className="text-left text-[11px] font-medium px-2 py-1.5 hover:bg-zinc-100 rounded transition-colors text-red-500">
            Red Text
          </button>
          <button className="text-left text-[11px] font-medium px-2 py-1.5 hover:bg-zinc-100 rounded transition-colors">
            Small Font
          </button>
        </div>
      )}
    </div>
  );
}
