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
import { LoadingSpinner } from "@/components/ui/loading";

type ProjectRecord = {
  id: string;
  record_data: RecordData & {
    visibility?: string;
    status?: string;
    updated_at?: string;
    updated_by?: string;
    template?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectVisibility, setNewProjectVisibility] = useState("public");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [createError, setCreateError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    setCreateError(null);

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
            template: selectedTemplate,
          },
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        setIsModalOpen(false);
        setNewProjectName("");
        setNewProjectVisibility("public");
        setSelectedTemplate("blank");
        router.push(`/dashboard/${tenantId}/projects/${newRecord.id}`);
      } else {
        const errData = await res.json();
        setCreateError(errData.detail || "Failed to create project");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setCreateError(error.message);
      } else {
        setCreateError("An unexpected error occurred.");
      }
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
    setOpenMenuId(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              record_data: { ...p.record_data, visibility: newVisibility },
            }
          : p,
      ),
    );

    try {
      const updatedData = { ...currentData, visibility: newVisibility };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      console.error(error);
      fetchProjects();
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

    setOpenMenuId(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, record_data: { ...p.record_data, status: "archived" } }
          : p,
      ),
    );

    try {
      const updatedData = { ...currentData, status: "archived" };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      console.error(error);
      fetchProjects();
    }
  };

  const restoreProject = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, record_data: { ...p.record_data, status: "active" } }
          : p,
      ),
    );

    try {
      const updatedData = { ...currentData, status: "active" };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      console.error(error);
      fetchProjects();
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

    setOpenMenuId(null);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    try {
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      console.error(error);
      fetchProjects();
    }
  };

  const displayedProjects = projects.filter((p) => {
    const hasPermission = isAdmin || p.record_data?.visibility !== "just_admin";
    const isArchived = p.record_data?.status === "archived";
    return hasPermission && (showArchived ? isArchived : !isArchived);
  });

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto relative bg-zinc-50/50 min-h-[700px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6 md:mb-8 border-b border-zinc-200/60 pb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-zinc-950 tracking-tight">
              {showArchived ? "Archived Projects" : "Projects"}
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 mt-1 font-medium">
              {showArchived
                ? "Hidden from the main view."
                : "Manage your workspaces and canvases."}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all ${showArchived ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-sm"}`}
            >
              {showArchived ? "Active" : "Archived"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {isLoading ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text="Projects loading..." />
            </div>
          ) : (
            <>
              {!showArchived && (
                <button
                  type="button"
                  onClick={() => isAdmin && setIsModalOpen(true)}
                  disabled={isCreating || !isAdmin}
                  aria-label="Create new project"
                  className={`group aspect-[16/12] rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm bg-white z-10 ${
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
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

                const templateType = project.record_data?.template || "blank";
                const badgeText =
                  templateType === "kanban"
                    ? "Kanban"
                    : templateType === "notepad"
                      ? "Notepad"
                      : templateType === "timeline"
                        ? "Timeline"
                        : "Canvas";

                const isOpen = openMenuId === project.id;
                const baseCardClasses = `group relative aspect-[16/12] rounded-3xl border border-zinc-200/80 bg-white shadow-sm flex flex-col transition-all duration-300 ${isOpen ? "z-50" : "z-10"}`;
                const cardClasses = `${baseCardClasses} ${!showArchived ? "hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1.5 cursor-pointer ring-1 ring-transparent hover:ring-zinc-950/5" : "grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500"}`;

                const cardContent = (
                  <>
                    <div className="flex-1 w-full rounded-t-[23px] bg-linear-to-br from-zinc-100 to-zinc-50 border-b border-zinc-100/50 flex items-center justify-center group-hover:from-zinc-200 group-hover:to-zinc-100 transition-all duration-500 relative">
                      <div className="absolute top-4 left-4">
                        <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md bg-white/80 backdrop-blur-sm border border-zinc-200 text-zinc-600 shadow-sm">
                          {badgeText}
                        </span>
                      </div>
                      <span className="text-6xl font-black text-white group-hover:text-zinc-200 transition-colors duration-300 animate-pulse">
                        {initial}
                      </span>
                    </div>

                    <div className="px-5 py-4 md:px-6 md:py-5 flex flex-col gap-2 md:gap-3 border-t border-zinc-50">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm md:text-base font-extrabold text-zinc-950 leading-tight truncate flex-1 tracking-tight">
                          {displayName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest rounded-full border ${isJustAdmin ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-600 border-zinc-200 shadow-sm"}`}
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
                                    openMenuId === project.id
                                      ? null
                                      : project.id,
                                  );
                                }}
                                className={`p-1 rounded-lg transition-all duration-200 ${showArchived ? "text-zinc-500 bg-zinc-100 hover:bg-zinc-200" : "text-zinc-400 hover:text-zinc-800 opacity-100 md:opacity-0 group-hover:opacity-100"}`}
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
                              {isOpen && (
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
                                        className="text-left px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-50 transition-colors"
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
                                        Archive Project
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
                                        className="text-left px-4 py-2 text-xs font-extrabold text-zinc-700 hover:bg-zinc-50 transition-colors"
                                      >
                                        Restore Project
                                      </button>
                                      <div className="h-px bg-zinc-100 my-1.5" />
                                      <button
                                        onClick={(e) =>
                                          deletePermanently(e, project.id)
                                        }
                                        className="text-left px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        Delete Permanently
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 text-[9px] md:text-[10px] font-semibold">
                        <span className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 text-[7px] md:text-[8px] uppercase">
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
                  <p className="text-zinc-400 font-bold">Trash is empty.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-zinc-950/40 backdrop-blur-sm sm:px-4">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col md:flex-row h-[85vh] sm:h-[600px]">
            <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100 bg-zinc-50/50 h-[45%] md:h-full shrink-0">
              <div className="p-5 md:p-8 border-b border-zinc-100 shrink-0">
                <h2 className="text-xl md:text-3xl font-extrabold text-zinc-950 tracking-tighter">
                  Select Template
                </h2>
                <p className="text-xs md:text-sm text-zinc-500 mt-1 md:mt-2 font-medium">
                  Choose a layout that fits your workflow.
                </p>
              </div>

              <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-3 md:space-y-4 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate("blank")}
                  className={`w-full flex items-start rounded-2xl border-2 p-3 sm:p-5 text-left transition-all ${selectedTemplate === "blank" ? "border-zinc-900 bg-white shadow-md" : "border-zinc-200/80 bg-white hover:border-zinc-400"}`}
                >
                  <div className="mr-4 sm:mr-5 flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-zinc-950 text-sm sm:text-base">
                      Blank Canvas
                    </h4>
                    <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-zinc-500 font-medium leading-relaxed hidden sm:block">
                      Start from scratch with an infinite workspace layout for
                      total freedom.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate("kanban")}
                  className={`w-full flex items-start rounded-2xl border-2 p-3 sm:p-5 text-left transition-all ${selectedTemplate === "kanban" ? "border-zinc-900 bg-white shadow-md" : "border-zinc-200/80 bg-white hover:border-zinc-400"}`}
                >
                  <div className="mr-4 sm:mr-5 flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="9" y1="3" x2="9" y2="21"></line>
                      <line x1="15" y1="3" x2="15" y2="21"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-zinc-950 text-sm sm:text-base">
                      Static Kanban Board
                    </h4>
                    <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-zinc-500 font-medium leading-relaxed hidden sm:block">
                      Manage tasks dynamically with a traditional, static board
                      interface.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate("notepad")}
                  className={`w-full flex items-start rounded-2xl border-2 p-3 sm:p-5 text-left transition-all ${selectedTemplate === "notepad" ? "border-zinc-900 bg-white shadow-md" : "border-zinc-200/80 bg-white hover:border-zinc-400"}`}
                >
                  <div className="mr-4 sm:mr-5 flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-zinc-950 text-sm sm:text-base">
                      Notepad (Whiteboard)
                    </h4>
                    <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-zinc-500 font-medium leading-relaxed hidden sm:block">
                      Optimize for tablet and stylus. Take freeform notes and
                      sketches.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate("timeline")}
                  className={`w-full flex items-start rounded-2xl border-2 p-3 sm:p-5 text-left transition-all ${selectedTemplate === "timeline" ? "border-zinc-900 bg-white shadow-md" : "border-zinc-200/80 bg-white hover:border-zinc-400"}`}
                >
                  <div className="mr-4 sm:mr-5 flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-zinc-950 text-sm sm:text-base">
                      Timeline (Calendar)
                    </h4>
                    <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-zinc-500 font-medium leading-relaxed hidden sm:block">
                      Plan events visually across months. Use simple blocks or
                      detailed cards.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col bg-white relative flex-1 h-[55%] md:h-full">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition z-10"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="p-5 md:p-8 border-b border-zinc-100 shrink-0 pr-12">
                <h3 className="text-lg md:text-xl font-extrabold text-zinc-950 tracking-tight">
                  Project Details
                </h3>
                <p className="text-[10px] md:text-sm text-zinc-500 mt-1 font-medium">
                  Define name and visibility rules.
                </p>
              </div>

              <form
                onSubmit={handleCreateSubmit}
                className="flex-1 flex flex-col justify-between p-5 md:p-8 overflow-y-auto"
              >
                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-2 md:space-y-2.5">
                    <label className="text-[10px] md:text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest pl-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Q3 Financial Planning"
                      className="w-full px-4 py-3 md:px-5 md:py-4 bg-white border border-zinc-200 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all shadow-inner placeholder:text-zinc-300"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:space-y-2.5">
                    <label className="text-[10px] md:text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest pl-1">
                      Initial Visibility
                    </label>
                    <select
                      value={newProjectVisibility}
                      onChange={(e) => setNewProjectVisibility(e.target.value)}
                      className="w-full px-4 py-3 md:px-5 md:py-4 bg-white border border-zinc-200 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all shadow-inner appearance-none bg-[url('/down-arrow.svg')] bg-[length:16px] bg-no-repeat bg-[position:right_1rem_center]"
                    >
                      <option value="public">Public (All Employees)</option>
                      <option value="just_admin">
                        Just Admin (Owners/Admins Only)
                      </option>
                    </select>
                  </div>
                </div>
                {createError && (
                  <div className="px-5 py-3 mx-5 md:mx-8 mb-4 md:mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl font-bold flex items-start gap-3">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {createError}
                  </div>
                )}
                <div className="flex items-center justify-end gap-3 pt-6 md:pt-8 border-t border-zinc-100 mt-6 md:mt-8 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 md:px-6 md:py-3 text-xs md:text-sm font-bold text-zinc-500 hover:text-zinc-950 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-zinc-950 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all duration-150 w-full sm:w-auto flex-1 sm:flex-none"
                  >
                    {isCreating ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
