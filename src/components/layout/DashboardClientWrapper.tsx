"use client";
import React, { useEffect, useState } from "react";
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const params = useParams();
  const moduleName = (params.moduleName as string) || "projects";

  useEffect(() => {
    clearCanvas();
    loadProject(tenantId, moduleName);
  }, [loadProject, clearCanvas, tenantId, moduleName]);

  useAutoSave(tenantId, moduleName);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-200">
      <Navbar
        tenantId={tenantId}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-zinc-900/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div
          className={`
          ${isMobileMenuOpen ? "flex" : "hidden lg:flex"} 
          flex-col lg:flex-row
          
          /* MOBİL: Arka plan hafif gri, boşluklu (gap-3), iç (p-3) dolgulu kart sistemi */
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[82vh] z-50 bg-zinc-100 rounded-2xl shadow-2xl max-lg:gap-3 max-lg:p-3 max-lg:overflow-hidden
          
          /* PC: Senin orijinal ayarların */
          lg:static lg:w-auto lg:h-auto lg:translate-x-0 lg:translate-y-0 lg:bg-transparent lg:z-auto lg:rounded-none lg:shadow-none lg:gap-0 lg:p-0 lg:overflow-visible
        `}
        >
          <div className="flex-1 lg:flex-none w-full lg:w-auto max-lg:bg-white max-lg:rounded-xl max-lg:border max-lg:border-zinc-200/60 max-lg:shadow-sm flex flex-col overflow-hidden lg:overflow-visible">
            <div className="flex-1 overflow-y-auto">
              <ProjectSidebar />
            </div>
          </div>

          <div className="flex-1 lg:flex-none w-full lg:w-[220px] max-lg:bg-white max-lg:rounded-xl max-lg:border max-lg:border-zinc-200/60 max-lg:shadow-sm flex flex-col overflow-hidden lg:overflow-visible lg:border-r lg:border-zinc-200/60 lg:bg-white lg:shrink-0">
            <div className="flex-1 overflow-y-auto">
              <ItemSidebar />
            </div>
          </div>
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
