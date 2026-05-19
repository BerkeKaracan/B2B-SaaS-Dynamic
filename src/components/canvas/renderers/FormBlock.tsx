"use client";
import React from "react";
import { BlockContent } from "@/types/record";

interface FormBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function FormBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: FormBlockProps) {
  const label = (block.settings?.label as string) ?? "New Field";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_field";
  const inputType = (block.settings?.inputType as string) ?? "text";
  const placeholderText =
    (block.settings?.placeholderText as string) ?? "Enter content...";
  const isRequired = (block.settings?.isRequired as boolean) ?? false;
  const inputValue = (block.value as string) || "";

  return (
    <div className="w-full relative space-y-2">
      {isActive && (
        <div className="flex flex-col gap-2 bg-zinc-50 border border-zinc-200/60 rounded-xl p-2 max-w-max mb-3 animate-in fade-in slide-in-from-top-1 duration-150 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 w-14">
              Schema:
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => onSettingsChange({ label: e.target.value })}
              placeholder="Label"
              className="text-[11px] font-semibold bg-white border border-zinc-200 rounded-lg px-2 py-1 w-28 text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
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
              className="text-[11px] font-mono bg-white border border-zinc-200 rounded-lg px-2 py-1 w-28 text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 w-14">
              Config:
            </span>
            <select
              value={inputType}
              onChange={(e) => onSettingsChange({ inputType: e.target.value })}
              className="text-[11px] font-medium bg-white border border-zinc-200 rounded-lg px-2 py-1 w-28 text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer appearance-none"
            >
              <option value="text">Text (String)</option>
              <option value="number">Number</option>
              <option value="email">Email Address</option>
              <option value="password">Password</option>
              <option value="url">URL Link</option>
            </select>
            <input
              type="text"
              value={placeholderText}
              onChange={(e) =>
                onSettingsChange({ placeholderText: e.target.value })
              }
              placeholder="Placeholder"
              className="text-[11px] bg-white border border-zinc-200 rounded-lg px-2 py-1 w-28 text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
            />
            <label className="flex items-center gap-1.5 cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) =>
                  onSettingsChange({ isRequired: e.target.checked })
                }
                className="w-3 h-3 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                Required
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase select-none flex items-center gap-1.5">
          <span>{label || "Untitled Field"}</span>
          {isRequired && (
            <span className="text-red-500 text-[14px] leading-none mt-1">
              *
            </span>
          )}
          <span className="text-[9px] font-mono text-zinc-300 lowercase font-normal">
            ({jsonKey || "no_key"})
          </span>
        </label>
        <input
          type={inputType}
          value={inputValue}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder={placeholderText}
          className="w-full p-0 py-1 bg-transparent border-b border-zinc-200 hover:border-zinc-400 focus:border-zinc-900 text-[14px] text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-0 transition-colors"
        />
      </div>
    </div>
  );
}
