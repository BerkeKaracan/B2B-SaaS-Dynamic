"use client";
import React, { useRef, useState, useEffect } from "react";
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase credentials missing.");
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("canvas_assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("canvas_assets")
        .getPublicUrl(filePath);

      onUpdate(data.publicUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload asset.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !isUploading) uploadFile(file);
  };

  const isImage =
    currentAsset.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)(\?.*)?$/i) != null;

  return (
    <div className="relative w-full h-full flex flex-col justify-center group/block">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

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
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!currentAsset && !isUploading) fileInputRef.current?.click();
          }}
          className={`relative flex-1 w-full flex flex-col items-center justify-center rounded-xl transition-all overflow-hidden bg-zinc-50 border-2 ${
            isDragging
              ? "border-indigo-500 border-dashed bg-indigo-50/50"
              : isActive
                ? "border-indigo-500 border-solid ring-4 ring-indigo-500/10 shadow-sm"
                : "border-zinc-200 border-dashed hover:border-zinc-300 hover:bg-zinc-100/50 cursor-pointer"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-indigo-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Uploading...
              </span>
            </div>
          ) : currentAsset ? (
            isImage ? (
              <div className="w-full h-full relative group/img">
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
              <div className="flex flex-col items-center justify-center w-full h-full p-4 group/doc relative">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-200 mb-2 group-hover/doc:scale-110 transition-transform">
                  <FileBox className="w-6 h-6 text-indigo-500" />
                </div>
                <span className="text-xs font-bold text-zinc-700 truncate max-w-[90%] text-center">
                  Attached Document
                </span>

                <div className="absolute inset-0 bg-white/90 opacity-0 group-hover/doc:opacity-100 flex items-center justify-center gap-4 transition-opacity backdrop-blur-sm">
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
            <div className="flex flex-col items-center gap-2 p-4 text-center pointer-events-none opacity-60">
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
          )}
        </div>
      </div>
    </div>
  );
}
