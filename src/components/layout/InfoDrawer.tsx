"use client";
import React from "react";
import { useLayoutStore } from "@/store/useLayoutStore";

export default function InfoDrawer() {
  const { isSecondarySidebarOpen, toggleSecondarySidebar } = useLayoutStore();

  if (!isSecondarySidebarOpen) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-3 border-l border-zinc-200/80 bg-[#FAFAFA] shrink-0">
        <button
          onClick={toggleSecondarySidebar}
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
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-[300px] h-full flex flex-col border-l border-zinc-200/80 bg-[#FAFAFA] shrink-0">
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-200/50">
        <button
          onClick={toggleSecondarySidebar}
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
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Properties
        </span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <div className="text-[13px] text-zinc-500 font-medium text-center p-4 border border-zinc-200/60 border-dashed rounded-lg bg-zinc-50/50">
          Select a block to edit its properties
        </div>
      </div>
    </div>
  );
}
