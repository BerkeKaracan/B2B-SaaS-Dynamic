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

type ProjectRecord = {
  id: string;
  record_data: RecordData & { visibility?: string };
};

export default function ProjectCardsGrid() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectVisibility, setNewProjectVisibility] = useState("public");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/records/?tenant_id=${tenantId}&module_name=${WORKSPACE_MODULE}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (res.ok) {
        const data: ProjectRecord[] = await res.json();
        const meaningful = data.filter((row) =>
          isMeaningfulProjectRecord(row.record_data ?? {}),
        );
        setProjects(meaningful);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, [tenantId, API_BASE_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tenantId) fetchProjects();
  }, [tenantId, fetchProjects]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !isAdmin) return;

    setIsCreating(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/records/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          module_name: WORKSPACE_MODULE,
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
      console.error("Creation failed", error);
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
      const token = localStorage.getItem("token");
      const updatedData = { ...currentData, visibility: newVisibility };

      const res = await fetch(`${API_BASE_URL}/api/records/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setOpenMenuId(null);
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to update visibility", error);
    }
  };

  const visibleProjects = projects.filter(
    (p) => isAdmin || p.record_data?.visibility !== "just_admin",
  );

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto relative">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visibleProjects.map((project) => {
            const isJustAdmin =
              project.record_data?.visibility === "just_admin";
            return (
              <Link
                key={project.id}
                href={`/dashboard/${tenantId}/projects/${project.id}`}
                className="group relative aspect-4/3 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col"
              >
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${isJustAdmin ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
                  >
                    {isJustAdmin ? "Admin Only" : "Public"}
                  </span>
                </div>

                {isAdmin && (
                  <div className="absolute top-4 right-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === project.id ? null : project.id,
                        );
                      }}
                      className="p-1 text-zinc-300 hover:text-zinc-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </button>

                    {openMenuId === project.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-white border border-zinc-200 shadow-xl rounded-xl py-1.5 z-20 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={(e) =>
                            changeVisibility(
                              e,
                              project.id,
                              project.record_data,
                              "public",
                            )
                          }
                          className="text-left px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
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
                          className="text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Make Admin Only
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <span className="text-base font-extrabold text-zinc-800 mt-auto leading-snug">
                  {getProjectDisplayName(project.record_data ?? {}, project.id)}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => isAdmin && setIsModalOpen(true)}
            disabled={isCreating || !isAdmin}
            aria-label="Create new project"
            className={`aspect-4/3 rounded-2xl border-2 flex items-center justify-center transition-all ${
              isAdmin
                ? "border-dashed border-zinc-200 bg-zinc-50/30 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                : "border-solid border-zinc-100 bg-zinc-50/50 text-zinc-300 cursor-not-allowed opacity-70"
            }`}
          >
            {isCreating ? (
              <span className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
            ) : isAdmin ? (
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mb-2"
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
                <span className="text-xs font-bold uppercase tracking-wider">
                  Admin Only
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-zinc-100">
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                Create Workspace
              </h2>
              <p className="text-sm text-zinc-500 mt-1.5">
                Define name and visibility rules for the new project.
              </p>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 Financial Planning"
                  className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                  Visibility Level
                </label>
                <select
                  value={newProjectVisibility}
                  onChange={(e) => setNewProjectVisibility(e.target.value)}
                  className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
                >
                  <option value="public">Public (All Employees)</option>
                  <option value="just_admin">
                    Just Admin (Only Owners/Admins)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-zinc-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 shadow-md transition-all"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
