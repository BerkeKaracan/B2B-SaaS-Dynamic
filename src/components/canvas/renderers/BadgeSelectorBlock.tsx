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
import {
  blockRoot,
  blockLabel,
  blockSettingsButton,
  blockSettingsPanel,
  blockSettingsHeader,
  blockSettingsTitle,
  blockSettingsClose,
  blockSettingsFieldLabel,
  blockSettingsInput,
  blockSettingsTextarea,
  blockPopover,
} from "./blockStyles";

interface BadgeSelectorBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

const getBadgeStyles = (str: string) => {
  const styles = [
    "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200/80",
    "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200/80",
    "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/80",
    "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/80",
    "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200/80",
    "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200/80",
    "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200/80",
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
    options = ["To Do", "In Progress", "Done", "Blocked"];
  }

  const optionsString = options.join(", ");
  const currentValue = (block.value as string) || "";

  return (
    <div className={blockRoot}>
      {onSettingsChange && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(!isSettingsOpen);
          }}
          className={blockSettingsButton(isActive, isSettingsOpen)}
          title="Badge Settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      )}

      {isSettingsOpen && isActive && onSettingsChange && (
        <div
          className={blockSettingsPanel}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className={blockSettingsHeader}>
            <div className={blockSettingsTitle}>
              <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
              Badge Setup
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
              placeholder="e.g. Priority"
            />
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
              <Database className="w-3 h-3" /> JSON Key
            </label>
            <input
              type="text"
              value={jsonKey}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, jsonKey: e.target.value })
              }
              className={`${blockSettingsInput} font-mono`}
              placeholder="e.g. task_priority"
            />
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
              <List className="w-3 h-3" /> Tags (Comma Separated)
            </label>
            <textarea
              value={optionsString}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, options: e.target.value })
              }
              rows={3}
              className={blockSettingsTextarea}
              placeholder="High, Medium, Low"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full items-start">
        {label && <label className={blockLabel}>{label}</label>}

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-semibold transition-colors outline-none ${
                currentValue
                  ? getBadgeStyles(currentValue)
                  : "bg-zinc-50 border-zinc-200 border-dashed text-zinc-500 hover:bg-zinc-100"
              } ${
                isActive
                  ? "ring-2 ring-zinc-900/10 ring-offset-1 ring-offset-white"
                  : ""
              }`}
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
              className={`${blockPopover} min-w-[180px] p-1.5`}
            >
              <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
                {options.length > 0 ? (
                  options.map((opt, idx) => {
                    const badgeClass = getBadgeStyles(opt);
                    const isSelected = currentValue === opt;

                    return (
                      <button
                        key={idx}
                        onClick={() => onUpdate(opt)}
                        className={`flex items-center justify-between w-full text-left px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors outline-none ${
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
