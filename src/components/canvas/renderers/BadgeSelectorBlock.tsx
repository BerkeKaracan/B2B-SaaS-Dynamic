"use client";
import React from "react";
import { BlockContent } from "@/types/record";

interface BadgeSelectorBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function BadgeSelectorBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: BadgeSelectorBlockProps) {
  const label = (block.settings?.label as string) ?? "Badge Selector";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_badge";
  const optionsString =
    (block.settings?.options as string) ?? "Option 1, Option 2, Option 3";
  const options = optionsString
    .split(",")
    .map((opt) => opt.trim())
    .filter(Boolean);
  const currentValue = (block.value as string) || "";

  return (
    <div className="w-full relative space-y-2">
      {isActive && (
        <div className="flex flex-col gap-2 bg-zinc-50 border border-zinc-200/60 rounded-xl p-2 max-w-md mb-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
              Options:
            </span>
            <input
              type="text"
              value={optionsString}
              onChange={(e) => onSettingsChange({ options: e.target.value })}
              placeholder="Comma separated options..."
              className="flex-1 text-[11px] bg-white border border-zinc-200 rounded-lg px-2 py-0.5 text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 py-1 border-b border-zinc-100 hover:border-zinc-200 transition-colors">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-zinc-800 tracking-tight">
            {label || "Untitled Selector"}
          </span>
          <span className="text-[9px] font-mono text-zinc-400 lowercase font-normal">
            ({jsonKey || "no_key"})
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {options.map((option, index) => {
            const isSelected = currentValue === option;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onUpdate(isSelected ? "" : option)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all duration-150 focus:outline-none ${
                  isSelected
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-sm"
                    : "bg-zinc-50/60 border-zinc-200/60 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {option}
              </button>
            );
          })}
          {options.length === 0 && (
            <span className="text-zinc-300 text-[11px] italic">
              No options defined
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
