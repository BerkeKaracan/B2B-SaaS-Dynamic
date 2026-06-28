'use client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { WORKSPACE_MODULE } from '@/lib/workspace';
import {
  getProjectDisplayName,
  isMeaningfulProjectRecord,
} from '@/lib/projectRecord';
import { RecordData } from '@/types/record';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchAPI } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/loading';
import { useTranslations } from 'next-intl';
import {
  Search,
  Briefcase,
  Archive,
  FolderPlus,
  MoreVertical,
  Clock,
  Shield,
  Globe,
  LayoutTemplate,
  Trash2,
  AlertTriangle,
  Database,
  PenTool,
  FileText,
  Network,
  MessageSquare,
  ChevronDown,
  KanbanSquare,
} from 'lucide-react';

type ProjectRecord = {
  id: string;
  record_data: RecordData & {
    visibility?: string;
    status?: string;
    updated_at?: string;
    updated_by?: string;
    template?: string;
    is_global_shared?: string;
  };
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export default function ProjectCardsGrid({
  moduleName,
}: {
  moduleName?: string;
}) {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const activeModule = moduleName || WORKSPACE_MODULE;

  const t = useTranslations('ProjectsPage');

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectVisibility, setNewProjectVisibility] = useState('public');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  const TEMPLATES = useMemo(
    () => [
      {
        id: 'blank',
        name: t('templates.blank'),
        icon: LayoutTemplate,
        color: 'text-zinc-500 dark:text-zinc-400',
      },
      {
        id: 'kanban',
        name: t('templates.kanban'),
        icon: KanbanSquare,
        color: 'text-blue-500',
      },
      {
        id: 'document',
        name: t('templates.document'),
        icon: FileText,
        color: 'text-amber-500',
      },
      {
        id: 'whiteboard',
        name: t('templates.whiteboard'),
        icon: PenTool,
        color: 'text-emerald-500',
      },
      {
        id: 'timeline',
        name: t('templates.timeline'),
        icon: Clock,
        color: 'text-purple-500',
      },
      {
        id: 'database',
        name: t('templates.database'),
        icon: Database,
        color: 'text-indigo-500',
      },
      {
        id: 'mindmap',
        name: t('templates.mindmap'),
        icon: Network,
        color: 'text-pink-500',
      },
      {
        id: 'retrospective',
        name: t('templates.retrospective'),
        icon: MessageSquare,
        color: 'text-rose-500',
      },
    ],
    [t]
  );

  const selectedTemplateData =
    TEMPLATES.find((temp) => temp.id === selectedTemplate) || TEMPLATES[0];

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAPI(
        `/api/records/?tenant_id=${tenantId}&module_name=${activeModule}`
      );
      if (res.ok) {
        const data: ProjectRecord[] = await res.json();
        const meaningful = data.filter((row) =>
          isMeaningfulProjectRecord(row.record_data ?? {})
        );
        setProjects(meaningful);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [activeModule, tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tenantId) fetchProjects();
  }, [tenantId, fetchProjects]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !isAdmin) return;
    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetchAPI(`/api/records/`, {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          module_name: activeModule,
          record_data: {
            name: newProjectName,
            status: 'active',
            visibility: newProjectVisibility,
            template: selectedTemplate,
          },
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        setIsModalOpen(false);
        setNewProjectName('');
        setNewProjectVisibility('public');
        setSelectedTemplate('blank');
        router.push(`/dashboard/${tenantId}/projects/${newRecord.id}`);
      } else {
        const errData = await res.json();
        setCreateError(errData.detail || 'Failed to create project');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setCreateError(error.message);
      } else {
        setCreateError('An unexpected error occurred.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const changeVisibility = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData,
    newVisibility: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              record_data: { ...p.record_data, visibility: newVisibility },
            }
          : p
      )
    );
    try {
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          record_data: { ...currentData, visibility: newVisibility },
        }),
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      fetchProjects();
    }
  };

  const toggleGlobalShare = (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);

    const isCurrentlyGlobal = currentData.is_global_shared === 'true';
    const newStatus = isCurrentlyGlobal ? 'false' : 'true';

    setConfirmDialog({
      isOpen: true,
      title: isCurrentlyGlobal
        ? t('dialogs.removeFromHubTitle')
        : t('dialogs.publishToHubTitle'),
      message: isCurrentlyGlobal
        ? t('dialogs.removeFromHubMsg')
        : t('dialogs.publishToHubMsg'),
      confirmText: isCurrentlyGlobal
        ? t('dialogs.unpublishBtn')
        : t('dialogs.publishBtn'),
      type: isCurrentlyGlobal ? 'danger' : 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  record_data: {
                    ...p.record_data,
                    is_global_shared: newStatus,
                  },
                }
              : p
          )
        );
        try {
          const res = await fetchAPI(`/api/records/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              record_data: { ...currentData, is_global_shared: newStatus },
            }),
          });
          if (!res.ok) fetchProjects();
        } catch (error) {
          fetchProjects();
        }
      },
    });
  };

  const archiveProject = (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: t('dialogs.archiveTitle'),
      message: t('dialogs.archiveMsg'),
      confirmText: t('dialogs.archiveBtn'),
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, record_data: { ...p.record_data, status: 'archived' } }
              : p
          )
        );
        try {
          const res = await fetchAPI(`/api/records/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              record_data: { ...currentData, status: 'archived' },
            }),
          });
          if (!res.ok) fetchProjects();
        } catch (error) {
          fetchProjects();
        }
      },
    });
  };

  const restoreProject = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, record_data: { ...p.record_data, status: 'active' } }
          : p
      )
    );
    try {
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          record_data: { ...currentData, status: 'active' },
        }),
      });
      if (!res.ok) fetchProjects();
    } catch (error) {
      fetchProjects();
    }
  };

  const deletePermanently = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: t('dialogs.deleteTitle'),
      message: t('dialogs.deleteMsg'),
      confirmText: t('dialogs.deleteBtn'),
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        try {
          const res = await fetchAPI(`/api/records/${projectId}`, {
            method: 'DELETE',
          });
          if (!res.ok) fetchProjects();
        } catch (error) {
          fetchProjects();
        }
      },
    });
  };

  const { displayedProjects, activeCount, privateCount, archivedCount } =
    useMemo(() => {
      const active = projects.filter(
        (p) => p.record_data?.status !== 'archived'
      ).length;
      const archived = projects.filter(
        (p) => p.record_data?.status === 'archived'
      ).length;
      const privateProjects = projects.filter(
        (p) => p.record_data?.visibility === 'just_admin'
      ).length;

      const filtered = projects.filter((p) => {
        const hasPermission =
          isAdmin || p.record_data?.visibility !== 'just_admin';
        const isArchived = p.record_data?.status === 'archived';
        const matchesSearch = getProjectDisplayName(p.record_data ?? {}, p.id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return (
          hasPermission &&
          (showArchived ? isArchived : !isArchived) &&
          matchesSearch
        );
      });

      return {
        displayedProjects: filtered,
        activeCount: active,
        privateCount: privateProjects,
        archivedCount: archived,
      };
    }, [projects, isAdmin, showArchived, searchQuery]);

  const recentProject = useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.record_data?.status !== 'archived'
    );
    if (!activeProjects.length) return null;

    return [...activeProjects].sort((a, b) => {
      const dateA = new Date(a.record_data?.updated_at || 0).getTime();
      const dateB = new Date(b.record_data?.updated_at || 0).getTime();
      return dateB - dateA;
    })[0];
  }, [projects]);

  return (
    <div className="flex-1 w-full relative transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {recentProject ? (
          <Link
            href={`/dashboard/${tenantId}/projects/${recentProject.id}`}
            className="group relative overflow-hidden bg-zinc-950 dark:bg-white rounded-2xl p-5 border border-zinc-800 dark:border-zinc-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-[130px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/20 transition-colors"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 dark:text-indigo-600">
                <Clock className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  {t('jumpBackIn')}
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-3 h-3 text-white dark:text-zinc-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white dark:text-zinc-900 truncate">
                {getProjectDisplayName(
                  recentProject.record_data ?? {},
                  recentProject.id
                )}
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                {formatTimeAgo(recentProject.record_data?.updated_at)}{' '}
                {t('updated')}
              </p>
            </div>
          </Link>
        ) : (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col justify-center items-center text-center h-[130px]">
            <Briefcase className="w-6 h-6 text-zinc-400 mb-2" />
            <p className="text-sm font-medium text-zinc-500">
              {t('noActiveProject')}
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-[130px]">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t('workspaceUsage')}
            </span>
          </div>
          <div>
            <div className="flex items-end justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none">
                  {activeCount}
                </span>
                <span className="text-sm font-medium text-zinc-500">/ 50</span>
              </div>
              <span className="text-xs font-bold text-zinc-500">
                {t('projectsLabel')}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((activeCount / 50) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-[130px]">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-3">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {t('securityOverview')}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                {t('teamPublic')}
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {activeCount - privateCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                {t('adminPrivate')}
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {privateCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative group w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors duration-300" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative z-0 w-full pl-10 pr-4 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform-gpu active:scale-95 ${
                showArchived
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm'
              }`}
            >
              {showArchived ? t('btnActive') : t('btnArchived')}
            </button>
          )}

          {!showArchived && isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm transform-gpu active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              {t('btnNewProject')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center items-center">
            <LoadingSpinner size="lg" text="Loading workspaces..." />
          </div>
        ) : (
          <>
            {displayedProjects.map((project) => {
              const isJustAdmin =
                project.record_data?.visibility === 'just_admin';
              const isGlobalShared =
                project.record_data?.is_global_shared === 'true';
              const displayName = getProjectDisplayName(
                project.record_data ?? {},
                project.id
              );
              const timeAgo = formatTimeAgo(project.record_data?.updated_at);
              const templateType = project.record_data?.template || 'blank';
              const isOpen = openMenuId === project.id;

              const currentTemplate =
                TEMPLATES.find((temp) => temp.id === templateType) ||
                TEMPLATES[0];

              const baseClasses =
                'group relative rounded-xl bg-white dark:bg-zinc-900 flex flex-col transition-all duration-200 transform-gpu will-change-transform border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md';
              const hoverClasses = !showArchived
                ? 'hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer'
                : 'opacity-75 grayscale';
              const cardClasses = `${baseClasses} ${hoverClasses} ${isOpen ? 'z-50' : 'z-10'}`;

              const cardContent = (
                <>
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <currentTemplate.icon className="w-3.5 h-3.5" />
                          <span className="capitalize">
                            {currentTemplate.name} {t('tags.template')}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === project.id ? null : project.id
                              );
                            }}
                            className="p-1.5 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors transform-gpu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {isOpen && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg py-1.5 z-[100] transform-gpu">
                              {!showArchived ? (
                                <>
                                  <button
                                    onClick={(e) =>
                                      changeVisibility(
                                        e,
                                        project.id,
                                        project.record_data,
                                        'public'
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                  >
                                    {t('menus.makePublic')}
                                  </button>
                                  <button
                                    onClick={(e) =>
                                      changeVisibility(
                                        e,
                                        project.id,
                                        project.record_data,
                                        'just_admin'
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                  >
                                    {t('menus.makeAdminOnly')}
                                  </button>

                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                                  <button
                                    onClick={(e) =>
                                      toggleGlobalShare(
                                        e,
                                        project.id,
                                        project.record_data
                                      )
                                    }
                                    className={`w-full px-4 py-2 text-xs font-medium flex items-center justify-between ${
                                      isGlobalShared
                                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    }`}
                                  >
                                    {isGlobalShared
                                      ? t('menus.removeFromHub')
                                      : t('menus.publishToHub')}
                                    <Globe className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                                  <button
                                    onClick={(e) =>
                                      archiveProject(
                                        e,
                                        project.id,
                                        project.record_data
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                  >
                                    {t('menus.archiveProject')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) =>
                                      restoreProject(
                                        e,
                                        project.id,
                                        project.record_data
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  >
                                    {t('menus.restoreProject')}
                                  </button>
                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                  <button
                                    onClick={(e) =>
                                      deletePermanently(e, project.id)
                                    }
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    {t('menus.deletePermanently')}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 rounded-b-xl flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                      {timeAgo}
                    </div>
                    <div className="flex items-center gap-2">
                      {isGlobalShared && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                          <Globe className="w-3 h-3" />
                          {t('tags.hub')}
                        </div>
                      )}
                      {isJustAdmin ? (
                        <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                          <Shield className="w-3 h-3" />
                          {t('tags.private')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          {t('tags.team')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );

              return showArchived ? (
                <div key={project.id} className={cardClasses}>
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={project.id}
                  href={`/dashboard/${tenantId}/projects/${project.id}`}
                  className={cardClasses}
                >
                  {cardContent}
                </Link>
              );
            })}

            {displayedProjects.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
                <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mb-3" />
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
                  {t('noProjectsFound')}
                </p>
                {searchQuery && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {t('clearSearch')}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4 transform-gpu">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 transform-gpu will-change-transform">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-500" />
                {t('createProject')}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 ml-7">
                {t('initDesc')}
              </p>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('projectName')}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('projectNamePlaceholder')}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('engineTemplate')}
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setIsTemplateDropdownOpen(!isTemplateDropdownOpen)
                  }
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <div className="flex items-center gap-2.5">
                    <selectedTemplateData.icon
                      className={`w-4 h-4 ${selectedTemplateData.color}`}
                    />
                    <span className="font-medium">
                      {selectedTemplateData.name}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isTemplateDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isTemplateDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsTemplateDropdownOpen(false)}
                    />

                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 max-h-[220px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setIsTemplateDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                            selectedTemplate === template.id
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <template.icon
                            className={`w-4 h-4 ${
                              selectedTemplate === template.id
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : template.color
                            }`}
                          />
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {createError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {createError}
                </p>
              )}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-95 transform-gpu"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors active:scale-95 transform-gpu disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? t('creating') : t('createBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm p-4 transform-gpu">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 transform-gpu will-change-transform overflow-hidden flex flex-col">
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {confirmDialog.type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {confirmDialog.title}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-95 transform-gpu"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors active:scale-95 transform-gpu ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
