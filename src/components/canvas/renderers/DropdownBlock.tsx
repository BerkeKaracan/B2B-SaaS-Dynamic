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
  blockSettingsTextarea,
  blockPopover,
  blockMenuItem,
} from "./blockStyles";

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
    <div className={blockRoot}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSettingsOpen(!isSettingsOpen);
        }}
        className={blockSettingsButton(isActive, isSettingsOpen)}
        title="Field Settings"
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
              Field Setup
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
              placeholder="e.g. Project Status"
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
              placeholder="e.g. project_status"
            />
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
              <List className="w-3 h-3" /> Options (Comma Separated)
            </label>
            <textarea
              value={optionsString}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, options: e.target.value })
              }
              rows={3}
              className={blockSettingsTextarea}
              placeholder="Todo, In Progress, Done"
            />
          </div>
        </div>
      )}

      <div className={blockFieldStack}>
        {label && <label className={blockLabel}>{label}</label>}

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className={blockField(
                isActive,
                "flex justify-between items-center"
              )}
            >
              <span
                className={
                  currentValue
                    ? "text-zinc-900 font-semibold"
                    : "text-zinc-400"
                }
              >
                {currentValue || "Select an option..."}
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              className={`${blockPopover} w-[var(--radix-popover-trigger-width)] p-1.5`}
            >
              <div className="flex flex-col max-h-48 overflow-y-auto">
                {options.length > 0 ? (
                  options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onUpdate(opt)}
                      className={blockMenuItem(currentValue === opt)}
                    >
                      <span>{opt}</span>
                      {currentValue === opt && (
                        <Check className="w-4 h-4 text-zinc-600" />
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
