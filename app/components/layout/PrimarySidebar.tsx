"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import { Database, Users, Briefcase, CarFront } from "lucide-react";

/**
 * Primary navigation sidebar (Left 1).
 * Displays main SaaS modules.
 */
export default function PrimarySidebar() {
  const { isPrimarySidebarOpen } = useLayoutStore();

  return (
    <aside
      className={`bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col ${
        isPrimarySidebarOpen
          ? "w-64 opacity-100"
          : "w-0 opacity-0 overflow-hidden"
      }`}
    >
      <div className="p-4 w-64">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Workspaces
        </h2>
        <nav className="space-y-2">
          {/* Active module */}
          <button className="w-full flex items-center space-x-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 p-2 rounded-md transition-colors">
            <CarFront size={18} />
            <span className="text-sm font-semibold">Fleet Vehicles</span>
          </button>

          {/* Other modules */}
          <button className="w-full flex items-center space-x-3 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 p-2 rounded-md transition-colors">
            <Users size={18} />
            <span className="text-sm font-medium">Employee Payroll</span>
          </button>
          <button className="w-full flex items-center space-x-3 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 p-2 rounded-md transition-colors">
            <Briefcase size={18} />
            <span className="text-sm font-medium">Client Contracts</span>
          </button>
          <button className="w-full flex items-center space-x-3 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 p-2 rounded-md transition-colors">
            <Database size={18} />
            <span className="text-sm font-medium">Data Warehouses</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
