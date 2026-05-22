"use client";
import React, { useRef, useState } from "react";
import { BlockContent } from "@/types/record";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

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

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          "Supabase credentials missing in environment variables",
        );
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(fileName);

      onUpdate(urlData.publicUrl);
    } catch (error) {
      console.error("Upload Error:", error);
      alert(
        "Upload failed. Make sure the 'assets' bucket exists and is public in Supabase.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isImage =
    currentAsset.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null;

  return (
    <div className="w-full relative space-y-2">
      {isActive && (
        <div className="flex flex-wrap items-center gap-2 bg-zinc-50 border border-zinc-200/60 rounded-xl p-1.5 px-2.5 mb-2 animate-in fade-in slide-in-from-top-1 duration-150">
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
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
        />

        {!currentAsset ? (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 py-2 mt-1 text-[12px] font-medium text-zinc-400 hover:text-zinc-950 transition-colors outline-none group/btn w-full text-left disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-zinc-300 group-hover/btn:text-zinc-950 transition-colors shrink-0"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
            <span className="truncate">
              {isUploading
                ? "Uploading to secure cloud..."
                : "Click to stream cloud asset..."}
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 mt-2 animate-in fade-in duration-150">
            {isImage ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200/80 bg-zinc-50 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentAsset}
                  alt="Asset Preview"
                  className="max-h-48 w-auto rounded-lg object-contain shadow-sm"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-zinc-50/60 border border-zinc-200/40 rounded-xl p-2 min-w-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-blue-500 shrink-0"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <a
                  href={currentAsset}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
                >
                  View Cloud Document
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => onUpdate("")}
              className="flex items-center gap-1.5 py-1 text-[11px] font-bold text-zinc-400 hover:text-red-600 transition-colors w-max"
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
              Remove Asset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
