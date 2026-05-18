"use client";
import React from "react";
import { BlockContent } from "@/types/record";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

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
  const label = (block.settings?.label as string) ?? "Date Field";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_date";
  const dateValue = block.value ? new Date(block.value as string) : undefined;

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

      <div className="flex flex-col gap-1 items-start">
        <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase select-none flex items-center gap-1.5">
          <span>{label || "Untitled Date"}</span>
          <span className="text-[9px] font-mono text-zinc-300 lowercase font-normal">
            ({jsonKey || "no_key"})
          </span>
        </label>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 py-1 bg-transparent border-b border-zinc-100 hover:border-zinc-200 text-[14px] text-zinc-800 transition-colors outline-none w-full text-left"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span
                className={
                  !dateValue ? "text-zinc-300" : "text-zinc-800 font-medium"
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
              sideOffset={4}
              className="z-50 bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-3 animate-in fade-in zoom-in-95"
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
