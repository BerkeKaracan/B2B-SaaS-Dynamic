'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { fetchAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type?: string;
  action_url?: string | null;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuthStore();
  const { tenant } = useTenantStore();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || !tenant) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadNotifications = async (showLoader = false) => {
      if (showLoader) setIsLoading(true);
      try {
        const res = await fetchAPI(`/api/notifications?tenant_id=${tenant.id}`);
        if (!res.ok || cancelled) return;
        const data: NotificationItem[] = await res.json();
        if (!cancelled) setNotifications(data);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        if (showLoader && !cancelled) setIsLoading(false);
      }
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      // Soft poll only while the tab is visible — RealtimeNotifier covers push toasts.
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadNotifications(false);
        }
      }, 75_000);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications(false);
        startPolling();
      } else {
        stopPolling();
      }
    };

    loadNotifications(true);
    if (document.visibilityState === 'visible') {
      startPolling();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, tenant]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchAPI(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Mark as read failed:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchAPI(`/api/notifications/read-all`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Mark all as read failed:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          isOpen
            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <Bell className="w-5 h-5" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 dark:bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-zinc-900"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute -right-6 sm:right-0 mt-3 w-[300px] sm:w-[24rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2.5">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold tracking-wide">
                  {unreadCount} New
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="group text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin mb-3 text-indigo-500 dark:text-indigo-400" />
                <span className="text-[11px] font-medium tracking-wide">
                  Loading your updates...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 shadow-inner dark:shadow-none">
                  <Inbox
                    className="w-8 h-8 text-zinc-300 dark:text-zinc-600"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  All caught up!
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  When you have new tasks or updates,
                  <br />
                  they will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`relative p-5 flex gap-4 transition-all duration-200 group ${
                      notif.is_read
                        ? 'bg-white dark:bg-transparent'
                        : 'bg-indigo-50/40 dark:bg-indigo-500/10 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/20'
                    }`}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-r-full"></div>
                    )}

                    <div className="shrink-0 mt-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shadow-sm dark:shadow-none ${
                          notif.is_read
                            ? 'bg-zinc-200 dark:bg-zinc-700'
                            : 'bg-indigo-500 dark:bg-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-500/20'
                        }`}
                      ></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold mb-1 truncate ${
                          notif.is_read
                            ? 'text-zinc-600 dark:text-zinc-400'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p
                        className={`text-xs leading-relaxed line-clamp-2 ${
                          notif.is_read
                            ? 'text-zinc-500 dark:text-zinc-500'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {notif.message}
                      </p>

                      {notif.action_url && (
                        <div className="mt-3">
                          <Link
                            href={notif.action_url}
                            onClick={() => {
                              if (!notif.is_read) handleMarkAsRead(notif.id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View details
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}

                      <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-3 flex items-center gap-1.5">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-200"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
