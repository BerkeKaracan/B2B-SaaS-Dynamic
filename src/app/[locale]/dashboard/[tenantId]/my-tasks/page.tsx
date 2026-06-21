"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { fetchAPI } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import {
  CheckCircle,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  FolderKanban,
  ArrowUpRight,
} from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "done";

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
  const [activeTab, setActiveTab] = useState<TaskStatus | "all">("all");

  useEffect(() => {
    const fetchMyTasks = async () => {
      if (!user?.email) return;
      setIsLoading(true);

      try {
        const encodedEmail = encodeURIComponent(user.email);
        const res = await fetchAPI(
          `/api/tasks/me?tenant_id=${tenantId}&email=${encodedEmail}`,
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
            dueDate: record.record_data.due_date || "-",
          }));

          setTasks(formattedTasks);
        }
      } catch (error) {
        console.error("Failed to fetch assigned tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTasks();
  }, [tenantId, user]);

  const filteredTasks = tasks.filter(
    (task) => activeTab === "all" || task.status === activeTab,
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-[#FAFAFA]">
      <header className="shrink-0 px-8 py-6 border-b border-zinc-200/60 bg-white shadow-sm z-10 relative">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                My Assigned Tasks
              </h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">
                Tasks assigned securely to you across the entire workspace.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8 relative">
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
          <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl max-w-md">
            {(["all", "todo", "in_progress", "done"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-bold capitalize tracking-wider rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Loading Tasks...
                </span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-[300px]">
                <CheckCircle2 className="w-12 h-12 text-zinc-300 mb-4" />
                <h3 className="text-lg font-bold text-zinc-900">
                  All caught up!
                </h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-md">
                  No active tasks assigned to <strong>{user?.email}</strong> in
                  this category.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {filteredTasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      {task.status === "todo" && (
                        <Circle className="w-5 h-5 text-zinc-300 shrink-0" />
                      )}
                      {task.status === "in_progress" && (
                        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      {task.status === "done" && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}

                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-bold truncate max-w-md md:max-w-lg lg:max-w-xl ${task.status === "done" ? "text-zinc-400 line-through" : "text-zinc-900"}`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Link
                            href={`/dashboard/${tenantId}/projects/${task.projectId}`}
                            className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                          >
                            <FolderKanban className="w-3 h-3" />
                            {task.projectName}
                          </Link>

                          {task.dueDate && task.dueDate !== "-" && (
                            <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Due {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`hidden sm:block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                          task.priority.toLowerCase() === "high"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : task.priority.toLowerCase() === "medium"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        {task.priority}
                      </span>

                      <Link
                        href={`/dashboard/${tenantId}/projects/${task.projectId}`}
                        className="w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                        title="Go to Project"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
