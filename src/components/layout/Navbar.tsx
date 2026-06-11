"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  User,
  LogOut,
  Settings,
  Shield,
  ChevronDown,
  Menu,
} from "lucide-react";

interface NavbarProps {
  tenantId?: string;
  onMenuToggle?: () => void;
  showProjectInfo?: boolean;
}

export default function Navbar({
  tenantId: propTenantId,
  onMenuToggle,
  showProjectInfo,
}: NavbarProps) {
  const params = useParams();
  const tenantId = propTenantId || (params.tenantId as string);

  const { user, logout, fetchUser } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 border-b border-zinc-200/80 bg-white flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 -ml-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold font-mono">B2</span>
        </div>
        <span className="font-bold text-sm tracking-tight text-zinc-900">
          SaaS Engine
        </span>
        <span className="text-xs font-medium px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full hidden sm:inline-block">
          Beta
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 hover:bg-zinc-50 pl-1.5 pr-2 py-1.5 rounded-xl transition-all focus:outline-none border border-transparent hover:border-zinc-200/60"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-blue-700 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                {user.initials || getInitials(user.full_name)}
              </div>

              <div className="hidden sm:flex flex-col items-start justify-center">
                <span className="text-[13px] font-bold text-zinc-900 leading-none mb-1">
                  {user.full_name || "User"}
                </span>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">
                  {user.role || "Account"}
                </span>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ml-1 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                {/* Header Profile Section */}
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-blue-700 text-white flex items-center justify-center text-sm font-bold shadow-inner shrink-0">
                      {user.initials || getInitials(user.full_name)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-extrabold text-zinc-900 truncate">
                        {user.full_name || "User"}
                      </span>
                      <span className="text-xs text-zinc-500 truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="p-2 space-y-0.5">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Account Settings
                  </div>

                  <Link
                    href={`/dashboard/${tenantId}/account/profile`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors group"
                  >
                    <User className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                    Personal Profile
                  </Link>

                  <Link
                    href={`/dashboard/${tenantId}/account/security`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors group"
                  >
                    <Shield className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                    Security & Password
                  </Link>

                  <Link
                    href={`/dashboard/${tenantId}/settings`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors group"
                  >
                    <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                    Workspace Settings
                  </Link>
                </div>

                {/* Footer Action */}
                <div className="p-2 border-t border-zinc-100 bg-zinc-50/50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                  >
                    Sign Out
                    <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
