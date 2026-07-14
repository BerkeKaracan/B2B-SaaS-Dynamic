'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Activity,
  Clock,
  Sparkles,
  Archive,
  Trash2,
  FolderPlus,
  Pencil,
  RotateCcw,
  Shield,
} from 'lucide-react';

type ActivityLogRecord = {
  id: string;
  record_data: {
    user: string;
    action: string;
    details: string;
    timestamp: string;
  };
};

function actionMeta(action: string) {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('trash')) {
    return {
      icon: Trash2,
      accent: 'text-rose-600 dark:text-rose-400',
      soft: 'bg-rose-50 dark:bg-rose-500/15 border-rose-100 dark:border-rose-500/25',
      pill: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-500/20',
      dot: 'bg-rose-500',
    };
  }
  if (a.includes('archive')) {
    return {
      icon: Archive,
      accent: 'text-amber-600 dark:text-amber-400',
      soft: 'bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/25',
      pill: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-500/20',
      dot: 'bg-amber-500',
    };
  }
  if (a.includes('restor')) {
    return {
      icon: RotateCcw,
      accent: 'text-emerald-600 dark:text-emerald-400',
      soft: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-100 dark:border-emerald-500/25',
      pill: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20',
      dot: 'bg-emerald-500',
    };
  }
  if (a.includes('creat') || a.includes('new')) {
    return {
      icon: FolderPlus,
      accent: 'text-sky-600 dark:text-sky-400',
      soft: 'bg-sky-50 dark:bg-sky-500/15 border-sky-100 dark:border-sky-500/25',
      pill: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-500/20',
      dot: 'bg-sky-500',
    };
  }
  if (a.includes('updat') || a.includes('edit') || a.includes('chang')) {
    return {
      icon: Pencil,
      accent: 'text-teal-600 dark:text-teal-400',
      soft: 'bg-teal-50 dark:bg-teal-500/15 border-teal-100 dark:border-teal-500/25',
      pill: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-500/20',
      dot: 'bg-teal-500',
    };
  }
  return {
    icon: Shield,
    accent: 'text-zinc-600 dark:text-zinc-300',
    soft: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    pill: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400',
  };
}

function userInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

export default function ActivityLogPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await fetchAPI(
          `/api/records/?tenant_id=${tenantId}&module_name=activity_logs`
        );
        if (res.ok) {
          const data: ActivityLogRecord[] = await res.json();
          const sorted = data.sort(
            (a, b) =>
              new Date(b.record_data.timestamp).getTime() -
              new Date(a.record_data.timestamp).getTime()
          );
          setLogs(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch activity logs', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (tenantId) fetchLogs();
  }, [tenantId]);

  const todayCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return logs.filter(
      (l) => new Date(l.record_data.timestamp).getTime() >= start.getTime()
    ).length;
  }, [logs]);

  return (
    <div className="relative flex-1 overflow-y-auto h-full w-full custom-scrollbar">
      <div className="pointer-events-none absolute inset-0 bg-[#F4F6F8] dark:bg-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(244,63,94,0.08),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.07),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(244,63,94,0.05),_transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(24,24,27,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-4xl mx-auto w-full p-6 md:p-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-500/30 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-2">
                <Sparkles className="w-3 h-3" />
                Workspace pulse
              </div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                Activity Log
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium leading-relaxed max-w-xl">
                Track everything happening in your workspace — creates, edits,
                archives, and more.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
                Total
              </p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                {logs.length}
              </p>
            </div>
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-amber-200/60 dark:border-amber-500/20 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/70 mb-0.5">
                Today
              </p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums leading-none">
                {todayCount}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="relative overflow-hidden bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.08),_transparent_60%)] pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                <Activity className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">
                No recent activity
              </h3>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Actions across projects and settings will show up here as your
                team works.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-y-2 before:left-5 before:w-0.5 before:bg-gradient-to-b before:from-amber-300/40 before:via-rose-200/50 before:to-transparent dark:before:from-amber-500/20 dark:before:via-rose-500/15">
            {logs.map((log) => {
              const meta = actionMeta(log.record_data.action);
              const Icon = meta.icon;
              return (
                <div
                  key={log.id}
                  className="relative flex items-start gap-4 pl-0 group"
                >
                  <div
                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-xl border shadow-sm shrink-0 ${meta.soft}`}
                  >
                    <Icon className={`w-4 h-4 ${meta.accent}`} />
                  </div>

                  <div className="flex-1 min-w-0 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur shadow-sm group-hover:shadow-md group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black flex items-center justify-center shrink-0">
                          {userInitials(log.record_data.user)}
                        </div>
                        <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {log.record_data.user}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium tabular-nums">
                        <Clock className="w-3 h-3" />
                        {new Date(
                          log.record_data.timestamp
                        ).toLocaleDateString()}{' '}
                        {new Date(log.record_data.timestamp).toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.pill}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                      />
                      {log.record_data.action}
                    </span>

                    {log.record_data.details && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 font-medium leading-relaxed">
                        {log.record_data.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
