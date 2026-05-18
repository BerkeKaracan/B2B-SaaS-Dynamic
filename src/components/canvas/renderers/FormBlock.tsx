"use client";
import React from "react";
import { BlockContent } from "@/types/record";

interface FormBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function FormBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: FormBlockProps) {
  const label = (block.settings?.label as string) ?? "New Field";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_field";
  const inputValue = (block.value as string) || "";

  return (
    <div className="w-full relative space-y-2">
      {isActive && (
        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/60 rounded-xl p-1.5 px-2.5 max-w-max mb-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
            Schema:
          </span>
          <input
            type="text"
            value={label}
            onChange={(e) => onSettingsChange({ label: e.target.value })}
            placeholder="Label"
            className="text-[11px] font-semibold bg-white border border-zinc-200 rounded-lg px-2 py-0.5 w-28 text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
          />
          <input
            type="text"
            value={jsonKey}
            onChange={(e) => {
              const formattedKey = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_");
              onSettingsChange({ jsonKey: formattedKey });
            }}
            placeholder="json_key"
            className="text-[11px] font-mono bg-white border border-zinc-200 rounded-lg px-2 py-0.5 w-28 text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase select-none flex items-center gap-1.5">
          <span>{label || "Untitled Field"}</span>
          <span className="text-[9px] font-mono text-zinc-300 lowercase font-normal">
            ({jsonKey || "no_key"})
          </span>
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Enter content..."
          className="w-full p-0 py-1 bg-transparent border-b border-zinc-100 hover:border-zinc-200 focus:border-zinc-900 text-[14px] text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-0 transition-colors"
        />
      </div>
    </div>
  );
}
