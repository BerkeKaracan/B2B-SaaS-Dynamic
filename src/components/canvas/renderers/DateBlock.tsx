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
import {
  blockRoot,
  blockFieldStack,
  blockLabel,
  blockField,
  blockSettingsButton,
  blockSettingsPanel,
  blockSettingsHeader,
  blockSettingsTitle,
  blockSettingsClose,
  blockSettingsFieldLabel,
  blockSettingsInput,
  blockPopover,
} from "./blockStyles";

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
    <div className={blockRoot}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSettingsOpen(!isSettingsOpen);
        }}
        className={blockSettingsButton(isActive, isSettingsOpen)}
        title="Date Settings"
      >
        <Settings2 className="w-3.5 h-3.5" />
      </button>

      {isSettingsOpen && isActive && (
        <div
          className={blockSettingsPanel}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className={blockSettingsHeader}>
            <div className={blockSettingsTitle}>
              <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
              Date Setup
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className={blockSettingsClose}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
              <Type className="w-3 h-3" /> Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, label: e.target.value })
              }
              className={blockSettingsInput}
              placeholder="e.g. Deadline"
            />
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
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
              className={`${blockSettingsInput} font-mono`}
              placeholder="e.g. custom_date"
            />
          </div>
        </div>
      )}

      <div className={blockFieldStack}>
        {label && <label className={blockLabel}>{label}</label>}

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={blockField(isActive, "flex items-center gap-2.5")}
            >
              <CalendarIcon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  dateValue ? "text-zinc-600" : "text-zinc-400"
                }`}
              />
              <span
                className={
                  !dateValue ? "text-zinc-400" : "text-zinc-900 font-semibold"
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
              className={`${blockPopover} p-3`}
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
