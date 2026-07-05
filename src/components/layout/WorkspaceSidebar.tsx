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
  Zap,
  Sparkles,
  CheckCircle,
  Users,
  CreditCard,
  ChevronRight,
  ChevronUp,
  BarChart2,
  TrendingUp,
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
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);
  const [customModules, setCustomModules] = useState<CustomModule[]>([]);

  // Modal & Popover States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);

  // Click-away listener for Settings Popover
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
            const actualProjects = projData.filter(
              (item: { module_name: string }) =>
                item.module_name !== 'workspace_modules'
            );
            setProjectsCount(actualProjects.length);
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
      return 'relative bg-white text-indigo-600 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/50 z-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:text-indigo-400';
    }
    return 'text-zinc-500 font-medium hover:text-zinc-900 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50';
  };

  const currentTier = tenant?.tier || 'basic';
  const tierName =
    currentTier === 'pro'
      ? t('plans.pro')
      : currentTier === 'advanced'
        ? t('plans.advanced')
        : t('plans.free');
  const projectLimit =
    currentTier === 'pro' ? 'Unlimited' : currentTier === 'advanced' ? 50 : 3;
  const percentage =
    projectLimit === 'Unlimited'
      ? 10
      : Math.min((projectsCount / (projectLimit as number)) * 100, 100);

  return (
    <>
      <aside className="w-[240px] h-full flex flex-col bg-[#F8F9FA] dark:bg-zinc-950 border-r border-zinc-200/60 dark:border-zinc-800/60 shrink-0 selection:bg-indigo-100 overflow-hidden">
        {/* HEADER SECTION */}
        <div className="px-5 py-6 border-b border-zinc-200/50 dark:border-zinc-800/50 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden relative">
              {isClient && tenant?.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                (tenant?.name?.charAt(0).toUpperCase() ?? 'W')
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                {t('header')}
              </span>
              <h2 className="font-bold text-sm truncate dark:text-zinc-100">
                {isClient ? tenant?.name || t('header') : t('header')}
              </h2>
            </div>
          </div>
        </div>

        {/* NAVIGATION SECTION */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto custom-scrollbar min-h-0">
          {isOnProject && (
            <div className="mb-4 pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <Link
                href={`/dashboard/${tenantId}/projects`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50 transition-all"
              >
                <ChevronRight
                  className="w-4 h-4 rotate-180"
                  strokeWidth={2.5}
                />
                {t('backToProjects')}
              </Link>
            </div>
          )}

          {!isOnProject && (
            <p className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 mt-2">
              {t('menu')}
            </p>
          )}

          <Link
            href={`/dashboard/${tenantId}/projects`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.endsWith('/projects') && !isOnProject)}`}
          >
            <LayoutDashboard className={`w-4 h-4 transition-colors`} />
            {t('projects')}
          </Link>

          <Link
            href={`/dashboard/${tenantId}/my-tasks`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.endsWith('/my-tasks'))}`}
          >
            <CheckCircle className={`w-4 h-4 transition-colors`} />
            {t('myTasks')}
          </Link>

          <Link
            href={`/dashboard/${tenantId}/ai`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.endsWith('/ai'))}`}
          >
            <Sparkles className={`w-4 h-4 transition-colors`} />
            {t('aiAssistant')}
          </Link>

          <Link
            href={`/dashboard/${tenantId}/community`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.endsWith('/community'))}`}
          >
            <Globe className={`w-4 h-4 transition-colors`} />
            {t('communityHub')}
          </Link>

          {isAdmin && !isOnProject && (
            <p className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 mt-4">
              {t('insights')}
            </p>
          )}

          {isAdmin && (
          <Link
            href={`/dashboard/${tenantId}/analytics`}
            className={`relative flex items-center gap-3 px-3 py-3 rounded-2xl text-sm transition-all group overflow-hidden ${
              pathname.endsWith('/analytics')
                ? 'bg-white text-indigo-600 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-indigo-200/60 z-10 dark:bg-zinc-900 dark:ring-indigo-900/50 dark:text-indigo-400'
                : 'text-zinc-600 font-medium hover:bg-white/80 hover:shadow-sm ring-1 ring-transparent hover:ring-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:ring-zinc-800/60'
            }`}
          >
            <div
              className={`absolute inset-0 bg-linear-to-br from-indigo-500/8 via-violet-500/5 to-transparent pointer-events-none transition-opacity ${
                pathname.endsWith('/analytics') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            />
            <div
              className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                pathname.endsWith('/analytics')
                  ? 'bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-indigo-50 text-indigo-600 group-hover:bg-linear-to-br group-hover:from-indigo-500 group-hover:to-violet-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-500/20 dark:bg-indigo-950/60 dark:text-indigo-400'
              }`}
            >
              <BarChart2 className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <div className="flex flex-col min-w-0 relative z-10">
              <span className="leading-tight">{t('analytics')}</span>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 group-hover:text-indigo-400/80 transition-colors">
                {t('analyticsDesc')}
              </span>
            </div>
            <TrendingUp
              className={`w-3.5 h-3.5 ml-auto relative z-10 shrink-0 transition-all ${
                pathname.endsWith('/analytics')
                  ? 'text-indigo-500 opacity-100'
                  : 'text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 dark:text-zinc-600'
              }`}
            />
          </Link>
          )}

          {customModules.length > 0 && (
            <div className="pt-4 pb-1">
              <p className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                {t('customModules')}
              </p>
            </div>
          )}

          {customModules.map((mod) => (
            <Link
              key={mod.slug}
              href={`/dashboard/${tenantId}/${mod.slug}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${getLinkStyle(pathname.includes(`/${mod.slug}`) && !isOnProject)}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${pathname.includes(`/${mod.slug}`) && !isOnProject ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-400'} transition-colors`}
              />
              {mod.name}
            </Link>
          ))}

          {isAdmin && !isOnProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> {t('addModule')}
            </button>
          )}
        </nav>

        {/* BOTTOM SECTION - SETTINGS POPOVER */}
        <div
          className="p-3 shrink-0 flex flex-col gap-2 relative"
          ref={settingsRef}
        >
          {!isOnProject && (
            <div className="p-4 rounded-2xl bg-linear-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm relative overflow-hidden mb-1 group cursor-default transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>
              <h3 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1 mb-1.5 relative z-10">
                <Zap className="w-3 h-3 text-amber-500" /> {tierName}
              </h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-3 relative z-10">
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                  {projectsCount}
                </span>{' '}
                {t('usage.of')} {projectLimit} {t('usage.projectsUsed')}
              </p>
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative z-10">
                <div
                  className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="relative">
              {/* GEMINI STYLE POPOVER */}
              {isSettingsOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="p-2 space-y-1">
                    <Link
                      href={`/dashboard/${tenantId}/settings`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                        {t('settingsAdv')}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Link>
                    <Link
                      href={`/dashboard/${tenantId}/team`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                        Team
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Link>
                    <Link
                      href={`/dashboard/${tenantId}/billing`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                        Billing
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </div>
                </div>
              )}

              {/* TRIGGER BUTTON */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all group ${isSettingsOpen || pathname.includes('/settings') || pathname.includes('/team') ? 'bg-white dark:bg-zinc-900 text-indigo-600 font-bold shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800' : 'text-zinc-500 dark:text-zinc-400 font-medium hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings
                    className={`w-4 h-4 ${isSettingsOpen || pathname.includes('/settings') || pathname.includes('/team') ? 'text-indigo-600' : 'text-zinc-400'} group-hover:text-zinc-900 dark:group-hover:text-white transition-colors`}
                  />
                  {t('settings')}
                </div>
                <ChevronUp
                  className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* CREATE MODULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-black text-zinc-950 dark:text-zinc-100 tracking-tight">
                {t('modal.title')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateModule} className="p-6">
              <div className="mb-6">
                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                  {t('modal.moduleName')}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={t('modal.placeholder')}
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-zinc-400 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-950 rounded-full animate-spin"></span>
                      {t('modal.creating')}
                    </>
                  ) : (
                    t('modal.create')
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
