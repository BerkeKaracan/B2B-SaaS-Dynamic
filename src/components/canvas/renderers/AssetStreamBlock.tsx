"use client";
import React, { useRef } from "react";
import { BlockContent } from "@/types/record";

interface AssetStreamBlockProps {
  block: BlockContent;
  onUpdate: (value: string) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  isActive: boolean;
}

export default function AssetStreamBlock({
  block,
  onUpdate,
  onSettingsChange,
  isActive,
}: AssetStreamBlockProps) {
  const label = (block.settings?.label as string) ?? "Asset Stream";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_asset";
  const currentAsset = (block.value as string) || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate(file.name);
    }
  };

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

      <div className="flex flex-col gap-1 py-1 border-b border-b-zinc-100 hover:border-b-zinc-200 transition-colors">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-zinc-800 tracking-tight">
            {label || "Untitled Asset Stream"}
          </span>
          <span className="text-[9px] font-mono text-zinc-400 lowercase font-normal">
            ({jsonKey || "no_key"})
          </span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {!currentAsset ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 py-2 mt-1 text-[12px] font-medium text-zinc-400 hover:text-zinc-950 transition-colors outline-none group/btn w-full text-left"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-zinc-300 group-hover/btn:text-zinc-950 transition-colors"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Click to stream cloud asset...</span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-zinc-50/60 border border-zinc-200/40 rounded-xl p-2 mt-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-zinc-500 shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-[12px] font-medium text-zinc-700 truncate">
                {currentAsset}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onUpdate("")}
              className="p-1 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50/50 transition-all shrink-0"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
