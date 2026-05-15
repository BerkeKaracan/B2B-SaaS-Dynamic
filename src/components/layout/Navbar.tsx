"use client";
import React from "react";
import { useLayoutStore } from "@/store/useLayoutStore";

export default function Navbar({ tenantId }: { tenantId: string }) {
  const { toggleSecondarySidebar } = useLayoutStore();

  return (
    <nav className="h-14 w-full border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded text-slate-600 transition-colors">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-sm tracking-tight uppercase">
            Engine
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleSecondarySidebar}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          PROJECT INFO
        </button>

        <button className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold hover:bg-slate-700">
          JD
        </button>
      </div>
    </nav>
  );
}
