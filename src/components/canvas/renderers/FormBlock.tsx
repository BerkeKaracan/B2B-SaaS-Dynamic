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

  return (
    <div className="w-full space-y-1.5 relative">
      {isActive && (
        <div className="absolute -top-9 left-0 flex gap-1.5 items-center bg-zinc-900 p-1.5 px-2 rounded shadow-md z-30 animate-in fade-in slide-in-from-bottom-1">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
            Schema:
          </span>
          <input
            type="text"
            value={label}
            onChange={(e) => onSettingsChange({ label: e.target.value })}
            placeholder="Label (e.g. Price)"
            className="text-[10px] bg-zinc-800 text-white border-none outline-none px-1.5 py-0.5 rounded w-28 placeholder:text-zinc-600"
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
            className="text-[10px] font-mono bg-zinc-800 text-blue-400 border-none outline-none px-1.5 py-0.5 rounded w-24 placeholder:text-zinc-700"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-zinc-400 tracking-wide uppercase">
          {label || "..."}{" "}
          <span className="text-[9px] font-mono text-zinc-300 lowercase">
            ({jsonKey || "..."})
          </span>
        </span>
        <input
          type="text"
          value={(block.value as string) || ""}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder={`Enter ${label ? label.toLowerCase() : "value"}...`}
          className="w-full bg-transparent border-b border-zinc-100 py-1 text-sm text-zinc-800 outline-none focus:border-zinc-900 transition-colors"
        />
      </div>
    </div>
  );
}
