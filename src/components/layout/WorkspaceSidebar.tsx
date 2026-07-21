'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
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
  Trash2,
  Archive,
  Folder,
  Star,
  Activity,
  Key,
  MessageSquareHeart,
  ExternalLink,
} from 'lucide-react';
import { fetchAPI } from '@/services/api';
import { useTenantStore } from '@/store/useTenantStore';
import { FEEDBACK_PORTAL_URL } from '@/lib/feedbackPortal';

type CustomModule = {
  name: string;
  slug: string;
};

type WorkspaceItem = {
  id: string;
  name: string;
  logo_url?: string;
  tier?: string;
};

type ProjectRecordItem = {
  record_data: {
    folder?: string;
    status?: string;
  };
};

export default function WorkspaceSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const isOnProject = Boolean(params.projectId);

  const view = searchParams.get('view');
  const currentFolder = searchParams.get('folder');

  const t = useTranslations('WorkspaceSidebar');

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const { tenant, fetchTenant } = useTenantStore();
  const [isClient, setIsClient] = useState(false);
  const [customModules, setCustomModules] = useState<CustomModule[]>([]);

  const [myWorkspaces, setMyWorkspaces] = useState<WorkspaceItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  const [isModulesOpen, setIsModulesOpen] = useState(true);
  const [isStorageOpen, setIsStorageOpen] = useState(
    view === 'archive' || view === 'trash'
  );
  const [isProjectsFoldersOpen, setIsProjectsFoldersOpen] = useState(true);

  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWorkspaceDropdownOpen(false);
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

        const [modulesRes, workspacesRes, projectsRes] = await Promise.all([
          fetchAPI(
            `/api/records?tenant_id=${tenantId}&module_name=workspace_modules`
          ),
          fetchAPI(`/api/tenants/me/list`),
          fetchAPI(`/api/records?tenant_id=${tenantId}&module_name=projects`),
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

        if (workspacesRes.ok) {
          const wData = await workspacesRes.json();
          if (Array.isArray(wData)) {
            setMyWorkspaces(wData);
          }
        }

        if (projectsRes.ok) {
          const pData: ProjectRecordItem[] = await projectsRes.json();
          const uniqueFolders = Array.from(
            new Set(
              pData
                .filter(
                  (p) =>
                    p.record_data?.folder && p.record_data.status !== 'trashed'
                )
                .map((p) => p.record_data.folder as string)
            )
          );
          setFolders(uniqueFolders.sort());
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
    const base =
      'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] leading-snug tracking-[-0.01em] transition-colors';
    if (isActive) {
      return `${base} bg-white dark:bg-zinc-800/90 text-zinc-950 dark:text-zinc-50 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/70 dark:ring-white/5`;
    }
    return `${base} text-zinc-500 dark:text-zinc-400 font-medium hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100`;
  };

  const sectionHeader = (label: string, isOpen: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2.5 py-1.5 mt-1 mb-1 cursor-pointer group rounded-md hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30 transition-colors"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <ChevronRight
        className={`w-3 h-3 text-zinc-400/70 group-hover:text-zinc-500 transition-all duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}
      />
    </button>
  );

  const isProjectsActive =
    pathname.endsWith('/projects') && !view && !currentFolder && !isOnProject;
  const isFavoritesActive =
    pathname.endsWith('/projects') && view === 'favorites' && !isOnProject;
  const isArchiveActive = pathname.endsWith('/projects') && view === 'archive';
  const isTrashActive = pathname.endsWith('/projects') && view === 'trash';

  return (
    <>
      <aside className="w-62 h-full flex flex-col bg-[#F7F7F8] dark:bg-[#18181B] border-r border-zinc-200/70 dark:border-white/6 shrink-0 selection:bg-zinc-200 overflow-hidden transition-all duration-300 antialiased">
        <div
          className="px-3 pt-4 pb-3 shrink-0 relative"
          ref={workspaceDropdownRef}
        >
          <div
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="w-full flex items-center justify-between gap-2.5 px-2 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group ring-1 ring-transparent hover:ring-zinc-200/80 dark:hover:ring-white/5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-semibold text-[11px] tracking-tight shadow-sm overflow-hidden shrink-0">
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
              <h2 className="font-semibold text-[13px] tracking-[-0.02em] truncate text-zinc-900 dark:text-zinc-50">
                {isClient ? tenant?.name || t('header') : t('header')}
              </h2>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 opacity-40 group-hover:opacity-100 transition-all duration-200 shrink-0" />
          </div>

          {isWorkspaceDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-white dark:bg-[#252528] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-1.5 flex flex-col gap-0.5 max-h-62.5 overflow-y-auto custom-scrollbar">
                <div className="px-2.5 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em]">
                  {t('myWorkspaces')}
                </div>
                {myWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      setIsWorkspaceDropdownOpen(false);
                      if (workspace.id !== tenantId) {
                        router.push(`/dashboard/${workspace.id}`);
                      }
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-2 py-2 rounded-lg transition-colors ${
                      workspace.id === tenantId
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-semibold text-[10px] tracking-tight overflow-hidden shrink-0 bg-white dark:bg-zinc-900">
                      {workspace.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={workspace.logo_url}
                          alt={workspace.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        workspace.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-[13px] font-medium tracking-[-0.01em] truncate flex-1">
                      {workspace.name}
                    </span>
                    {workspace.id === tenantId && (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2.5 py-1 overflow-y-auto custom-scrollbar min-h-0">
          {isOnProject && (
            <div className="mb-3 px-0.5">
              <Link
                href={`/dashboard/${tenantId}/projects`}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium tracking-[-0.01em] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/40 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                {t('backToProjects')}
              </Link>
            </div>
          )}

          <div className="mb-1">
            {sectionHeader(t('menu'), isMenuOpen, () =>
              setIsMenuOpen(!isMenuOpen)
            )}

            <div
              className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                isMenuOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href={`/dashboard/${tenantId}/projects?view=favorites`}
                className={getLinkStyle(isFavoritesActive)}
              >
                <Star
                  className={`w-4 h-4 shrink-0 ${isFavoritesActive ? 'text-amber-500 fill-amber-500' : ''}`}
                  strokeWidth={1.75}
                />
                {t('favorites')}
              </Link>

              <div className="relative">
                <div className="flex items-center w-full">
                  <Link
                    href={`/dashboard/${tenantId}/projects`}
                    className={`flex-1 ${getLinkStyle(isProjectsActive)}`}
                  >
                    <LayoutDashboard
                      className="w-4 h-4 shrink-0"
                      strokeWidth={1.75}
                    />
                    {t('allProjects')}
                  </Link>
                  {folders.length > 0 && (
                    <button
                      onClick={() =>
                        setIsProjectsFoldersOpen(!isProjectsFoldersOpen)
                      }
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 absolute right-1 rounded-md"
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-all duration-200 ${
                          isProjectsFoldersOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {folders.length > 0 && (
                  <div
                    className={`ml-3.5 pl-3 mt-1 space-y-0.5 border-l border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-200 ${
                      isProjectsFoldersOpen
                        ? 'max-h-75 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    {folders.map((folder) => {
                      const isActive = currentFolder === folder;
                      return (
                        <Link
                          key={folder}
                          href={`/dashboard/${tenantId}/projects?folder=${encodeURIComponent(
                            folder
                          )}`}
                          className={`group flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[12.5px] tracking-[-0.01em] transition-all duration-200 ${
                            isActive
                              ? 'bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-50 font-semibold ring-1 ring-zinc-200/70 dark:ring-white/5'
                              : 'text-zinc-500 font-medium hover:bg-zinc-200/40 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                          }`}
                        >
                          <Folder
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 group-hover:text-zinc-600'}`}
                            strokeWidth={1.75}
                          />
                          <span className="truncate">{folder}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                href={`/dashboard/${tenantId}/my-tasks`}
                className={getLinkStyle(pathname.endsWith('/my-tasks'))}
              >
                <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {t('myTasks')}
              </Link>

              <Link
                href={`/dashboard/${tenantId}/ai`}
                className={getLinkStyle(pathname.endsWith('/ai'))}
              >
                <Sparkles className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {t('aiAssistant')}
              </Link>

              <Link
                href={`/dashboard/${tenantId}/community`}
                className={getLinkStyle(pathname.endsWith('/community'))}
              >
                <Globe className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {t('communityHub')}
              </Link>
            </div>
          </div>

          {isAdmin && (
            <div className="mb-1 mt-3">
              {sectionHeader(t('insights'), isInsightsOpen, () =>
                setIsInsightsOpen(!isInsightsOpen)
              )}

              <div
                className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                  isInsightsOpen
                    ? 'max-h-37.5 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <Link
                  href={`/dashboard/${tenantId}/analytics`}
                  className={getLinkStyle(pathname.endsWith('/analytics'))}
                >
                  <BarChart2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {t('analytics')}
                </Link>
                <Link
                  href={`/dashboard/${tenantId}/activity`}
                  className={getLinkStyle(pathname.endsWith('/activity'))}
                >
                  <Activity className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {t('activityLog')}
                </Link>
              </div>
            </div>
          )}

          {customModules.length > 0 && (
            <div className="mb-1 mt-3">
              {sectionHeader(t('customModules'), isModulesOpen, () =>
                setIsModulesOpen(!isModulesOpen)
              )}

              <div
                className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                  isModulesOpen
                    ? 'max-h-125 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                {customModules.map((mod) => (
                  <Link
                    key={mod.slug}
                    href={`/dashboard/${tenantId}/${mod.slug}`}
                    className={getLinkStyle(
                      pathname.includes(`/${mod.slug}`) && !isOnProject
                    )}
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    </div>
                    <span className="truncate">{mod.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mb-1 mt-3">
            {sectionHeader(t('storage'), isStorageOpen, () =>
              setIsStorageOpen(!isStorageOpen)
            )}

            <div
              className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                isStorageOpen
                  ? 'max-h-37.5 opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              <Link
                href={`/dashboard/${tenantId}/projects?view=archive`}
                className={getLinkStyle(isArchiveActive)}
              >
                <Archive className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {t('archive')}
              </Link>

              <Link
                href={`/dashboard/${tenantId}/projects?view=trash`}
                className={getLinkStyle(isTrashActive)}
              >
                <Trash2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {t('trash')}
              </Link>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-5 pt-4 pb-2 border-t border-zinc-200/80 dark:border-zinc-800/80 px-0.5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-[12.5px] font-semibold tracking-[-0.01em] text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                {t('addModule')}
              </button>
            </div>
          )}
        </nav>

        <div
          className="p-2.5 shrink-0 flex flex-col gap-1 relative border-t border-zinc-200/70 dark:border-white/6"
          ref={settingsRef}
        >
          <a
            href={FEEDBACK_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${getLinkStyle(false)} justify-between`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MessageSquareHeart
                className="w-4 h-4 shrink-0"
                strokeWidth={1.75}
              />
              <span className="truncate">{t('feedback')}</span>
            </div>
            <ExternalLink
              className="w-3.5 h-3.5 shrink-0 opacity-40"
              strokeWidth={1.75}
            />
          </a>
          {isAdmin && (
            <div className="relative">
              {isSettingsOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-[#252528] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href={`/dashboard/${tenantId}/settings`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium tracking-[-0.01em] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" strokeWidth={1.75} />
                      {t('settingsAdv')}
                    </Link>
                    <Link
                      href={`/dashboard/${tenantId}/team`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium tracking-[-0.01em] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Users className="w-4 h-4" strokeWidth={1.75} />
                      {t('team')}
                    </Link>
                    <Link
                      href={`/dashboard/${tenantId}/billing`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium tracking-[-0.01em] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4" strokeWidth={1.75} />
                      {t('billing')}
                    </Link>
                    <Link
                      href={`/dashboard/${tenantId}/developer`}
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium tracking-[-0.01em] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Key className="w-4 h-4" strokeWidth={1.75} />
                      {t('developer')}
                    </Link>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full ${getLinkStyle(
                  isSettingsOpen ||
                    pathname.includes('/settings') ||
                    pathname.includes('/team') ||
                    pathname.includes('/billing') ||
                    pathname.includes('/developer')
                )} justify-between`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {t('settings')}
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E1E20] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-white/5">
              <h2 className="text-[14px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
                {t('modal.title')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[13px] tracking-[-0.01em] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 dark:focus:ring-white/10 transition-colors text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-2 rounded-lg text-[13px] font-semibold tracking-[-0.01em] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
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
