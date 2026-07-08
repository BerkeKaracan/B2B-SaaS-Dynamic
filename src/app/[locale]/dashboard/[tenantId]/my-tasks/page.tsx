'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import {
  CheckCircle,
  Loader2,
  FolderKanban,
  Square,
  CheckSquare,
  ChevronsUp,
  ChevronUp,
  Minus,
  ChevronDown,
  ChevronDown as ChevronDownSmall,
} from 'lucide-react';

type TaskStatus = 'todo' | 'in_progress' | 'done';

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
  dueDate: string;
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
            projectName: record.record_data.project_name,
            title: record.record_data.title,
            status: record.record_data.status,
            priority: record.record_data.priority,
            dueDate: record.record_data.due_date || '-',
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

  const filteredTasks = tasks.filter(
    (task) => activeTab === 'all' || task.status === activeTab
  );

  // Jira tarzı Öncelik İkonları ve Renkleri
  const renderPriority = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'highest' || p === 'urgent') {
      return (
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <ChevronsUp className="w-4 h-4 text-red-500" />
          <span className="capitalize">{priority}</span>
        </div>
      );
    }
    if (p === 'high') {
      return (
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <ChevronUp className="w-4 h-4 text-red-400" />
          <span className="capitalize">{priority}</span>
        </div>
      );
    }
    if (p === 'medium') {
      return (
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <Minus className="w-4 h-4 text-amber-500" />
          <span className="capitalize">{priority}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
        <ChevronDown className="w-4 h-4 text-blue-500" />
        <span className="capitalize">{priority}</span>
      </div>
    );
  };

  // Açılır menü hissiyatlı Jira tarzı durum rozetleri
  const renderStatusBadge = (status: TaskStatus) => {
    if (status === 'done') {
      return (
        <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase cursor-pointer hover:bg-emerald-500/20 transition-colors">
          DONE <ChevronDownSmall className="w-3 h-3 opacity-70" />
        </div>
      );
    }
    if (status === 'in_progress') {
      return (
        <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase cursor-pointer hover:bg-blue-500/20 transition-colors">
          IN PROGRESS <ChevronDownSmall className="w-3 h-3 opacity-70" />
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase cursor-pointer hover:bg-zinc-500/20 transition-colors">
        TODO <ChevronDownSmall className="w-3 h-3 opacity-70" />
      </div>
    );
  };

  // Benzersiz görsel ID oluşturucu (Proje adının ilk 3 harfi + kısa ID)
  const generateVisualId = (projectName: string, id: string) => {
    const prefix = projectName.substring(0, 3).toUpperCase() || 'TSK';
    const suffix = id.substring(0, 4).toUpperCase();
    return `${prefix}-${suffix}`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-white dark:bg-[#161616] transition-colors duration-300">
      {/* Header Alanı */}
      <header className="shrink-0 px-6 py-6 border-b border-zinc-200 dark:border-zinc-800 z-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                My Assigned Tasks
              </h1>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                Overview of your personal workload.
              </p>
            </div>
          </div>

          <div className="flex bg-zinc-100 dark:bg-[#0A0A0A] p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full md:w-auto overflow-x-auto custom-scrollbar">
            {(['all', 'todo', 'in_progress', 'done'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold capitalize tracking-wider rounded-md transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white dark:bg-[#222222] text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50'
                    : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tablo Alanı */}
      <main className="flex-1 overflow-auto bg-white dark:bg-[#161616] p-4 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-zinc-400 dark:text-zinc-600">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Loading Data...
            </span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
            <CheckCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-300">
              No tasks found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              You don&lsquo;t have any tasks matching this filter.
            </p>
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-10">
                    <Square className="w-4 h-4 opacity-50" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 min-w-[300px]">
                    Work
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Project
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTasks.map((task) => {
                  const isDone = task.status === 'done';
                  const visualId = generateVisualId(task.projectName, task.id);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-zinc-50 dark:hover:bg-[#222222] transition-colors group cursor-default"
                    >
                      <td className="px-4 py-2.5">
                        {isDone ? (
                          <CheckSquare className="w-4 h-4 text-indigo-500" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/dashboard/${tenantId}/projects/${task.projectId}`}
                          className="flex items-center gap-3 hover:underline decoration-indigo-500/30 underline-offset-4"
                        >
                          <span
                            className={`text-xs font-mono font-medium ${
                              isDone
                                ? 'text-zinc-400 dark:text-zinc-600 line-through'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {visualId}
                          </span>
                          <span
                            className={`text-sm font-medium truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] ${
                              isDone
                                ? 'text-zinc-500 dark:text-zinc-500'
                                : 'text-zinc-900 dark:text-zinc-200'
                            }`}
                          >
                            {task.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
                          {task.projectName}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium">
                        {renderPriority(task.priority)}
                      </td>
                      <td className="px-4 py-2.5">
                        {renderStatusBadge(task.status)}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {task.dueDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
