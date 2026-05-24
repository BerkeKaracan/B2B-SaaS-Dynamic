"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  Check,
  Users,
  ShieldAlert,
  CreditCard,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { fetchAPI } from "@/services/api";

type AppNotification = {
  id: string;
  type: "project_invite" | "role_update" | "billing" | "system";
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetchAPI("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await fetchAPI(`/api/notifications/${id}/read`, { method: "PATCH" });
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetchAPI(`/api/notifications/read-all`, { method: "PATCH" });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "project_invite":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "role_update":
        return <ShieldAlert className="w-4 h-4 text-purple-500" />;
      case "billing":
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-sm font-black text-zinc-950">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Bell className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="text-sm font-medium text-zinc-500">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-4 hover:bg-zinc-50 transition-colors cursor-pointer flex gap-4 ${!notif.is_read ? "bg-blue-50/30" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.is_read ? "bg-white shadow-sm border border-zinc-100" : "bg-zinc-100"}`}
                  >
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`text-xs mb-0.5 ${!notif.is_read ? "font-black text-zinc-950" : "font-semibold text-zinc-700"}`}
                    >
                      {notif.title}
                    </h4>
                    <p className="text-[11px] font-medium text-zinc-500 leading-relaxed mb-2">
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-block text-[10px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        View Details &rarr;
                      </Link>
                    )}
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
