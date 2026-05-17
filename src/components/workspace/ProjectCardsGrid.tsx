"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCanvasStore } from "@/store/useCanvasStore";
import { WORKSPACE_MODULE } from "@/lib/workspace";
import {
  getProjectDisplayName,
  isMeaningfulProjectRecord,
} from "@/lib/projectRecord";
import { RecordData } from "@/types/record";

type ProjectRecord = {
  id: string;
  record_data: RecordData;
};

export default function ProjectCardsGrid() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { createProject } = useCanvasStore();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.role === "admin" || data.role === "owner");
        }
      } catch (error) {
        console.error("Role check failed", error);
      }
    };
    checkRole();
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  }, [tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tenantId) fetchProjects();
  }, [tenantId, fetchProjects]);

  const handleNewProject = async () => {
    if (isCreating) return;
    setIsCreating(true);

    const newId = await createProject(
      tenantId,
      `New Project ${projects.length + 1}`,
    );
    setIsCreating(false);

    if (newId) {
      router.push(`/dashboard/${tenantId}/projects/${newId}`);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/${tenantId}/projects/${project.id}`}
              className="group relative aspect-4/3 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col"
            >
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="absolute top-4 right-4 p-1 text-zinc-300 hover:text-zinc-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Project menu"
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
              <span className="text-base font-semibold text-zinc-800 mt-auto leading-snug">
                {getProjectDisplayName(project.record_data ?? {}, project.id)}
              </span>
            </Link>
          ))}

          <button
            type="button"
            onClick={handleNewProject}
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
                strokeWidth="1.5"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
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
    </div>
  );
}
