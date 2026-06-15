"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/services/api";
import { useCanvasStore } from "@/store/useCanvasStore";

import StaticKanbanBoard from "@/components/kanban/StaticKanbanBoard";
import NotepadBoard from "@/components/notepad/NotepadBoard";
import TimelineBoard from "@/components/timeline/TimelineBoard";
import {
  Globe,
  ShieldAlert,
  ArrowLeft,
  Layers,
  Copy,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

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

  const panRef = useRef({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panRef.current = { x: panX, y: panY };
    if (gridRef.current)
      gridRef.current.style.backgroundPosition = `${panX}px ${panY}px`;
    if (wrapperRef.current)
      wrapperRef.current.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom / 100})`;
  }, [panX, panY, zoom]);

  useEffect(() => {
    const checkAuthAndModules = async () => {
      if (typeof window === "undefined") return;
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
        const res = await fetchAPI(
          `/api/public/records/${projectId}?t=${new Date().getTime()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );

        if (!res.ok) {
          if (res.status === 403)
            throw new Error(
              "This secure workspace is flagged as private or restricted.",
            );
          if (res.status === 404)
            throw new Error(
              "The requested workspace does not exist in the public cluster.",
            );
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

    panRef.current.x += dx;
    panRef.current.y += dy;
    setPanStart({ x: e.clientX, y: e.clientY });

    requestAnimationFrame(() => {
      if (gridRef.current)
        gridRef.current.style.backgroundPosition = `${panRef.current.x}px ${panRef.current.y}px`;
      if (wrapperRef.current)
        wrapperRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoom / 100})`;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    setPanX(panRef.current.x);
    setPanY(panRef.current.y);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Streaming Framework Data
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight mb-1.5">
            Access Restricted
          </h2>
          <p className="text-xs font-medium text-zinc-500 mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const renderWorkspaceContent = () => {
    if (template === "kanban")
      return (
        <div className="relative flex-1 w-full h-full bg-[#fafafb]">
          <StaticKanbanBoard projectId={projectId} />
        </div>
      );
    if (template === "notepad")
      return (
        <div className="relative flex-1 w-full h-full bg-[#fafafb]">
          <NotepadBoard projectId={projectId} />
        </div>
      );
    if (template === "timeline")
      return (
        <div className="relative flex-1 w-full h-full bg-[#fafafb]">
          <TimelineBoard projectId={projectId} />
        </div>
      );

    return (
      <main
        className={`flex-1 relative z-10 w-full h-full overflow-hidden transform-gpu will-change-transform ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          ref={gridRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundSize: `${40 * (zoom / 100)}px ${40 * (zoom / 100)}px`,
            backgroundImage:
              "radial-gradient(circle, #e4e4e7 1px, transparent 1px)",
          }}
        ></div>

        <div
          ref={wrapperRef}
          className="absolute inset-0 pointer-events-none transform-gpu will-change-transform"
          style={{ transformOrigin: "0 0" }}
        >
          {pages.length === 0 ? (
            <div className="absolute top-[200px] left-[200px] bg-white border border-zinc-200 p-6 rounded-xl max-w-xs shadow-sm pointer-events-auto">
              <h3 className="text-xs font-semibold text-zinc-900 mb-1">
                Empty Infrastructure
              </h3>
              <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">
                This public snapshot currently has no active frames or
                configuration blocks detected.
              </p>
            </div>
          ) : (
            pages.map((page) => (
              <section
                key={page.id}
                className="absolute shadow-sm rounded-xl border border-zinc-200 pointer-events-auto overflow-hidden"
                style={{
                  left: `${page.x}px`,
                  top: `${page.y}px`,
                  width: `${page.width}px`,
                  minHeight: `${page.height}px`,
                  backgroundColor: page.settings?.backgroundColor || "#ffffff",
                }}
              >
                <div className="flex items-center text-zinc-400 font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 select-none">
                  <Layers className="w-3 h-3 mr-1.5 text-zinc-400" />
                  <span>{page.title || "Frame"}</span>
                </div>

                <div className="p-4 relative min-h-[inherit]">
                  {page.blocks &&
                    page.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="absolute bg-white border border-zinc-200/80 rounded-lg p-3.5 shadow-xs hover:border-zinc-300 transition-colors"
                        style={{
                          left: `${block.x}px`,
                          top: `${block.y}px`,
                          width: `${block.width || 320}px`,
                          minHeight: `${block.height || 100}px`,
                        }}
                      >
                        <div className="flex items-center mb-2">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 border border-zinc-200/60 px-1.5 py-0.5 rounded">
                            {block.type}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-zinc-600 Richmond whitespace-pre-wrap leading-relaxed">
                          {String(block.value)}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans selection:bg-zinc-100 flex flex-col overflow-hidden relative antialiased">
      <header className="relative z-50 h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-zinc-950 rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-black font-mono">
              B2
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-200"></div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xs font-semibold text-zinc-950 truncate max-w-[180px] sm:max-w-xs leading-none">
              {meta?.name}
            </h1>
            {meta?.updated_at && (
              <span className="text-[9px] font-medium text-zinc-400 mt-1">
                Shared Framework •{" "}
                {new Date(meta.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-bold uppercase tracking-wider rounded border border-zinc-200 select-none">
              View Only
            </span>
            {template !== "blank" && (
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[9px] font-bold uppercase tracking-wider rounded border border-zinc-200 select-none">
                {template}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={() => setIsCloneModalOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1.5 transform-gpu active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              Clone to Workspace
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-xs font-semibold hover:bg-zinc-50 hover:text-zinc-950 transition-colors shadow-sm"
            >
              Log in to Clone
            </Link>
          )}
        </div>
      </header>

      {renderWorkspaceContent()}

      {isCloneModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/20 backdrop-blur-sm px-4 transform-gpu">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md overflow-hidden transform-gpu butch will-change-transform animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900">
                Clone Framework
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Duplicate this ecosystem into your active infrastructure.
              </p>
            </div>

            <form onSubmit={handleCloneSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  New Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Target Destination Module
                </label>
                <select
                  value={targetModule}
                  onChange={(e) => setTargetModule(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-sm cursor-pointer"
                >
                  <option value="projects">Main Projects Module</option>
                  {myModules.map((mod) => (
                    <option key={mod.slug} value={mod.slug}>
                      {mod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors active:scale-95 transform-gpu"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCloning}
                  className="bg-zinc-950 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 transform-gpu"
                >
                  {isCloning ? "Cloning Engine..." : "Confirm Clone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {template === "blank" && (
        <div className="absolute bottom-6 right-6 z-50 flex items-center bg-white border border-zinc-200 shadow-sm rounded-lg p-1 gap-0.5 pointer-events-auto">
          <button
            onClick={() => setZoom(Math.max(20, zoom - 10))}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-md transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold text-zinc-500 px-1.5 w-11 text-center select-none font-mono">
            {Math.round(zoom)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(300, zoom + 10))}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-md transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
