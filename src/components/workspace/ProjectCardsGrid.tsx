"use client";
import React, { useCallback, useEffect, useState, useMemo } from "react";
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
import {
  Search,
  Briefcase,
  Archive,
  FolderPlus,
  MoreVertical,
  Clock,
  Shield,
  Globe,
  LayoutTemplate,
  Trash2,
  AlertTriangle,
  Database,
  PenTool,
  FileText,
  Network,
  MessageSquare,
} from "lucide-react";

type ProjectRecord = {
  id: string;
  record_data: RecordData & {
    visibility?: string;
    status?: string;
    updated_at?: string;
    updated_by?: string;
    template?: string;
    is_global_shared?: string;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectVisibility, setNewProjectVisibility] = useState("public");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: "danger" | "warning";
    onConfirm: () => void;
  } | null>(null);

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
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({
          record_data: { ...currentData, visibility: newVisibility },
        }),
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      fetchProjects();
    }
  };

  const toggleGlobalShare = (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);

    const isCurrentlyGlobal = currentData.is_global_shared === "true";
    const newStatus = isCurrentlyGlobal ? "false" : "true";

    setConfirmDialog({
      isOpen: true,
      title: isCurrentlyGlobal
        ? "Remove from Community Hub"
        : "Publish to Community Hub",
      message: isCurrentlyGlobal
        ? "This will remove your workspace from the public Community Hub. Other companies will no longer see it."
        : "WARNING: This will make your workspace visible to everyone on the internet. Make sure you don't have any sensitive company data inside. Proceed?",
      confirmText: isCurrentlyGlobal ? "Unpublish" : "Publish to World",
      type: isCurrentlyGlobal ? "danger" : "warning",
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  record_data: {
                    ...p.record_data,
                    is_global_shared: newStatus,
                  },
                }
              : p,
          ),
        );
        try {
          const res = await fetchAPI(`/api/records/${projectId}`, {
            method: "PATCH",
            body: JSON.stringify({
              record_data: { ...currentData, is_global_shared: newStatus },
            }),
          });
          if (!res.ok) fetchProjects();
        } catch (error) {
          fetchProjects();
        }
      },
    });
  };

  const archiveProject = (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: "Archive Workspace",
      message:
        "Are you sure you want to move this workspace to the archive? It will be hidden from the active projects list, but you can restore it later.",
      confirmText: "Archive",
      type: "warning",
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, record_data: { ...p.record_data, status: "archived" } }
              : p,
          ),
        );
        try {
          const res = await fetchAPI(`/api/records/${projectId}`, {
            method: "PATCH",
            body: JSON.stringify({
              record_data: { ...currentData, status: "archived" },
            }),
          });
          if (!res.ok) fetchProjects();
        } catch (error) {
          fetchProjects();
        }
      },
    });
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
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({
          record_data: { ...currentData, status: "active" },
        }),
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      fetchProjects();
    }
  };

  const deletePermanently = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Permanently",
      message:
        "WARNING: This action cannot be undone. This will permanently delete the workspace and all its dynamic blocks. Are you absolutely sure?",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        try {
          const res = await fetchAPI(`/api/records/${projectId}`, {
            method: "DELETE",
          });
          if (!res.ok) fetchProjects();
        } catch (error) {
          fetchProjects();
        }
      },
    });
  };

  const { displayedProjects, activeCount, privateCount, archivedCount } =
    useMemo(() => {
      const active = projects.filter(
        (p) => p.record_data?.status !== "archived",
      ).length;
      const archived = projects.filter(
        (p) => p.record_data?.status === "archived",
      ).length;
      const privateProjects = projects.filter(
        (p) => p.record_data?.visibility === "just_admin",
      ).length;

      const filtered = projects.filter((p) => {
        const hasPermission =
          isAdmin || p.record_data?.visibility !== "just_admin";
        const isArchived = p.record_data?.status === "archived";
        const matchesSearch = getProjectDisplayName(p.record_data ?? {}, p.id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return (
          hasPermission &&
          (showArchived ? isArchived : !isArchived) &&
          matchesSearch
        );
      });

      return {
        displayedProjects: filtered,
        activeCount: active,
        privateCount: privateProjects,
        archivedCount: archived,
      };
    }, [projects, isAdmin, showArchived, searchQuery]);

  return (
    <div className="flex-1 w-full relative transition-colors duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Projects
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {activeCount}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
            <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Private Workspaces
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {privateCount}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
            <Archive className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Archived
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {archivedCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative group w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors duration-300"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative z-0 w-full pl-10 pr-4 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform-gpu active:scale-95 ${
                showArchived
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm"
              }`}
            >
              {showArchived ? "Active" : "Archived"}
            </button>
          )}

          {!showArchived && isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm transform-gpu active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center items-center">
            <LoadingSpinner size="lg" text="Loading workspaces..." />
          </div>
        ) : (
          <>
            {displayedProjects.map((project) => {
              const isJustAdmin =
                project.record_data?.visibility === "just_admin";
              const isGlobalShared =
                project.record_data?.is_global_shared === "true";
              const displayName = getProjectDisplayName(
                project.record_data ?? {},
                project.id,
              );
              const timeAgo = formatTimeAgo(project.record_data?.updated_at);
              const templateType = project.record_data?.template || "blank";
              const isOpen = openMenuId === project.id;

              const baseClasses =
                "group relative rounded-xl bg-white dark:bg-zinc-900 flex flex-col transition-all duration-200 transform-gpu will-change-transform border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md";
              const hoverClasses = !showArchived
                ? "hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
                : "opacity-75 grayscale";
              const cardClasses = `${baseClasses} ${hoverClasses} ${isOpen ? "z-50" : "z-10"}`;

              const cardContent = (
                <>
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {templateType === "database" ? (
                            <Database className="w-3.5 h-3.5" />
                          ) : templateType === "whiteboard" ? (
                            <PenTool className="w-3.5 h-3.5" />
                          ) : templateType === "document" ||
                            templateType === "notepad" ? (
                            <FileText className="w-3.5 h-3.5" />
                          ) : templateType === "mindmap" ? (
                            <Network className="w-3.5 h-3.5" />
                          ) : templateType === "retrospective" ? (
                            <MessageSquare className="w-3.5 h-3.5" />
                          ) : (
                            <LayoutTemplate className="w-3.5 h-3.5" />
                          )}
                          <span className="capitalize">
                            {templateType === "document" ||
                            templateType === "notepad"
                              ? "Document"
                              : templateType}{" "}
                            Template
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === project.id ? null : project.id,
                              );
                            }}
                            className="p-1.5 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors transform-gpu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {isOpen && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg py-1.5 z-[100] transform-gpu">
                              {!showArchived ? (
                                <>
                                  <button
                                    onClick={(e) =>
                                      changeVisibility(
                                        e,
                                        project.id,
                                        project.record_data,
                                        "public",
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                  >
                                    Make Workspace Public
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
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                  >
                                    Make Admin Only
                                  </button>

                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                                  <button
                                    onClick={(e) =>
                                      toggleGlobalShare(
                                        e,
                                        project.id,
                                        project.record_data,
                                      )
                                    }
                                    className={`w-full px-4 py-2 text-xs font-medium flex items-center justify-between ${
                                      isGlobalShared
                                        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                        : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    }`}
                                  >
                                    {isGlobalShared
                                      ? "Remove from Hub"
                                      : "Publish to Hub"}
                                    <Globe className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                                  <button
                                    onClick={(e) =>
                                      archiveProject(
                                        e,
                                        project.id,
                                        project.record_data,
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
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
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  >
                                    Restore Project
                                  </button>
                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                  <button
                                    onClick={(e) =>
                                      deletePermanently(e, project.id)
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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

                  <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 rounded-b-xl flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                      {timeAgo}
                    </div>
                    <div className="flex items-center gap-2">
                      {isGlobalShared && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                          <Globe className="w-3 h-3" />
                          HUB
                        </div>
                      )}
                      {isJustAdmin ? (
                        <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                          <Shield className="w-3 h-3" />
                          Private
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          Team
                        </div>
                      )}
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

            {displayedProjects.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
                <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mb-3" />
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
                  No workspaces found.
                </p>
                {searchQuery && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Try clearing your search.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4 transform-gpu">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 transform-gpu will-change-transform">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Create Workspace
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Initialize a new dynamic environment.
              </p>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Workspace Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q4 Strategy"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Engine Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all shadow-sm cursor-pointer"
                >
                  <option value="blank">Infinite Canvas</option>
                  <option value="kanban">Kanban Board</option>
                  <option value="document">Document / Notes</option>
                  <option value="whiteboard">Whiteboard (Drawing)</option>
                  <option value="timeline">Timeline</option>
                  <option value="database">Database / Table</option>
                  <option value="mindmap">Mind Map / Flowchart</option>
                  <option value="retrospective">Agile Retrospective</option>
                </select>
              </div>
              {createError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                  {createError}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-95 transform-gpu"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm transition-colors active:scale-95 transform-gpu"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4 transform-gpu">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 transform-gpu will-change-transform overflow-hidden flex flex-col">
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  confirmDialog.type === "danger"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                }`}
              >
                {confirmDialog.type === "danger" ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {confirmDialog.title}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-95 transform-gpu"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors active:scale-95 transform-gpu ${
                  confirmDialog.type === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
