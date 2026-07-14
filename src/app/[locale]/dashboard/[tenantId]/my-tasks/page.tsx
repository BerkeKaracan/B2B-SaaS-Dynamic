'use client';

import React, { useState, useEffect, use, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import {
  CheckCircle2,
  Loader2,
  FolderKanban,
  Square,
  CheckSquare,
  ChevronsUp,
  ChevronUp,
  Minus,
  ChevronDown,
  Search,
  ListTodo,
  CircleDot,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarClock,
  ExternalLink,
  AlertCircle,
  Filter,
} from 'lucide-react';

type TaskStatus = 'todo' | 'in_progress' | 'done';
type SortKey = 'title' | 'project' | 'priority' | 'status' | 'dueDate' | 'updated';
type SortDir = 'asc' | 'desc';

interface TaskRecordData {
  project_id: string;
  project_name: string;
  title: string;
  status: TaskStatus;
  priority: string;
  due_date: string | null;
  assigned_to: string;
}

interface TaskRecord {
  id: string;
  tenant_id: string;
  module_name: string;
  record_data: TaskRecordData;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: TaskStatus;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 5,
  highest: 5,
  high: 4,
  medium: 3,
  low: 2,
  lowest: 1,
  'no priority': 0,
};

const STATUS_WEIGHT: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  done: 2,
};

const STATUS_TABS: { id: TaskStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

function normalizePriority(priority: string) {
  return (priority || 'medium').toLowerCase().trim();
}

function parseDueDate(value: string | null): Date | null {
  if (!value || value === '-') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDueLabel(value: string | null): {
  label: string;
  tone: 'overdue' | 'today' | 'soon' | 'normal' | 'none';
} {
  const due = parseDueDate(value);
  if (!due) return { label: 'No date', tone: 'none' };

  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);
  const diffDays = Math.round(
    (dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      tone: 'overdue',
    };
  }
  if (diffDays === 0) return { label: 'Today', tone: 'today' };
  if (diffDays === 1) return { label: 'Tomorrow', tone: 'soon' };
  if (diffDays <= 7) return { label: `In ${diffDays}d`, tone: 'soon' };

  return {
    label: due.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: due.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    }),
    tone: 'normal',
  };
}

