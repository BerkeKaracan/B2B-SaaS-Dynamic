"use client";
import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useLayoutStore } from "@/store/useLayoutStore";

export default function ProjectSidebar() {
  const { isPrimarySidebarOpen, togglePrimarySidebar } = useLayoutStore();
  const params = useParams();
  const pathname = usePathname();
  const tenantId = params.tenantId as string;

  const modules = [
    {
      id: "projects",
      label: "Projects",
      icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
    },
    {
      id: "fleet_vehicles",
      label: "Fleet Vehicles",
      icon: "M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.09a5.5 5.5 0 0 1 4.51-2h4.9a2 2 0 0 1 1.93 1.46l1.24 4.54H21a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2m-4 0h-6m-9 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0z",
    },
    {
      id: "payroll",
      label: "Payroll & HR",
      icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    },
  ];

  if (!isPrimarySidebarOpen) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-3 border-r border-zinc-200/80 bg-[#FAFAFA] shrink-0">
        <button
          onClick={togglePrimarySidebar}
          className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 rounded-md transition-all"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-[240px] h-full flex flex-col border-r border-zinc-200/80 bg-[#FAFAFA] shrink-0">
      <div className="h-12 flex items-center justify-between px-4">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Modules
        </span>
        <button
          onClick={togglePrimarySidebar}
          className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 rounded-md transition-all"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-2 space-y-1 overflow-y-auto mt-2">
        {modules.map((mod) => {
          const isActive = pathname.includes(`/${mod.id}`);
          return (
            <Link
              key={mod.id}
              href={`/dashboard/${tenantId}/${mod.id}`}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md border text-sm font-medium transition-all ${
                isActive
                  ? "bg-white border-zinc-200/60 shadow-sm text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isActive ? "text-zinc-900" : "text-zinc-400"}
              >
                <path d={mod.icon}></path>
              </svg>
              {mod.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
