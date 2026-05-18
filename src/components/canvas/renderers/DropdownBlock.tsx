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

export default function DropdownBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: DropdownBlockProps) {
  const label = (block.settings?.label as string) ?? "Select Option";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_select";
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

      <div className="flex flex-col gap-1 items-start">
        <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase select-none flex items-center gap-1.5">
          <span>{label || "Untitled Dropdown"}</span>
          <span className="text-[9px] font-mono text-zinc-300 lowercase font-normal">
            ({jsonKey || "no_key"})
          </span>
        </label>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="flex items-center justify-between py-1 bg-transparent border-b border-zinc-100 hover:border-zinc-200 text-[14px] text-zinc-800 transition-colors outline-none w-full text-left"
            >
              <span
                className={
                  !currentValue ? "text-zinc-300" : "text-zinc-800 font-medium"
                }
              >
                {currentValue || "Select an option..."}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-zinc-400"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              className="z-50 w-[240px] bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-1 animate-in fade-in zoom-in-95"
            >
              <div className="flex flex-col">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onUpdate(opt)}
                    className="flex items-center justify-between w-full text-left px-2 py-1.5 text-[13px] text-zinc-800 hover:bg-zinc-50 rounded-lg transition-colors outline-none"
                  >
                    <span>{opt}</span>
                    {currentValue === opt && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-zinc-900"
                      >
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
