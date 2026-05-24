"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import CanvasArea from "@/components/canvas/renderers/CanvasArea";
import { fetchAPI } from "@/services/api";
import { useCanvasStore } from "@/store/useCanvasStore";

type Collaborator = {
  email: string;
  role: string;
};

type RecordDataProps = {
  name?: string;
  is_global_public?: boolean | string;
  collaborators?: Collaborator[];
  [key: string]: unknown;
};

export default function ProjectDesignPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [recordData, setRecordData] = useState<RecordDataProps | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState<boolean>(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const updateMetadata = useCanvasStore((state) => state.updateMetadata);

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
      console.error("Failed to copy link", err);
    }
  };

  const handleGlobalToggle = async () => {
    if (!recordData) return;
    setIsUpdating(true);

    const isCurrentlyGlobal = String(recordData.is_global_public) === "true";
    const nextGlobalState = !isCurrentlyGlobal;

    try {
      const updatedData = { ...recordData, is_global_public: nextGlobalState };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
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
      setInviteEmail("");
      return;
    }

    const newCollabs = [
      ...currentCollabs,
      { email: cleanEmail, role: inviteRole },
    ];

    try {
      const updatedData = { ...recordData, collaborators: newCollabs };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setRecordData(updatedData);
        updateMetadata({ collaborators: newCollabs });
        setInviteEmail("");
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
      (c) => c.email.toLowerCase().trim() !== cleanEmailToRemove,
    );

    try {
      const updatedData = { ...recordData, collaborators: newCollabs };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
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

  const isGlobal = String(recordData?.is_global_public) === "true";
  const collaborators = recordData?.collaborators || [];

  return (
    <div className="flex flex-col h-full w-full bg-[#fafafb] relative selection:bg-zinc-200">
      <div className="h-14 border-b border-zinc-200/80 bg-white px-6 flex items-center justify-between shrink-0 shadow-xs relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200/50">
            Design Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openShareModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm active:scale-95"
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
            Web Share Options
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-0">
        <CanvasArea />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-zinc-950/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-black text-zinc-950 tracking-tight">
                  Access & Sharing
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                  Manage Workspace Visibility
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 transition-colors p-1"
              >
                <svg
                  width="20"
                  height="20"
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
              <div className="p-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-6 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950 mb-1">
                        Publish to Global Gallery
                      </h4>
                      <p className="text-[11px] font-medium text-zinc-500 leading-relaxed max-w-[250px]">
                        Feature your workspace in the SaaS Engine community.
                      </p>
                    </div>
                    <button
                      onClick={handleGlobalToggle}
                      disabled={isUpdating}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors mt-1 ${isGlobal ? "bg-zinc-950" : "bg-zinc-200"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGlobal ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  <div
                    className={`transition-opacity ${!isGlobal ? "hidden" : "block"}`}
                  >
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${projectId}`}
                        className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 focus:outline-none"
                      />
                      <button
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isCopied ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}
                      >
                        {isCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-100 w-full"></div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 mb-1">
                      Project-Specific Access
                    </h4>
                    <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                      Invite teammates to view or edit this specific project,
                      regardless of their global workspace role.
                    </p>
                  </div>

                  <form onSubmit={handleAddCollaborator} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isUpdating || !inviteEmail}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      Invite
                    </button>
                  </form>

                  {collaborators.length > 0 && (
                    <div className="mt-4 border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
                      {collaborators.map((collab, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600 uppercase">
                              {collab.email.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold text-zinc-900">
                              {collab.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${collab.role === "editor" ? "bg-indigo-50 text-indigo-600" : "bg-zinc-100 text-zinc-500"}`}
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
