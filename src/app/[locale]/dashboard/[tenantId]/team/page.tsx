'use client';
import React, { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/services/api';
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
  'w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-500';

const selectClassName =
  'w-full appearance-none px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 outline-none transition-colors hover:border-zinc-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 disabled:bg-zinc-50 disabled:text-zinc-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600 dark:disabled:bg-zinc-800/50';

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
        const authRes = await fetchAPI(
          `/api/auth/me?t=${new Date().getTime()}`,
          {
            headers: strictNoCacheHeaders,
            cache: 'no-store',
          }
        );

        if (authRes.status === 401) {
          router.push('/login');
          return;
        }

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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      showNotification('error', 'Error removing role.');
    }
  };

  const getAvatarTone = (email: string) => {
    const tones = [
      'from-zinc-700 to-zinc-900 text-white',
      'from-emerald-500 to-emerald-700 text-white',
      'from-sky-500 to-sky-700 text-white',
      'from-amber-500 to-amber-700 text-white',
      'from-rose-500 to-rose-700 text-white',
      'from-teal-500 to-teal-700 text-white',
      'from-indigo-500 to-indigo-700 text-white',
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
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black min-h-screen">
        <div className="max-w-[1280px] mx-auto w-full px-6 md:px-10 py-10 animate-pulse space-y-8">
          <div className="h-12 bg-zinc-200/70 dark:bg-zinc-800 rounded-2xl w-1/3" />
          <div className="h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl" />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 h-[28rem] bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl" />
            <div className="h-96 bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black min-h-screen font-sans transition-colors duration-300">
      {/* Page header band */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-[1280px] mx-auto w-full px-6 md:px-10 pt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">
            Workspace · People
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                Team
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium max-w-xl leading-relaxed">
                Invite people, manage access, and structure your workspace with
                departments and roles.
              </p>
            </div>

            {/* Inline stat strip */}
            <div className="flex items-stretch divide-x divide-zinc-200 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 overflow-hidden self-start md:self-auto">
              <StatSegment
                label="Members"
                value={roleCounts.total}
                icon={<Users className="w-3.5 h-3.5" />}
              />
              <StatSegment
                label="Owners"
                value={roleCounts.owners}
                icon={<Crown className="w-3.5 h-3.5 text-amber-500" />}
              />
              <StatSegment
                label="Admins"
                value={roleCounts.admins}
                icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />}
              />
              <StatSegment
                label="Staff"
                value={roleCounts.employees}
                icon={<UserRound className="w-3.5 h-3.5 text-emerald-500" />}
              />
            </div>
          </div>

          {/* Underline tabs */}
          <nav className="flex items-center gap-6 mt-6 -mb-px">
            <TabButton
              active={activeTab === 'team'}
              onClick={() => setActiveTab('team')}
              icon={<Users className="w-4 h-4" />}
              label="Directory"
              count={members.length}
            />
            <TabButton
              active={activeTab === 'organization'}
              onClick={() => setActiveTab('organization')}
              icon={<Building2 className="w-4 h-4" />}
              label="Organization"
              count={departments.length + customRoles.length}
            />
          </nav>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-10 py-8 pb-36 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {notification && (
          <div
            className={`mb-6 px-4 py-3.5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 border-red-200/70 dark:border-red-900/20 text-red-800 dark:text-red-400'
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

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start animate-in fade-in duration-300">
            {/* Directory — main column */}
            <section className="xl:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    People
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                    {filteredMembers.length} of {members.length} shown
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by email..."
                    className={`${fieldClassName} pl-10 py-2 rounded-full bg-zinc-50 dark:bg-zinc-900`}
                  />
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="px-6 py-20 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 rotate-3">
                    <Users className="w-7 h-7 text-zinc-400" />
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
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {filteredMembers.map((m) => {
                    const emailStr = m.email || 'Pending invite...';
                    const safeRole = m.role
                      ? String(m.role).toLowerCase().trim()
                      : 'employee';
                    const isOwner = safeRole === 'owner';
                    const isAdmin = safeRole === 'admin';

                    return (
                      <li
                        key={m.id}
                        className="group px-5 md:px-6 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Identity */}
                          <div className="flex items-center gap-3.5 min-w-0 md:w-[280px] shrink-0">
                            <div
                              className={`w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${getAvatarTone(emailStr)}`}
                            >
                              {emailStr.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="font-bold text-sm text-zinc-900 dark:text-white truncate"
                                  title={emailStr}
                                >
                                  {emailStr}
                                </span>
                              </span>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 flex items-center gap-1.5">
                                {(isOwner || isAdmin) && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-px text-[9px] uppercase font-black tracking-wider rounded ${
                                      isOwner
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400'
                                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400'
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
                                Joined{' '}
                                {m.created_at
                                  ? new Date(m.created_at).toLocaleDateString()
                                  : 'Recently'}
                              </span>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
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
                              title="System role"
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
                                  title="Job title"
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
                                  title="Department"
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
                              <span className="sm:col-span-2 self-center text-xs text-zinc-400 italic font-medium px-1">
                                Title & department not applicable for owner
                              </span>
                            )}
                          </div>

                          {/* Remove */}
                          <div className="flex md:justify-end shrink-0">
                            {!isOwner && (
                              <button
                                onClick={() => removeMember(m.id)}
                                className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-xl transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Invite — side panel */}
            <aside className="xl:sticky xl:top-8">
              <div className="rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                <div className="bg-zinc-950 dark:bg-zinc-900 px-6 py-6 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl" />
                  <div className="absolute -left-6 -bottom-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-4">
                      <UserPlus className="w-4.5 h-4.5 text-white" />
                    </div>
                    <h2 className="text-lg font-extrabold text-white tracking-tight">
                      Invite a teammate
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1 font-medium leading-relaxed">
                      Send an invite email with a role and optional note.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleInvite}
                  className="p-6 space-y-4 bg-white dark:bg-zinc-950"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
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
                    <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
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
                    <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      System role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <RolePickButton
                        active={newRole === 'employee'}
                        onClick={() => setNewRole('employee')}
                        icon={<UserRound className="w-3.5 h-3.5" />}
                        label="Member"
                      />
                      <RolePickButton
                        active={newRole === 'admin'}
                        onClick={() => setNewRole('admin')}
                        icon={<Shield className="w-3.5 h-3.5" />}
                        label="Admin"
                      />
                    </div>
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
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'organization' && (
          <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Departments */}
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      Departments
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                      Group people by team or function.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                  {departments.length}
                </span>
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
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {departments.map((dept) => (
                      <li
                        key={dept.id}
                        className="group relative flex items-center justify-between gap-2 border border-zinc-200/70 dark:border-zinc-800 px-4 py-3.5 rounded-2xl hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sm transition-all bg-zinc-50/50 dark:bg-zinc-900/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {dept.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                            {deptMemberCount(dept.id)} member
                            {deptMemberCount(dept.id) === 1 ? '' : 's'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
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
            <section className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      Job titles
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                      Custom titles you can assign in the directory.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                  {customRoles.length}
                </span>
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
                  <ul className="flex flex-wrap gap-2">
                    {customRoles.map((role) => (
                      <li
                        key={role.id}
                        className="group inline-flex items-center gap-2.5 border border-zinc-200/70 dark:border-zinc-800 pl-4 pr-2 py-2 rounded-full hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all bg-zinc-50/50 dark:bg-zinc-900/40"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {role.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold tabular-nums">
                          {roleMemberCount(role.id)}
                        </span>
                        <button
                          onClick={() => handleDeleteCustomRole(role.id)}
                          className="p-1 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                          title="Delete role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

function StatSegment({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="px-4 md:px-5 py-2.5 flex flex-col justify-center min-w-[76px]">
      <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </span>
      <span className="text-xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight mt-0.5">
        {value}
      </span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 pb-3.5 text-sm font-bold transition-colors ${
        active
          ? 'text-zinc-900 dark:text-white'
          : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
      <span
        className={`px-1.5 py-px rounded-md text-[10px] font-black tabular-nums ${
          active
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
        }`}
      >
        {count}
      </span>
      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-900 dark:bg-white rounded-full" />
      )}
    </button>
  );
}

function RolePickButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
        active
          ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm'
          : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-200'
      }`}
    >
      {icon}
      {label}
    </button>
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
    <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 px-4 py-12 flex flex-col items-center text-center">
      <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3 -rotate-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-[240px] font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
}
