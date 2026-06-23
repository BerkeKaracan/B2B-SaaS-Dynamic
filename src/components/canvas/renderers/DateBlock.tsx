"use client";
import React, { useState, useEffect } from "react";
import { BlockContent } from "@/types/record";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Settings2,
  X,
  Type,
  Database,
} from "lucide-react";

interface DateBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function DateBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: DateBlockProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isActive) setIsSettingsOpen(false);
  }, [isActive]);

  const label = (block.settings?.label as string) ?? "Date Field";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_date";

  let dateValue: Date | undefined = undefined;
  if (block.value && typeof block.value === "string") {
    const parsedDate = new Date(block.value);
    if (!isNaN(parsedDate.getTime())) {
      dateValue = parsedDate;
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-center group/block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSettingsOpen(!isSettingsOpen);
        }}
        className={`absolute -right-2.5 -top-4 z-20 flex items-center justify-center w-7 h-7 bg-white border border-zinc-200/80 rounded-full shadow-sm hover:bg-zinc-50 transition-all duration-200 ${
          isActive ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${isSettingsOpen ? "text-indigo-600 border-indigo-200 ring-2 ring-indigo-500/10" : "text-zinc-400"}`}
        title="Date Settings"
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
                Date Setup
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
              placeholder="e.g. Deadline"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-3 h-3" /> JSON Key
            </label>
            <input
              type="text"
              value={jsonKey}
              onChange={(e) => {
                const formattedKey = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "_");
                onSettingsChange({ ...block.settings, jsonKey: formattedKey });
              }}
              className="w-full bg-zinc-50/50 border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-zinc-300"
              placeholder="e.g. custom_date"
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
              type="button"
              className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all outline-none ${
                isActive
                  ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm"
                  : "border-zinc-200/80 shadow-sm hover:border-zinc-300 hover:shadow"
              }`}
            >
              <CalendarIcon
                className={`w-4 h-4 transition-colors ${dateValue ? "text-indigo-500" : "text-zinc-400"}`}
              />
              <span
                className={
                  !dateValue ? "text-zinc-400" : "text-zinc-900 font-bold"
                }
              >
                {dateValue
                  ? format(dateValue, "MMMM d, yyyy")
                  : "Select a date..."}
              </span>
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              onPointerDown={(e) => e.stopPropagation()}
              className="z-[100] bg-white border border-zinc-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-3 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
            >
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    const localDate = new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .split("T")[0];
                    onUpdate(localDate);
                  }
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
