"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useAuthStore } from "@/store/useAuthStore";

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
    <nav className="h-14 w-full border-b border-zinc-200/60 bg-white flex items-center justify-between px-4 shrink-0 z-50 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-zinc-100 rounded text-zinc-600 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-800 text-sm tracking-tight uppercase">
            Engine
          </span>
        </div>

        <div className="ml-4 flex items-center gap-2 text-[10px] font-medium text-zinc-400">
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Saving...
            </span>
          ) : showSaved ? (
            <span className="flex items-center gap-1.5 transition-opacity duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Saved
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showProjectInfo && (
          <button
            onClick={toggleSecondarySidebar}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span className="hidden sm:inline">PROJECT INFO</span>
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title={fullName}
            className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
          >
            {initials}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200/80 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-800 truncate">
                  {fullName}
                </p>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                  {user?.role || "Employee"}
                </p>
              </div>

              <div className="p-1">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors flex items-center gap-2.5"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
