import React from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant_id: string };
}) {
  return (
    <div className="flex h-screen bg-[#fafafb] font-sans text-zinc-900 overflow-hidden">
      <aside className="w-64 bg-zinc-950 text-zinc-300 flex flex-col justify-between border-r border-zinc-800">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-zinc-800/50 mb-4">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center mr-3 shadow-sm">
              <span className="text-zinc-950 text-xs font-bold font-mono">
                B2
              </span>
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">
              Workspace
            </span>
          </div>

          <nav className="px-4 space-y-1">
            <Link
              href={`/dashboard/${params.tenant_id}/projects`}
              className="flex items-center gap-3 px-3 py-2 bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              Projects
            </Link>

            <Link
              href={`/dashboard/${params.tenant_id}/team`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Team & Roles
            </Link>

            <Link
              href={`/dashboard/${params.tenant_id}/settings`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Settings
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <span className="text-xs text-zinc-400 font-medium">U</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">Owner</span>
              <span className="text-[10px] text-zinc-500">Manage account</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-y-auto">
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center text-sm text-zinc-500">
            <span className="hover:text-zinc-900 cursor-pointer transition-colors">
              Dashboard
            </span>
            <span className="mx-2">/</span>
            <span className="font-medium text-zinc-900">Projects</span>
          </div>
          <div className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
            ID: {params.tenant_id.slice(0, 8)}...
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
