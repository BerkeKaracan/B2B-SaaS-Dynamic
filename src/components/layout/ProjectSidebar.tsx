"use client";
import React from "react";
import { useLayoutStore } from "@/store/useLayoutStore";

export default function ProjectSidebar() {
  const { isPrimarySidebarOpen, togglePrimarySidebar } = useLayoutStore();

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
          Projects
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

      <div className="flex-1 px-2 overflow-y-auto">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-white border border-zinc-200/60 shadow-sm text-sm font-medium text-zinc-800 hover:border-zinc-300 transition-all">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-zinc-400"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Test Project
        </button>
      </div>
    </div>
  );
}
