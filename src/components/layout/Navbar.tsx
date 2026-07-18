'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';
import NotificationBell from '@/components/layout/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandMark } from '@/components/brand/BrandLogo';
import {
  User,
  Shield,
  LogOut,
  ChevronDown,
  MessageSquare,
  X,
  Users,
  Sparkles,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  MessageSquareHeart,
  ExternalLink,
  Menu,
} from 'lucide-react';
import AiChatbot from '@/components/chat/AiChatbot';
import TeamChat from '@/components/chat/TeamChat';
import { FEEDBACK_PORTAL_URL } from '@/lib/feedbackPortal';

export default function Navbar({
  tenantId,
  onMenuToggle,
  showProjectInfo = false,
}: {
  tenantId: string;
  onMenuToggle?: () => void;
  showProjectInfo?: boolean;
}) {
  const { toggleSecondarySidebar, isSecondarySidebarOpen } = useLayoutStore();
  const { isSaving, showSaved } = useCanvasStore();

  const { user, logout, fetchUser } = useAuthStore();
  const { tenant, fetchTenant } = useTenantStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFetchingRole, setIsFetchingRole] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<'team' | 'ai'>('team');

  const initials = user?.initials || '--';
  const fullName = user?.full_name || 'Loading...';

  const displayRole =
    user?.role === 'owner'
      ? 'Owner'
      : user?.custom_role_name || user?.role || 'Employee';

  useEffect(() => {
    let isMounted = true;

    const loadTenantData = async () => {
      if (tenantId) {
        setIsFetchingRole(true);
        await Promise.all([fetchTenant(tenantId), fetchUser(tenantId)]);
        if (isMounted) setIsFetchingRole(false);
      }
    };

    loadTenantData();

    return () => {
      isMounted = false;
    };
  }, [tenantId, fetchUser, fetchTenant]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
  };

  const currentTier = tenant?.tier || 'basic';
  const workspaceLabel = tenant?.name || 'Workspace';

  return (
    <>
      <nav className="h-14 w-full shrink-0 sticky top-0 z-50 flex items-center justify-between gap-3 px-3 sm:px-5 border-b border-zinc-200/70 dark:border-zinc-800/80 bg-[#f7f9fb]/90 dark:bg-zinc-950/90 backdrop-blur-xl transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors active:scale-95"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-[18px] h-[18px]" strokeWidth={2.25} />
          </button>

          <Link
            href={`/dashboard/${tenantId}/projects`}
            className="flex items-center gap-2.5 min-w-0 group"
            title="Projects"
          >
            <BrandMark size="sm" />
            <span className="hidden sm:block text-sm font-black tracking-tight text-zinc-950 dark:text-white">
              SaaS Engine
            </span>
            <span className="hidden md:flex flex-col min-w-0 leading-none border-l border-zinc-200 dark:border-zinc-800 pl-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Workspace
              </span>
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[160px] group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                {workspaceLabel}
              </span>
            </span>
          </Link>

          {(isSaving || showSaved) && (
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.14em] border animate-in fade-in duration-200 ${
                isSaving
                  ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {currentTier === 'pro' || currentTier === 'advanced' ? (
            <span className="hidden lg:inline-flex items-center px-2 py-1 mr-1 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] border border-sky-200/80 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300">
              {currentTier === 'pro' ? 'Pro' : 'Advanced'}
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            title="Team Chat & AI Assistant"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-500 ring-2 ring-[#f7f9fb] dark:ring-zinc-950" />
          </button>

          <ThemeToggle />
          <NotificationBell />

          {showProjectInfo && (
            <button
              type="button"
              onClick={toggleSecondarySidebar}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all active:scale-95 ${
                isSecondarySidebarOpen
                  ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-950'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="tracking-wide">Info</span>
            </button>
          )}

          <div className="relative ml-0.5" ref={dropdownRef}>
            <button
              type="button"
              onClick={() =>
                user && !isFetchingRole && setIsDropdownOpen(!isDropdownOpen)
              }
              className={`flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-xl border transition-all ${
                user && !isFetchingRole
                  ? 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-white/80 dark:hover:bg-zinc-900 cursor-pointer'
                  : 'border-transparent cursor-default'
              }`}
            >
              {!user || isFetchingRole ? (
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                  <div className="hidden sm:block w-20 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              ) : (
                <>
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover border border-zinc-200/80 dark:border-zinc-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-bold tracking-tight">
                      {initials}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col items-start min-w-0">
                    <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 leading-none truncate max-w-[110px]">
                      {fullName}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.12em] mt-1 truncate max-w-[110px]">
                      {displayRole}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {isDropdownOpen && user && !isFetchingRole && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                  <p className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                    {fullName}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {user?.email || 'user@company.com'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] uppercase font-semibold tracking-[0.12em] text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 px-1.5 py-0.5 rounded">
                      {displayRole}
                    </span>
                    {user?.department_name && (
                      <span className="text-[10px] font-medium text-zinc-500 truncate max-w-[100px]">
                        {user.department_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-1.5 py-1 space-y-0.5">
                  <Link
                    href={`/dashboard/${tenantId}/account/profile`}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    Personal Profile
                  </Link>
                  <Link
                    href={`/dashboard/${tenantId}/account/security`}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Shield className="w-4 h-4 text-zinc-400" />
                    Security & Password
                  </Link>
                  <a
                    href={FEEDBACK_PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center justify-between gap-2.5 px-2.5 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquareHeart className="w-4 h-4 text-zinc-400" />
                      Feedback & Support
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                  </a>
                </div>

                <div className="px-1.5 pt-1 mt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-[13px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Sign Out
                    <LogOut className="w-4 h-4 opacity-70" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {isChatOpen && (
        <>
          <div
            className="fixed inset-0 bg-zinc-950/25 backdrop-blur-[2px] z-[90]"
            onClick={() => setIsChatOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 w-80 sm:w-[26rem] bg-white dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="shrink-0 flex flex-col px-4 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400 mb-1">
                    Live
                  </p>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Workspace Chat
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setChatTab('team')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    chatTab === 'team'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Team
                </button>
                <button
                  type="button"
                  onClick={() => setChatTab('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    chatTab === 'ai'
                      ? 'bg-white dark:bg-zinc-800 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative bg-[#f7f9fb] dark:bg-zinc-950">
              {chatTab === 'team' ? (
                <TeamChat tenantId={tenantId} />
              ) : (
                <AiChatbot />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
