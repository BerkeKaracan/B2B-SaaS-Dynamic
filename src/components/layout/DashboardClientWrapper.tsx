'use client';
import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import Navbar from './Navbar';
import WorkspaceSidebar from './WorkspaceSidebar';
import ItemSidebar from './ItemSidebar';
import ProjectInfoPanel from './ProjectInfoPanel';
import { Toaster } from 'sonner';
import RealtimeNotifier from '@/components/RealtimeNotifier';

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

  const { isCheckingAuth, isAuthenticated, fetchUser, user } = useAuthStore();

  const { isPrimarySidebarOpen, togglePrimarySidebar, showEngineToolkit } =
    useLayoutStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (isDesignView && projectId) {
      loadProjectById(tenantId, projectId);
    } else {
      clearCanvas();
    }
  }, [isDesignView, projectId, tenantId, loadProjectById, clearCanvas]);

  useAutoSave(tenantId, recordId);

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider animate-pulse">
            Starting Engine...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      <Toaster richColors closeButton expand={false} position="bottom-right" />
      {user?.email && <RealtimeNotifier userEmail={user.email} />}

      <Navbar
        tenantId={tenantId}
        onMenuToggle={togglePrimarySidebar}
        showProjectInfo={isDesignView}
      />

      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <div
          className={`fixed lg:static inset-y-16 lg:inset-auto left-0 z-50 lg:z-auto h-[calc(100%-4rem)] lg:h-full shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
            isPrimarySidebarOpen
              ? 'translate-x-0 w-[240px] opacity-100'
              : '-translate-x-full lg:translate-x-0 w-0 opacity-0 lg:opacity-100'
          }`}
        >
          <div className="w-[240px] h-full">
            <WorkspaceSidebar />
          </div>
        </div>

        <div className="flex flex-1 min-w-0 overflow-hidden">
          {isDesignView && showEngineToolkit && <ItemSidebar />}

          <main
            className={`flex-1 relative w-full h-full z-0 min-w-0 transition-colors duration-300 ${
              isDesignView
                ? 'overflow-hidden bg-[#FAFAFB] dark:bg-[#0A0A0A]'
                : 'overflow-y-auto bg-white dark:bg-black'
            }`}
          >
            {children}
          </main>

          {isDesignView && <ProjectInfoPanel />}
        </div>
      </div>
    </div>
  );
}
