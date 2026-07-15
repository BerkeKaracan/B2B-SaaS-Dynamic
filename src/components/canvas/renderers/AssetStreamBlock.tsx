"use client";
import React, { useState, useEffect } from "react";
import { BlockContent } from "@/types/record";
import { createClient } from "@supabase/supabase-js";
import {
  Loader2,
  Settings2,
  X,
  Type,
  Database,
  Link as LinkIcon,
  FileBox,
  UploadCloud,
  Trash2,
} from "lucide-react";
import {
  blockRoot,
  blockLabel,
  blockAssetWell,
  blockSettingsButton,
  blockSettingsPanel,
  blockSettingsHeader,
  blockSettingsTitle,
  blockSettingsClose,
  blockSettingsFieldLabel,
  blockSettingsInput,
} from "./blockStyles";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isActive) setIsSettingsOpen(false);
  }, [isActive]);

  const label = (block.settings?.label as string) ?? "Asset Stream";
  const jsonKey = (block.settings?.jsonKey as string) ?? "custom_asset";
  const currentAsset = (block.value as string) || "";

  const uploadFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        alert("Supabase Error: URL or Key is missing in .env files.");
        setIsUploading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const fileExtension = file.name.split(".").pop();
      const randomText = Math.random().toString(36).substring(2, 10);
      const safeFileName = `${Date.now()}_${randomText}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(safeFileName, file);

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        alert(`Upload failed: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("assets")
        .getPublicUrl(safeFileName);

      onUpdate(data.publicUrl);
    } catch (error) {
      console.error("Upload exception:", error);
      alert("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const isImage =
    currentAsset.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)(\?.*)?$/i) != null;

  return (
    <div className={blockRoot}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSettingsOpen(!isSettingsOpen);
        }}
        className={blockSettingsButton(isActive, isSettingsOpen)}
        title="Asset Settings"
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
              Asset Setup
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
              placeholder="e.g. Design File"
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
              placeholder="e.g. design_file"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full h-full">
        {label && <label className={blockLabel}>{label}</label>}

        <div
          className={blockAssetWell(isActive, isDragging)}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-600 z-10 pointer-events-none">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Uploading...
              </span>
            </div>
          ) : currentAsset ? (
            isImage ? (
              <div className="w-full h-full relative group/img z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentAsset}
                  alt={label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-3 transition-opacity backdrop-blur-sm">
                  <a
                    href={currentAsset}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-white hover:scale-105 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white/20 p-2 rounded-full">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold">Open</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate("");
                    }}
                    className="flex flex-col items-center gap-1 text-red-300 hover:text-red-200 hover:scale-105 transition-transform"
                  >
                    <div className="bg-red-500/20 p-2 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold">Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-4 group/doc relative z-10">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-zinc-200 mb-2 group-hover/doc:scale-105 transition-transform">
                  <FileBox className="w-6 h-6 text-zinc-600" />
                </div>
                <span className="text-xs font-semibold text-zinc-700 truncate max-w-[90%] text-center">
                  Attached Document
                </span>

                <div className="absolute inset-0 bg-white/95 opacity-0 group-hover/doc:opacity-100 flex items-center justify-center gap-4 transition-opacity backdrop-blur-sm">
                  <a
                    href={currentAsset}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-zinc-100 text-zinc-700 rounded-full hover:bg-zinc-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    title="Open Document"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate("");
                    }}
                    className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                    title="Remove Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ) : (
            <>
              <input
                type="file"
                onChange={handleFileChange}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                title="Click or Drag to Upload"
              />
              <div className="flex flex-col items-center gap-2 p-4 text-center pointer-events-none opacity-70 z-10">
                <UploadCloud
                  className={`w-8 h-8 ${
                    isDragging ? "text-zinc-700" : "text-zinc-400"
                  }`}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-600">
                    Click or drop file
                  </span>
                  <span className="text-[10px] text-zinc-400 max-w-[150px]">
                    Supabase Storage Ready
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
