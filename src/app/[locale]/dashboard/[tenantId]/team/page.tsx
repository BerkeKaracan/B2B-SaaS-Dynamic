'use client';
import React, { useState, useEffect, use } from 'react';
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

  const getAvatarGradient = (email: string) => {
    const colors = [
      'from-blue-500 to-indigo-500',
      'from-emerald-400 to-teal-500',
      'from-orange-400 to-rose-500',
      'from-purple-500 to-pink-500',
    ];
    const index = email.length % colors.length;
    return colors[index];
  };

  if (isCheckingAccess) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4 mb-8"></div>
        <div className="flex gap-4 mb-8 border-b border-zinc-200 pb-4">
          <div className="h-6 bg-zinc-200 rounded w-24"></div>
          <div className="h-6 bg-zinc-200 rounded w-24"></div>
        </div>
        <div className="h-96 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] min-h-screen font-sans">
      <div className="max-w-[1400px] mx-auto w-full p-6 md:p-10 pb-32">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Team Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-medium">
            Manage your workspace members, assign roles, and structure your
            departments.
          </p>
        </div>

        <div className="flex items-center gap-6 border-b border-zinc-200/80 mb-8 overflow-x-auto select-none">
          <TabButton
            active={activeTab === 'team'}
            onClick={() => setActiveTab('team')}
            icon={<Users className="w-4 h-4" />}
            label="Directory"
          />
          <TabButton
            active={activeTab === 'organization'}
            onClick={() => setActiveTab('organization')}
            icon={<Building2 className="w-4 h-4" />}
            label="Organization"
          />
        </div>

        {notification && (
          <div
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="text-sm font-semibold">{notification.msg}</p>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            <div className="xl:col-span-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden sticky top-8">
              <div className="p-6 border-b border-zinc-100/80 bg-zinc-50/50">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-zinc-400" /> Invite Members
                </h3>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                    Message (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquareText className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                    <textarea
                      rows={3}
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900 outline-none resize-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                    System Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-zinc-900 outline-none font-medium"
                  >
                    <option value="employee">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </form>
            </div>

            <div className="xl:col-span-8 bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100/80">
                <h3 className="text-base font-bold text-zinc-900">
                  Workspace Directory
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Manage access and roles for your team members.
                </p>
              </div>

              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <div className="col-span-4">Member</div>
                <div className="col-span-3">System Role</div>
                <div className="col-span-4">Job Title / Dept</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y divide-zinc-100">
                <div className="divide-y divide-zinc-100">
                  {members.map((m) => {
                    const emailStr = m.email || 'Pending Invite...';

                    const safeRole = m.role
                      ? String(m.role).toLowerCase().trim()
                      : 'employee';
                    const isOwner = safeRole === 'owner';

                    return (
                      <div
                        key={m.id}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:px-6 lg:py-4 items-center hover:bg-zinc-50/50 transition-colors group"
                      >
                        <div className="col-span-1 lg:col-span-4 flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${getAvatarGradient(emailStr)} shadow-sm shrink-0 ring-2 ring-white`}
                          >
                            {emailStr.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-bold text-sm text-zinc-900 truncate"
                              title={emailStr}
                            >
                              {emailStr}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium truncate">
                              Joined{' '}
                              {m.created_at
                                ? new Date(m.created_at).toLocaleDateString()
                                : 'Recently'}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-1 lg:col-span-3 flex items-center">
                          <div className="flex flex-col w-full max-w-[140px]">
                            {isOwner || safeRole === 'admin' ? (
                              <div className="mb-1 w-max px-1.5 py-0.5 bg-zinc-900 text-white text-[9px] uppercase font-black rounded flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                {isOwner ? 'Owner' : 'Admin'}
                              </div>
                            ) : null}

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
                              className="appearance-none px-2.5 py-1.5 text-xs font-semibold rounded-md border border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 outline-none w-full transition-colors disabled:bg-zinc-50 disabled:text-zinc-400"
                            >
                              <option value="owner" disabled={!isOwner}>
                                Owner
                              </option>

                              {!isOwner && currentUserRole === 'owner' && (
                                <option value="transfer_owner">
                                  Transfer Ownership
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
                        </div>

                        <div className="col-span-1 lg:col-span-4 flex flex-col gap-2">
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
                                className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-transparent hover:border-zinc-200 bg-transparent hover:bg-white text-zinc-600 focus:bg-white focus:border-zinc-300 outline-none transition-all w-full max-w-[180px]"
                              >
                                <option value="">-- Set Title --</option>
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
                                className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-transparent hover:border-zinc-200 bg-transparent hover:bg-white text-zinc-600 focus:bg-white focus:border-zinc-300 outline-none transition-all w-full max-w-[180px]"
                              >
                                <option value="">-- Set Department --</option>
                                {departments.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">
                              Not applicable for owner
                            </span>
                          )}
                        </div>

                        <div className="col-span-1 lg:col-span-1 flex justify-end lg:justify-center">
                          {!isOwner && (
                            <button
                              onClick={() => removeMember(m.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organization' && (
          <div className="animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100/80 bg-zinc-50/50">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" /> Departments
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Create departments to organize your workspace.
                </p>
              </div>
              <div className="p-6">
                <form
                  onSubmit={handleAddDepartment}
                  className="flex gap-3 mb-6"
                >
                  <input
                    type="text"
                    required
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingDept}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 disabled:opacity-50 hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </form>
                <div className="flex flex-col gap-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="group flex items-center justify-between bg-zinc-50 border border-zinc-200/60 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-white hover:border-zinc-300 transition-colors"
                    >
                      {dept.name}
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100/80 bg-zinc-50/50">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" /> Custom
                  Roles
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Create custom job titles to assign to your team.
                </p>
              </div>
              <div className="p-6">
                <form
                  onSubmit={handleAddCustomRole}
                  className="flex gap-3 mb-6"
                >
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Content Editor"
                    className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingRole}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Role
                  </button>
                </form>
                <div className="flex flex-col gap-2">
                  {customRoles.map((role) => (
                    <div
                      key={role.id}
                      className="group flex items-center justify-between bg-zinc-50 border border-zinc-200/60 px-3 py-2.5 rounded-lg hover:bg-white hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-bold text-zinc-800">
                          {role.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCustomRole(role.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
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
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-bold transition-all ${active ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'}`}
    >
      {icon} {label}
    </button>
  );
}
