"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/services/api";
import { useCanvasStore } from "@/store/useCanvasStore";

import StaticKanbanBoard from "@/components/kanban/StaticKanbanBoard";
import NotepadBoard from "@/components/notepad/NotepadBoard";
import TimelineBoard from "@/components/timeline/TimelineBoard";

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

type CustomModule = {
  name: string;
  slug: string;
};

export default function PublicSharePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [meta, setMeta] = useState<ProjectMetadata | null>(null);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [template, setTemplate] = useState<string>("blank");

  const [rawRecordData, setRawRecordData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myTenantId, setMyTenantId] = useState<string | null>(null);
  const [myModules, setMyModules] = useState<CustomModule[]>([]);

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [targetModule, setTargetModule] = useState("projects");
  const [isCloning, setIsCloning] = useState(false);

  const updateMetadata = useCanvasStore((state) => state.updateMetadata);

  const [zoom, setZoom] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuthAndModules = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const meRes = await fetchAPI("/api/auth/me");
        if (meRes.ok) {
          const userData = await meRes.json();
          const tenantId =
            userData.tenant_id || localStorage.getItem("tenant_id");

          if (tenantId) {
            setIsLoggedIn(true);
            setMyTenantId(tenantId);

            const modRes = await fetchAPI(
              `/api/records?tenant_id=${tenantId}&module_name=workspace_modules`,
            );
            if (modRes.ok) {
              const modData = await modRes.json();
              setMyModules(
                modData.map(
                  (m: { record_data: CustomModule }) => m.record_data,
                ),
              );
            }
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      }
    };
    checkAuthAndModules();
  }, []);

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
        const rootData = data.record_data || data || {};

        setMeta({
          name: rootData.name || rootData.title || "Shared Workspace",
          updated_at: data.updated_at || rootData.updated_at,
          updated_by: data.updated_by || rootData.updated_by || "System",
        });

        const currentTemplate = rootData.template || "blank";
        setTemplate(currentTemplate);

        setRawRecordData(rootData);
        setCloneName(
          `Copy of ${rootData.name || rootData.title || "Framework"}`,
        );

        updateMetadata(rootData);

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
  }, [projectId, updateMetadata]);

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTenantId || !cloneName.trim() || !rawRecordData) return;
    setIsCloning(true);

    try {
      const payloadData = {
        ...rawRecordData,
        name: cloneName,
        visibility: "just_admin",
        status: "active",
      };

      const res = await fetchAPI("/api/records/", {
        method: "POST",
        body: JSON.stringify({
          tenant_id: myTenantId,
          module_name: targetModule,
          record_data: payloadData,
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        setIsCloneModalOpen(false);
        router.push(`/dashboard/${myTenantId}/projects/${newRecord.id}`);
      } else {
        const errorData = await res.json();
        alert(`Failed to clone: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Cloning error:", error);
      alert("An error occurred while cloning the framework.");
    } finally {
      setIsCloning(false);
    }
  };

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

  const renderWorkspaceContent = () => {
    if (template === "kanban")
      return (
        <div className="relative flex-1 w-full h-full">
          <StaticKanbanBoard projectId={projectId} />
        </div>
      );
    if (template === "notepad")
      return (
        <div className="relative flex-1 w-full h-full">
          <NotepadBoard projectId={projectId} />
        </div>
      );
    if (template === "timeline")
      return (
        <div className="relative flex-1 w-full h-full">
          <TimelineBoard projectId={projectId} />
        </div>
      );

    return (
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
    );
  };

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
          {template !== "blank" && (
            <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded shadow-xs border border-blue-200">
              {template}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={() => setIsCloneModalOpen(true)}
              className="px-4 py-1.5 bg-zinc-950 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Clone Framework
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-colors shadow-sm"
            >
              Log in to Clone
            </Link>
          )}
        </div>
      </header>

      {renderWorkspaceContent()}

      {isCloneModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">
                  Clone to Workspace
                </h2>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Make this framework your own.
                </p>
              </div>
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200/50 text-zinc-400 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCloneSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest pl-1">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest pl-1">
                  Destination Module
                </label>
                <select
                  value={targetModule}
                  onChange={(e) => setTargetModule(e.target.value)}
                  className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition-all appearance-none bg-[url('/down-arrow.svg')] bg-[length:16px] bg-no-repeat bg-[position:right_1rem_center]"
                >
                  <option value="projects">Main Projects</option>
                  {myModules.map((mod) => (
                    <option key={mod.slug} value={mod.slug}>
                      {mod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCloning}
                  className="bg-zinc-950 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-800 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isCloning ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{" "}
                      Cloning...
                    </>
                  ) : (
                    "Clone Framework"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {template === "blank" && (
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
      )}
    </div>
  );
}
