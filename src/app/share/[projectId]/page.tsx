"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/services/api";

type BlockContent = {
  id: string;
  type: string;
  value: string | boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  settings?: Record<string, unknown>;
};

type PageContent = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocks: BlockContent[];
  settings?: { backgroundColor?: string };
};

type ProjectMetadata = {
  name: string;
  updated_at?: string;
  updated_by?: string;
};

export default function PublicSharePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [meta, setMeta] = useState<ProjectMetadata | null>(null);
  const [pages, setPages] = useState<PageContent[]>([]);

  const [zoom, setZoom] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSharedWorkspace = async () => {
      try {
        const res = await fetchAPI(`/api/public/records/${projectId}`);

        if (!res.ok) {
          if (res.status === 403)
            throw new Error("This secure workspace is flagged as private.");
          if (res.status === 404)
            throw new Error("The requested workspace does not exist.");
          throw new Error("Failed to communicate with the core engine.");
        }

        const data = await res.json();

        // 🚀 FIX: Veritabanı şemasındaki isimlendirme karmaşasını çözüyoruz
        const rootData = data.record_data || data || {};

        setMeta({
          name: rootData.name || rootData.title || "Shared Workspace",
          updated_at: data.updated_at || rootData.updated_at,
          updated_by: data.updated_by || rootData.updated_by || "System",
        });

        // 🚀 FIX: pages alanı nerede olursa olsun (kök veya record_data içi) güvenli şekilde yakala!
        const fetchedPages = rootData.pages || data.pages || [];
        setPages(fetchedPages);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected architecture failure occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchSharedWorkspace();
  }, [projectId]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((prev) => Math.min(Math.max(20, prev - e.deltaY * 0.5), 300));
    } else {
      setPanX((prev) => prev - e.deltaX);
      setPanY((prev) => prev - e.deltaY);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          Streaming Engine Data
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-lg font-black text-zinc-950 tracking-tight mb-1">
          Access Restricted
        </h2>
        <p className="text-xs font-semibold text-zinc-400 mb-6 max-w-sm text-center leading-relaxed">
          {error}
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
        >
          Return to Terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col overflow-hidden relative">
      <header className="relative z-50 h-14 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-zinc-950 rounded-lg flex items-center justify-center shadow-xs">
            <span className="text-white text-[10px] font-black font-mono">
              B2
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-200"></div>
          <div className="flex flex-col">
            <h1 className="text-xs font-black text-zinc-950 tracking-tight leading-none">
              {meta?.name}
            </h1>
            {meta?.updated_at && (
              <span className="text-[9px] font-bold text-zinc-400 mt-1">
                Snapshot: {new Date(meta.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <span className="ml-2 px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-widest rounded shadow-xs border border-zinc-200">
            Read Only
          </span>
        </div>
      </header>

      <main
        className={`flex-1 relative z-10 w-full h-full overflow-hidden ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        ref={containerRef}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundSize: `${40 * (zoom / 100)}px ${40 * (zoom / 100)}px`,
            backgroundImage:
              "radial-gradient(circle, #e4e4e7 1.5px, transparent 1.5px)",
            backgroundPosition: `${panX}px ${panY}px`,
          }}
        ></div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
            transformOrigin: "0 0",
          }}
        >
          {pages.length === 0 ? (
            <div className="absolute top-[200px] left-[200px] bg-white border border-zinc-200/80 p-8 rounded-3xl max-w-sm shadow-sm pointer-events-auto">
              <h3 className="text-sm font-bold text-zinc-950 mb-1">
                Empty Infrastructure
              </h3>
              <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                This project currently has no frames or blocks detected.
              </p>
            </div>
          ) : (
            pages.map((page) => (
              <section
                key={page.id}
                className="absolute shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-md border border-zinc-200/50 pointer-events-auto"
                style={{
                  left: `${page.x}px`,
                  top: `${page.y}px`,
                  width: `${page.width}px`,
                  minHeight: `${page.height}px`,
                  backgroundColor: page.settings?.backgroundColor || "#ffffff",
                }}
              >
                <div className="absolute -top-8 left-0 flex items-center text-zinc-500 font-bold text-[11px] uppercase tracking-wider px-2 py-1">
                  <span># {page.title}</span>
                </div>

                {page.blocks &&
                  page.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="absolute bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm"
                      style={{
                        left: `${block.x}px`,
                        top: `${block.y}px`,
                        width: `${block.width || 320}px`,
                        minHeight: `${block.height || 100}px`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded">
                          {block.type}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-zinc-700 whitespace-pre-wrap leading-relaxed">
                        {String(block.value)}
                      </div>
                    </div>
                  ))}
              </section>
            ))
          )}
        </div>
      </main>

      <div className="absolute bottom-6 right-6 z-50 flex items-center bg-white border border-zinc-200 shadow-sm rounded-xl p-1.5 gap-1 pointer-events-auto">
        <button
          onClick={() => setZoom(Math.max(20, zoom - 10))}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <span className="text-[10px] font-black text-zinc-600 px-2 w-12 text-center select-none">
          {Math.round(zoom)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(300, zoom + 10))}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-1"></div>
        <button
          onClick={() => {
            setPanX(0);
            setPanY(0);
            setZoom(100);
          }}
          className="px-3 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg text-[10px] font-bold transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
