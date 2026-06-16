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
    <div className="relative w-full h-full flex flex-col justify-center group/block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSettingsOpen(!isSettingsOpen);
        }}
        className={`absolute -right-2.5 -top-4 z-20 flex items-center justify-center w-7 h-7 bg-white border border-zinc-200/80 rounded-full shadow-sm hover:bg-zinc-50 transition-all duration-200 ${
          isActive ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${isSettingsOpen ? "text-indigo-600 border-indigo-200 ring-2 ring-indigo-500/10" : "text-zinc-400"}`}
        title="Asset Settings"
      >
        <Settings2 className="w-3.5 h-3.5" />
      </button>

      {isSettingsOpen && isActive && (
        <div
          className="absolute top-0 -right-4 translate-x-full w-[260px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-4 z-[100] animate-in slide-in-from-left-2 fade-in duration-200 cursor-default"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Asset Setup
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-zinc-400 hover:text-zinc-800 transition-colors p-1 rounded-md hover:bg-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Type className="w-3 h-3" /> Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, label: e.target.value })
              }
              className="w-full bg-zinc-50/50 border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-zinc-300"
              placeholder="e.g. Design File"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-3 h-3" /> JSON Key
            </label>
            <input
              type="text"
              value={jsonKey}
              onChange={(e) =>
                onSettingsChange({ ...block.settings, jsonKey: e.target.value })
              }
              className="w-full bg-zinc-50/50 border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-zinc-300"
              placeholder="e.g. design_file"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full h-full">
        {label && (
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-1">
            {label}
          </label>
        )}

        <div
          className={`relative flex-1 w-full flex flex-col items-center justify-center rounded-xl transition-all overflow-hidden bg-zinc-50 border-2 ${
            isDragging
              ? "border-indigo-500 border-dashed bg-indigo-50/50"
              : isActive
                ? "border-indigo-500 border-solid ring-4 ring-indigo-500/10 shadow-sm"
                : "border-zinc-200 border-dashed hover:border-zinc-300 hover:bg-zinc-100/50"
          }`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-indigo-500 z-10 pointer-events-none">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
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
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white/20 p-2 rounded-full">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold">Open</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate("");
                    }}
                    className="flex flex-col items-center gap-1 text-red-300 hover:text-red-400 hover:scale-110 transition-transform"
                  >
                    <div className="bg-red-500/20 p-2 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold">Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-4 group/doc relative z-10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-200 mb-2 group-hover/doc:scale-110 transition-transform">
                  <FileBox className="w-6 h-6 text-indigo-500" />
                </div>
                <span className="text-xs font-bold text-zinc-700 truncate max-w-[90%] text-center">
                  Attached Document
                </span>

                <div className="absolute inset-0 bg-white/95 opacity-0 group-hover/doc:opacity-100 flex items-center justify-center gap-4 transition-opacity backdrop-blur-sm">
                  <a
                    href={currentAsset}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
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
              <div className="flex flex-col items-center gap-2 p-4 text-center pointer-events-none opacity-60 z-10">
                <UploadCloud
                  className={`w-8 h-8 ${isDragging ? "text-indigo-500 animate-bounce" : "text-zinc-400"}`}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-600">
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
