'use client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  Lock,
  Unlock,
  Folder,
  Star,
} from 'lucide-react';
import { logActivity } from '@/lib/activityLogger';

type ProjectRecord = {
  id: string;
  record_data: RecordData & {
    visibility?: string;
    status?: string;
    updated_at?: string;
    updated_by?: string;
    template?: string;
    is_global_shared?: string;
    is_locked?: string;
    folder?: string;
    favorite_at?: string | null;
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
  const searchParams = useSearchParams();
  const tenantId = params.tenantId as string;
  const activeModule = moduleName || WORKSPACE_MODULE;

  const view = searchParams.get('view') || 'active';
  const currentFolder = searchParams.get('folder');

  const t = useTranslations('ProjectsPage');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectFolder, setNewProjectFolder] = useState('');
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

  const getUserDisplayName = (u: typeof user) => {
    if (!u) return 'Unknown User';

    const safeUser = u as unknown as Record<string, unknown>;

    return (
      (safeUser.name as string) ||
      (safeUser.full_name as string) ||
      (safeUser.email as string) ||
      'Unknown User'
    );
  };

  const headerContent = useMemo(() => {
    if (view === 'trash') {
      return {
        title: 'Trash',
        desc: 'Manage deleted projects. Items here will be permanently removed after 30 days.',
      };
    }
    if (view === 'archive') {
      return {
        title: 'Archived Projects',
        desc: 'View and restore your frozen or completed workspaces.',
      };
    }
    if (view === 'favorites') {
      return {
        title: 'Favorites',
        desc: 'Quick access to your most important and starred projects.',
      };
    }
    if (currentFolder) {
      return {
        title: currentFolder,
        desc: `Viewing projects inside the ${currentFolder} folder.`,
      };
    }
    return {
      title: 'Active Workspaces',
      desc: 'Select a live record to load into the engine canvas framework.',
    };
  }, [view, currentFolder]);

  const TEMPLATES = useMemo(
    () => [
      {
        id: 'blank',
        name: 'Blank',
        icon: LayoutTemplate,
        color: 'text-zinc-500 dark:text-zinc-400',
      },
      {
        id: 'kanban',
        name: 'Kanban',
        icon: KanbanSquare,
        color: 'text-blue-500',
      },
      {
        id: 'document',
        name: 'Document',
        icon: FileText,
        color: 'text-amber-500',
      },
      {
        id: 'whiteboard',
        name: 'Whiteboard',
        icon: PenTool,
        color: 'text-emerald-500',
      },
      {
        id: 'timeline',
        name: 'Timeline',
        icon: Clock,
        color: 'text-purple-500',
      },
      {
        id: 'database',
        name: 'Database',
        icon: Database,
        color: 'text-indigo-500',
      },
      { id: 'mindmap', name: 'Mindmap', icon: Network, color: 'text-pink-500' },
      {
        id: 'retrospective',
        name: 'Retrospective',
        icon: MessageSquare,
        color: 'text-rose-500',
      },
    ],
    []
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
            is_locked: 'false',
            folder: newProjectFolder.trim() || undefined,
            favorite_at: null,
          },
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();

        logActivity(
          tenantId,
          getUserDisplayName(user),
          'Created Project',
          `Project: ${newProjectName}`
        );

        setIsModalOpen(false);
        setNewProjectName('');
        setNewProjectFolder('');
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

  const toggleFavorite = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const isCurrentlyFav = !!currentData.favorite_at;
    const newFavoriteAt = isCurrentlyFav ? null : new Date().toISOString();

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              record_data: { ...p.record_data, favorite_at: newFavoriteAt },
            }
          : p
      )
    );
    try {
      await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          record_data: { ...currentData, favorite_at: newFavoriteAt },
        }),
      });
      logActivity(
        tenantId,
        getUserDisplayName(user),
        newFavoriteAt ? 'Added to Favorites' : 'Removed from Favorites',
        `Project: ${currentData.name}`
      );
    } catch (error) {
      fetchProjects();
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
      await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          record_data: { ...currentData, visibility: newVisibility },
        }),
      });
      logActivity(
        tenantId,
        getUserDisplayName(user),
        'Changed Visibility',
        `Project: ${currentData.name} is now ${newVisibility}`
      );
    } catch (error) {
      fetchProjects();
    }
  };

  const toggleProjectLock = async (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    const newStatus = currentData.is_locked === 'true' ? 'false' : 'true';
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, record_data: { ...p.record_data, is_locked: newStatus } }
          : p
      )
    );
    try {
      await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          record_data: { ...currentData, is_locked: newStatus },
        }),
      });
      logActivity(
        tenantId,
        getUserDisplayName(user),
        newStatus === 'true' ? 'Locked Project' : 'Unlocked Project',
        `Project: ${currentData.name}`
      );
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
      title: isCurrentlyGlobal ? 'Remove from Hub' : 'Publish to Hub',
      message: isCurrentlyGlobal
        ? 'This project will be removed from the global gallery.'
        : 'This project will be visible in the global gallery.',
      confirmText: isCurrentlyGlobal ? 'Remove' : 'Publish',
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
          await fetchAPI(`/api/records/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              record_data: { ...currentData, is_global_shared: newStatus },
            }),
          });
          logActivity(
            tenantId,
            getUserDisplayName(user),
            newStatus === 'true' ? 'Published to Hub' : 'Removed from Hub',
            `Project: ${currentData.name}`
          );
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
      title: 'Archive Project',
      message: 'Are you sure you want to archive this project?',
      confirmText: 'Archive',
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
          await fetchAPI(`/api/records/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              record_data: { ...currentData, status: 'archived' },
            }),
          });
          logActivity(
            tenantId,
            getUserDisplayName(user),
            'Archived Project',
            `Project: ${currentData.name}`
          );
        } catch (error) {
          fetchProjects();
        }
      },
    });
  };

  const moveToTrash = (
    e: React.MouseEvent,
    projectId: string,
    currentData: RecordData
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: 'Move to Trash',
      message: 'This project will be moved to the trash.',
      confirmText: 'Move to Trash',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, record_data: { ...p.record_data, status: 'trashed' } }
              : p
          )
        );
        try {
          await fetchAPI(`/api/records/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              record_data: { ...currentData, status: 'trashed' },
            }),
          });
          logActivity(
            tenantId,
            getUserDisplayName(user),
            'Moved to Trash',
            `Project: ${currentData.name}`
          );
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
      await fetchAPI(`/api/records/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          record_data: { ...currentData, status: 'active' },
        }),
      });
      logActivity(
        tenantId,
        getUserDisplayName(user),
        'Restored Project',
        `Project: ${currentData.name}`
      );
    } catch (error) {
      fetchProjects();
    }
  };

  const deletePermanently = (
    e: React.MouseEvent,
    projectId: string,
    currentData?: RecordData
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Permanently',
      message: 'Are you absolutely sure? This action cannot be undone.',
      confirmText: 'Delete Forever',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        try {
          await fetchAPI(`/api/records/${projectId}`, { method: 'DELETE' });
          logActivity(
            tenantId,
            getUserDisplayName(user),
            'Deleted Permanently',
            `Project: ${currentData?.name || 'Unknown'}`
          );
        } catch (error) {
          fetchProjects();
        }
      },
    });
  };

  const { displayedProjects } = useMemo(() => {
    let filtered = projects.filter((p) => {
      const status = p.record_data?.status || 'active';
      const folder = p.record_data?.folder;

      if (view === 'trash') {
        if (status !== 'trashed') return false;
      } else if (view === 'archive') {
        if (status !== 'archived') return false;
      } else if (view === 'favorites') {
        if (status === 'trashed' || status === 'archived') return false;
        if (!p.record_data?.favorite_at) return false;
      } else {
        if (status === 'trashed' || status === 'archived') return false;
        if (currentFolder && folder !== currentFolder) return false;
      }

      const hasPermission =
        isAdmin || p.record_data?.visibility !== 'just_admin';
      const matchesSearch = getProjectDisplayName(p.record_data ?? {}, p.id)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return hasPermission && matchesSearch;
    });

    // Her durumda projelere recent (son güncellenme) sıralaması uyguluyoruz
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.record_data?.updated_at || 0).getTime();
      const dateB = new Date(b.record_data?.updated_at || 0).getTime();
      return dateB - dateA;
    });

    return { displayedProjects: filtered };
  }, [projects, isAdmin, searchQuery, view, currentFolder]);

  return (
    <div className="flex-1 w-full relative transition-colors duration-300">
      <div className="mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
          {view === 'favorites' && (
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
          )}
          {currentFolder && <Folder className="w-8 h-8 text-indigo-500" />}
          {headerContent.title}
        </h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1.5">
          {headerContent.desc}
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex-1 w-full relative group max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
          <input
            type="text"
            placeholder={
              view === 'trash'
                ? 'Search in trash...'
                : view === 'archive'
                  ? 'Search in archives...'
                  : view === 'favorites'
                    ? 'Search in favorites...'
                    : t('searchPlaceholder')
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {view === 'trash' ? (
            <div className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-900/50">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Trash</span>
            </div>
          ) : view === 'archive' ? (
            <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl flex items-center gap-2 border border-zinc-200 dark:border-zinc-700">
              <Archive className="w-4 h-4" />
              <span className="text-sm">Archive</span>
            </div>
          ) : (
            isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95 whitespace-nowrap"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{t('btnNewProject')}</span>
              </button>
            )
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner size="lg" text="Loading workspaces..." />
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
          <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mb-3" />
          <p className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
            {view === 'trash'
              ? 'Trash is empty.'
              : view === 'archive'
                ? 'No archived projects.'
                : view === 'favorites'
                  ? 'No favorite projects yet.'
                  : t('noProjectsFound')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-500">
          {displayedProjects.map((project) => {
            const status = project.record_data?.status || 'active';
            const isJustAdmin =
              project.record_data?.visibility === 'just_admin';
            const isGlobalShared =
              project.record_data?.is_global_shared === 'true';
            const isLocked = project.record_data?.is_locked === 'true';
            const isFavorite = !!project.record_data?.favorite_at;
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
            const hoverClasses =
              status === 'active'
                ? 'hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer'
                : 'opacity-80 grayscale-[20%] cursor-default';
            const cardClasses = `${baseClasses} ${hoverClasses} ${isOpen ? 'z-50' : 'z-10'}`;

            const cardContent = (
              <>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-base font-semibold truncate transition-colors flex items-center gap-2 ${status !== 'active' ? 'text-zinc-600 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}
                      >
                        {status !== 'active' && (
                          <Archive className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <currentTemplate.icon className="w-3.5 h-3.5" />
                        <span className="capitalize">
                          {currentTemplate.name}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="relative shrink-0 flex items-center gap-1">
                        {status === 'active' && (
                          <button
                            onClick={(e) =>
                              toggleFavorite(e, project.id, project.record_data)
                            }
                            className={`p-1.5 rounded-md transition-colors ${isFavorite ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                          >
                            <Star
                              className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
                            />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === project.id ? null : project.id
                            );
                          }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {isOpen && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg py-1.5 z-[100] transform-gpu">
                            {status === 'active' && (
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
                                  Make Public
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
                                  Make Admin Only
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
                                  className={`w-full px-4 py-2 text-xs font-medium flex items-center justify-between ${isGlobalShared ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                >
                                  {isGlobalShared
                                    ? 'Remove from Hub'
                                    : 'Publish to Hub'}
                                  <Globe className="w-3.5 h-3.5" />
                                </button>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <button
                                  onClick={(e) =>
                                    toggleProjectLock(
                                      e,
                                      project.id,
                                      project.record_data
                                    )
                                  }
                                  className={`w-full px-4 py-2 text-xs font-medium flex items-center justify-between ${isLocked ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                >
                                  {isLocked
                                    ? 'Unlock Project'
                                    : 'Lock (Read-Only)'}
                                  {isLocked ? (
                                    <Unlock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5" />
                                  )}
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
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                                >
                                  Archive Project{' '}
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) =>
                                    moveToTrash(
                                      e,
                                      project.id,
                                      project.record_data
                                    )
                                  }
                                  className="w-full px-4 py-2 text-xs font-medium flex items-center justify-between text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
                                >
                                  Move to Trash{' '}
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {status === 'archived' && (
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
                                  Restore
                                </button>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <button
                                  onClick={(e) =>
                                    moveToTrash(
                                      e,
                                      project.id,
                                      project.record_data
                                    )
                                  }
                                  className="w-full px-4 py-2 text-xs font-medium flex items-center justify-between text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  Move to Trash{' '}
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {status === 'trashed' && (
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
                                  Restore
                                </button>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <button
                                  onClick={(e) =>
                                    deletePermanently(
                                      e,
                                      project.id,
                                      project.record_data
                                    )
                                  }
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  Delete Permanently
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
                    {status === 'trashed' && (
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-800">
                        <Trash2 className="w-3 h-3" />
                        <span>Trash</span>
                      </div>
                    )}
                    {status === 'archived' && (
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                        <Archive className="w-3 h-3" />
                        <span>Archived</span>
                      </div>
                    )}
                    {isLocked && status === 'active' && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-800">
                        <Lock className="w-3 h-3" />
                        <span>Read-Only</span>
                      </div>
                    )}
                    {isJustAdmin && status === 'active' && (
                      <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                        <Shield className="w-3 h-3" />
                        {t('tags.private')}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );

            return status === 'active' ? (
              <Link
                key={project.id}
                href={`/dashboard/${tenantId}/projects/${project.id}`}
                className={cardClasses}
              >
                {cardContent}
              </Link>
            ) : (
              <div key={project.id} className={cardClasses}>
                {cardContent}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 transform-gpu will-change-transform">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-500" />
                {t('createProject')}
              </h2>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-zinc-400" /> Folder Name
                  (Optional)
                </label>
                <input
                  type="text"
                  value={newProjectFolder}
                  onChange={(e) => setNewProjectFolder(e.target.value)}
                  placeholder="e.g. Marketing, Q3 Goals..."
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
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
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-400 transition-all shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
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
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${selectedTemplate === template.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                        >
                          <template.icon
                            className={`w-4 h-4 ${selectedTemplate === template.id ? 'text-indigo-600 dark:text-indigo-400' : template.color}`}
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
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {createError}
                </p>
              )}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold border border-zinc-200 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
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
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 transform-gpu will-change-transform overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}
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
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors active:scale-95 transform-gpu ${confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
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
