"use client";

import { Table2, Kanban, Webhook, DatabaseBackup } from "lucide-react";

/**
 * Secondary navigation sidebar (Left 2).
 * Displays context-specific views and settings for the active workspace (Fleet Vehicles).
 */
export default function SecondarySidebar() {
  return (
    <aside className="w-56 bg-white dark:bg-black border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
      <div className="p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Data Views
        </h2>
        <nav className="space-y-2 mb-8">
          <button className="w-full flex items-center space-x-3 text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 p-2 rounded-md transition-colors">
            <Table2 size={18} />
            <span className="text-sm font-medium">Grid View</span>
          </button>
          <button className="w-full flex items-center space-x-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 p-2 rounded-md transition-colors">
            <Kanban size={18} />
            <span className="text-sm font-medium">Kanban Board</span>
          </button>
        </nav>

        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Integrations
        </h2>
        <nav className="space-y-2">
          <button className="w-full flex items-center space-x-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 p-2 rounded-md transition-colors">
            <DatabaseBackup size={18} />
            <span className="text-sm font-medium">Import / Export</span>
          </button>
          <button className="w-full flex items-center space-x-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 p-2 rounded-md transition-colors">
            <Webhook size={18} />
            <span className="text-sm font-medium">API & Webhooks</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
