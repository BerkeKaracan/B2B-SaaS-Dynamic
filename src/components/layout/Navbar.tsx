"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useAuthStore } from "@/store/useAuthStore";
import NotificationBell from "@/components/layout/NotificationBell";

export default function Navbar({
  tenantId,
  onMenuToggle,
  showProjectInfo = false,
}: {
  tenantId: string;
  onMenuToggle?: () => void;
  showProjectInfo?: boolean;
}) {
  const router = useRouter();
  const { toggleSecondarySidebar } = useLayoutStore();
  const { isSaving, showSaved } = useCanvasStore();
  const { user } = useAuthStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user?.initials || "--";
  const fullName = user?.full_name || "Loading...";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenant_id");
    router.push("/");
  };

  return (
    <nav className="h-16 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg flex items-center justify-between px-6 shrink-0 z-50 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-zinc-900 text-sm tracking-tight uppercase">
            Engine
          </span>
        </div>

        <div className="ml-4 flex items-center h-full">
          {isSaving ? (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-50 rounded-md border border-zinc-100">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Saving
              </span>
            </div>
          ) : showSaved ? (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 rounded-md border border-emerald-100 transition-opacity duration-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Saved
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        {showProjectInfo && (
          <button
            onClick={toggleSecondarySidebar}
            className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-zinc-600 bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-950 rounded-xl transition-all"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span className="hidden sm:inline tracking-wider">
              PROJECT INFO
            </span>
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title={fullName}
            className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center text-sm font-extrabold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg focus:outline-none ring-2 ring-transparent focus:ring-zinc-200"
          >
            {initials}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-zinc-200/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 rounded-t-2xl">
                <p className="text-sm font-extrabold text-zinc-950 truncate">
                  {fullName}
                </p>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  {user?.role || "Employee"}
                </p>
              </div>

              <div className="p-2 space-y-1">
                <button className="w-full text-left px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 rounded-xl transition-colors flex items-center gap-3">
                  ⚙️ Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors flex items-center gap-3"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
