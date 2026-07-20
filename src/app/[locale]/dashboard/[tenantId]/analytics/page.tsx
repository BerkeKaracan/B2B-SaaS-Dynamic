'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import {
  Download,
  BarChart2,
  FolderKanban,
  CheckCircle2,
  Users,
  TrendingUp,
  ListTodo,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type Notification = {
  type: 'error' | 'success';
  msg: string;
};

interface ProjectExportRecord {
  id: string;
  module_name?: string;
  created_at?: string;
  record_data?: {
    name?: string;
    status?: string;
    template?: string;
    visibility?: string;
    folder?: string;
    [key: string]: unknown;
  };
}

const escapeCsvCell = (value: unknown): string => {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const rowsToCsv = (rows: unknown[][]): string =>
  rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

interface ChartDataPoint {
  month: string;
  projectsCreated: number;
  tasksCompleted: number;
  activeTasks: number;
}

interface AnalyticsMetrics {
  total_projects: number;
  active_projects: number;
  archived_projects: number;
  total_tasks: number;
  tasks_todo: number;
  tasks_in_progress: number;
  tasks_done: number;
  team_members: number;
  completion_rate: number;
}

interface PriorityBreakdown {
  priority: string;
  count: number;
}

interface TemplateBreakdown {
  template: string;
  count: number;
}

interface AnalyticsResponse {
  metrics: AnalyticsMetrics;
  chartData: ChartDataPoint[];
  tasksByPriority: PriorityBreakdown[];
  projectsByTemplate: TemplateBreakdown[];
}

const STATUS_COLORS = ['#6366f1', '#f59e0b', '#10b981'];
const PRIORITY_COLORS = [
  '#E3123B',
  '#7B323D',
  '#93B27D',
  '#BEF109',
  '#B2BAAE',
  '#6366f1',
];
const TEMPLATE_LABELS: Record<string, string> = {
  blank: 'Blank',
  kanban: 'Kanban',
  document: 'Document',
  whiteboard: 'Whiteboard',
  timeline: 'Timeline',
  database: 'Database',
  mindmap: 'Mind Map',
  retrospective: 'Retrospective',
  notepad: 'Notepad',
};

const EMPTY_METRICS: AnalyticsMetrics = {
  total_projects: 0,
  active_projects: 0,
  archived_projects: 0,
  total_tasks: 0,
  tasks_todo: 0,
  tasks_in_progress: 0,
  tasks_done: 0,
  team_members: 0,
  completion_rate: 0,
};

export default function AnalyticsDashboardPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();

  const [metrics, setMetrics] = useState<AnalyticsMetrics>(EMPTY_METRICS);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [tasksByPriority, setTasksByPriority] = useState<PriorityBreakdown[]>(
    []
  );
  const [projectsByTemplate, setProjectsByTemplate] = useState<
    TemplateBreakdown[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const showNotification = (type: 'error' | 'success', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  // Access control is enforced by the backend `/analytics` endpoint (per-tenant
  // admin/owner). We drive the UI purely off its response so the page always
  // opens: 401 → login, 403 → access-denied state, other errors → retry state.
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    setAccessDenied(false);
    try {
      const res = await fetchAPI(
        `/api/tenants/${tenantId}/analytics?t=${new Date().getTime()}`,
        {
          headers: { 'x-tenant-id': tenantId },
          cache: 'no-store',
        }
      );

      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!res.ok) {
        setLoadError(true);
        return;
      }

      const analyticsResult: AnalyticsResponse = await res.json();
      setMetrics(analyticsResult.metrics ?? EMPTY_METRICS);
      setChartData(analyticsResult.chartData ?? []);
      setTasksByPriority(analyticsResult.tasksByPriority ?? []);
      setProjectsByTemplate(analyticsResult.projectsByTemplate ?? []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, router]);

  useEffect(() => {
    // Initial data load on mount. fetchAnalytics sets loading state before its
    // first await; that synchronous setState is intentional here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
  }, [fetchAnalytics]);

  const taskStatusData = [
    { name: 'To Do', value: metrics.tasks_todo },
    { name: 'In Progress', value: metrics.tasks_in_progress },
    { name: 'Done', value: metrics.tasks_done },
  ].filter((item) => item.value > 0);

  const templateChartData = projectsByTemplate.map((item) => ({
    name: TEMPLATE_LABELS[item.template] || item.template,
    count: item.count,
  }));

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetchAPI(
        `/api/records?tenant_id=${tenantId}&module_name=projects`,
        {
          headers: { 'x-tenant-id': tenantId },
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch workspace records for export.');
      }

      const projects: ProjectExportRecord[] = await res.json();

      const csvRows: unknown[][] = [
        ['Workspace Export'],
        ['Generated At', new Date().toISOString()],
        ['Tenant ID', tenantId],
        [],
        ['Summary Metrics'],
        ['Metric', 'Value'],
        ['Total Projects', metrics.total_projects],
        ['Active Projects', metrics.active_projects],
        ['Archived Projects', metrics.archived_projects],
        ['Total Tasks', metrics.total_tasks],
        ['Tasks To Do', metrics.tasks_todo],
        ['Tasks In Progress', metrics.tasks_in_progress],
        ['Tasks Done', metrics.tasks_done],
        ['Completion Rate', `${metrics.completion_rate}%`],
        ['Team Members', metrics.team_members],
        [],
        ['Projects'],
        [
          'ID',
          'Name',
          'Status',
          'Template',
          'Visibility',
          'Folder',
          'Module',
          'Created At',
        ],
        ...projects.map((project) => {
          const data = project.record_data ?? {};
          return [
            project.id,
            data.name ?? '',
            data.status ?? '',
            TEMPLATE_LABELS[String(data.template ?? '')] ||
              data.template ||
              '',
            data.visibility ?? '',
            data.folder ?? '',
            project.module_name ?? 'projects',
            project.created_at ?? '',
          ];
        }),
      ];

      const csvString = rowsToCsv(csvRows);
      const blob = new Blob([csvString], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = 'workspace-export.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('success', 'Workspace export downloaded successfully.');
    } catch (error) {
      console.error('CSV export failed:', error);
      showNotification(
        'error',
        'Failed to export workspace data. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex justify-center items-center p-10">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="h-full flex flex-col justify-center items-center p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-black text-zinc-900">Analytics is restricted</h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-md font-medium">
          Only workspace owners and admins can view analytics. Ask an admin to
          upgrade your role if you need access.
        </p>
        <button
          onClick={() => router.push(`/dashboard/${tenantId}/projects`)}
          className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full flex flex-col justify-center items-center p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-600" />
        </div>
        <h2 className="text-xl font-black text-zinc-900">
          Couldn&apos;t load analytics
        </h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-md font-medium">
          Something went wrong while fetching your workspace metrics. Please try
          again.
        </p>
        <button
          onClick={fetchAnalytics}
          className="mt-6 flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Projects',
      value: metrics.total_projects,
      sub: `${metrics.active_projects} active · ${metrics.archived_projects} archived`,
      icon: FolderKanban,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Total Tasks',
      value: metrics.total_tasks,
      sub: `${metrics.tasks_in_progress} in progress`,
      icon: ListTodo,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Completion Rate',
      value: `${metrics.completion_rate}%`,
      sub: `${metrics.tasks_done} tasks completed`,
      icon: CheckCircle2,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      label: 'Team Members',
      value: metrics.team_members,
      sub: 'Active workspace seats',
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-100',
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#FAFAFB] p-6 md:p-10 pb-16 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <BarChart2 className="w-8 h-8 text-indigo-500" />
              Advanced Analytics
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium">
              Real-time workspace metrics from projects, tasks, and team data.
            </p>
            {lastUpdated && (
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                Updated{' '}
                {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              title="Refresh analytics"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export to CSV'}
            </button>
          </div>
        </div>

        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-semibold">{notification.msg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-3xl font-black text-zinc-900 mt-2">
                    {card.value}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.bg}`}
                >
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900">
              Monthly Activity
            </h3>
          </div>
          <div className="w-full h-[360px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e4e4e7"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="projectsCreated"
                    name="Projects Created"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="tasksCompleted"
                    name="Tasks Completed"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="activeTasks"
                    name="Active Tasks"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-500 font-medium">
                No activity data yet. Create projects and tasks to see trends.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6">
            <h3 className="text-base font-bold text-zinc-900 mb-6">
              Task Status
            </h3>
            <div className="w-full h-[280px]">
              {taskStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {taskStatusData.map((_, index) => (
                        <Cell
                          key={`status-${index}`}
                          fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-zinc-500 font-medium">
                  No synced tasks yet. Kanban boards sync tasks automatically.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6">
            <h3 className="text-base font-bold text-zinc-900 mb-6">
              Tasks by Priority
            </h3>
            <div className="w-full h-[280px]">
              {tasksByPriority.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tasksByPriority}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e4e4e7"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: '#71717a' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="priority"
                      width={90}
                      tick={{ fontSize: 11, fill: '#71717a' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f4f4f5' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]}>
                      {tasksByPriority.map((_, index) => (
                        <Cell
                          key={`priority-${index}`}
                          fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-zinc-500 font-medium">
                  No priority data available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6">
          <h3 className="text-base font-bold text-zinc-900 mb-6">
            Projects by Template
          </h3>
          <div className="w-full h-[280px]">
            {templateChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={templateChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e4e4e7"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#71717a' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Projects"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-500 font-medium">
                No projects created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
