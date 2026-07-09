'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';
import NotificationBell from '@/components/layout/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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
} from 'lucide-react';
import AiChatbot from '@/components/chat/AiChatbot';
import TeamChat from '@/components/chat/TeamChat';

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

  return (
    <>
      <nav className="h-16 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg flex items-center justify-between px-6 shrink-0 z-50 sticky top-0 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200 active:scale-90 active:bg-zinc-200 dark:active:bg-zinc-700 focus:outline-none"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-transform duration-300"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <Link
            href={`/dashboard/${tenantId}`}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity active:scale-95 transform-gpu cursor-pointer"
            title="Go to Dashboard"
          >
            <span className="font-extrabold text-zinc-900 dark:text-white text-sm tracking-tight uppercase">
              Engine
            </span>
          </Link>

          <div className="ml-4 flex items-center h-full">
            {isSaving ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full border border-zinc-200/80 dark:border-zinc-700 shadow-sm animate-in fade-in duration-200">
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">
                  Saving...
                </span>
              </div>
            ) : showSaved ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 backdrop-blur-md rounded-full border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Saved
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center mr-4 select-none cursor-default">
            <span
              className={`uppercase ${
                currentTier === 'pro'
                  ? 'text-base font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400'
                  : currentTier === 'advanced'
                    ? 'text-[15px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400'
                    : 'text-xs font-bold tracking-tight text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {currentTier === 'pro'
                ? 'Pro'
                : currentTier === 'advanced'
                  ? 'Advanced'
                  : ''}
            </span>
          </div>

          <button
            onClick={() => setIsChatOpen(true)}
            className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none"
            title="Team Chat & AI Assistant"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-950"></span>
          </button>

          <ThemeToggle />
          <NotificationBell />

          {showProjectInfo && (
            <button
              onClick={toggleSecondarySidebar}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold bg-zinc-50 dark:bg-zinc-900 border hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all group ${
                isSecondarySidebarOpen
                  ? 'border-zinc-300 dark:border-zinc-600 text-zinc-950 dark:text-white'
                  : 'border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <div className="relative w-3.5 h-3.5 rounded-full border-[2px] border-current flex items-center justify-center shrink-0">
                <div
                  className={`absolute inset-0 flex items-start justify-center transition-all duration-300 ${
                    isSecondarySidebarOpen
                      ? 'animate-[spin_2s_linear_infinite]'
                      : ''
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
              onClick={() =>
                user && !isFetchingRole && setIsDropdownOpen(!isDropdownOpen)
              }
              className={`flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl transition-all focus:outline-none border border-transparent ${
                user && !isFetchingRole
                  ? 'hover:bg-zinc-100/80 dark:hover:bg-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              {!user || isFetchingRole ? (
                <div className="flex items-center gap-2.5 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
                  <div className="hidden sm:flex flex-col items-start justify-center gap-2">
                    <div className="w-24 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                    <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-200 dark:text-zinc-700 ml-1" />
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-sm font-extrabold shadow-sm shrink-0">
                    {initials}
                  </div>

                  <div className="hidden sm:flex flex-col items-start justify-center">
                    <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 leading-none mb-1">
                      {fullName}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none truncate max-w-[120px]">
                      {displayRole}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ml-1 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {isDropdownOpen && user && !isFetchingRole && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-t-2xl mb-2">
                  <p className="text-sm font-extrabold text-zinc-950 dark:text-white truncate">
                    {fullName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 mb-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
                      {displayRole}
                    </span>
                    {user?.department_name && (
                      <span className="px-1.5 py-0.5 bg-zinc-100/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded text-[9px] font-semibold truncate max-w-[100px]">
                        {user.department_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    {user?.email || 'user@company.com'}
                  </p>
                </div>

                <div className="p-2 space-y-0.5">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Account Settings
                  </div>

                  <Link
                    href={`/dashboard/${tenantId}/account/profile`}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors group"
                  >
                    <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
                    Personal Profile
                  </Link>

                  <Link
                    href={`/dashboard/${tenantId}/account/security`}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors group"
                  >
                    <Shield className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
                    Security & Password
                  </Link>
                </div>

                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 rounded-xl transition-colors group"
                  >
                    Sign Out
                    <LogOut className="w-4 h-4 text-red-400 dark:text-red-500/70 group-hover:text-red-600 dark:group-hover:text-red-400" />
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
            onClick={() => setIsChatOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 w-80 sm:w-[26rem] bg-white dark:bg-[#161616] shadow-2xl border-l border-zinc-200 dark:border-zinc-800 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="shrink-0 flex flex-col px-4 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Workspace Chat
                </h2>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex bg-zinc-100 dark:bg-[#222222] p-1 rounded-lg">
                <button
                  onClick={() => setChatTab('team')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all focus:outline-none ${
                    chatTab === 'team'
                      ? 'bg-white dark:bg-[#333333] text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Team
                </button>
                <button
                  onClick={() => setChatTab('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all focus:outline-none ${
                    chatTab === 'ai'
                      ? 'bg-white dark:bg-[#333333] text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative bg-zinc-50/50 dark:bg-[#121212]">
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
