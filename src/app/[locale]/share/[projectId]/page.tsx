'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { BrandMark } from '@/components/brand/BrandLogo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CanvasArea from '@/components/canvas/renderers/CanvasArea';
import StaticKanbanBoard from '@/components/kanban/StaticKanbanBoard';
import NotepadBoard from '@/components/notepad/NotepadBoard';
import TimelineBoard from '@/components/timeline/TimelineBoard';
import DatabaseBoard from '@/components/database/DatabaseBoard';
import WhiteboardBoard from '@/components/whiteboard/WhiteBoard';
import MindMapBoard from '@/components/mindmap/MindMapBoard';
import RetrospectiveBoard from '@/components/retrospective/RetrospectiveBoard';
import { fetchAPI } from '@/services/api';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useProjectEditMode } from '@/hooks/useProjectEditMode';
import { ArrowLeft, Copy, ShieldAlert } from 'lucide-react';

type CustomModule = {
  name: string;
  slug: string;
};

const TEMPLATE_BOARD_TYPES = new Set([
  'kanban',
  'notepad',
  'document',
  'whiteboard',
  'timeline',
  'database',
  'mindmap',
  'retrospective',
]);

export default function PublicSharePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const loadPublicProjectById = useCanvasStore((s) => s.loadPublicProjectById);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const setMode = useCanvasStore((s) => s.setMode);
  const isLoading = useCanvasStore((s) => s.isLoading);
  const metadata = useCanvasStore((s) => s.metadata);
  const { isReadonly } = useProjectEditMode();

  const [error, setError] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [rawRecordData, setRawRecordData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myTenantId, setMyTenantId] = useState<string | null>(null);
  const [myModules, setMyModules] = useState<CustomModule[]>([]);

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [targetModule, setTargetModule] = useState('projects');
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError('');
      setHasLoaded(false);
      try {
        await loadPublicProjectById(projectId);
        if (cancelled) return;
        setMode('readonly');
        const meta = useCanvasStore.getState().metadata;
        setRawRecordData(meta);
        setCloneName(
          `Copy of ${(meta.name as string) || (meta.title as string) || 'Framework'}`
        );
        setHasLoaded(true);
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 403) {
          setError(
            'This secure workspace is flagged as private or restricted.'
          );
        } else if (status === 404) {
          setError(
            'The requested workspace does not exist in the public cluster.'
          );
        } else {
          setError('Failed to communicate with the core engine.');
        }
        setHasLoaded(true);
      }
    };

    if (projectId) void load();

    return () => {
      cancelled = true;
      clearCanvas();
    };
  }, [projectId, loadPublicProjectById, clearCanvas, setMode]);

  useEffect(() => {
    const checkAuthAndModules = async () => {
      if (typeof window === 'undefined') return;
      const token = Cookies.get('token') || localStorage.getItem('token');
      if (!token) return;

      try {
        const meRes = await fetchAPI('/api/auth/me');
        if (!meRes.ok) return;
        const userData = await meRes.json();
        const tenantId =
          userData.tenant_id ||
          Cookies.get('tenant_id') ||
          localStorage.getItem('tenant_id');

        if (!tenantId) return;
        setIsLoggedIn(true);
        setMyTenantId(tenantId);

        const modRes = await fetchAPI(
          `/api/records?tenant_id=${tenantId}&module_name=workspace_modules`
        );
        if (modRes.ok) {
          const modData = await modRes.json();
          setMyModules(
            modData.map((m: { record_data: CustomModule }) => m.record_data)
          );
        }
      } catch (e) {
        console.warn('User is not logged in for public share:', e);
      }
    };
    void checkAuthAndModules();
  }, []);

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTenantId || !cloneName.trim() || !rawRecordData) return;
    setIsCloning(true);

    try {
      const payloadData = {
        ...rawRecordData,
        name: cloneName,
        visibility: 'just_admin',
        status: 'active',
        is_global_shared: 'false',
        is_global_public: false,
      };

      const res = await fetchAPI('/api/records/', {
        method: 'POST',
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
        const errorData = await res.json().catch(() => null);
        alert(`Failed to clone: ${errorData?.detail || res.status}`);
      }
    } catch (cloneError) {
      console.error('Cloning error:', cloneError);
      alert('An error occurred while cloning the framework.');
    } finally {
      setIsCloning(false);
    }
  };

  const projectName =
    (metadata.name as string) ||
    (metadata.title as string) ||
    'Shared Workspace';
  const template = String(metadata.template || 'blank').toLowerCase();
  const showBoard = TEMPLATE_BOARD_TYPES.has(template);

  if (!hasLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Loading workspace
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
            type="button"
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-zinc-900 font-sans selection:bg-sky-200/50 flex flex-col overflow-hidden relative antialiased">
      <header className="relative z-50 h-14 border-b border-zinc-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark size="sm" />
          <div className="h-4 w-px bg-zinc-200 shrink-0" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-xs font-semibold text-zinc-950 truncate max-w-[160px] sm:max-w-xs leading-none">
              {projectName}
            </h1>
            <span className="text-[9px] font-medium text-zinc-400 mt-1">
              Public share
            </span>
          </div>
          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[9px] font-bold uppercase tracking-wider rounded border border-sky-100 select-none shrink-0">
            View Only
          </span>
          {template !== 'blank' && (
            <span className="hidden sm:inline px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[9px] font-bold uppercase tracking-wider rounded border border-zinc-200 select-none">
              {template}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsCloneModalOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clone to Workspace</span>
              <span className="sm:hidden">Clone</span>
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

      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden relative z-0">
        <ErrorBoundary moduleName="Public Share">
          {!showBoard ? (
            <CanvasArea />
          ) : (
            <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
              {isReadonly && (
                <div
                  className="absolute inset-0 z-[60] cursor-not-allowed"
                  title="View mode — editing disabled"
                  aria-hidden
                />
              )}
              {template === 'kanban' ? (
                <StaticKanbanBoard projectId={projectId} />
              ) : template === 'notepad' || template === 'document' ? (
                <NotepadBoard projectId={projectId} />
              ) : template === 'whiteboard' ? (
                <WhiteboardBoard projectId={projectId} />
              ) : template === 'mindmap' ? (
                <MindMapBoard projectId={projectId} />
              ) : template === 'timeline' ? (
                <TimelineBoard projectId={projectId} />
              ) : template === 'database' ? (
                <DatabaseBoard projectId={projectId} />
              ) : template === 'retrospective' ? (
                <RetrospectiveBoard projectId={projectId} />
              ) : (
                <CanvasArea />
              )}
            </div>
          )}
        </ErrorBoundary>
      </div>

      {isCloneModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/20 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900">
                Clone Framework
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Duplicate this workspace into your account.
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
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCloning}
                  className="bg-zinc-950 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isCloning ? 'Cloning…' : 'Confirm Clone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
