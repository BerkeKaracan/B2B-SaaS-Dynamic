'use client';
import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
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
  Filter,
  X,
  ArrowUpDown,
  Sparkles,
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

type VisibilityFilter = 'all' | 'public' | 'just_admin';
type SortOption = 'recent' | 'name_asc' | 'name_desc';

const selectClassName =
  'appearance-none pl-9 pr-8 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors cursor-pointer min-w-[9.5rem] hover:border-zinc-300 dark:hover:border-zinc-700';

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
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectFolder, setNewProjectFolder] = useState('');
  const [newProjectVisibility, setNewProjectVisibility] = useState('public');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  const closeProjectMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuPosition(null);
  }, []);

  const openProjectMenu = useCallback((projectId: string, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuWidth = 224;
    const gap = 4;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );
    const preferredTop = rect.bottom + gap;
    const maxHeight = Math.min(320, window.innerHeight - preferredTop - 8);
    // If almost no room below, flip above the button
    if (maxHeight < 160) {
      const top = Math.max(8, rect.top - Math.min(320, rect.top - 8) - gap);
      setMenuPosition({ top, left });
    } else {
      setMenuPosition({ top: preferredTop, left });
    }
    setOpenMenuId(projectId);
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const onScrollOrResize = () => closeProjectMenu();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProjectMenu();
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenuId, closeProjectMenu]);

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
        badge: 'Storage · Trash',
        Icon: Trash2,
        accent: 'text-rose-600 dark:text-rose-400',
        badgeClass:
          'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-300',
        iconBox:
          'border-rose-200/80 dark:border-rose-500/30',
      };
    }
    if (view === 'archive') {
      return {
        title: 'Archived Projects',
        desc: 'View and restore your frozen or completed workspaces.',
        badge: 'Storage · Archive',
        Icon: Archive,
        accent: 'text-amber-600 dark:text-amber-400',
        badgeClass:
          'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-300',
        iconBox:
          'border-amber-200/80 dark:border-amber-500/30',
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

  const isStorageView = view === 'trash' || view === 'archive';

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
    closeProjectMenu();
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
    closeProjectMenu();
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
    closeProjectMenu();
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
    closeProjectMenu();
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
    closeProjectMenu();
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
    closeProjectMenu();
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
    closeProjectMenu();
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

  const { displayedProjects, hasActiveFilters } = useMemo(() => {
    let filtered = projects.filter((p) => {
      const status = p.record_data?.status || 'active';
      const folder = p.record_data?.folder;
      const template = p.record_data?.template || 'blank';
      const visibility = p.record_data?.visibility || 'public';

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

      if (templateFilter !== 'all' && template !== templateFilter) return false;
      if (visibilityFilter !== 'all' && visibility !== visibilityFilter)
        return false;

      const hasPermission =
        isAdmin || p.record_data?.visibility !== 'just_admin';
      const matchesSearch = getProjectDisplayName(p.record_data ?? {}, p.id)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return hasPermission && matchesSearch;
    });

    filtered = filtered.sort((a, b) => {
      if (sortBy === 'name_asc' || sortBy === 'name_desc') {
        const nameA = getProjectDisplayName(a.record_data ?? {}, a.id);
        const nameB = getProjectDisplayName(b.record_data ?? {}, b.id);
        const cmp = nameA.localeCompare(nameB, undefined, {
          sensitivity: 'base',
        });
        return sortBy === 'name_asc' ? cmp : -cmp;
      }
      const dateA = new Date(a.record_data?.updated_at || 0).getTime();
      const dateB = new Date(b.record_data?.updated_at || 0).getTime();
      return dateB - dateA;
    });

    const filtersActive =
      templateFilter !== 'all' ||
      visibilityFilter !== 'all' ||
      sortBy !== 'recent' ||
      searchQuery.trim().length > 0;

    return { displayedProjects: filtered, hasActiveFilters: filtersActive };
  }, [
    projects,
    isAdmin,
    searchQuery,
    view,
    currentFolder,
    templateFilter,
    visibilityFilter,
    sortBy,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setTemplateFilter('all');
    setVisibilityFilter('all');
    setSortBy('recent');
  };

  return (
    <div className="flex-1 w-full relative transition-colors duration-300">
      <div
        className={`relative z-10 mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
          isStorageView ? 'flex flex-col sm:flex-row sm:items-end justify-between gap-6' : ''
        }`}
      >
        {isStorageView && 'Icon' in headerContent && headerContent.Icon ? (
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 bg-white dark:bg-zinc-900 border rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${headerContent.iconBox}`}
            >
              {(() => {
                const HeaderIcon = headerContent.Icon;
                return (
                  <HeaderIcon className={`w-5 h-5 ${headerContent.accent}`} />
                );
              })()}
            </div>
            <div className="min-w-0 pt-0.5">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-2 ${headerContent.badgeClass}`}
              >
                <Sparkles className="w-3 h-3" />
                {headerContent.badge}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {headerContent.title}
              </h1>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xl leading-relaxed">
                {headerContent.desc}
              </p>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        {isStorageView && (
          <div className="flex items-center gap-3">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
                Items
              </p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                {displayedProjects.length}
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className={`relative z-10 mb-8 rounded-2xl border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ${
          isStorageView
            ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800'
            : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800'
        }`}
      >
        <div className="flex flex-col gap-3 p-3 md:p-4 md:flex-row md:items-center md:gap-3">
          <div className="relative group min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
            <input
              type="text"
              placeholder={
                view === 'trash'
                  ? t('filters.searchTrash')
                  : view === 'archive'
                    ? t('filters.searchArchive')
                    : view === 'favorites'
                      ? t('filters.searchFavorites')
                      : t('searchPlaceholder')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-9 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={t('filters.clear')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <LayoutTemplate className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className={selectClassName}
                aria-label={t('filters.template')}
              >
                <option value="all">{t('filters.allTemplates')}</option>
                {TEMPLATES.map((temp) => (
                  <option key={temp.id} value={temp.id}>
                    {temp.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <select
                value={visibilityFilter}
                onChange={(e) =>
                  setVisibilityFilter(e.target.value as VisibilityFilter)
                }
                className={selectClassName}
                aria-label={t('filters.visibility')}
              >
                <option value="all">{t('filters.allVisibility')}</option>
                <option value="public">{t('teamPublic')}</option>
                <option value="just_admin">{t('adminPrivate')}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={selectClassName}
                aria-label={t('filters.sort')}
              >
                <option value="recent">{t('filters.sortRecent')}</option>
                <option value="name_asc">{t('filters.sortNameAsc')}</option>
                <option value="name_desc">{t('filters.sortNameDesc')}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 md:ml-auto">
            {view === 'trash' ? (
              <div className="h-10 px-3 inline-flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm font-semibold border border-rose-100 dark:border-rose-500/20">
                <Trash2 className="w-4 h-4" />
                Trash
              </div>
            ) : view === 'archive' ? (
              <div className="h-10 px-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm font-semibold border border-amber-100 dark:border-amber-500/20">
                <Archive className="w-4 h-4" />
                Archive
              </div>
            ) : (
              isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="h-10 flex-1 md:flex-none px-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-sm font-bold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] whitespace-nowrap"
                >
                  <FolderPlus className="w-4 h-4" />
                  {t('btnNewProject')}
                </button>
              )
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-3 md:px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/40 rounded-b-2xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <Filter className="w-3 h-3" />
              {t('filters.active')}
            </span>
            {templateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setTemplateFilter('all')}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
              >
                {TEMPLATES.find((temp) => temp.id === templateFilter)?.name}
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            )}
            {visibilityFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setVisibilityFilter('all')}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
              >
                {visibilityFilter === 'public'
                  ? t('teamPublic')
                  : t('adminPrivate')}
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            )}
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors max-w-[12rem]"
              >
                <span className="truncate">“{searchQuery.trim()}”</span>
                <X className="w-3 h-3 text-zinc-400 shrink-0" />
              </button>
            )}
            <span className="text-xs font-medium text-zinc-400 ml-auto tabular-nums">
              {t('filters.resultCount', { count: displayedProjects.length })}
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t('filters.clear')}
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="relative z-10 py-20 flex justify-center items-center">
          <LoadingSpinner size="lg" text="Loading workspaces..." />
        </div>
      ) : displayedProjects.length === 0 ? (
        <div
          className={`relative z-10 py-16 flex flex-col items-center justify-center rounded-3xl border shadow-sm ${
            isStorageView
              ? 'border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 overflow-hidden'
              : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'
          }`}
        >
          {isStorageView && (
            <div
              className={`absolute inset-0 pointer-events-none ${
                view === 'trash'
                  ? 'bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.08),_transparent_60%)]'
                  : 'bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.08),_transparent_60%)]'
              }`}
            />
          )}
          <div className="relative flex flex-col items-center">
            <div
              className={`w-14 h-14 mb-4 rounded-2xl flex items-center justify-center border ${
                view === 'trash'
                  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
                  : view === 'archive'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-transparent'
              }`}
            >
              {view === 'trash' ? (
                <Trash2 className="w-6 h-6 text-rose-500" />
              ) : view === 'archive' ? (
                <Archive className="w-6 h-6 text-amber-500" />
              ) : (
                <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
              )}
            </div>
            <p className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
              {view === 'trash'
                ? 'Trash is empty.'
                : view === 'archive'
                  ? 'No archived projects.'
                  : view === 'favorites'
                    ? 'No favorite projects yet.'
                    : t('noProjectsFound')}
            </p>
            {isStorageView && (
              <p className="text-xs font-medium text-zinc-500 mt-1.5 max-w-sm text-center">
                {view === 'trash'
                  ? 'Deleted workspaces will appear here for 30 days before permanent removal.'
                  : 'Freeze completed workspaces from the project menu to find them here.'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-500">
          {displayedProjects.map((project) => {
            const status = project.record_data?.status || 'active';
            const isJustAdmin =
              project.record_data?.visibility === 'just_admin';
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
              'group relative rounded-xl bg-white dark:bg-zinc-900 flex flex-col transition-all duration-200 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md';
            const hoverClasses =
              status === 'active' && !isOpen
                ? 'hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer'
                : status === 'active'
                  ? 'hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer'
                  : 'opacity-90 cursor-default';
            const storageAccent =
              status === 'trashed'
                ? 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-xl before:bg-rose-400'
                : status === 'archived'
                  ? 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-xl before:bg-amber-400'
                  : '';
            // overflow-hidden clips the "..." menu; keep visible and raise stacking when open
            const cardClasses = `${baseClasses} ${hoverClasses} ${storageAccent} ${
              isOpen ? 'z-50 overflow-visible' : 'z-10'
            }`;

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
                            if (openMenuId === project.id) {
                              closeProjectMenu();
                            } else {
                              openProjectMenu(project.id, e.currentTarget);
                            }
                          }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
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

      {openMenuId &&
        menuPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90]"
              onClick={closeProjectMenu}
              aria-hidden
            />
            {(() => {
              const project = projects.find((p) => p.id === openMenuId);
              if (!project) return null;
              const status = project.record_data?.status || 'active';
              const isGlobalShared =
                project.record_data?.is_global_shared === 'true';
              const isLocked = project.record_data?.is_locked === 'true';
              return (
                <div
                  className="fixed w-56 max-h-[min(320px,calc(100vh-16px))] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg py-1.5 z-[100]"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                  onClick={(e) => e.stopPropagation()}
                >
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
                        {isGlobalShared ? 'Remove from Hub' : 'Publish to Hub'}
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
                        {isLocked ? 'Unlock Project' : 'Lock (Read-Only)'}
                        {isLocked ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                      <button
                        onClick={(e) =>
                          archiveProject(e, project.id, project.record_data)
                        }
                        className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                      >
                        Archive Project <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) =>
                          moveToTrash(e, project.id, project.record_data)
                        }
                        className="w-full px-4 py-2 text-xs font-medium flex items-center justify-between text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
                      >
                        Move to Trash <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {status === 'archived' && (
                    <>
                      <button
                        onClick={(e) =>
                          restoreProject(e, project.id, project.record_data)
                        }
                        className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        Restore
                      </button>
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                      <button
                        onClick={(e) =>
                          moveToTrash(e, project.id, project.record_data)
                        }
                        className="w-full px-4 py-2 text-xs font-medium flex items-center justify-between text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Move to Trash <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {status === 'trashed' && (
                    <>
                      <button
                        onClick={(e) =>
                          restoreProject(e, project.id, project.record_data)
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
              );
            })()}
          </>,
          document.body
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
