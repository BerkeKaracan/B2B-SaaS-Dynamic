import React from "react";

export default function ProjectsPage({
  params,
}: {
  params: { tenant_id: string };
}) {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Active Projects
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and organize your dynamic workflows.
          </p>
        </div>
        <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm flex items-center gap-2">
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

      <div className="w-full border-2 border-dashed border-zinc-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-white/50">
        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">
          No projects found
        </h3>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          You haven&apos;t created any projects yet. Start by creating a new project
          to utilize the dynamic JSONB records.
        </p>
        <button className="text-sm font-semibold text-zinc-900 bg-white border border-zinc-200 px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
          Read Documentation
        </button>
      </div>
    </div>
  );
}
