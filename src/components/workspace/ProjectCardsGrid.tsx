"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { WORKSPACE_MODULE } from "@/lib/workspace";
import {
  getProjectDisplayName,
  isMeaningfulProjectRecord,
} from "@/lib/projectRecord";
import { RecordData } from "@/types/record";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchAPI } from "@/services/api";

type ProjectRecord = {
  id: string;
  record_data: RecordData & {
    visibility?: string;
    status?: string;
    updated_at?: string;
    updated_by?: string;
  };
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export default function ProjectCardsGrid({
  moduleName,
}: {
  moduleName?: string;
}) {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const activeModule = moduleName || WORKSPACE_MODULE;

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectVisibility, setNewProjectVisibility] = useState("public");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetchAPI(
        `/api/records/?tenant_id=${tenantId}&module_name=${activeModule}`,
      );

      if (res.ok) {
        const data: ProjectRecord[] = await res.json();
        const meaningful = data.filter((row) =>
          isMeaningfulProjectRecord(row.record_data ?? {}),
        );
        setProjects(meaningful);
      }
    } catch (error) {
      console.error(error);
    }
  }, [activeModule, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tenantId) fetchProjects();
  }, [tenantId, fetchProjects]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !isAdmin) return;
    setIsCreating(true);

    try {
      const res = await fetchAPI(`/api/records/`, {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenantId,
          module_name: activeModule,
          record_data: {
            name: newProjectName,
            status: "active",
            visibility: newProjectVisibility,
          },
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        setIsModalOpen(false);
        setNewProjectName("");
        setNewProjectVisibility("public");
        router.push(`/dashboard/${tenantId}/projects/${newRecord.id}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const changeVisibility = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData,
    newVisibility: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const updatedData = { ...currentData, visibility: newVisibility };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setOpenMenuId(null);
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const archiveProject = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Move this project to the archive?")) {
      setOpenMenuId(null);
      return;
    }

    try {
      const updatedData = { ...currentData, status: "archived" };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setOpenMenuId(null);
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const restoreProject = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const updatedData = { ...currentData, status: "active" };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setOpenMenuId(null);
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deletePermanently = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        "WARNING! This will permanently delete the project and all its contents. This action CANNOT be undone. Are you sure?",
      )
    ) {
      setOpenMenuId(null);
      return;
    }

    try {
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOpenMenuId(null);
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const displayedProjects = projects.filter((p) => {
    const hasPermission = isAdmin || p.record_data?.visibility !== "just_admin";
    const isArchived = p.record_data?.status === "archived";
    return hasPermission && (showArchived ? isArchived : !isArchived);
  });

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-zinc-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-zinc-200/60 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
              {showArchived ? "Archived Projects" : "Projects"}
            </h2>
            <p className="text-sm text-zinc-500 mt-1 font-medium">
              {showArchived
                ? "Hidden from the main view. You can restore or delete them permanently."
                : "Manage your workspaces and canvases."}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${showArchived ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-sm"}`}
            >
              {showArchived ? "← Back to Active" : "🗑️ View Archive"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!showArchived && (
            <button
              type="button"
              onClick={() => isAdmin && setIsModalOpen(true)}
              disabled={isCreating || !isAdmin}
              aria-label="Create new project"
              className={`group aspect-[16/12] rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm bg-white ${
                isAdmin
                  ? "border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-950 hover:shadow-xl hover:-translate-y-1"
                  : "border-solid border-zinc-100 bg-zinc-50/50 text-zinc-300 cursor-not-allowed opacity-70"
              }`}
            >
              {isCreating ? (
                <span className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              ) : isAdmin ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-950 group-hover:text-white transition-colors duration-300 mb-4">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="text-sm font-extrabold tracking-tight text-zinc-800 group-hover:text-zinc-950">
                    New Project
                  </span>
                  <span className="text-xs text-zinc-400 mt-1">
                    Start from scratch
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center text-zinc-300">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mb-3"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Admin Only
                  </span>
                </div>
              )}
            </button>
          )}

          {displayedProjects.map((project) => {
            const isJustAdmin =
              project.record_data?.visibility === "just_admin";
            const displayName = getProjectDisplayName(
              project.record_data ?? {},
              project.id,
            );
            const initial = displayName.charAt(0).toUpperCase();

            const updatedAt = project.record_data?.updated_at;
            const updatedBy = project.record_data?.updated_by || "System";
            const timeAgo = formatTimeAgo(updatedAt);

            const cardClasses = `group relative aspect-[16/12] rounded-3xl border border-zinc-200/80 bg-white shadow-sm flex flex-col transition-all duration-300 ${!showArchived ? "hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1.5 cursor-pointer ring-1 ring-transparent hover:ring-zinc-950/5" : "opacity-80"}`;

            const cardContent = (
              <>
                <div className="flex-1 w-full rounded-t-[23px] bg-linear-to-br from-zinc-100 to-zinc-50 border-b border-zinc-100/50 flex items-center justify-center group-hover:from-zinc-200 group-hover:to-zinc-100 transition-all duration-500">
                  <span className="text-6xl font-black text-white group-hover:text-zinc-200 transition-colors duration-300 animate-pulse">
                    {initial}
                  </span>
                </div>

                <div className="px-6 py-5 flex flex-col gap-3 border-t border-zinc-50">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-extrabold text-zinc-950 leading-tight truncate flex-1 tracking-tight">
                      {displayName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full border ${isJustAdmin ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}
                      >
                        {isJustAdmin ? "Admin" : "Public"}
                      </span>
                      {isAdmin && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === project.id ? null : project.id,
                              );
                            }}
                            className={`p-1 rounded-lg transition-all duration-200 ${showArchived ? "text-zinc-500 bg-zinc-100 hover:bg-zinc-200" : "text-zinc-400 hover:text-zinc-800 opacity-0 group-hover:opacity-100"}`}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                          {openMenuId === project.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 shadow-xl rounded-2xl py-2 z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              {!showArchived ? (
                                <>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-4 py-1">
                                    Visibility
                                  </p>
                                  <button
                                    onClick={(e) =>
                                      changeVisibility(
                                        e,
                                        project.id,
                                        project.record_data,
                                        "public",
                                      )
                                    }
                                    className="text-left px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                                  >
                                    Make Public
                                  </button>
                                  <button
                                    onClick={(e) =>
                                      changeVisibility(
                                        e,
                                        project.id,
                                        project.record_data,
                                        "just_admin",
                                      )
                                    }
                                    className="text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    Make Admin Only
                                  </button>
                                  <div className="h-px bg-zinc-100 my-1.5" />
                                  <button
                                    onClick={(e) =>
                                      archiveProject(
                                        e,
                                        project.id,
                                        project.record_data,
                                      )
                                    }
                                    className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                                  >
                                    🗑️ Archive Project
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) =>
                                      restoreProject(
                                        e,
                                        project.id,
                                        project.record_data,
                                      )
                                    }
                                    className="text-left px-4 py-2 text-xs font-extrabold text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  >
                                    ♻️ Restore Project
                                  </button>
                                  <div className="h-px bg-zinc-100 my-1.5" />
                                  <button
                                    onClick={(e) =>
                                      deletePermanently(e, project.id)
                                    }
                                    className="text-left px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    💥 Delete Permanently
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-semibold">
                    <span className="w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 text-[8px] uppercase">
                      {updatedBy.charAt(0)}
                    </span>
                    <span>
                      Edited {timeAgo} by {updatedBy}
                    </span>
                  </div>
                </div>
              </>
            );

            return showArchived ? (
              <div key={project.id} className={cardClasses}>
                {cardContent}
              </div>
            ) : (
              <Link
                key={project.id}
                href={`/dashboard/${tenantId}/projects/${project.id}`}
                className={cardClasses}
              >
                {cardContent}
              </Link>
            );
          })}

          {showArchived && displayedProjects.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-3xl">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-zinc-400 font-bold">Trash is empty.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-zinc-950/20 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-3xl font-extrabold text-zinc-950 tracking-tighter">
                Create Workspace
              </h2>
              <p className="text-sm text-zinc-500 mt-2 font-medium">
                Define name and visibility rules for the new project.
              </p>
            </div>
            <form
              onSubmit={handleCreateSubmit}
              className="p-10 space-y-8 bg-white"
            >
              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest pl-1">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 Financial Planning"
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all shadow-inner placeholder:text-zinc-300"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest pl-1">
                  Initial Visibility
                </label>
                <select
                  value={newProjectVisibility}
                  onChange={(e) => setNewProjectVisibility(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all shadow-inner appearance-none bg-[url('/down-arrow.svg')] bg-[length:16px] bg- bg-no-repeat"
                >
                  <option value="public">Public (All Employees)</option>
                  <option value="just_admin">
                    Just Admin (Owners/Admins Only)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-950 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-950 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-150"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
