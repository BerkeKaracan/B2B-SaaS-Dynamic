'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchAPI } from '@/services/api';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Calendar } from '@/components/ui/calendar';
import toast from 'react-hot-toast';
import {
  Loader2,
  Link2,
  Unlink,
  X,
  Activity,
  GitCommitHorizontal,
  Filter,
  ArrowUpDown,
  Search,
  BookmarkPlus,
  LayoutDashboard,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit2,
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

const CustomGithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

export type TaskStatus = string;
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NO PRIORITY';

export interface Task {
  id: string;
  title: string;
  description: string;
  commitCode?: string;
  assignee: string;
  createdBy: string;
  updatedBy: string;
  startDate?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  date: string;
}

export interface SavedView {
  id: string;
  name: string;
  filterQuery: string;
  filterPriority: TaskPriority | 'ALL';
  sortBy: 'manual' | 'priority' | 'deadline';
}

interface GithubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface AIColumnData {
  id?: string;
  title?: string;
  color?: string;
}

interface AITaskData {
  id?: string;
  title?: string;
  content?: string;
  description?: string;
  assignee?: string;
  createdBy?: string;
  updatedBy?: string;
  priority?: TaskPriority;
  status?: string;
  columnId?: string;
  startDate?: string;
  deadline?: string;
  commitCode?: string;
}

const PRIORITIES: Record<string, string> = {
  URGENT: '#E3123B',
  HIGH: '#7B323D',
  MEDIUM: '#93B27D',
  LOW: '#BEF109',
  'NO PRIORITY': '#B2BAAE',
};

const PRIORITY_WEIGHTS: Record<string, number> = {
  URGENT: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  'NO PRIORITY': 1,
};

const DEFAULT_COLUMNS = [
  { id: 'TO DO', title: 'TO DO', color: '#71C6C0' },
  { id: 'IN PROGRESS', title: 'IN PROGRESS', color: '#6682FB' },
  { id: 'DONE', title: 'DONE', color: '#89A841' },
];

export default function StaticKanbanBoard({
  projectId,
}: {
  projectId: string;
}) {
  const t = useTranslations('KanbanBoard');
  const params = useParams();
  const tenantId = params?.tenantId as string;

  const { metadata, updateMetadata, pages, updatePageSettings } =
    useCanvasStore();

  // A Kanban board can render in two ways:
  //  1) Standalone template project → data lives in the project's top-level
  //     record_data (== store `metadata`), and `projectId` is the record id.
  //  2) A frame inside the infinite canvas → data must live on that page's own
  //     `settings` (keyed by `page.id`), so multiple Kanban frames stay isolated.
  const canvasPage = useMemo(
    () => pages.find((p) => p.id === projectId),
    [pages, projectId]
  );
  const isPageScoped = !!canvasPage;
  const pageSettings = (canvasPage?.settings || {}) as Record<string, unknown>;

  const persistTasks = useCallback(
    (next: Task[]) => {
      if (isPageScoped) {
        updatePageSettings(projectId, { tasks: next, kanbanTasks: next });
      } else {
        updateMetadata({ tasks: next, kanbanTasks: next });
      }
    },
    [isPageScoped, projectId, updatePageSettings, updateMetadata]
  );

  const columns = useMemo(() => {
    const aiCols = (isPageScoped
      ? (pageSettings.kanbanColumns as AIColumnData[])
      : (metadata.kanbanColumns as AIColumnData[])) || [];
    if (aiCols && aiCols.length > 0) {
      return aiCols.map((c, i) => ({
        id: c.id || c.title || `col-${i}`,
        title: c.title || `Column ${i + 1}`,
        color: c.color || DEFAULT_COLUMNS[i % DEFAULT_COLUMNS.length].color,
      }));
    }
    return DEFAULT_COLUMNS;
  }, [isPageScoped, pageSettings.kanbanColumns, metadata.kanbanColumns]);

  const tasks = useMemo(() => {
    const rawTasks = (
      isPageScoped
        ? pageSettings.tasks || pageSettings.kanbanTasks
        : metadata.tasks || metadata.kanbanTasks
    ) as AITaskData[] | undefined;
    return (rawTasks || []).map((t, i) => ({
      // eslint-disable-next-line react-hooks/purity
      id: t.id || `ai-task-${i}-${Date.now()}`,
      title: t.title || t.content || 'Untitled Task',
      description: t.description || '',
      assignee: t.assignee || 'Unassigned',
      createdBy: t.createdBy || 'AI Assistant',
      updatedBy: t.updatedBy || 'AI Assistant',
      priority:
        t.priority && PRIORITIES[t.priority] ? t.priority : 'NO PRIORITY',
      status: t.status || t.columnId || columns[0].id,
      startDate: t.startDate || undefined,
      deadline: t.deadline || undefined,
      commitCode: t.commitCode || undefined,
    })) as Task[];
  }, [
    isPageScoped,
    pageSettings.tasks,
    pageSettings.kanbanTasks,
    metadata.tasks,
    metadata.kanbanTasks,
    columns,
  ]);

  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const collaborators =
    (metadata.collaborators as { email: string; role: string }[]) || [];
  const linkedRepo = (metadata.githubRepo as string) || '';
  const activityLogs = (metadata.activityLogs as ActivityLog[]) || [];
  const savedViews = (metadata.savedViews as SavedView[]) || [];

  const { user } = useAuthStore();
  const currentUserName =
    user?.full_name || user?.email?.split('@')[0] || 'System User';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'activity' | 'github'>('activity');

  const [isClient, setIsClient] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [openTaskMenu, setOpenTaskMenu] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskCommit, setNewTaskCommit] = useState('');
  const [newTaskPriority, setNewTaskPriority] =
    useState<TaskPriority>('NO PRIORITY');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(columns[0].id);

  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined);
  const [deadlineObj, setDeadlineObj] = useState<Date | undefined>(undefined);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [isCommitsLoading, setIsCommitsLoading] = useState(false);
  const [repoInput, setRepoInput] = useState('');

  const [filterQuery, setFilterQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>(
    'ALL'
  );
  const [sortBy, setSortBy] = useState<'manual' | 'priority' | 'deadline'>(
    'manual'
  );

  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (filterRef.current && !filterRef.current.contains(target as Node))
        setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(target as Node))
        setIsSortOpen(false);
      if (target && typeof target.closest === 'function') {
        if (
          !target.closest('.task-dropdown-menu') &&
          !target.closest('.task-menu-trigger')
        ) {
          setOpenTaskMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logActivity = (action: string, target: string) => {
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
      user: currentUserName,
      action,
      target,
      date: new Date().toISOString(),
    };
    const updatedLogs = [newLog, ...activityLogs].slice(0, 50);
    updateMetadata({ activityLogs: updatedLogs });
  };

  useEffect(() => {
    if (linkedRepo) {
      const [owner, repo] = linkedRepo.split('/');
      if (!owner || !repo) return;
      const fetchCommits = async () => {
        setIsCommitsLoading(true);
        try {
          const res = await fetchAPI(
            `/api/github/commits?owner=${owner}&repo=${repo}&limit=15`
          );
          if (res.ok) setCommits(await res.json());
          else setCommits([]);
        } catch {
          setCommits([]);
        } finally {
          setIsCommitsLoading(false);
        }
      };
      fetchCommits();
    }
  }, [linkedRepo]);

  const handleConnectRepo = () => {
    if (!repoInput.includes('/'))
      return toast.error('Format must be: owner/repo');
    updateMetadata({ githubRepo: repoInput });
    logActivity('connected GitHub repository', repoInput);
    toast.success('GitHub repository linked!');
    setRepoInput('');
  };

  const handleUnlinkRepo = () => {
    if (window.confirm('Are you sure you want to unlink this repository?')) {
      updateMetadata({ githubRepo: '' });
      logActivity('unlinked GitHub repository', linkedRepo);
      setCommits([]);
    }
  };

  const mapStatusToBackend = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('PROGRESS')) return 'in_progress';
    if (s.includes('DONE') || s.includes('COMPLETE') || s.includes('FINISH'))
      return 'done';
    return 'todo';
  };

  const syncTasksToBackend = async (currentTasks: Task[]) => {
    if (!tenantId || !projectId) return;
    const formattedTasks = currentTasks.map((t) => ({
      project_id: projectId,
      project_name: (metadata.name as string) || 'Project Board',
      title: t.title,
      status: mapStatusToBackend(t.status),
      priority: t.priority,
      due_date: t.deadline || null,
      assigned_to: t.assignee,
    }));
    try {
      await fetchAPI('/api/tasks/sync', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          project_id: projectId,
          tasks: formattedTasks,
        }),
      });
    } catch (error) {
      console.error('Failed to sync tasks:', error);
    }
  };

  const updateTasks = (newTasks: Task[]) => {
    persistTasks(newTasks);
    syncTasksToBackend(newTasks);
  };

  // Bridge: AiChatbot dispatches `onAiTaskCreated` after a successful tool INSERT.
  // On infinite canvas, this board's `projectId` prop is the page/frame id, while
  // AI events carry the parent custom_records id — accept either target.
  useEffect(() => {
    const handleAiTaskCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      const detail = customEvent.detail;
      if (!detail) return;

      const eventBoardId =
        (detail.board_id as string | undefined) ||
        (detail.page_id as string | undefined);
      const eventProjectId =
        (detail.project_id as string | undefined) ||
        (detail.module_id as string | undefined);
      const routeProjectId = (params?.projectId as string | undefined) || '';
      const storeRecordId = useCanvasStore.getState().recordId;

      if (isPageScoped) {
        // A frame on the infinite canvas only accepts events aimed at its page.
        // This prevents an AI task from being duplicated across every Kanban frame.
        if (eventBoardId) {
          if (eventBoardId !== projectId) return;
        } else {
          return;
        }
      } else if (eventBoardId) {
        if (eventBoardId !== projectId) return;
      } else if (eventProjectId) {
        const matchesThisBoard = eventProjectId === projectId;
        const matchesParentProject =
          eventProjectId === routeProjectId ||
          (!!storeRecordId && eventProjectId === storeRecordId);
        if (!matchesThisBoard && !matchesParentProject) return;
      }

      const rawStatus = String(detail.status || columns[0]?.id || 'TO DO');
      const normalizedStatus =
        columns.find(
          (c) =>
            c.id === rawStatus ||
            c.title === rawStatus ||
            c.id.toUpperCase() === rawStatus.toUpperCase()
        )?.id ||
        columns[0]?.id ||
        rawStatus;

      const priorityValue = String(detail.priority || 'NO PRIORITY');
      const priority: TaskPriority =
        priorityValue in PRIORITIES
          ? (priorityValue as TaskPriority)
          : 'NO PRIORITY';

      const newTask: Task = {
        id: String(detail.id || detail.db_id || `ai-${Date.now()}`),
        title: String(detail.title || 'Untitled Task'),
        description: String(detail.description || ''),
        assignee: String(detail.assignee || 'Unassigned'),
        createdBy: String(detail.createdBy || 'AI Assistant'),
        updatedBy: String(detail.updatedBy || 'AI Assistant'),
        priority,
        status: normalizedStatus,
        startDate: (detail.startDate as string | undefined) || undefined,
        deadline: (detail.deadline as string | undefined) || undefined,
        commitCode: (detail.commitCode as string | undefined) || undefined,
      };

      const current = tasksRef.current;
      if (current.some((t) => t.id === newTask.id)) {
        return;
      }

      const nextTasks = [...current, newTask];
      tasksRef.current = nextTasks;
      // Instant UI update via Zustand — DB write already done by create_task.
      persistTasks(nextTasks);
    };

    window.addEventListener('onAiTaskCreated', handleAiTaskCreated);
    return () => {
      window.removeEventListener('onAiTaskCreated', handleAiTaskCreated);
    };
  }, [projectId, columns, persistTasks, isPageScoped, params?.projectId]);

  const handleOpenAddModal = (status: TaskStatus) => {
    setEditingTaskId(null);
    setNewTaskStatus(status);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignee('');
    setNewTaskCommit('');
    setNewTaskPriority('NO PRIORITY');
    setStartDateObj(undefined);
    setDeadlineObj(undefined);
    setIsAddModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskStatus(task.status);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description);
    setNewTaskAssignee(task.assignee);
    setNewTaskCommit(task.commitCode || '');
    setNewTaskPriority(task.priority);
    if (task.startDate) {
      const [day, month] = task.startDate.split('/');
      setStartDateObj(
        new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day))
      );
    } else setStartDateObj(undefined);
    if (task.deadline) {
      const [day, month] = task.deadline.split('/');
      setDeadlineObj(
        new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day))
      );
    } else setDeadlineObj(undefined);
    setIsAddModalOpen(true);
  };

  const handleDuplicateTask = (taskToDuplicate: Task) => {
    const duplicatedTask: Task = {
      ...taskToDuplicate,
      id: 't-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: `${taskToDuplicate.title} (Copy)`,
      createdBy: currentUserName,
      updatedBy: currentUserName,
    };
    updateTasks([...tasks, duplicatedTask]);
    logActivity('duplicated task', taskToDuplicate.title);
    toast.success('Task duplicated successfully!');
    setOpenTaskMenu(null);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
      updateTasks(tasks.filter((t) => t.id !== taskId));
      logActivity('deleted task', taskTitle);
      toast.success('Task deleted!');
    }
    setOpenTaskMenu(null);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const formattedStart = startDateObj
      ? startDateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
        })
      : undefined;
    const formattedDeadline = deadlineObj
      ? deadlineObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
        })
      : undefined;

    let updatedTasks = [...tasks];

    if (editingTaskId) {
      updatedTasks = updatedTasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: newTaskTitle,
              description: newTaskDescription,
              commitCode: newTaskCommit || undefined,
              assignee: newTaskAssignee || 'Unassigned',
              updatedBy: currentUserName,
              startDate: formattedStart,
              deadline: formattedDeadline,
              priority: newTaskPriority,
              status: newTaskStatus,
            }
          : task
      );
      logActivity('updated task', newTaskTitle);
      toast.success('Task updated!');
    } else {
      updatedTasks.push({
        id: 't-' + Date.now(),
        title: newTaskTitle,
        description: newTaskDescription,
        commitCode: newTaskCommit || undefined,
        assignee: newTaskAssignee || 'Unassigned',
        createdBy: currentUserName,
        updatedBy: currentUserName,
        startDate: formattedStart,
        deadline: formattedDeadline,
        priority: newTaskPriority,
        status: newTaskStatus,
      });
      logActivity('created new task', newTaskTitle);
      toast.success('New task created!');

      if (newTaskAssignee.includes('@')) {
        try {
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: newTaskAssignee,
              taskTitle: newTaskTitle,
              assigneeName: newTaskAssignee.split('@')[0],
              assignedBy: currentUserName,
            }),
          });
        } catch (error) {
          console.error('Email trigger failed', error);
        }
      }
    }

    updateTasks(updatedTasks);
    setIsAddModalOpen(false);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (sortBy !== 'manual') {
      setSortBy('manual');
      setActiveViewId(null);
      toast('Sort method automatically reset to Manual for Drag & Drop', {
        icon: 'ℹ️',
      });
    }

    const draggedTask = tasks.find((t) => t.id === draggableId);
    if (!draggedTask) return;

    const newTasks = tasks.filter((t) => t.id !== draggableId);
    const updatedTask = {
      ...draggedTask,
      status: destination.droppableId as TaskStatus,
      updatedBy: currentUserName,
    };

    const destColTasks = newTasks.filter(
      (t) => t.status === destination.droppableId
    );
    destColTasks.splice(destination.index, 0, updatedTask);

    const finalTasks: Task[] = [];
    for (const col of columns) {
      if (col.id === destination.droppableId) finalTasks.push(...destColTasks);
      else finalTasks.push(...newTasks.filter((t) => t.status === col.id));
    }

    if (source.droppableId !== destination.droppableId)
      logActivity(
        `moved to ${columns.find((c) => c.id === destination.droppableId)?.title || 'column'}`,
        draggedTask.title
      );

    updateTasks(finalTasks);
  };

  const formatActivityDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const parseDateStr = (dateStr?: string) => {
    if (!dateStr) return Infinity;
    const parts = dateStr.split('/');
    if (parts.length === 3)
      return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
    return Infinity;
  };

  const handleSaveView = () => {
    const viewName = prompt(
      'Enter a name for this view (e.g. My Urgent Tasks):'
    );
    if (!viewName?.trim()) return;

    const newView: SavedView = {
      id: 'view-' + Date.now(),
      name: viewName,
      filterQuery,
      filterPriority,
      sortBy,
    };
    updateMetadata({ savedViews: [...savedViews, newView] });
    setActiveViewId(newView.id);
    setIsFilterOpen(false);
    toast.success(`View "${viewName}" saved successfully!`);
    logActivity('created custom view', viewName);
  };

  const applyView = (viewId: string | null) => {
    setActiveViewId(viewId);
    if (viewId === null) {
      setFilterQuery('');
      setFilterPriority('ALL');
      setSortBy('manual');
      return;
    }
    const view = savedViews.find((v) => v.id === viewId);
    if (view) {
      setFilterQuery(view.filterQuery);
      setFilterPriority(view.filterPriority);
      setSortBy(view.sortBy);
    }
  };

  const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this custom view?')) {
      updateMetadata({ savedViews: savedViews.filter((v) => v.id !== viewId) });
      if (activeViewId === viewId) applyView(null);
      toast.success('View deleted.');
    }
  };

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent overflow-hidden transition-colors duration-300">
      <div className="flex flex-col bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 z-10 shadow-xs transition-colors duration-300">
        <div className="flex items-center justify-between p-4 md:px-6 py-4">
          <div className="flex items-center gap-3 md:gap-4">
            <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {typeof metadata.name === 'string' && metadata.name
                ? metadata.name
                : t('title')}
            </h2>
            {linkedRepo && (
              <a
                href={`https://github.com/${linkedRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <CustomGithubIcon className="w-3 h-3" />
                {linkedRepo.split('/')[1]}
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs border ${isFilterOpen || filterQuery || filterPriority !== 'ALL' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                <Filter className="w-3.5 h-3.5" /> {t('filter')}
                {(filterQuery || filterPriority !== 'ALL') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"></span>
                )}
              </button>
              {isFilterOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">
                        Search Content
                      </label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          value={filterQuery}
                          onChange={(e) => {
                            setFilterQuery(e.target.value);
                            setActiveViewId(null);
                          }}
                          placeholder={t('searchPlaceholder')}
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">
                        {t('priorityFilter')}
                      </label>
                      <select
                        value={filterPriority}
                        onChange={(e) => {
                          setFilterPriority(
                            e.target.value as TaskPriority | 'ALL'
                          );
                          setActiveViewId(null);
                        }}
                        className="w-full px-2 py-1.5 text-xs font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ALL">{t('allPriorities')}</option>
                        {Object.keys(PRIORITIES).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
                      <button
                        onClick={handleSaveView}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        <BookmarkPlus className="w-3 h-3" /> {t('saveView')}
                      </button>
                      {(filterQuery || filterPriority !== 'ALL') && (
                        <button
                          onClick={() => applyView(null)}
                          className="w-full py-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                          {t('clearFilters')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs border ${isSortOpen || sortBy !== 'manual' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> {t('sort')}
                {sortBy !== 'manual' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"></span>
                )}
              </button>
              {isSortOpen && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setSortBy('manual');
                        setActiveViewId(null);
                        setIsSortOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${sortBy === 'manual' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                    >
                      {t('sortManual')}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('priority');
                        setActiveViewId(null);
                        setIsSortOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${sortBy === 'priority' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                    >
                      {t('sortPriority')}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('deadline');
                        setActiveViewId(null);
                        setIsSortOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${sortBy === 'deadline' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                    >
                      {t('sortDeadline')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:block w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`flex items-center gap-2 px-3 h-8 rounded-md transition-colors font-bold text-xs border ${isDrawerOpen ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'}`}
            >
              <Activity className="w-3.5 h-3.5" /> {t('history')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 md:px-6 pb-2 overflow-x-auto custom-scrollbar hide-scrollbar-y">
          <button
            onClick={() => applyView(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap ${activeViewId === null ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> {t('defaultView')}
          </button>
          {savedViews.map((view) => (
            <div key={view.id} className="flex items-center group relative">
              <button
                onClick={() => applyView(view.id)}
                className={`flex items-center pr-6 pl-3 py-1.5 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap ${activeViewId === view.id ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                {view.name}
              </button>
              <button
                onClick={(e) => handleDeleteView(e, view.id)}
                className={`absolute right-1.5 w-4 h-4 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${activeViewId === view.id ? 'hover:bg-indigo-700 text-white' : 'hover:bg-red-500 hover:text-white text-zinc-400 dark:text-zinc-500'}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative w-full">
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar h-full">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 md:gap-6 p-4 md:p-6 items-start h-full w-max">
              {columns.map((col) => {
                const colTasks = tasks
                  .filter((t) => t.status === col.id)
                  .filter((t) => {
                    if (filterQuery) {
                      const q = filterQuery.toLowerCase();
                      if (
                        !t.title.toLowerCase().includes(q) &&
                        !t.assignee.toLowerCase().includes(q)
                      )
                        return false;
                    }
                    if (
                      filterPriority !== 'ALL' &&
                      t.priority !== filterPriority
                    )
                      return false;
                    return true;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'priority')
                      return (
                        (PRIORITY_WEIGHTS[b.priority] || 0) -
                        (PRIORITY_WEIGHTS[a.priority] || 0)
                      );
                    if (sortBy === 'deadline')
                      return (
                        parseDateStr(a.deadline) - parseDateStr(b.deadline)
                      );
                    return 0;
                  });

                return (
                  <div
                    key={col.id}
                    className="w-[85vw] sm:w-[340px] shrink-0 flex flex-col max-h-full bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800"
                  >
                    <div
                      className="p-3 md:p-4 rounded-t-xl border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between shadow-sm shrink-0"
                      style={{ backgroundColor: col.color }}
                    >
                      <h3 className="font-black text-white tracking-wider text-sm md:text-base">
                        {col.title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                        {colTasks.length}
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          className={`flex-1 overflow-y-auto p-2 md:p-3 flex flex-col gap-2 md:gap-3 custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-zinc-200/30 dark:bg-zinc-800/30' : ''}`}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {colTasks.map((task, index) => {
                            const isDarkBg = [
                              'URGENT',
                              'HIGH',
                              'MEDIUM',
                            ].includes(task.priority);
                            const textColor = isDarkBg
                              ? 'text-white'
                              : 'text-zinc-900';
                            const mutedTextColor = isDarkBg
                              ? 'text-white/80'
                              : 'text-zinc-500';
                            const borderColor = isDarkBg
                              ? 'border-white/20'
                              : 'border-zinc-200';
                            const bgColor =
                              PRIORITIES[task.priority] ||
                              PRIORITIES['NO PRIORITY'];

                            return (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleEditTask(task)}
                                    style={{
                                      ...provided.draggableProps.style,
                                      backgroundColor: bgColor,
                                    }}
                                    className={`rounded-xl shadow-xs flex flex-col overflow-visible cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition-all ${snapshot.isDragging ? 'shadow-2xl scale-105 z-60 opacity-100' : 'opacity-100 scale-100'} ${textColor}`}
                                  >
                                    <div className="p-3 md:p-4 flex flex-col gap-2 md:gap-3 relative">
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className={`task-menu-trigger p-1.5 rounded-md transition-colors ${isDarkBg ? 'hover:bg-white/20 text-white' : 'hover:bg-zinc-200/50 text-zinc-500'}`}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpenTaskMenu(
                                              openTaskMenu === task.id
                                                ? null
                                                : task.id
                                            );
                                          }}
                                        >
                                          <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                        {openTaskMenu === task.id && (
                                          <div className="task-dropdown-menu absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 z-70 animate-in fade-in zoom-in-95">
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleEditTask(task);
                                                setOpenTaskMenu(null);
                                              }}
                                              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-md transition-colors"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />{' '}
                                              {t('editTask')}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDuplicateTask(task);
                                              }}
                                              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-md transition-colors"
                                            >
                                              <Copy className="w-3.5 h-3.5" />{' '}
                                              {t('duplicate')}
                                            </button>
                                            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-700 my-1"></div>
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteTask(
                                                  task.id,
                                                  task.title
                                                );
                                              }}
                                              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />{' '}
                                              {t('delete')}
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex justify-between items-start gap-2 md:gap-4 pr-8">
                                        <div className="flex-1">
                                          <h4 className="text-sm font-extrabold leading-snug tracking-tight">
                                            {task.title}
                                          </h4>
                                          {task.description && (
                                            <p
                                              className={`text-[10px] md:text-[11px] mt-1 line-clamp-2 ${mutedTextColor}`}
                                            >
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex flex-col items-start gap-1.5 shrink-0 mt-1">
                                        <span
                                          className={`text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkBg ? 'bg-white/10 border-white/20' : 'bg-zinc-200/50 border-zinc-200'}`}
                                        >
                                          {t('for')}{' '}
                                          {task.assignee.includes('@')
                                            ? task.assignee.split('@')[0]
                                            : task.assignee}
                                        </span>
                                        {task.commitCode && (
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-mono font-bold border ${isDarkBg ? 'bg-white/10 border-white/20' : 'bg-white/50 border-zinc-300'}`}
                                          >
                                            {task.commitCode}
                                          </span>
                                        )}
                                      </div>

                                      <div
                                        className={`h-px w-full ${borderColor} my-0.5`}
                                      />

                                      <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-0.5">
                                          <span
                                            className={`text-[8px] md:text-[9px] font-medium ${mutedTextColor}`}
                                          >
                                            {t('createdBy')}{' '}
                                            <span className="font-bold">
                                              {task.createdBy}
                                            </span>
                                          </span>
                                          <span
                                            className={`text-[8px] md:text-[9px] font-medium ${mutedTextColor}`}
                                          >
                                            {t('updatedBy')}{' '}
                                            <span className="font-bold">
                                              {task.updatedBy}
                                            </span>
                                          </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5 text-[9px] md:text-[10px] font-bold">
                                          {task.startDate && (
                                            <span className={mutedTextColor}>
                                              {t('start')}: {task.startDate}
                                            </span>
                                          )}
                                          {task.deadline && (
                                            <span className={mutedTextColor}>
                                              {t('deadline')}: {task.deadline}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          <button
                            onClick={() => handleOpenAddModal(col.id)}
                            className="mt-1 md:mt-2 w-full flex items-center justify-center gap-2 py-2 md:py-3 rounded-xl text-xs font-extrabold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-all border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                          >
                            {t('addTask')}
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {isDrawerOpen && (
          <div className="w-[85vw] sm:w-80 shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full absolute md:relative right-0 z-40 animate-in slide-in-from-right duration-300">
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-zinc-200/50 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => setDrawerTab('activity')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${drawerTab === 'activity' ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  <Activity className="w-3.5 h-3.5" /> {t('activity')}
                </button>
                <button
                  onClick={() => setDrawerTab('github')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${drawerTab === 'github' ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  <GitCommitHorizontal className="w-3.5 h-3.5" /> {t('commits')}
                </button>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center justify-center w-7 h-7 mr-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-md hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto bg-white dark:bg-zinc-900 custom-scrollbar relative">
              {drawerTab === 'activity' && (
                <div className="space-y-5 relative">
                  {activityLogs.length === 0 ? (
                    <div className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-10 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                      {t('noActivity')}
                    </div>
                  ) : (
                    <>
                      <div className="absolute left-4 top-2 bottom-2 w-px bg-zinc-100 dark:bg-zinc-800"></div>
                      {activityLogs.map((log) => (
                        <div key={log.id} className="relative flex gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-600 dark:text-zinc-400 shrink-0 z-10">
                            {log.user.charAt(0).toUpperCase()}
                          </div>
                          <div className="pt-1.5">
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              <span className="font-bold text-zinc-900 dark:text-white">
                                {log.user}
                              </span>{' '}
                              {log.action}{' '}
                              <span className="font-semibold text-zinc-800 dark:text-zinc-300">
                                {log.target}
                              </span>
                            </p>
                            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                              {formatActivityDate(log.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              {drawerTab === 'github' && (
                <div className="space-y-4">
                  {!linkedRepo ? (
                    <div className="flex flex-col items-center text-center mt-6 bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full flex items-center justify-center mb-3">
                        <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white">
                        {t('linkRepo')}
                      </h4>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1.5 mb-4 leading-relaxed">
                        {t('linkRepoDesc')}
                      </p>
                      <div className="w-full space-y-2">
                        <input
                          type="text"
                          value={repoInput}
                          onChange={(e) => setRepoInput(e.target.value)}
                          placeholder="owner/repo"
                          className="w-full text-xs font-medium px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleConnectRepo}
                          disabled={!repoInput}
                          className="w-full py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                        >
                          {t('connect')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex flex-col truncate">
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            {t('connectedTo')}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                            {linkedRepo}
                          </span>
                        </div>
                        <button
                          onClick={handleUnlinkRepo}
                          className="p-1.5 text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-5 relative">
                        <div className="absolute left-[11px] top-4 bottom-4 w-px bg-zinc-100 dark:bg-zinc-800"></div>
                        {isCommitsLoading ? (
                          <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500">
                            <Loader2 className="w-5 h-5 animate-spin mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              {t('fetching')}
                            </span>
                          </div>
                        ) : commits.length === 0 ? (
                          <div className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                            {t('noCommits')}
                          </div>
                        ) : (
                          commits.map((commit) => (
                            <div
                              key={commit.sha}
                              className="flex gap-3 group relative z-10"
                            >
                              <div className="w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5">
                                <GitCommitHorizontal className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-zinc-900 dark:text-white wrap-break-word line-clamp-2">
                                  {commit.message}
                                </p>
                                <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                                  by{' '}
                                  <b className="text-zinc-700 dark:text-zinc-300">
                                    {commit.author}
                                  </b>{' '}
                                  •{' '}
                                  {new Date(commit.date).toLocaleDateString(
                                    'en-US',
                                    { month: 'short', day: 'numeric' }
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && isClient && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/60 backdrop-blur-sm sm:p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">
                <div className="p-5 md:p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
                  <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 dark:text-white">
                    {editingTaskId ? t('modalTitleEdit') : t('modalTitleNew')}
                  </h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    type="button"
                    className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-full transition-colors p-1.5 shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleTaskSubmit}
                  className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar pb-8 sm:pb-6"
                >
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                      {t('modalTitle')}
                    </label>
                    <input
                      required
                      type="text"
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-3 sm:py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-sm font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                      {t('modalDesc')}
                    </label>
                    <textarea
                      rows={2}
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="w-full mt-1 px-3 py-3 sm:py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-sm font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {t('modalPriority')}
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) =>
                          setNewTaskPriority(e.target.value as TaskPriority)
                        }
                        className="w-full mt-1 px-3 py-3 sm:py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-sm font-bold focus:outline-none"
                      >
                        {Object.keys(PRIORITIES).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {t('modalAssignee')}
                      </label>
                      <input
                        type="text"
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        onFocus={() => setShowAssigneeDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowAssigneeDropdown(false), 200)
                        }
                        className="w-full mt-1 px-3 py-3 sm:py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        placeholder={t('modalAssigneePlaceholder')}
                      />
                      {showAssigneeDropdown && collaborators.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden z-50 max-h-40 overflow-y-auto">
                          {collaborators
                            .filter((c) =>
                              c.email
                                .toLowerCase()
                                .includes(newTaskAssignee.toLowerCase())
                            )
                            .map((c, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setNewTaskAssignee(c.email);
                                  setShowAssigneeDropdown(false);
                                }}
                                className="px-3 py-3 sm:py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex justify-between items-center"
                              >
                                <span className="truncate">{c.email}</span>
                                <span className="text-[9px] uppercase bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded ml-2">
                                  {c.role}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="col-span-1 md:col-span-2 bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        {t('modalCommit')}
                      </label>
                      {linkedRepo && commits.length > 0 ? (
                        <select
                          value={newTaskCommit}
                          onChange={(e) => setNewTaskCommit(e.target.value)}
                          className="w-full mt-1 px-3 py-3 sm:py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                          <option value="" className="font-sans">
                            -- Select a recent commit --
                          </option>
                          {commits.map((c) => (
                            <option key={c.sha} value={c.sha}>
                              {c.sha} -{' '}
                              {c.message.length > 50
                                ? c.message.substring(0, 50) + '...'
                                : c.message}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newTaskCommit}
                          onChange={(e) => setNewTaskCommit(e.target.value)}
                          className="w-full mt-1 px-3 py-3 sm:py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          placeholder={t('modalCommitPlaceholder')}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                        {t('modalStart')}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowStartCalendar(!showStartCalendar);
                          setShowDeadlineCalendar(false);
                        }}
                        className="w-full mt-1 px-3 py-3 sm:py-2 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-xs font-semibold text-left flex justify-between items-center transition-colors"
                      >
                        <span>
                          {startDateObj
                            ? startDateObj.toLocaleDateString('en-GB')
                            : 'Date'}
                        </span>
                        {startDateObj && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setStartDateObj(undefined);
                            }}
                            className="text-zinc-400 hover:text-red-500 p-1"
                          >
                            ✖
                          </span>
                        )}
                      </button>
                      {showStartCalendar && (
                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={startDateObj}
                            onSelect={(date) => {
                              setStartDateObj(date);
                              setShowStartCalendar(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                        {t('modalDeadline')}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeadlineCalendar(!showDeadlineCalendar);
                          setShowStartCalendar(false);
                        }}
                        className="w-full mt-1 px-3 py-3 sm:py-2 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-lg text-xs font-semibold text-left flex justify-between items-center transition-colors"
                      >
                        <span>
                          {deadlineObj
                            ? deadlineObj.toLocaleDateString('en-GB')
                            : 'Date'}
                        </span>
                        {deadlineObj && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeadlineObj(undefined);
                            }}
                            className="text-zinc-400 hover:text-red-500 p-1"
                          >
                            ✖
                          </span>
                        )}
                      </button>
                      {showDeadlineCalendar && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-100 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={deadlineObj}
                            onSelect={(date) => {
                              setDeadlineObj(date);
                              setShowDeadlineCalendar(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 shrink-0 sticky bottom-0 bg-white dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-5 py-3 sm:py-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-8 sm:px-6 py-3 sm:py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-md flex-1 sm:flex-none transition-colors"
                    >
                      {editingTaskId ? t('save') : t('create')}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
