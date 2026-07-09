'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CanvasArea from '@/components/canvas/renderers/CanvasArea';
import { fetchAPI } from '@/services/api';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import StaticKanbanBoard from '@/components/kanban/StaticKanbanBoard';
import NotepadBoard from '@/components/notepad/NotepadBoard';
import TimelineBoard from '@/components/timeline/TimelineBoard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading';
import DatabaseBoard from '@/components/database/DatabaseBoard';
import WhiteboardBoard from '@/components/whiteboard/WhiteBoard';
import MindMapBoard from '@/components/mindmap/MindMapBoard';
import RetrospectiveBoard from '@/components/retrospective/RetrospectiveBoard';
import { useAutoSave } from '@/hooks/useAutoSave';

type Collaborator = {
  email: string;
  role: string;
};

type RecordDataProps = {
  name?: string;
  is_global_public?: boolean | string;
  collaborators?: Collaborator[];
  template?: string;
  [key: string]: unknown;
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

  // --- OTOMATİK KAYDETME MOTORU ---
  useAutoSave(tenantId, recordId || projectId);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [recordData, setRecordData] = useState<RecordDataProps | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [isLoadingRecord, setIsLoadingRecord] = useState<boolean>(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetchAPI(`/api/records/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setRecordData(data.record_data);
          if (
            data.record_data?.template === 'kanban' ||
            data.record_data?.template === 'notepad' ||
            data.record_data?.template === 'document' ||
            data.record_data?.template === 'whiteboard' ||
            data.record_data?.template === 'timeline' ||
            data.record_data?.template === 'database' ||
            data.record_data?.template === 'mindmap' ||
            data.record_data?.template === 'retrospective'
          ) {
            setShowEngineToolkit(false);
          } else {
            setShowEngineToolkit(true);
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
  }, [projectId, setShowEngineToolkit]);

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

    const isCurrentlyGlobal = String(recordData.is_global_public) === 'true';
    const nextGlobalState = !isCurrentlyGlobal;

    try {
      const updatedData = { ...recordData, is_global_public: nextGlobalState };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setRecordData(updatedData);
        updateMetadata({ is_global_public: nextGlobalState });
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

  const isGlobal = String(recordData?.is_global_public) === 'true';
  const collaborators = recordData?.collaborators || [];
  const projectTemplate = recordData?.template || 'blank';

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-[#fafafb] relative selection:bg-zinc-200">
      <div className="h-12 md:h-14 border-b border-zinc-200/80 bg-white px-3 md:px-6 flex items-center justify-between shrink-0 shadow-xs relative z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-100 px-2 md:px-2.5 py-1 rounded-md border border-zinc-200/50">
            {projectTemplate === 'kanban'
              ? 'Kanban Mode'
              : projectTemplate === 'notepad'
                ? 'NotePad'
                : projectTemplate === 'timeline'
                  ? 'Time Schema'
                  : 'Design Mode'}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={openShareModal}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all duration-300 bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm active:scale-95"
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
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span className="hidden sm:inline">Web Share Options</span>
            <span className="sm:hidden">Share</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative z-0">
        <ErrorBoundary moduleName="Workspace">
          {isLoadingPage ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
            </div>
          ) : projectTemplate === 'kanban' ? (
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
        </ErrorBoundary>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-zinc-950/40 backdrop-blur-sm sm:p-4">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="p-5 md:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
              <div>
                <h3 className="text-base md:text-lg font-black text-zinc-950 tracking-tight">
                  Access & Sharing
                </h3>
                <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase mt-1">
                  Manage Workspace Visibility
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 bg-white hover:bg-zinc-200 border border-zinc-200 rounded-full transition-colors p-1.5 shadow-sm"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {isLoadingRecord ? (
              <div className="p-10 flex justify-center shrink-0">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-6 md:space-y-8 bg-white flex-1 overflow-y-auto custom-scrollbar pb-8">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-zinc-950 mb-1">
                        Publish to Global Gallery
                      </h4>
                      <p className="text-[10px] md:text-[11px] font-medium text-zinc-500 leading-relaxed max-w-[250px]">
                        Feature your workspace in the SaaS Engine community.
                      </p>
                    </div>
                    <button
                      onClick={handleGlobalToggle}
                      disabled={isUpdating}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors mt-1 ${isGlobal ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGlobal ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>

                  <div
                    className={`transition-opacity ${!isGlobal ? 'hidden' : 'block'}`}
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${projectId}`}
                        className="flex-1 px-3 py-3 sm:py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] md:text-xs font-medium text-zinc-600 focus:outline-none"
                      />
                      <button
                        onClick={handleCopy}
                        className={`px-4 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isCopied ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-zinc-950 text-white hover:bg-zinc-800'}`}
                      >
                        {isCopied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-100 w-full"></div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-zinc-950 mb-1">
                      Project-Specific Access
                    </h4>
                    <p className="text-[10px] md:text-[11px] font-medium text-zinc-500 leading-relaxed">
                      Invite teammates to view or edit this specific project.
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
                      className="flex-1 px-3 py-3 sm:py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                    <div className="flex gap-2">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-3 sm:py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isUpdating || !inviteEmail}
                        className="px-6 sm:px-4 py-3 sm:py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        Invite
                      </button>
                    </div>
                  </form>

                  {collaborators.length > 0 && (
                    <div className="mt-4 border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
                      {collaborators.map((collab, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-6 h-6 shrink-0 rounded-md bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600 uppercase">
                              {collab.email.charAt(0)}
                            </div>
                            <span className="text-[10px] md:text-xs font-semibold text-zinc-900 truncate">
                              {collab.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <span
                              className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${collab.role === 'editor' ? 'bg-indigo-50 text-indigo-600' : 'bg-zinc-100 text-zinc-500'}`}
                            >
                              {collab.role}
                            </span>
                            <button
                              onClick={() =>
                                handleRemoveCollaborator(collab.email)
                              }
                              disabled={isUpdating}
                              className="text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
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
