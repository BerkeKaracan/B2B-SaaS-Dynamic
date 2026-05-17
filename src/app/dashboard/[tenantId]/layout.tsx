import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = await params;
  const currentTenantId = resolvedParams.tenantId;

  return (
    <div className="flex flex-col h-screen bg-[#fafafb] font-sans text-zinc-900 overflow-hidden">
      <Navbar tenantId={currentTenantId} showProjectInfo={false} />
      <div className="flex flex-1 flex-row overflow-hidden w-full">
        <aside className="w-64 bg-zinc-950 text-zinc-300 flex flex-col justify-between border-r border-zinc-800 z-20 h-full">
          <div>
            <nav className="p-4 space-y-1">
              <Link
                href={`/dashboard/${currentTenantId}/projects`}
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
            </nav>
          </div>

          <div className="p-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <span className="text-xs text-zinc-400 font-medium">U</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white">Owner</span>
                <span className="text-[10px] text-zinc-500">
                  Manage account
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 bg-[#fafafb]">
          {children}
        </main>
      </div>
    </div>
  );
}
