'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/loading';
import { Activity, Clock } from 'lucide-react';

type ActivityLogRecord = {
  id: string;
  record_data: {
    user: string;
    action: string;
    details: string;
    timestamp: string;
  };
};

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
          // Tarihe göre en yeni en üstte olacak şekilde sırala
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

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
          <Activity className="w-7 h-7 text-indigo-500" />
          Activity Log
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Track everything happening in your workspace.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
          {logs.map((log) => (
            <div
              key={log.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#1E1E20] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <Activity className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    {log.record_data.user}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
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
                <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {log.record_data.action}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {log.record_data.details}
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center text-zinc-500 py-10">
              No recent activity.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
