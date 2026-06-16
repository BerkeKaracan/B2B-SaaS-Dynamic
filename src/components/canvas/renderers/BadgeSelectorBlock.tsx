"use client";
import React, { useState, useEffect } from "react";
import { BlockContent } from "@/types/record";
import * as Popover from "@radix-ui/react-popover";
import {
  Settings2,
  X,
  Tag,
  Database,
  Type,
  List,
  Plus,
  Check,
} from "lucide-react";

interface BadgeSelectorBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

const getBadgeStyles = (str: string) => {
  const styles = [
    "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200/80 ring-zinc-500/20",
    "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200/80 ring-blue-500/20",
    "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200/80 ring-emerald-500/20",
    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200/80 ring-amber-500/20",
    "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200/80 ring-rose-500/20",
    "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200/80 ring-purple-500/20",
    "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200/80 ring-indigo-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
};

export default function BadgeSelectorBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: BadgeSelectorBlockProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isActive) setIsSettingsOpen(false);
  }, [isActive]);

  const label = (block.settings?.label as string) ?? "Status";
  const jsonKey = (block.settings?.jsonKey as string) ?? "status_key";
  const optionsString =
    (block.settings?.options as string) ?? "To Do, In Progress, Done, Blocked";
  const options = optionsString
    .split(",")
    .map((opt) => opt.trim())
    .filter(Boolean);
  const currentValue = (block.value as string) || "";

  return (
    <div className="relative w-full h-full flex flex-col justify-center">
      {onSettingsChange && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(!isSettingsOpen);
          }}
          className={`absolute -right-2.5 -top-4 z-20 flex items-center justify-center w-7 h-7 bg-white border border-zinc-200/80 rounded-full shadow-sm hover:bg-zinc-50 transition-all duration-200 ${
            isActive ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${isSettingsOpen ? "text-indigo-600 border-indigo-200 ring-2 ring-indigo-500/10" : "text-zinc-400"}`}
          title="Badge Settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      )}

      {isSettingsOpen && isActive && onSettingsChange && (
        <div
          className="absolute top-0 -right-4 translate-x-full w-[260px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-4 z-[100] animate-in slide-in-from-left-2 fade-in duration-200 cursor-default"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Badge Setup
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-zinc-400 hover:text-zinc-800 transition-colors p-1 rounded-md hover:bg-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Type className="w-3 h-3" /> Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, label: e.target.value })
              }
              className="w-full bg-zinc-50/50 border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-zinc-300"
              placeholder="e.g. Priority"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-3 h-3" /> JSON Key
            </label>
            <input
              type="text"
              value={jsonKey}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, jsonKey: e.target.value })
              }
              className="w-full bg-zinc-50/50 border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-zinc-300"
              placeholder="e.g. task_priority"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <List className="w-3 h-3" /> Tags (Comma Separated)
            </label>
            <textarea
              value={optionsString}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, options: e.target.value })
              }
              rows={3}
              className="w-full bg-zinc-50/50 border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none placeholder:text-zinc-300"
              placeholder="High, Medium, Low"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 w-full items-start">
        {label && (
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-1">
            {label}
          </label>
        )}

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-bold transition-all outline-none ${
                currentValue
                  ? getBadgeStyles(currentValue)
                  : "bg-zinc-50 border-zinc-200/80 text-zinc-500 hover:bg-zinc-100 border-dashed"
              } ${isActive ? "ring-4" : ""}`}
            >
              {currentValue ? (
                <>
                  <Tag className="w-3 h-3 opacity-60" />
                  <span>{currentValue}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Label</span>
                </>
              )}
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={8}
              className="z-[100] min-w-[180px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
            >
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                {options.length > 0 ? (
                  options.map((opt, idx) => {
                    const badgeClass = getBadgeStyles(opt);
                    const isSelected = currentValue === opt;

                    return (
                      <button
                        key={idx}
                        onClick={() => onUpdate(opt)}
                        className={`flex items-center justify-between w-full text-left px-2 py-1.5 text-xs font-bold rounded-xl transition-colors outline-none ${
                          isSelected ? "bg-zinc-100" : "hover:bg-zinc-50"
                        }`}
                      >
                        <div
                          className={`px-2.5 py-1 border rounded-md ${badgeClass}`}
                        >
                          {opt}
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-zinc-500 mr-1" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-xs font-medium text-zinc-400 text-center">
                    No labels found.
                  </div>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
