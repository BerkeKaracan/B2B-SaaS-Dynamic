"use client";
import React, { useState, useEffect } from "react";
import { BlockContent } from "@/types/record";
import { Settings2, X, Type, Database, ToggleRight } from "lucide-react";
import {
  blockRoot,
  blockControlSurface,
  blockSettingsButton,
  blockSettingsPanel,
  blockSettingsHeader,
  blockSettingsTitle,
  blockSettingsClose,
  blockSettingsFieldLabel,
  blockSettingsInput,
  blockSettingsTextarea,
} from "./blockStyles";

interface ToggleSwitchBlockProps {
  block: BlockContent;
  onUpdate: (value: boolean) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function ToggleSwitchBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: ToggleSwitchBlockProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isActive) setIsSettingsOpen(false);
  }, [isActive]);

  const label = (block.settings?.label as string) ?? "Enable Feature";
  const jsonKey = (block.settings?.jsonKey as string) ?? "feature_enabled";
  const description = (block.settings?.description as string) ?? "";
  const currentValue = (block.value as boolean) || false;

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
          title="Toggle Settings"
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
              <ToggleRight className="w-3.5 h-3.5 text-zinc-400" />
              Toggle Setup
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
              placeholder="e.g. Enable Notifications"
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
              placeholder="e.g. is_enabled"
            />
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
              <Type className="w-3 h-3" /> Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) =>
                onSettingsChange({
                  ...block.settings,
                  description: e.target.value,
                })
              }
              rows={2}
              className={blockSettingsTextarea}
              placeholder="Explain what this does..."
            />
          </div>
        </div>
      )}

      <div
        className={blockControlSurface(isActive)}
        onClick={() => onUpdate(!currentValue)}
        role="switch"
        aria-checked={currentValue}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className={`text-sm font-semibold transition-colors ${
              currentValue ? "text-zinc-900" : "text-zinc-700"
            }`}
          >
            {label}
          </span>
          {description && (
            <span className="text-[11px] font-medium text-zinc-400 leading-tight pr-4">
              {description}
            </span>
          )}
        </div>

        <div className="shrink-0 relative">
          <div
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-out ${
              currentValue ? "bg-zinc-800" : "bg-zinc-200"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-out ${
                currentValue ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
