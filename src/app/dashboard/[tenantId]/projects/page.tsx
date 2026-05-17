"use client";
import React, { useState, useEffect, use } from "react";

type ProjectRecord = {
  id: string;
  tenant_id: string;
  module_name: string;
  record_data: {
    name: string;
    description?: string;
    status?: string;
  };
  created_at: string;
};

export default function ProjectsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const currentTenantId = resolvedParams.tenantId;

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchProjects = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/records/?tenant_id=${currentTenantId}&module_name=projects`,
      );
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenantId]);
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/records/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenantId,
          module_name: "projects",
          record_data: {
            name: newProjectName,
            status: "active",
          },
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewProjectName("");
        fetchProjects();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Creation failed:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full relative">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Active Projects
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Manage your dynamic workflows and records.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg
            className="animate-spin h-8 w-8 text-zinc-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-zinc-200 bg-zinc-50/50 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:bg-zinc-50 hover:border-zinc-300 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 bg-white border border-zinc-200 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className="font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors text-lg">
              Create Project
            </span>
            <span className="text-xs text-zinc-400 mt-1.5 text-center px-4">
              Start a new dynamic workflow
            </span>
          </div>

          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-zinc-300 transition-all group cursor-pointer flex flex-col min-h-[220px]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-950 text-white flex items-center justify-center font-bold text-2xl shadow-inner transform group-hover:scale-105 transition-transform duration-300">
                  {project.record_data.name.charAt(0).toUpperCase()}
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                  {project.record_data.status || "Active"}
                </span>
              </div>
              <h3 className="font-extrabold text-zinc-900 text-xl mb-1 mt-2">
                {project.record_data.name}
              </h3>
              <p className="text-xs text-zinc-400 mb-6 font-mono bg-zinc-50 inline-block px-2 py-1 rounded">
                ID: {project.id.split("-")[0]}
              </p>

              <div className="mt-auto pt-4 border-t border-zinc-100 flex justify-between items-center text-sm text-zinc-500">
                <span className="font-medium text-xs">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
                <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
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
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-zinc-100">
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                Create Project
              </h2>
              <p className="text-sm text-zinc-500 mt-1.5">
                Initialize a new dynamic workspace.
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 Marketing Campaign"
                  className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2"
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
