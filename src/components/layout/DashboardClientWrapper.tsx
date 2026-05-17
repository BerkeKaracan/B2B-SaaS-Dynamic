"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCanvasStore } from "@/store/useCanvasStore";
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
  const params = useParams();
  const projectId = params.projectId as string | undefined;
  const isDesignView = Boolean(projectId);

  const { loadProjectById, isLoading, clearCanvas, recordId } = useCanvasStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDesignView && projectId) {
      loadProjectById(tenantId, projectId);
    } else {
      clearCanvas();
    }
  }, [loadProjectById, clearCanvas, tenantId, projectId, isDesignView]);

  useAutoSave(tenantId, isDesignView ? recordId : null);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white text-zinc-900 font-sans antialiased">
      <Navbar
        tenantId={tenantId}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        showProjectInfo={isDesignView}
      />

      <DashboardBody>
        {isMobileMenuOpen && (
          <MobileOverlay onClose={() => setIsMobileMenuOpen(false)} />
        )}

        <SidebarSlot isMobileMenuOpen={isMobileMenuOpen}>
          <WorkspaceSidebar />
        </SidebarSlot>

        <ContentRow>
          {isDesignView && (
            <div className="hidden md:flex w-[200px] border-r border-zinc-200/60 bg-white shrink-0 overflow-y-auto">
              <ItemSidebar />
            </div>
          )}

          <main className="flex-1 overflow-y-auto bg-zinc-50/30 relative min-w-0">
            {isLoading && isDesignView && <LoadingOverlay />}
            {children}
          </main>

          {isDesignView && <ProjectInfoPanel />}
        </ContentRow>
      </DashboardBody>

      <DashboardFooter />
    </div>
  );
}

function DashboardBody({ children }: { children: React.ReactNode }) {
  return (
    <MotionDashboardBodyDiv>{children}</MotionDashboardBodyDiv>
  );
}

function MotionDashboardBodyDiv({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden relative min-h-0">{children}</div>
  );
}

function SidebarSlot({
  children,
  isMobileMenuOpen,
}: {
  children: React.ReactNode;
  isMobileMenuOpen: boolean;
}) {
  return (
    <div
      className={`${
        isMobileMenuOpen ? "flex" : "hidden lg:flex"
      } fixed lg:static inset-y-14 lg:inset-auto left-0 z-50 lg:z-auto h-[calc(100%-3.5rem)] lg:h-full shrink-0`}
    >
      {children}
    </div>
  );
}

function ContentRow({ children }: { children: React.ReactNode }) {
  return (
    <MotionContentRowDiv>{children}</MotionContentRowDiv>
  );
}

function MotionContentRowDiv({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">{children}</div>
  );
}

function MobileOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-zinc-900/50 z-40 lg:hidden"
      onClick={onClose}
    />
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-40">
      <span className="text-xs font-semibold tracking-wider text-zinc-400 animate-pulse uppercase">
        Loading...
      </span>
    </div>
  );
}
