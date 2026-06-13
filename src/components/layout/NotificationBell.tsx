"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { fetchAPI } from "@/services/api";

type Notification = {
  id: string;
  type: "mention" | "system" | "invite" | "update";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
};

type BackendNotification = {
  id: string;
  target_email: string;
  type: "mention" | "system" | "invite" | "update";
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetchAPI("/api/notifications");

        if (!isMounted) return;

        if (res.ok) {
          const data = (await res.json()) as BackendNotification[];
          if (!isMounted) return;

          const mappedData: Notification[] = data.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            createdAt: n.created_at,
            actionUrl: n.action_url,
          }));

          setNotifications(mappedData);
          setUnreadCount(mappedData.filter((n) => !n.isRead).length);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetchAPI(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetchAPI(`/api/notifications/read-all`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 md:p-2.5 rounded-xl transition-all duration-200 ${
          isOpen || unreadCount > 0
            ? "text-zinc-900 bg-zinc-100"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        <Bell size={18} strokeWidth={2.5} className="shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-[70px] sm:top-full left-4 sm:left-auto right-4 sm:-right-2 w-auto sm:w-[380px] bg-white border border-zinc-200/80 shadow-2xl rounded-2xl sm:mt-3 z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 sm:slide-in-from-top-2 duration-200 max-h-[85vh] sm:max-h-[80vh]">
          <div className="flex items-center justify-between px-4 py-3 md:p-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-zinc-950 text-sm">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-zinc-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-950 transition-colors uppercase tracking-widest"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[60vh] sm:max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                  <Bell size={20} className="text-zinc-300" />
                </div>
                <p className="text-sm font-bold text-zinc-900">
                  All caught up!
                </p>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  You don&apos;t have any new notifications.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification.id);
                    }}
                    className={`p-4 flex gap-3 md:gap-4 transition-colors hover:bg-zinc-50 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="shrink-0 mt-1">
                      {notification.type === "mention" ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          @
                        </div>
                      ) : notification.type === "invite" ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          +
                        </div>
                      ) : notification.type === "update" ? (
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                          !
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-xs">
                          <Bell size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs md:text-sm truncate ${
                            !notification.isRead
                              ? "font-extrabold text-zinc-950"
                              : "font-bold text-zinc-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <span className="text-[9px] font-semibold text-zinc-400 whitespace-nowrap shrink-0">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-zinc-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.actionUrl && (
                        <Link
                          href={notification.actionUrl}
                          className="inline-block mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                        >
                          View Details &rarr;
                        </Link>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-100 shrink-0 flex justify-center">
            <button className="text-[10px] md:text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-widest">
              View All History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
