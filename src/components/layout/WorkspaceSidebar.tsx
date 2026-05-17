"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

type TenantInfo = {
  id: string;
  name: string;
};

export default function WorkspaceSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const tenantId = params.tenantId as string;
  const isOnProject = Boolean(params.projectId);

  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          setTenant(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch workspace:", error);
      }
    };

    if (tenantId) fetchTenant();
  }, [tenantId]);

  return (
    <aside className="w-[220px] h-full flex flex-col border-r border-zinc-200/80 bg-[#FAFAFA] shrink-0">
      <div className="px-4 py-5 border-b border-zinc-200/50 shrink-0">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          Workspace
        </p>
        <h2 className="text-sm font-bold text-zinc-900 leading-snug">
          {tenant?.name ?? "Loading..."}
        </h2>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link
          href={`/dashboard/${tenantId}/projects`}
          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname.endsWith("/projects") && !isOnProject
              ? "bg-white border border-zinc-200/80 text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60"
          }`}
        >
          Projects
        </Link>

        {isOnProject && (
          <Link
            href={`/dashboard/${tenantId}/projects`}
            className="block px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60 transition-colors"
          >
            ← All projects
          </Link>
        )}
      </nav>
    </aside>
  );
}
