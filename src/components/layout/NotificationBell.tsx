"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  Trash2,
  Loader2,
  MonitorSmartphone,
  ExternalLink,
} from "lucide-react";
import { fetchAPI } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useTenantStore } from "@/store/useTenantStore";
import { useOSNotification } from "@/hooks/useOSNotification";
import Link from "next/link";

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

  const { permission, requestPermission, sendNotification } =
    useOSNotification();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || !tenant) return;

    let previousUnreadCount = 0;

    const loadNotifications = async (showLoader = false) => {
      if (showLoader) setIsLoading(true);
      try {
        const res = await fetchAPI(`/api/notifications?tenant_id=${tenant.id}`);
        if (res.ok) {
          const data: NotificationItem[] = await res.json();
          setNotifications(data);

          const currentUnread = data.filter((n) => !n.is_read);
          if (
            currentUnread.length > previousUnreadCount &&
            previousUnreadCount !== 0
          ) {
            const newest = currentUnread[0];
            sendNotification(newest.title, {
              body: newest.message,
            });
          }
          previousUnreadCount = currentUnread.length;
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        if (showLoader) setIsLoading(false);
      }
    };

    loadNotifications(true);

    const intervalId = setInterval(() => {
      loadNotifications(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, tenant, sendNotification]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchAPI(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error("Mark as read failed:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchAPI(`/api/notifications/read-all`, {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Mark all as read failed:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-4 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-zinc-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {permission === "default" && (
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-start gap-3">
              <MonitorSmartphone className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-indigo-900">
                  Enable Desktop Notifications
                </p>
                <p className="text-[10px] font-medium text-indigo-700/80 mt-0.5 leading-relaxed">
                  Get notified of new tasks and updates even when the app is in
                  the background.
                </p>
                <button
                  onClick={requestPermission}
                  className="mt-2 text-[10px] font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Enable Now
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Loading...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-zinc-300" />
                </div>
                <p className="text-sm font-bold text-zinc-900">
                  All caught up!
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  You have no new notifications.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-50">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`p-4 flex gap-3 transition-colors ${
                      notif.is_read
                        ? "bg-white opacity-60"
                        : "bg-zinc-50/50 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="shrink-0 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          notif.is_read
                            ? "bg-zinc-200"
                            : "bg-indigo-500 ring-4 ring-indigo-50"
                        }`}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${notif.is_read ? "text-zinc-600" : "text-zinc-900"}`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-[11px] font-medium text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.action_url && (
                        <div className="mt-2.5">
                          <Link
                            href={notif.action_url}
                            onClick={() => {
                              if (!notif.is_read) handleMarkAsRead(notif.id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Action
                          </Link>
                        </div>
                      )}

                      <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-wider">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
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
