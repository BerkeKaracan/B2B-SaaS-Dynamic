"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useAuthStore } from "@/store/useAuthStore";
import NotificationBell from "@/components/layout/NotificationBell";
import { User, Shield, Settings, LogOut, ChevronDown } from "lucide-react";

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
  const { toggleSecondarySidebar, isSecondarySidebarOpen } = useLayoutStore();
  const { isSaving, showSaved } = useCanvasStore();
  const { user, logout } = useAuthStore();

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
    logout();
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
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-zinc-600 bg-zinc-50 border hover:bg-zinc-100 rounded-xl transition-all group ${
              isSecondarySidebarOpen
                ? "border-zinc-300 text-zinc-950"
                : "border-zinc-200/80 hover:text-zinc-950"
            }`}
          >
            <div className="relative w-3.5 h-3.5 rounded-full border-[2px] border-current flex items-center justify-center shrink-0">
              <div
                className={`absolute inset-0 flex items-start justify-center transition-all duration-300 ${
                  isSecondarySidebarOpen
                    ? "animate-[spin_2s_linear_infinite]"
                    : ""
                }`}
              >
                <div className="w-1 h-1 bg-current rounded-full -mt-[1px]"></div>
              </div>
            </div>

            <span className="hidden sm:inline tracking-wider">
              PROJECT INFO
            </span>
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 hover:bg-zinc-100/80 pl-1.5 pr-2 py-1.5 rounded-xl transition-all focus:outline-none border border-transparent hover:border-zinc-200"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center text-sm font-extrabold shadow-sm shrink-0">
              {initials}
            </div>

            <div className="hidden sm:flex flex-col items-start justify-center">
              <span className="text-[13px] font-bold text-zinc-900 leading-none mb-1">
                {fullName}
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">
                {user?.role || "Employee"}
              </span>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ml-1 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-2xl mb-2">
                <p className="text-sm font-extrabold text-zinc-950 truncate">
                  {fullName}
                </p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {user?.email || "user@company.com"}
                </p>
              </div>

              <div className="p-2 space-y-0.5">
                <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Account Settings
                </div>

                <Link
                  href={`/dashboard/${tenantId}/account/profile`}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors group"
                >
                  <User className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                  Personal Profile
                </Link>

                <Link
                  href={`/dashboard/${tenantId}/account/security`}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors group"
                >
                  <Shield className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                  Security & Password
                </Link>

                <Link
                  href={`/dashboard/${tenantId}/settings`}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors group"
                >
                  <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                  Workspace Settings
                </Link>
              </div>

              <div className="p-2 border-t border-zinc-100 mt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors group"
                >
                  Sign Out
                  <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
