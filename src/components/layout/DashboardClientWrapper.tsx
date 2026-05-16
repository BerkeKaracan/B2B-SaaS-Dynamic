"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useAutoSave } from "@/hooks/useAutoSave";
import Navbar from "./Navbar";
import ProjectSidebar from "./ProjectSidebar";
import ItemSidebar from "./ItemSidebar";
import ProjectInfoSidebar from "./ProjectInfoSidebar";

export default function DashboardClientWrapper({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId: string;
}) {
  const { isSecondarySidebarOpen } = useLayoutStore();
  const { loadProject, isLoading, clearCanvas } = useCanvasStore();

  const params = useParams();
  const moduleName = (params.moduleName as string) || "projects";

  useEffect(() => {
    clearCanvas();
    loadProject(tenantId, moduleName);
  }, [loadProject, clearCanvas, tenantId, moduleName]);

  useAutoSave(tenantId, moduleName);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-200">
      <Navbar tenantId={tenantId} />
      <div className="flex flex-1 overflow-hidden relative">
        <ProjectSidebar />
        <div className="w-[220px] border-r border-zinc-200/60 bg-white shrink-0">
          <ItemSidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-zinc-50/30 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-40">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 animate-pulse uppercase">
                Loading Engine Framework...
              </span>
            </div>
          )}
          {children}
        </main>
        <div
          className={`transition-all duration-300 ease-in-out border-zinc-200/60 bg-white overflow-hidden shrink-0 ${isSecondarySidebarOpen ? "w-72 border-l" : "w-0 border-l-0"}`}
        >
          <div className="w-72 h-full">
            <ProjectInfoSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
