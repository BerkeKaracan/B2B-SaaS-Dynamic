"use client";
import React, { useState, useEffect } from "react";
import { BlockContent } from "@/types/record";
import * as Popover from "@radix-ui/react-popover";
import {
  ChevronDown,
  Check,
  Type,
  Database,
  List,
  Settings2,
  X,
} from "lucide-react";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSettingsOpen(false);
    }
  }, [isActive]);

  const label = (block.settings?.label as string) ?? "Select Option";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_select";

  let options: string[] = [];
  const rawOptions = block.settings?.options;

  if (Array.isArray(rawOptions)) {
    options = rawOptions.map((opt) => String(opt).trim()).filter(Boolean);
  } else if (typeof rawOptions === "string" && rawOptions.trim() !== "") {
    options = rawOptions
      .split(",")
      .map((opt) => opt.trim())
      .filter(Boolean);
  } else {
    options = ["Option 1", "Option 2", "Option 3"];
  }

  const optionsString = options.join(", ");
  const currentValue = (block.value as string) || "";

  return (
    <div className="relative w-full h-full flex flex-col justify-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSettingsOpen(!isSettingsOpen);
        }}
        className={`absolute -right-2.5 -top-4 z-20 flex items-center justify-center w-7 h-7 bg-white border border-zinc-200/80 rounded-full shadow-sm hover:bg-zinc-50 transition-all duration-200 ${
          isActive ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${isSettingsOpen ? "text-indigo-600 border-indigo-200 ring-2 ring-indigo-500/10" : "text-zinc-400"}`}
        title="Field Settings"
      >
        <Settings2 className="w-3.5 h-3.5" />
      </button>

      {isSettingsOpen && isActive && (
        <div
          className="absolute top-0 -right-4 translate-x-full w-[260px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-4 z-[100] animate-in slide-in-from-left-2 fade-in duration-200 cursor-default"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Field Setup
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
              placeholder="e.g. Project Status"
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
              placeholder="e.g. project_status"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <List className="w-3 h-3" /> Options (Comma Separated)
            </label>
            <textarea
              value={optionsString}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, options: e.target.value })
              }
              rows={3}
              className="w-full bg-zinc-50/50 border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none placeholder:text-zinc-300"
              placeholder="Todo, In Progress, Done"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-1">
            {label}
          </label>
        )}

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-sm font-medium flex justify-between items-center transition-all outline-none ${
                isActive
                  ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm"
                  : "border-zinc-200/80 text-zinc-700 shadow-sm hover:border-zinc-300 hover:shadow"
              }`}
            >
              <span
                className={
                  currentValue ? "text-zinc-900 font-bold" : "text-zinc-400"
                }
              >
                {currentValue || "Select an option..."}
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-indigo-500" />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              className="z-[100] w-[var(--radix-popover-trigger-width)] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-xl p-1.5 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
            >
              <div className="flex flex-col max-h-48 overflow-y-auto">
                {options.length > 0 ? (
                  options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onUpdate(opt)}
                      className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg transition-colors outline-none ${
                        currentValue === opt
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-zinc-700 hover:bg-zinc-100/80 font-medium"
                      }`}
                    >
                      <span>{opt}</span>
                      {currentValue === opt && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-xs font-medium text-zinc-400 text-center">
                    No options available
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
