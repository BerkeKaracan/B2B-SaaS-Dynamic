'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CanvasArea from '@/components/canvas/renderers/CanvasArea';
import { fetchAPI } from '@/services/api';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import StaticKanbanBoard from '@/components/kanban/StaticKanbanBoard';
import NotepadBoard from '@/components/notepad/NotepadBoard';
import TimelineBoard from '@/components/timeline/TimelineBoard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import DatabaseBoard from '@/components/database/DatabaseBoard';
import WhiteboardBoard from '@/components/whiteboard/WhiteBoard';
import MindMapBoard from '@/components/mindmap/MindMapBoard';
import RetrospectiveBoard from '@/components/retrospective/RetrospectiveBoard';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useProjectEditMode } from '@/hooks/useProjectEditMode';
import {
  Check,
  Clock,
  Copy,
  Database,
  FileText,
  Globe2,
  KanbanSquare,
  LayoutTemplate,
  Lock,
  MessageSquare,
  Network,
  PenTool,
  Share2,
  X,
} from 'lucide-react';

const TEMPLATE_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  blank: { label: 'Canvas', Icon: LayoutTemplate },
  kanban: { label: 'Kanban', Icon: KanbanSquare },
  notepad: { label: 'Document', Icon: FileText },
  document: { label: 'Document', Icon: FileText },
  whiteboard: { label: 'Whiteboard', Icon: PenTool },
  timeline: { label: 'Timeline', Icon: Clock },
  database: { label: 'Database', Icon: Database },
  mindmap: { label: 'Mindmap', Icon: Network },
  retrospective: { label: 'Retrospective', Icon: MessageSquare },
};

type Collaborator = {
  email: string;
  role: string;
};

type RecordDataProps = {
  name?: string;
  is_global_public?: boolean | string;
  is_global_shared?: boolean | string;
  collaborators?: Collaborator[];
  template?: string;
  is_locked?: string;
  [key: string]: unknown;
};

const isHubPublished = (data: RecordDataProps | null | undefined) => {
  if (!data) return false;
  return (
    String(data.is_global_shared) === 'true' ||
    data.is_global_shared === true ||
    String(data.is_global_public) === 'true' ||
    data.is_global_public === true
  );
};

