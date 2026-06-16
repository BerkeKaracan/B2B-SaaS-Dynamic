"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, X, LayoutDashboard, Settings, Globe, Zap } from "lucide-react";
import { fetchAPI } from "@/services/api";

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
        const resTenant = await fetchAPI(`/api/tenants/${tenantId}`);
        if (resTenant.ok) setTenant(await resTenant.json());

        const resModules = await fetchAPI(
          `/api/records?tenant_id=${tenantId}&module_name=workspace_modules`,
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
      const slug = newModuleName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");

      const res = await fetchAPI(`/api/records`, {
        method: "POST",
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

  // Aktif linkler için özel Vercel/Linear stili
  const getLinkStyle = (isActive: boolean) => {
    if (isActive) {
      return "relative bg-white text-indigo-600 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/50 z-10";
    }
    return "text-zinc-500 font-medium hover:text-zinc-900 hover:bg-zinc-100/80";
  };

  // Aktif ikon rengi
  const getIconStyle = (isActive: boolean) => {
    return isActive ? "text-indigo-600" : "text-zinc-400";
  };

  return (
    <>
      <aside className="w-[240px] h-full flex flex-col bg-[#F8F9FA] border-r border-zinc-200/60 shrink-0 selection:bg-indigo-100">
        {/* WORKSPACE HEADER */}
        <div className="px-5 py-6 border-b border-zinc-200/50 shrink-0 relative overflow-hidden">
          {/* Hafif arka plan parlaması */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {tenant?.name?.charAt(0).toUpperCase() ?? "W"}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                Workspace
              </span>
              <h2 className="text-sm font-bold text-zinc-900 leading-none truncate max-w-[140px]">
                {tenant?.name ?? "Loading..."}
              </h2>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {isOnProject && (
            <div className="mb-4 pb-2 border-b border-zinc-200/50">
              <Link
                href={`/dashboard/${tenantId}/projects`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Projects
              </Link>
            </div>
          )}

          {!isOnProject && (
            <p className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 mt-2">
              Menu
            </p>
          )}

          <Link
            href={`/dashboard/${tenantId}/projects`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.endsWith("/projects") && !isOnProject)}`}
          >
            {pathname.endsWith("/projects") && !isOnProject && (
              <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
            )}
            <LayoutDashboard
              className={`w-4 h-4 ${getIconStyle(pathname.endsWith("/projects") && !isOnProject)} group-hover:text-zinc-900 transition-colors`}
            />
            Projects
          </Link>

          <Link
            href={`/dashboard/${tenantId}/community`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.endsWith("/community"))}`}
          >
            {pathname.endsWith("/community") && (
              <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
            )}
            <Globe
              className={`w-4 h-4 ${getIconStyle(pathname.endsWith("/community"))} group-hover:text-zinc-900 transition-colors`}
            />
            Community Hub
          </Link>

          {customModules.length > 0 && (
            <div className="pt-4 pb-1">
              <p className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                Custom Modules
              </p>
            </div>
          )}

          {customModules.map((mod) => {
            const isActive = pathname.includes(`/${mod.slug}`) && !isOnProject;
            return (
              <Link
                key={mod.slug}
                href={`/dashboard/${tenantId}/${mod.slug}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(isActive)}`}
              >
                {isActive && (
                  <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
                )}
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" : "bg-zinc-300 group-hover:bg-zinc-400"} transition-colors`}
                />
                {mod.name}
              </Link>
            );
          })}

          {isAdmin && !isOnProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-zinc-300 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50/80 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Module
            </button>
          )}
        </nav>

        {/* BOTTOM SECTION: STORAGE & SETTINGS */}
        <div className="p-3 shrink-0 flex flex-col gap-2">
          {/* SAAS PREMIUM DETAY: Plan/Storage Göstergesi */}
          {!isOnProject && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 shadow-sm relative overflow-hidden mb-2 group cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>
              <div className="flex items-center justify-between mb-1.5 relative z-10">
                <h3 className="text-[10px] font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Free Plan
                </h3>
              </div>
              <p className="text-[11px] font-medium text-zinc-500 mb-3 relative z-10">
                <span className="text-zinc-900 font-bold">2</span> of 3 projects
                used
              </p>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-indigo-500 w-[66%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
              </div>
            </div>
          )}

          {isAdmin && (
            <Link
              href={`/dashboard/${tenantId}/settings`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.includes("/settings") || pathname.includes("/team"))}`}
            >
              {pathname.includes("/settings") && (
                <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
              )}
              <Settings
                className={`w-4 h-4 ${getIconStyle(pathname.includes("/settings"))} group-hover:text-zinc-900 transition-colors`}
              />
              Settings
            </Link>
          )}
        </div>
      </aside>

      {/* CREATE MODULE MODAL (Premium Tasarım) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-lg font-black text-zinc-950 tracking-tight">
                Create Workspace Module
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200/50 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="p-6">
              <div className="mb-6">
                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                  Module Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. HR Dashboard, Invoices..."
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-zinc-400 text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-950 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Creating...
                    </>
                  ) : (
                    "Create Module"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
