"use client";
import React from "react";
import { BlockContent } from "@/types/record";

interface ToggleSwitchBlockProps {
  block: BlockContent;
  onUpdate: (value: boolean) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function ToggleSwitchBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: ToggleSwitchBlockProps) {
  const label = (block.settings?.label as string) ?? "Toggle Switch";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_toggle";
  const isChecked = Boolean(block.value);

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

      <div className="flex items-center justify-between py-1 border-b border-zinc-100 hover:border-zinc-200 transition-colors">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-zinc-800 tracking-tight">
            {label || "Untitled Toggle"}
          </span>
          <span className="text-[9px] font-mono text-zinc-400 lowercase font-normal">
            ({jsonKey || "no_key"})
          </span>
        </div>
        <button
          type="button"
          onClick={() => onUpdate(!isChecked)}
          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
            isChecked ? "bg-zinc-900" : "bg-zinc-200"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${
              isChecked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
