'use client';
import React, { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import {
  Users,
  Building2,
  Briefcase,
  Mail,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  MessageSquareText,
  Shield,
  ShieldCheck,
  Crown,
  Search,
  Loader2,
  UserRound,
} from 'lucide-react';

type TeamMember = {
  id: string;
  email?: string;
  role: string;
  user_id: string;
  tenant_id: string;
  department_id?: string | null;
  custom_role_id?: string | null;
  created_at?: string;
};

type Notification = {
  type: 'error' | 'success';
  msg: string;
};

type Department = { id: string; name: string };
type CustomRole = { id: string; name: string };

const fieldClassName =
  'w-full px-4 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white transition-all dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500 dark:focus:ring-white/10 dark:focus:border-zinc-500 dark:focus:bg-zinc-800';

const selectClassName =
  'w-full appearance-none px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 outline-none transition-colors hover:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600 dark:disabled:bg-zinc-800/50';

export default function TeamManagementPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'team' | 'organization'>('team');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('employee');
  const [memberSearch, setMemberSearch] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [inviteMessage, setInviteMessage] = useState('');

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  const [newDeptName, setNewDeptName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const strictNoCacheHeaders = {
    'x-tenant-id': tenantId,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const authRes = await fetchAPI(
          `/api/auth/me?t=${new Date().getTime()}`,
          {
            headers: strictNoCacheHeaders,
            cache: 'no-store',
          }
        );

        if (!authRes.ok) throw new Error('Not logged in or token expired');

        const authData = await authRes.json();
        const roleStr = authData.role
          ? String(authData.role).toLowerCase().trim()
          : 'employee';
        setCurrentUserRole(roleStr);

        if (roleStr !== 'owner' && roleStr !== 'admin') {
          router.push(`/dashboard/${tenantId}`);
          return;
        }

        const timestamp = new Date().getTime();
        const fetchOptions = {
          headers: strictNoCacheHeaders,
          cache: 'no-store' as RequestCache,
        };

        const [teamRes, deptRes, rolesRes] = await Promise.all([
          fetchAPI(
            `/api/tenants/${tenantId}/team?t=${timestamp}`,
            fetchOptions
          ),
          fetchAPI(
            `/api/tenants/${tenantId}/departments?t=${timestamp}`,
            fetchOptions
          ),
          fetchAPI(
            `/api/tenants/${tenantId}/roles?t=${timestamp}`,
            fetchOptions
          ),
        ]);

        if (teamRes.ok) {
          const rawMembers = await teamRes.json();
          const safeMembers = rawMembers.map((m: TeamMember) => ({
            ...m,
            role: m.role ? String(m.role).toLowerCase().trim() : 'employee',
          }));
          setMembers(safeMembers);
        }

        if (deptRes.ok) setDepartments(await deptRes.json());
        if (rolesRes.ok) setCustomRoles(await rolesRes.json());
      } catch (err: unknown) {
        console.error('Auth Error:', err);
        router.push('/login');
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, router]);

  const showNotification = (type: 'error' | 'success', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsInviting(true);

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/team`, {
        method: 'POST',
        headers: strictNoCacheHeaders,
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
          message: inviteMessage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to invite user.');
      }

      showNotification('success', 'Team member invited successfully!');
      setNewEmail('');
      setNewRole('employee');
      setInviteMessage('');

      const res2 = await fetchAPI(
        `/api/tenants/${tenantId}/team?t=${new Date().getTime()}`,
        {
          headers: strictNoCacheHeaders,
          cache: 'no-store',
        }
      );
      if (res2.ok) {
        const rawMembers = await res2.json();
        const safeMembers = rawMembers.map((m: TeamMember) => ({
          ...m,
          role: m.role ? String(m.role).toLowerCase().trim() : 'employee',
        }));
        setMembers(safeMembers);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      showNotification('error', errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/team/${memberId}`, {
        method: 'DELETE',
        headers: strictNoCacheHeaders,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to remove member.');
      }
      setMembers(members.filter((m) => m.id !== memberId));
      showNotification('success', 'Member removed from the workspace.');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      showNotification('error', errorMessage);
    }
  };

  const handleMemberUpdate = async (
    memberId: string,
    field: 'role' | 'custom_role_id' | 'department_id',
    value: string
  ) => {
    try {
      const payload = { [field]: value === '' ? null : value };
      const res = await fetchAPI(`/api/tenants/${tenantId}/team/${memberId}`, {
        method: 'PATCH',
        headers: strictNoCacheHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to update member.');
      }

      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, [field]: value === '' ? null : value } : m
        )
      );
      showNotification('success', 'Member updated successfully.');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      showNotification('error', errorMessage);
    }
  };

  const handleTransferOwnership = async (
    memberId: string,
    memberEmail: string
  ) => {
    if (
      !window.confirm(
        `WARNING: Are you sure you want to transfer ownership to ${memberEmail}?`
      )
    )
      return;
    try {
      const res = await fetchAPI(
        `/api/tenants/${tenantId}/transfer-ownership`,
        {
          method: 'POST',
          headers: strictNoCacheHeaders,
          body: JSON.stringify({ new_owner_member_id: memberId }),
        }
      );
      if (!res.ok) throw new Error('Failed to transfer ownership.');
      showNotification('success', 'Ownership transferred successfully!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      showNotification('error', 'Error transferring ownership.');
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsCreatingDept(true);

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/departments`, {
        method: 'POST',
        headers: strictNoCacheHeaders,
        body: JSON.stringify({ name: newDeptName }),
      });
      if (!res.ok) throw new Error('Failed to create department');

      const newDept = await res.json();
      setDepartments([...departments, newDept]);
      setNewDeptName('');
      showNotification('success', 'Department created successfully.');
    } catch (error) {
      showNotification('error', 'Error creating department.');
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this department? Members in this department will be unassigned.'
      )
    )
      return;
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/departments/${id}`, {
        method: 'DELETE',
        headers: strictNoCacheHeaders,
      });
      if (!res.ok) throw new Error('Failed to delete department');

      setDepartments(departments.filter((d) => d.id !== id));
      showNotification('success', 'Department removed.');
      setMembers(
        members.map((m) =>
          m.department_id === id ? { ...m, department_id: null } : m
        )
      );
    } catch (error) {
      showNotification('error', 'Error removing department.');
    }
  };

  const handleAddCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setIsCreatingRole(true);

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/roles`, {
        method: 'POST',
        headers: strictNoCacheHeaders,
        body: JSON.stringify({ name: newRoleName }),
      });
      if (!res.ok) throw new Error('Failed to create custom role');

      const newRole = await res.json();
      setCustomRoles([...customRoles, newRole]);
      setNewRoleName('');
      showNotification('success', 'Custom role created successfully.');
    } catch (error) {
      showNotification('error', 'Error creating custom role.');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleDeleteCustomRole = async (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this role? Members with this role will be unassigned.'
      )
    )
      return;
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/roles/${id}`, {
        method: 'DELETE',
        headers: strictNoCacheHeaders,
      });
      if (!res.ok) throw new Error('Failed to delete role');

      setCustomRoles(customRoles.filter((r) => r.id !== id));
      showNotification('success', 'Role removed.');
      setMembers(
        members.map((m) =>
          m.custom_role_id === id ? { ...m, custom_role_id: null } : m
        )
      );
    } catch (error) {
      showNotification('error', 'Error removing role.');
    }
  };

  const getAvatarTone = (email: string) => {
    const tones = [
      'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900',
      'bg-emerald-600 text-white',
      'bg-sky-600 text-white',
      'bg-amber-600 text-white',
      'bg-rose-600 text-white',
      'bg-teal-700 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return tones[Math.abs(hash) % tones.length];
  };

  const roleCounts = useMemo(() => {
    const owners = members.filter((m) => m.role === 'owner').length;
    const admins = members.filter((m) => m.role === 'admin').length;
    const employees = members.filter(
      (m) => m.role !== 'owner' && m.role !== 'admin'
    ).length;
    return { owners, admins, employees, total: members.length };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m.email || '').toLowerCase().includes(q));
  }, [members, memberSearch]);

  const deptMemberCount = (deptId: string) =>
    members.filter((m) => m.department_id === deptId).length;

  const roleMemberCount = (roleId: string) =>
    members.filter((m) => m.custom_role_id === roleId).length;

  if (isCheckingAccess) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#FAFAFB] dark:bg-black min-h-screen">
        <div className="max-w-[1200px] mx-auto w-full p-6 md:p-10 animate-pulse space-y-6">
          <div className="h-16 bg-zinc-200/70 dark:bg-zinc-800 rounded-2xl w-2/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
            <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
            <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
          </div>
          <div className="h-96 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] dark:bg-black min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto w-full p-6 md:p-10 pb-36 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <Users className="w-5 h-5 text-zinc-900 dark:text-white" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Team
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium leading-relaxed max-w-xl">
                  Invite people, manage access, and structure your workspace
                  with departments and roles.
                </p>
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex items-center shadow-inner shrink-0 self-start">
              <button
                onClick={() => setActiveTab('team')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'team'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Directory
              </button>
              <button
                onClick={() => setActiveTab('organization')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'organization'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Organization
              </button>
            </div>
          </div>
        </div>

        {notification && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-semibold">{notification.msg}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard
            label="Total members"
            value={roleCounts.total}
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            label="Owners"
            value={roleCounts.owners}
            icon={<Crown className="w-4 h-4" />}
          />
          <StatCard
            label="Admins"
            value={roleCounts.admins}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
          <StatCard
            label="Members"
            value={roleCounts.employees}
            icon={<UserRound className="w-4 h-4" />}
          />
        </div>

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
            {/* Invite panel */}
            <section className="xl:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden xl:sticky xl:top-8">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-zinc-800/40 dark:to-transparent">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-widest">
                    Invite
                  </h2>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                  Send an invite email with a role and optional note.
                </p>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-0.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-0.5">
                    Message
                    <span className="normal-case tracking-normal font-medium text-zinc-400 ml-1">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <MessageSquareText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                    <textarea
                      rows={3}
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      className={`${fieldClassName} pl-10 resize-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-0.5">
                    System role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className={fieldClassName}
                  >
                    <option value="employee">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Send invite
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Directory */}
            <section className="xl:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-widest">
                      Directory
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                    {filteredMembers.length} of {members.length} people
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by email..."
                    className={`${fieldClassName} pl-9 py-2`}
                  />
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="px-6 py-16 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {memberSearch ? 'No matches found' : 'No members yet'}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-sm font-medium">
                    {memberSearch
                      ? 'Try a different email or clear the search.'
                      : 'Invite your first teammate to start collaborating.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    <div className="col-span-4">Member</div>
                    <div className="col-span-3">System role</div>
                    <div className="col-span-4">Title / Dept</div>
                    <div className="col-span-1 text-right"> </div>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredMembers.map((m) => {
                      const emailStr = m.email || 'Pending invite...';
                      const safeRole = m.role
                        ? String(m.role).toLowerCase().trim()
                        : 'employee';
                      const isOwner = safeRole === 'owner';
                      const isAdmin = safeRole === 'admin';

                      return (
                        <div
                          key={m.id}
                          className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:px-6 lg:py-4 items-center hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group"
                        >
                          <div className="lg:col-span-4 flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-white dark:ring-zinc-900 ${getAvatarTone(emailStr)}`}
                            >
                              {emailStr.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span
                                className="font-bold text-sm text-zinc-900 dark:text-white truncate"
                                title={emailStr}
                              >
                                {emailStr}
                              </span>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                                Joined{' '}
                                {m.created_at
                                  ? new Date(m.created_at).toLocaleDateString()
                                  : 'Recently'}
                              </span>
                            </div>
                          </div>

                          <div className="lg:col-span-3 flex flex-col gap-2 w-full max-w-[180px]">
                            {(isOwner || isAdmin) && (
                              <span
                                className={`w-max inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded-md ${
                                  isOwner
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400'
                                    : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                }`}
                              >
                                {isOwner ? (
                                  <Crown className="w-2.5 h-2.5" />
                                ) : (
                                  <Shield className="w-2.5 h-2.5" />
                                )}
                                {isOwner ? 'Owner' : 'Admin'}
                              </span>
                            )}

                            <select
                              value={safeRole}
                              disabled={isOwner}
                              onChange={(e) =>
                                e.target.value === 'transfer_owner'
                                  ? handleTransferOwnership(m.id, emailStr)
                                  : handleMemberUpdate(
                                      m.id,
                                      'role',
                                      e.target.value
                                    )
                              }
                              className={selectClassName}
                            >
                              <option value="owner" disabled={!isOwner}>
                                Owner
                              </option>
                              {!isOwner && currentUserRole === 'owner' && (
                                <option value="transfer_owner">
                                  Transfer ownership…
                                </option>
                              )}
                              <option value="admin" disabled={isOwner}>
                                Admin
                              </option>
                              <option value="employee" disabled={isOwner}>
                                Member
                              </option>
                            </select>
                          </div>

                          <div className="lg:col-span-4 flex flex-col gap-2">
                            {!isOwner ? (
                              <>
                                <select
                                  value={m.custom_role_id || ''}
                                  onChange={(e) =>
                                    handleMemberUpdate(
                                      m.id,
                                      'custom_role_id',
                                      e.target.value
                                    )
                                  }
                                  className={selectClassName}
                                >
                                  <option value="">Set title…</option>
                                  {customRoles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={m.department_id || ''}
                                  onChange={(e) =>
                                    handleMemberUpdate(
                                      m.id,
                                      'department_id',
                                      e.target.value
                                    )
                                  }
                                  className={selectClassName}
                                >
                                  <option value="">Set department…</option>
                                  {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.name}
                                    </option>
                                  ))}
                                </select>
                              </>
                            ) : (
                              <span className="text-xs text-zinc-400 italic font-medium">
                                Not applicable for owner
                              </span>
                            )}
                          </div>

                          <div className="lg:col-span-1 flex justify-start lg:justify-end">
                            {!isOwner && (
                              <button
                                onClick={() => removeMember(m.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {activeTab === 'organization' && (
          <div className="animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departments */}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-zinc-800/40 dark:to-transparent">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-widest">
                      Departments
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-zinc-400 tabular-nums">
                    {departments.length}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                  Group people by team or function.
                </p>
              </div>

              <div className="p-6">
                <form
                  onSubmit={handleAddDepartment}
                  className="flex gap-2.5 mb-5"
                >
                  <input
                    type="text"
                    required
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className={`${fieldClassName} flex-1`}
                  />
                  <button
                    type="submit"
                    disabled={isCreatingDept}
                    className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shrink-0"
                  >
                    {isCreatingDept ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add
                  </button>
                </form>

                {departments.length === 0 ? (
                  <EmptyOrgState
                    icon={<Building2 className="w-5 h-5" />}
                    title="No departments yet"
                    description="Create departments like Engineering or Sales to organize your team."
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {departments.map((dept) => (
                      <li
                        key={dept.id}
                        className="group flex items-center justify-between gap-3 bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 px-3.5 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {dept.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                            {deptMemberCount(dept.id)} member
                            {deptMemberCount(dept.id) === 1 ? '' : 's'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Custom roles */}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-zinc-800/40 dark:to-transparent">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-widest">
                      Job titles
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-zinc-400 tabular-nums">
                    {customRoles.length}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                  Custom titles you can assign in the directory.
                </p>
              </div>

              <div className="p-6">
                <form
                  onSubmit={handleAddCustomRole}
                  className="flex gap-2.5 mb-5"
                >
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Content Editor"
                    className={`${fieldClassName} flex-1`}
                  />
                  <button
                    type="submit"
                    disabled={isCreatingRole}
                    className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shrink-0"
                  >
                    {isCreatingRole ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add
                  </button>
                </form>

                {customRoles.length === 0 ? (
                  <EmptyOrgState
                    icon={<Briefcase className="w-5 h-5" />}
                    title="No job titles yet"
                    description="Add titles like Designer or Account Manager to assign in the directory."
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {customRoles.map((role) => (
                      <li
                        key={role.id}
                        className="group flex items-center justify-between gap-3 bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 px-3.5 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              {role.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                              {roleMemberCount(role.id)} assigned
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCustomRole(role.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">
          {label}
        </span>
        <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{icon}</span>
      </div>
      <p className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function EmptyOrgState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 px-4 py-10 flex flex-col items-center text-center">
      <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-[240px] font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
}
