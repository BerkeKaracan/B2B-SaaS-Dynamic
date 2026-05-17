"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useLayoutStore } from "@/store/useLayoutStore";

// Dynamic type mapping for backend custom_records
type ProjectRecord = {
  id: string;
  tenant_id: string;
  module_name: string;
  record_data: {
    name: string;
  };
};

export default function ProjectSidebar() {
  const { isPrimarySidebarOpen, togglePrimarySidebar } = useLayoutStore();
  const params = useParams();
  const pathname = usePathname();

  const tenantId = params.tenantId as string;
  const currentModuleName = (params.moduleName as string) || "projects";

  // State to hold dynamic backend records
  const [projects, setProjects] = useState<ProjectRecord[]>([]);

  // Fetch the active projects from your custom_records JSONB table
  useEffect(() => {
    const fetchSidebarProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const res = await fetch(
          `${API_BASE_URL}/api/records/?tenant_id=${tenantId}&module_name=${currentModuleName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar workspace items:", error);
      }
    };

    if (tenantId) {
      fetchSidebarProjects();
    }
  }, [tenantId, currentModuleName]);

  return (
    <div className="flex flex-col h-full bg-white w-full">
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-100 shrink-0">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          Active Workspaces
        </span>
        <button
          onClick={togglePrimarySidebar}
          className="p-1.5 hover:bg-zinc-50 rounded text-zinc-400 hover:text-zinc-800 transition-all"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* DYNAMIC LIST FETCHED FROM YOUR BACKEND */}
      <div className="flex-1 px-2 space-y-1 overflow-y-auto mt-2">
        {projects.map((project) => {
          // Detect if this specific backend project is currently active in the URL
          const isActive = pathname.includes(`/${project.id}`);

          return (
            <Link
              key={project.id}
              href={`/dashboard/${tenantId}/${project.module_name}/${project.id}`}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md border text-sm font-medium transition-all ${
                isActive
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-sm font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="truncate">{project.record_data.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
