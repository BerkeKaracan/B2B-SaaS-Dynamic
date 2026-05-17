"use client";
import React, { useState, useEffect } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";

export default function Navbar({
  tenantId,
  onMenuToggle,
  showProjectInfo = false, 
}: {
  tenantId: string;
  onMenuToggle?: () => void;
  showProjectInfo?: boolean;
}) {
  const { toggleSecondarySidebar } = useLayoutStore();
  const { isSaving, showSaved } = useCanvasStore();

  const [initials, setInitials] = useState<string>("--");
  const [fullName, setFullName] = useState<string>("Loading...");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setInitials(data.initials);
          setFullName(data.full_name);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

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
        {/* Only render PROJECT INFO if showProjectInfo is true */}
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

        <button
          title={fullName}
          className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold hover:bg-zinc-800 transition-colors"
        >
          {initials}
        </button>
      </div>
    </nav>
  );
}