export default function ProjectDesignPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const tenantId = params.tenantId as string;

  const setShowEngineToolkit = useLayoutStore(
    (state) => state.setShowEngineToolkit
  );

  const recordId = useCanvasStore((state) => state.recordId);
  const updateMetadata = useCanvasStore((state) => state.updateMetadata);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  useAutoSave(tenantId, recordId || projectId);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [recordData, setRecordData] = useState<RecordDataProps | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [isLoadingRecord, setIsLoadingRecord] = useState<boolean>(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const mode = useCanvasStore((state) => state.mode);
  const setMode = useCanvasStore((state) => state.setMode);

  const isLocked = String(recordData?.is_locked) === 'true';
  const { isReadonly } = useProjectEditMode();

  useEffect(() => {
    if (mode === 'readonly') {
      setShowEngineToolkit(false);
    } else if (mode === 'design') {
      const template = recordData?.template || 'blank';
      const isStandardCanvas = ![
        'kanban',
        'notepad',
        'document',
        'whiteboard',
        'timeline',
        'database',
        'mindmap',
        'retrospective',
      ].includes(template);
      if (isStandardCanvas) {
        setShowEngineToolkit(true);
      } else {
        setShowEngineToolkit(false);
      }
    }
  }, [mode, recordData?.template, setShowEngineToolkit]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetchAPI(`/api/records/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setRecordData(data.record_data);

          const isProjectLocked =
            String(data.record_data?.is_locked) === 'true';
          const currentUser = useAuthStore.getState().user;
          const userIsAdmin =
            currentUser?.role === 'admin' || currentUser?.role === 'owner';

          if (isProjectLocked && !userIsAdmin) {
            setMode('readonly');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingPage(false);
      }
    };
    if (projectId) fetchInitialData();
    return () => setShowEngineToolkit(true);
  }, [projectId, setMode, setShowEngineToolkit]);

  const openShareModal = async () => {
    setIsModalOpen(true);
    setIsLoadingRecord(true);
    try {
      const res = await fetchAPI(`/api/records/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setRecordData(data.record_data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const handleCopy = async () => {
    try {
      const shareLink = `${window.location.origin}/share/${projectId}`;
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleGlobalToggle = async () => {
    if (!recordData) return;
    setIsUpdating(true);

    const isCurrentlyGlobal = isHubPublished(recordData);
    const nextShared = isCurrentlyGlobal ? 'false' : 'true';
    const nextPublic = !isCurrentlyGlobal;

    try {
      // Keep both flags in sync: hub API/cards use is_global_shared;
      // older Share modal code used is_global_public.
      const updatedData = {
        ...recordData,
        is_global_shared: nextShared,
        is_global_public: nextPublic,
      };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setRecordData(updatedData);
        updateMetadata({
          is_global_shared: nextShared,
          is_global_public: nextPublic,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordData || !inviteEmail) return;
    setIsUpdating(true);

    const cleanEmail = inviteEmail.toLowerCase().trim();
    const currentCollabs = recordData.collaborators || [];

    if (
      currentCollabs.some((c) => c.email.toLowerCase().trim() === cleanEmail)
    ) {
      setIsUpdating(false);
      setInviteEmail('');
      return;
    }

    const newCollabs = [
      ...currentCollabs,
      { email: cleanEmail, role: inviteRole },
    ];

    try {
      const updatedData = { ...recordData, collaborators: newCollabs };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setRecordData(updatedData);
        updateMetadata({ collaborators: newCollabs });
        setInviteEmail('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveCollaborator = async (emailToRemove: string) => {
    if (!recordData) return;
    setIsUpdating(true);

    const cleanEmailToRemove = emailToRemove.toLowerCase().trim();
    const newCollabs = (recordData.collaborators || []).filter(
      (c) => c.email.toLowerCase().trim() !== cleanEmailToRemove
    );

    try {
      const updatedData = { ...recordData, collaborators: newCollabs };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setRecordData(updatedData);
        updateMetadata({ collaborators: newCollabs });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isGlobal = isHubPublished(recordData);
  const collaborators = recordData?.collaborators || [];
  const projectTemplate = recordData?.template || 'blank';
  const templateMeta =
    TEMPLATE_META[projectTemplate] || TEMPLATE_META.blank;
  const TemplateIcon = templateMeta.Icon;
  const projectTitle = recordData?.name || 'Untitled project';
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/${projectId}`
      : `/share/${projectId}`;

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-[#f7f9fb] dark:bg-zinc-950 relative selection:bg-sky-200/50 overscroll-none touch-none">
      <div className="h-12 md:h-14 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl px-3 md:px-5 flex items-center justify-between gap-3 shrink-0 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex items-center gap-2 min-w-0 pl-0.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center shrink-0">
              <TemplateIcon className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 truncate">
                {templateMeta.label}
              </p>
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px] md:max-w-[260px]">
                {projectTitle}
              </p>
            </div>
          </div>

          <div className="sm:hidden inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300">
            <TemplateIcon className="w-3 h-3 text-sky-600" />
            {templateMeta.label}
          </div>

          {!isLocked || isAdmin ? (
            <div className="flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setMode('design')}
                className={`px-2.5 md:px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-md transition-all ${
                  mode === 'design'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMode('readonly')}
                className={`px-2.5 md:px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-md transition-all ${
                  mode === 'readonly'
                    ? 'bg-white dark:bg-zinc-800 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                View
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
                Locked
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={openShareModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative z-0">
        <ErrorBoundary moduleName="Workspace">
          {isLoadingPage ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-950 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : projectTemplate === 'blank' || !TEMPLATE_META[projectTemplate] ? (
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
              {projectTemplate === 'kanban' ? (
                <StaticKanbanBoard projectId={projectId} />
              ) : projectTemplate === 'notepad' ||
                projectTemplate === 'document' ? (
                <NotepadBoard projectId={projectId} />
              ) : projectTemplate === 'whiteboard' ? (
                <WhiteboardBoard projectId={projectId} />
              ) : projectTemplate === 'mindmap' ? (
                <MindMapBoard projectId={projectId} />
              ) : projectTemplate === 'timeline' ? (
                <TimelineBoard projectId={projectId} />
              ) : projectTemplate === 'database' ? (
                <DatabaseBoard projectId={projectId} />
              ) : projectTemplate === 'retrospective' ? (
                <RetrospectiveBoard projectId={projectId} />
              ) : (
                <CanvasArea />
              )}
            </div>
          )}
        </ErrorBoundary>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-zinc-950/35 backdrop-blur-sm sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="p-5 md:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-[#f7f9fb]/80 dark:bg-zinc-950/40 shrink-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400 mb-1">
                  Access
                </p>
                <h3 className="text-base md:text-lg font-semibold text-zinc-950 dark:text-white tracking-tight">
                  Share & permissions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingRecord ? (
              <div className="p-10 flex justify-center shrink-0">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-950 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto custom-scrollbar pb-8">
                <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#f7f9fb]/70 dark:bg-zinc-950/40 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center shrink-0">
                        <Globe2 className="w-4 h-4 text-sky-700 dark:text-sky-300" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                          Publish to gallery
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          Show this project in the community hub with a public
                          link.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGlobalToggle}
                      disabled={isUpdating}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors mt-1 ${isGlobal ? 'bg-sky-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGlobal ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>

                  {isGlobal && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy link
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Invite collaborators
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Grant view or edit access for this project only.
                    </p>
                  </div>

                  <form
                    onSubmit={handleAddCollaborator}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50"
                    />
                    <div className="flex gap-2">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isUpdating || !inviteEmail}
                        className="px-4 py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        Invite
                      </button>
                    </div>
                  </form>

                  {collaborators.length > 0 && (
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                      {collaborators.map((collab, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <div className="w-7 h-7 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                              {collab.email.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {collab.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md ${
                                collab.role === 'editor'
                                  ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {collab.role}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCollaborator(collab.email)
                              }
                              disabled={isUpdating}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
