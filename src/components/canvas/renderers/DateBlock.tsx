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
            placeholder="Label (e.g. Birth Date)"
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

        {/* PREMIUM RADIX POPOVER + CALENDAR */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className={`w-full max-w-[240px] flex items-center gap-2.5 bg-white border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 rounded-md px-3 py-2 text-[13px] transition-all shadow-sm outline-none ${
                !dateValue ? "text-zinc-400" : "text-zinc-900 font-medium"
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
              {dateValue
                ? format(dateValue, "MMMM d, yyyy")
                : "Select a date..."}
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              className="z-50 bg-white border border-zinc-200 shadow-xl rounded-xl p-3 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
            >
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                    onUpdate(localDate);
                  } else {
                    onUpdate("");
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
