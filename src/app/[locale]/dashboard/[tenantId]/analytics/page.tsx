'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchAPI } from '@/services/api';
import {
  Download,
  BarChart2,
  FolderKanban,
  CheckCircle2,
  Users,
  TrendingUp,
  ListTodo,
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const authRes = await fetchAPI('/api/auth/me');
        if (!authRes.ok) throw new Error('Not logged in');
        const authData = await authRes.json();

        if (authData.role !== 'owner' && authData.role !== 'admin') {
          router.push(`/dashboard/${tenantId}/projects`);
          return;
        }

        const res = await fetchAPI(
          `/api/tenants/${tenantId}/analytics?t=${new Date().getTime()}`,
          {
            headers: { 'x-tenant-id': tenantId },
            cache: 'no-store',
          }
        );

        if (res.ok) {
          const analyticsResult: AnalyticsResponse = await res.json();
          setMetrics(analyticsResult.metrics ?? EMPTY_METRICS);
          setChartData(analyticsResult.chartData ?? []);
          setTasksByPriority(analyticsResult.tasksByPriority ?? []);
          setProjectsByTemplate(analyticsResult.projectsByTemplate ?? []);
        }
      } catch (error) {
        console.error('Failed to load analytics', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [tenantId, router]);

  const taskStatusData = [
    { name: 'To Do', value: metrics.tasks_todo },
    { name: 'In Progress', value: metrics.tasks_in_progress },
    { name: 'Done', value: metrics.tasks_done },
  ].filter((item) => item.value > 0);

  const templateChartData = projectsByTemplate.map((item) => ({
    name: TEMPLATE_LABELS[item.template] || item.template,
    count: item.count,
  }));

  const handleExportCSV = () => {
    const rows: string[] = [
      'Workspace Analytics Report',
      `Generated,${new Date().toISOString()}`,
      '',
      'Summary Metrics',
      'Metric,Value',
      `Total Projects,${metrics.total_projects}`,
      `Active Projects,${metrics.active_projects}`,
      `Archived Projects,${metrics.archived_projects}`,
      `Total Tasks,${metrics.total_tasks}`,
      `Tasks To Do,${metrics.tasks_todo}`,
      `Tasks In Progress,${metrics.tasks_in_progress}`,
      `Tasks Done,${metrics.tasks_done}`,
      `Completion Rate,${metrics.completion_rate}%`,
      `Team Members,${metrics.team_members}`,
      '',
      'Monthly Activity',
      'Month,Projects Created,Tasks Completed,Active Tasks',
      ...chartData.map(
        (row) =>
          `${row.month},${row.projectsCreated},${row.tasksCompleted},${row.activeTasks}`
      ),
      '',
      'Tasks by Priority',
      'Priority,Count',
      ...tasksByPriority.map((row) => `${row.priority},${row.count}`),
      '',
      'Projects by Template',
      'Template,Count',
      ...projectsByTemplate.map(
        (row) => `${TEMPLATE_LABELS[row.template] || row.template},${row.count}`
      ),
    ];

    const blob = new Blob([rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `workspace_analytics_${tenantId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="h-full flex justify-center items-center p-10">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
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
          </div>

          <button
            onClick={handleExportCSV}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>

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
