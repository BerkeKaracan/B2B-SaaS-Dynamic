"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAutoSave } from "@/hooks/useAutoSave";
import Navbar from "./Navbar";
import WorkspaceSidebar from "./WorkspaceSidebar";
import ItemSidebar from "./ItemSidebar";
import DashboardFooter from "./DashboardFooter";
import ProjectInfoPanel from "./ProjectInfoPanel";

export default function DashboardClientWrapper({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId: string;
}) {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string | undefined;
  const isDesignView = Boolean(projectId);

  const { loadProjectById, isLoading, clearCanvas, recordId } =
    useCanvasStore();
  const { isCheckingAuth, isAuthenticated, fetchUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (isDesignView && projectId) {
      loadProjectById(tenantId, projectId);
    } else {
      clearCanvas();
    }
  }, [loadProjectById, clearCanvas, tenantId, projectId, isDesignView]);

  useAutoSave(tenantId, isDesignView ? recordId : null);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></span>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider animate-pulse">
            Starting Engine...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white text-zinc-900 font-sans antialiased">
      <Navbar
        tenantId={tenantId}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        showProjectInfo={isDesignView}
      />
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <div
          className={`${
            isMobileMenuOpen ? "flex" : "hidden lg:flex"
          } fixed lg:static inset-y-14 lg:inset-auto left-0 z-50 lg:z-auto h-[calc(100%-3.5rem)] lg:h-full shrink-0`}
        >
          <WorkspaceSidebar />
        </div>
        <div className="flex flex-1 min-w-0 overflow-hidden">
          {isDesignView && <ItemSidebar />}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
              {children}
            </main>
            <DashboardFooter />
          </div>
          {isDesignView && <ProjectInfoPanel />}
        </div>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