function formatRelative(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function visualId(projectName: string, id: string) {
  const prefix =
    projectName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() ||
    'TSK';
  const suffix = id.replace(/-/g, '').substring(0, 4).toUpperCase();
  return `${prefix}-${suffix}`;
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  className = '',
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ${className}`}
    >
      {label}
      {active ? (
        sortDir === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}

export default function MyTasksPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;

  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMyTasks = async () => {
      if (!user?.email) return;
      setIsLoading(true);

      try {
        const encodedEmail = encodeURIComponent(user.email);
        const res = await fetchAPI(
          `/api/tasks/me?tenant_id=${tenantId}&email=${encodedEmail}`
        );

        if (res.ok) {
          const backendTasks: TaskRecord[] = await res.json();

          const formattedTasks: Task[] = backendTasks.map((record) => ({
            id: record.id,
            projectId: record.record_data.project_id,
            projectName: record.record_data.project_name || 'Untitled',
            title: record.record_data.title || 'Untitled task',
            status: (record.record_data.status || 'todo') as TaskStatus,
            priority: record.record_data.priority || 'medium',
            dueDate: record.record_data.due_date || null,
            createdAt: record.created_at,
            updatedAt: record.updated_at || record.created_at,
          }));

          setTasks(formattedTasks);
        }
      } catch (error) {
        console.error('Failed to fetch assigned tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTasks();
  }, [tenantId, user]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => map.set(t.projectId, t.projectName));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const priorities = useMemo(() => {
    const set = new Set(tasks.map((t) => normalizePriority(t.priority)));
    return Array.from(set).sort(
      (a, b) => (PRIORITY_WEIGHT[b] ?? 0) - (PRIORITY_WEIGHT[a] ?? 0)
    );
  }, [tasks]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => {
        if (t.status === 'done') return false;
        const due = formatDueLabel(t.dueDate);
        return due.tone === 'overdue';
      }).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let list = tasks.filter((task) => {
      if (activeTab !== 'all' && task.status !== activeTab) return false;
      if (projectFilter !== 'all' && task.projectId !== projectFilter)
        return false;
      if (
        priorityFilter !== 'all' &&
        normalizePriority(task.priority) !== priorityFilter
      )
        return false;
      if (q) {
        const hay = `${task.title} ${task.projectName} ${visualId(task.projectName, task.id)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'project':
          cmp = a.projectName.localeCompare(b.projectName);
          break;
        case 'priority':
          cmp =
            (PRIORITY_WEIGHT[normalizePriority(a.priority)] ?? 0) -
            (PRIORITY_WEIGHT[normalizePriority(b.priority)] ?? 0);
          break;
        case 'status':
          cmp = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
          break;
        case 'dueDate': {
          const ad = parseDueDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
          const bd = parseDueDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
          cmp = ad - bd;
          break;
        }
        case 'updated':
          cmp =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [
    tasks,
    activeTab,
    projectFilter,
    priorityFilter,
    searchQuery,
    sortKey,
    sortDir,
  ]);

  const allVisibleSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every((t) => selectedIds.has(t.id));

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(key === 'priority' || key === 'updated' ? 'desc' : 'asc');
      }
    },
    [sortKey]
  );

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTasks.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTasks.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderPriority = (priority: string) => {
    const p = normalizePriority(priority);
    if (p === 'highest' || p === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <ChevronsUp className="w-3.5 h-3.5 text-red-500" />
          <span className="capitalize">{p}</span>
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <ChevronUp className="w-3.5 h-3.5 text-orange-500" />
          <span className="capitalize">{p}</span>
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <Minus className="w-3.5 h-3.5 text-amber-500" />
          <span className="capitalize">{p}</span>
        </span>
      );
    }
    if (p === 'low' || p === 'lowest') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          <ChevronDown className="w-3.5 h-3.5 text-sky-500" />
          <span className="capitalize">{p}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Minus className="w-3.5 h-3.5 text-zinc-400" />
        None
      </span>
    );
  };

  const renderStatusBadge = (status: TaskStatus) => {
    if (status === 'done') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 px-2 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/80 dark:border-sky-500/20 px-2 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase">
          <CircleDot className="w-3 h-3" />
          In progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase">
        <ListTodo className="w-3 h-3" />
        To do
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] dark:bg-black min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-[1280px] mx-auto w-full p-6 md:p-10 pb-36 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <CheckCircle2 className="w-5 h-5 text-zinc-900 dark:text-white" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  My Tasks
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium leading-relaxed max-w-xl">
                  Everything assigned to you across workspaces — filter, sort,
                  and jump into the project.
                </p>
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex items-center shadow-inner shrink-0 self-start overflow-x-auto max-w-full">
              {STATUS_TABS.map((tab) => {
                const count =
                  tab.id === 'all'
                    ? counts.all
                    : counts[tab.id as TaskStatus];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
                        activeTab === tab.id
                          ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                          : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard label="Open" value={counts.todo + counts.in_progress} />
          <StatCard label="In progress" value={counts.in_progress} />
          <StatCard label="Completed" value={counts.done} />
          <StatCard
            label="Overdue"
            value={counts.overdue}
            accent={counts.overdue > 0}
          />
        </div>

        {/* Table card */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 md:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, projects, or IDs…"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-zinc-400 px-1">
                <Filter className="w-3.5 h-3.5" />
              </div>

              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="appearance-none px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 max-w-[180px]"
              >
                <option value="all">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
              >
                <option value="all">All priorities</option>
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>

              {(searchQuery ||
                projectFilter !== 'all' ||
                priorityFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setProjectFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-2 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="px-4 md:px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-between gap-3 text-xs font-bold">
              <span>{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="underline underline-offset-2 opacity-80 hover:opacity-100"
              >
                Clear selection
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Loading tasks…
              </span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                No tasks found
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-sm font-medium">
                {tasks.length === 0
                  ? 'Nothing assigned to you yet. Tasks from your projects will show up here.'
                  : 'Try adjusting filters or clearing the search.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-zinc-50/90 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 md:px-5 py-3 w-12">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          aria-label="Select all"
                        >
                          {allVisibleSelected ? (
                            <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-white" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-3 min-w-[320px]">
                        <SortHeader
                          label="Task"
                          column="title"
                          sortKey={sortKey}
                          sortDir={sortDir}
                          onSort={toggleSort}
                        />
                      </th>
                      <th className="px-3 py-3 min-w-[160px]">
                        <SortHeader
                          label="Project"
                          column="project"
                          sortKey={sortKey}
                          sortDir={sortDir}
                          onSort={toggleSort}
                        />
                      </th>
                      <th className="px-3 py-3 min-w-[110px]">
                        <SortHeader
                          label="Priority"
                          column="priority"
                          sortKey={sortKey}
                          sortDir={sortDir}
                          onSort={toggleSort}
                        />
                      </th>
                      <th className="px-3 py-3 min-w-[130px]">
                        <SortHeader
                          label="Status"
                          column="status"
                          sortKey={sortKey}
                          sortDir={sortDir}
                          onSort={toggleSort}
                        />
                      </th>
                      <th className="px-3 py-3 min-w-[120px]">
                        <SortHeader
                          label="Due"
                          column="dueDate"
                          sortKey={sortKey}
                          sortDir={sortDir}
                          onSort={toggleSort}
                        />
                      </th>
                      <th className="px-3 py-3 min-w-[100px]">
                        <SortHeader
                          label="Updated"
                          column="updated"
                          sortKey={sortKey}
                          sortDir={sortDir}
                          onSort={toggleSort}
                        />
                      </th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredTasks.map((task) => {
                      const isDone = task.status === 'done';
                      const idLabel = visualId(task.projectName, task.id);
                      const due = formatDueLabel(
                        isDone ? task.dueDate : task.dueDate
                      );
                      const selected = selectedIds.has(task.id);

                      return (
                        <tr
                          key={task.id}
                          className={`group transition-colors ${
                            selected
                              ? 'bg-zinc-50 dark:bg-zinc-800/60'
                              : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <td className="px-4 md:px-5 py-3.5 align-middle">
                            <button
                              type="button"
                              onClick={() => toggleSelect(task.id)}
                              className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                              aria-label={`Select ${task.title}`}
                            >
                              {selected || isDone ? (
                                <CheckSquare
                                  className={`w-4 h-4 ${
                                    isDone && !selected
                                      ? 'text-emerald-500'
                                      : 'text-zinc-900 dark:text-white'
                                  }`}
                                />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          <td className="px-3 py-3.5 align-middle">
                            <Link
                              href={`/dashboard/${tenantId}/projects/${task.projectId}`}
                              className="flex items-start gap-3 min-w-0 group/link"
                            >
                              <span
                                className={`mt-0.5 shrink-0 text-[11px] font-mono font-bold tracking-wide ${
                                  isDone
                                    ? 'text-zinc-400 dark:text-zinc-600 line-through'
                                    : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                {idLabel}
                              </span>
                              <span
                                className={`text-sm font-semibold leading-snug wrap-break-word group-hover/link:underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 ${
                                  isDone
                                    ? 'text-zinc-500 dark:text-zinc-500'
                                    : 'text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                {task.title}
                              </span>
                            </Link>
                          </td>

                          <td className="px-3 py-3.5 align-middle">
                            <Link
                              href={`/dashboard/${tenantId}/projects/${task.projectId}`}
                              className="inline-flex items-center gap-2 max-w-[200px] px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/70 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                            >
                              <FolderKanban className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="truncate">{task.projectName}</span>
                            </Link>
                          </td>

                          <td className="px-3 py-3.5 align-middle">
                            {renderPriority(task.priority)}
                          </td>

                          <td className="px-3 py-3.5 align-middle">
                            {renderStatusBadge(task.status)}
                          </td>

                          <td className="px-3 py-3.5 align-middle">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                due.tone === 'overdue'
                                  ? 'text-red-600 dark:text-red-400'
                                  : due.tone === 'today'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : due.tone === 'soon'
                                      ? 'text-sky-700 dark:text-sky-400'
                                      : due.tone === 'none'
                                        ? 'text-zinc-400'
                                        : 'text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {due.tone === 'overdue' ? (
                                <AlertCircle className="w-3.5 h-3.5" />
                              ) : (
                                <CalendarClock className="w-3.5 h-3.5 opacity-70" />
                              )}
                              {due.label}
                            </span>
                          </td>

                          <td className="px-3 py-3.5 align-middle">
                            <span
                              className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                              title={new Date(task.updatedAt).toLocaleString()}
                            >
                              {formatRelative(task.updatedAt)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 align-middle">
                            <Link
                              href={`/dashboard/${tenantId}/projects/${task.projectId}`}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all inline-flex"
                              title="Open project"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 md:px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-800/30">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Showing{' '}
                  <span className="text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {filteredTasks.length}
                  </span>{' '}
                  of{' '}
                  <span className="text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {tasks.length}
                  </span>{' '}
                  tasks
                </p>
                <p className="text-[11px] font-medium text-zinc-400">
                  Sorted by {sortKey.replace(/([A-Z])/g, ' $1').toLowerCase()}{' '}
                  ({sortDir === 'asc' ? 'ascending' : 'descending'})
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm p-4 md:p-5">
      <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p
        className={`text-2xl md:text-3xl font-black tabular-nums tracking-tight ${
          accent && value > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-zinc-900 dark:text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
