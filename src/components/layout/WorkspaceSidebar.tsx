'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';
import {
  Plus,
  X,
  LayoutDashboard,
  Settings,
  Globe,
  Sparkles,
  CheckCircle,
  Users,
  CreditCard,
  ChevronRight,
  ChevronsUpDown,
  BarChart2,
} from 'lucide-react';
import { fetchAPI } from '@/services/api';
import { useTenantStore } from '@/store/useTenantStore';

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

  const t = useTranslations('WorkspaceSidebar');

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const { tenant, fetchTenant } = useTenantStore();
  const [isClient, setIsClient] = useState(false);
  const [customModules, setCustomModules] = useState<CustomModule[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  const [isModulesOpen, setIsModulesOpen] = useState(true);

  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const fetchWorkspaceData = async () => {
      try {
        if (tenantId) fetchTenant(tenantId);

        const [modulesRes, projectsRes] = await Promise.all([
          fetchAPI(
            `/api/records?tenant_id=${tenantId}&module_name=workspace_modules`
          ),
          fetchAPI(`/api/records?tenant_id=${tenantId}`),
        ]);

        if (modulesRes.ok) {
          const data = await modulesRes.json();
          if (Array.isArray(data)) {
            setCustomModules(
              data.map(
                (item: { record_data: CustomModule }) => item.record_data
              )
            );
          }
        }

        if (projectsRes.ok) {
          const projData = await projectsRes.json();
          if (Array.isArray(projData)) {
          }
        }
      } catch (error) {
        console.error('Failed to fetch workspace data:', error);
      }
    };

    if (tenantId) fetchWorkspaceData();
  }, [tenantId, fetchTenant]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    setIsCreating(true);

    try {
      const slug = newModuleName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-');
      const res = await fetchAPI(`/api/records`, {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          module_name: 'workspace_modules',
          record_data: { name: newModuleName.trim(), slug },
        }),
      });

      if (res.ok) {
        setCustomModules([
          ...customModules,
          { name: newModuleName.trim(), slug },
        ]);
        setIsModalOpen(false);
        setNewModuleName('');
        router.push(`/dashboard/${tenantId}/${slug}`);
      }
    } catch (error) {
      console.error('Error creating module', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getLinkStyle = (isActive: boolean) => {
    if (isActive) {
      return 'bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-medium';
    }
    return 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium';
  };

  return (
    <>
      <aside className="w-[240px] h-full flex flex-col bg-[#F9F9F9] dark:bg-[#1E1E20] border-r border-zinc-200/60 dark:border-white/5 shrink-0 selection:bg-indigo-100 overflow-hidden transition-all duration-300">
        <div className="px-3 pt-4 pb-2 shrink-0">
          <div className="w-full flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
                {isClient && tenant?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (tenant?.name?.charAt(0).toUpperCase() ?? 'W')
                )}
              </div>
              <h2 className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-100">
                {isClient ? tenant?.name || t('header') : t('header')}
              </h2>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0" />
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar min-h-0">
          {isOnProject && (
            <div className="mb-4">
              <Link
                href={`/dashboard/${tenantId}/projects`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                {t('backToProjects')}
              </Link>
            </div>
          )}

          {!isOnProject && (
            <div className="mb-2">
              <div
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-between px-2 py-1 mt-2 mb-1 cursor-pointer group"
              >
                <span className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400">
                  {t('menu')}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}
                />
              </div>

              <div
                className={`space-y-0.5 overflow-hidden transition-all duration-200 ${isMenuOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <Link
                  href={`/dashboard/${tenantId}/projects`}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${getLinkStyle(pathname.endsWith('/projects') && !isOnProject)}`}
                >
                  <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
                  {t('projects')}
                </Link>

                <Link
                  href={`/dashboard/${tenantId}/my-tasks`}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${getLinkStyle(pathname.endsWith('/my-tasks'))}`}
                >
                  <CheckCircle className="w-4 h-4" strokeWidth={2} />
                  {t('myTasks')}
                </Link>

                <Link
                  href={`/dashboard/${tenantId}/ai`}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${getLinkStyle(pathname.endsWith('/ai'))}`}
                >
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
                  {t('aiAssistant')}
                </Link>

                <Link
                  href={`/dashboard/${tenantId}/community`}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${getLinkStyle(pathname.endsWith('/community'))}`}
                >
                  <Globe className="w-4 h-4" strokeWidth={2} />
                  {t('communityHub')}
                </Link>
              </div>
            </div>
          )}

          {isAdmin && !isOnProject && (
            <div className="mb-2 mt-4">
              <div
                onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                className="flex items-center justify-between px-2 py-1 mb-1 cursor-pointer group"
              >
                <span className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400">
                  {t('insights')}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isInsightsOpen ? 'rotate-90' : ''}`}
                />
              </div>

              <div
                className={`overflow-hidden transition-all duration-200 ${isInsightsOpen ? 'max-h-[150px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <Link
                  href={`/dashboard/${tenantId}/analytics`}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${getLinkStyle(pathname.endsWith('/analytics'))}`}
                >
                  <BarChart2 className="w-4 h-4" strokeWidth={2} />
                  {t('analytics')}
                </Link>
              </div>
            </div>
          )}

          {customModules.length > 0 && !isOnProject && (
            <div className="mb-2 mt-4">
              <div
                onClick={() => setIsModulesOpen(!isModulesOpen)}
                className="flex items-center justify-between px-2 py-1 mb-1 cursor-pointer group"
              >
                <span className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400">
                  {t('customModules')}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isModulesOpen ? 'rotate-90' : ''}`}
                />
              </div>

              <div
                className={`space-y-0.5 overflow-hidden transition-all duration-200 ${isModulesOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                {customModules.map((mod) => (
                  <Link
                    key={mod.slug}
                    href={`/dashboard/${tenantId}/${mod.slug}`}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${getLinkStyle(pathname.includes(`/${mod.slug}`) && !isOnProject)}`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    </div>
                    {mod.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isAdmin && !isOnProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 mt-2 rounded-md text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              {t('addModule')}
            </button>
          )}
        </nav>

        <div
          className="p-3 shrink-0 flex flex-col gap-1 relative"
          ref={settingsRef}
        >
          {isAdmin && (
            <div className="relative">
              {isSettingsOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-[#252525] border border-zinc-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <div className="p-1 space-y-0.5">
                    <Link
                      href={`/dashboard/${tenantId}/settings`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" strokeWidth={2} />
                      {t('settingsAdv')}
                    </Link>
                    <Link
                      href={`/dashboard/${tenantId}/team`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Users className="w-4 h-4" strokeWidth={2} />
                      Team
                    </Link>
                    <Link
                      href={`/dashboard/${tenantId}/billing`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4" strokeWidth={2} />
                      Billing
                    </Link>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${isSettingsOpen || pathname.includes('/settings') || pathname.includes('/team') || pathname.includes('/billing') ? 'bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" strokeWidth={2} />
                  {t('settings')}
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E1E20] rounded-xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-white/5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t('modal.title')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateModule} className="p-5">
              <div className="mb-5">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={t('modal.placeholder')}
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-md text-sm focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 transition-colors text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin"></span>
                  ) : null}
                  {t('modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
