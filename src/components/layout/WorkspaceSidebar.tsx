"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, X, LayoutDashboard, Settings, Globe } from "lucide-react";

type TenantInfo = {
  id: string;
  name: string;
};

type CustomModule = {
  name: string;
  slug: string;
};

export default function WorkspaceSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const isOnProject = Boolean(params.projectId);

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  const [customModules, setCustomModules] = useState<CustomModule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const resTenant = await fetch(
          `${API_BASE_URL}/api/tenants/${tenantId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (resTenant.ok) setTenant(await resTenant.json());

        const resModules = await fetch(
          `${API_BASE_URL}/api/records?tenant_id=${tenantId}&module_name=workspace_modules`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (resModules.ok) {
          const data = await resModules.json();
          setCustomModules(
            data.map((item: { record_data: CustomModule }) => item.record_data),
          );
        }
      } catch (error) {
        console.error("Failed to fetch workspace data:", error);
      }
    };

    if (tenantId) fetchTenantData();
  }, [tenantId]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    setIsCreating(true);

    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const slug = newModuleName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");

      const res = await fetch(`${API_BASE_URL}/api/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          module_name: "workspace_modules",
          record_data: { name: newModuleName.trim(), slug },
        }),
      });

      if (res.ok) {
        setCustomModules([
          ...customModules,
          { name: newModuleName.trim(), slug },
        ]);
        setIsModalOpen(false);
        setNewModuleName("");

        router.push(`/dashboard/${tenantId}/${slug}`);
      }
    } catch (error) {
      console.error("Error creating module", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <aside className="w-[220px] h-full flex flex-col border-r border-zinc-200/80 bg-[#FAFAFA] shrink-0">
        <div className="px-4 py-5 border-b border-zinc-200/50 shrink-0">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Workspace
          </p>
          <h2 className="text-sm font-bold text-zinc-900 leading-snug">
            {tenant?.name ?? "Loading..."}
          </h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            href={`/dashboard/${tenantId}/projects`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.endsWith("/projects") && !isOnProject
                ? "bg-white border border-zinc-200/80 text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Projects
          </Link>

          <Link
            href={`/dashboard/${tenantId}/community`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.endsWith("/community")
                ? "bg-white border border-zinc-200/80 text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60"
            }`}
          >
            <Globe className="w-4 h-4" /> Community Hub
          </Link>

          {customModules.map((mod) => (
            <Link
              key={mod.slug}
              href={`/dashboard/${tenantId}/${mod.slug}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.includes(`/${mod.slug}`) && !isOnProject
                  ? "bg-white border border-zinc-200/80 text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 opacity-50" /> {mod.name}
            </Link>
          ))}

          {isAdmin && !isOnProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-zinc-300 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Module
            </button>
          )}

          <div className="pt-4 mt-4 border-t border-zinc-200/50">
            {isAdmin && (
              <Link
                href={`/dashboard/${tenantId}/settings`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.includes("/settings") || pathname.includes("/team")
                    ? "bg-white border border-zinc-200/80 text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60"
                }`}
              >
                <Settings className="w-4 h-4" /> Workspace Settings
              </Link>
            )}
          </div>

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

      {/* NEW MODULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">
                Create Custom Module
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200/50 text-zinc-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="p-6">
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Module Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. HR Dashboard, Invoices..."
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-950 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-950 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
