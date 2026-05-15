"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import { Menu, Building2, ChevronDown } from "lucide-react";

/**
 * Topmost persistent navigation bar.
 * Displays tenant context and global actions.
 */
export default function GlobalNavbar() {
  const { togglePrimarySidebar } = useLayoutStore();

  return (
    <header className="h-14 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePrimarySidebar}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
          aria-label="Toggle Primary Sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">
            SE
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">
            SaaS Engine
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Tenant Workspace Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
          <Building2 size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Acme Logistics Corp.
          </span>
        </div>

        {/* User Profile */}
        <button className="flex items-center space-x-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-sm">
            BK
          </div>
          <ChevronDown size={16} className="text-slate-500" />
        </button>
      </div>
    </header>
  );
}
