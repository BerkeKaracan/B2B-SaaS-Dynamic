"use client";
import React from "react";
import { BlockContent } from "@/types/record";
import * as Popover from "@radix-ui/react-popover";

interface DropdownBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function DropdownBlock({ block, onUpdate, onSettingsChange, isActive }: DropdownBlockProps) {
  const label = (block.settings?.label as string) ?? "Select Option";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_select";

  const optionsString = (block.settings?.options as string) ?? "Option 1, Option 2, Option 3";
  const options = optionsString.split(",").map(opt => opt.trim()).filter(Boolean);

  const currentValue = block.value as string;

  return (
    <div className="w-full space-y-1.5 relative">
      {isActive && (
        <div className="absolute -top-[72px] left-0 flex flex-col gap-1.5 bg-zinc-900 p-2 rounded shadow-md z-30 animate-in fade-in slide-in-from-bottom-1 w-[320px]">
          <div className="flex gap-1.5 items-center">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 w-12">Schema:</span>
            <input
              type="text"
              value={label}
              onChange={(e) => onSettingsChange({ label: e.target.value })}
              placeholder="Label (e.g. Status)"
              className="text-[10px] bg-zinc-800 text-white border-none outline-none px-1.5 py-0.5 rounded flex-1 placeholder:text-zinc-600"
            />
            <input
              type="text"
              value={jsonKey}
              onChange={(e) => {
                const formattedKey = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                onSettingsChange({ jsonKey: formattedKey });
              }}
              placeholder="json_key"
              className="text-[10px] font-mono bg-zinc-800 text-blue-400 border-none outline-none px-1.5 py-0.5 rounded w-24 placeholder:text-zinc-700"
            />
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 w-12">Options:</span>
            <input
              type="text"
              value={optionsString}
              onChange={(e) => onSettingsChange({ options: e.target.value })}
              placeholder="Comma separated (e.g. Active, Pending, Closed)"
              className="text-[10px] bg-zinc-800 text-emerald-400 border-none outline-none px-1.5 py-0.5 rounded flex-1 placeholder:text-zinc-600"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-zinc-400 tracking-wide uppercase">
          {label} <span className="text-[9px] font-mono text-zinc-300 lowercase">({jsonKey})</span>
        </span>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="w-full max-w-[240px] flex items-center justify-between bg-white border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 rounded-md px-3 py-2 text-[13px] transition-all shadow-sm outline-none">
              <span className={currentValue ? "text-zinc-900 font-medium" : "text-zinc-400"}>
                {currentValue || "Select an option..."}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              className="z-50 w-[240px] bg-white border border-zinc-200 shadow-xl rounded-lg p-1 animate-in fade-in zoom-in-95"
            >
              <div className="flex flex-col">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onUpdate(opt)}
                    className="flex items-center justify-between w-full text-left px-2 py-1.5 text-[13px] text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors outline-none"
                  >
                    {opt}
                    {currentValue === opt && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-900">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}