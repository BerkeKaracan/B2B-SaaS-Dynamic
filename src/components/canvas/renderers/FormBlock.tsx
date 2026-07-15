"use client";
import React, { useState, useEffect } from "react";
import { BlockContent } from "@/types/record";
import { Settings2, X, Type, Database, Hash, AlignLeft } from "lucide-react";
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
  blockSettingsSelect,
} from "./blockStyles";

interface FormBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function FormBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: FormBlockProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isActive) setIsSettingsOpen(false);
  }, [isActive]);

  const label = (block.settings?.label as string) ?? "Field Label";
  const jsonKey = (block.settings?.jsonKey as string) ?? "field_key";
  const placeholder =
    (block.settings?.placeholder as string) ?? "Enter value...";
  const inputType = (block.settings?.inputType as string) ?? "text";
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
          title="Input Settings"
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
              Input Setup
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
              placeholder="e.g. Email Address"
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
              placeholder="e.g. user_email"
            />
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
              <AlignLeft className="w-3 h-3" /> Placeholder
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) =>
                onSettingsChange({
                  ...block.settings,
                  placeholder: e.target.value,
                })
              }
              className={blockSettingsInput}
              placeholder="e.g. john@doe.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className={blockSettingsFieldLabel}>
              <Hash className="w-3 h-3" /> Input Type
            </label>
            <select
              value={inputType}
              onChange={(e) =>
                onSettingsChange({
                  ...block.settings,
                  inputType: e.target.value,
                })
              }
              className={blockSettingsSelect}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
            </select>
          </div>
        </div>
      )}

      <div className={blockFieldStack}>
        {label && <label className={blockLabel}>{label}</label>}

        <input
          type={inputType}
          value={currentValue}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder={placeholder}
          className={blockField(isActive)}
        />
      </div>
    </div>
  );
}
