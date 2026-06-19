"use client";
import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/services/api";
import Cookies from "js-cookie";
import {
  Users,
  CreditCard,
  Settings,
  ShieldAlert,
  Mail,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Building2,
  Briefcase,
  Plus,
  Trash2,
} from "lucide-react";

import { useTenantStore } from "@/store/useTenantStore";

// 1. TeamMember tipini yeni alanları destekleyecek şekilde güncelledik
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
  type: "error" | "success";
  msg: string;
};

type Department = { id: string; name: string };
type CustomRole = { id: string; name: string };

export default function TeamBillingPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();

  const { updateTenantState } = useTenantStore();

  const [activeTab, setActiveTab] = useState<
    "team" | "organization" | "billing" | "advanced"
  >("team");
  const [tier, setTier] = useState<string>("Basic Plan");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [usageType, setUsageType] = useState<string>("team");

  const [currentUserRole, setCurrentUserRole] = useState<string>("employee");
  const [projectsCount, setProjectsCount] = useState<number>(0);

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [timezone, setTimezone] = useState<string>("UTC");
  const [dateFormat, setDateFormat] = useState<string>("YYYY-MM-DD");

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("employee");

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isSavingName, setIsSavingName] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  const [newDeptName, setNewDeptName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const hash = window.location.hash;
        if (hash && hash.includes("access_token=")) {
          const params = new URLSearchParams(hash.replace("#", "?"));
          const accessToken = params.get("access_token");

          if (accessToken) {
            Cookies.set("token", accessToken);
            localStorage.setItem("token", accessToken);
            window.history.replaceState(null, "", window.location.pathname);
          }
        }

        const token = Cookies.get("token") || localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const authRes = await fetchAPI("/api/auth/me");
        if (!authRes.ok) throw new Error("Not logged in or token expired");

        const authData = await authRes.json();
        const roleStr = authData.role || "employee";
        setCurrentUserRole(roleStr);

        if (roleStr !== "owner" && roleStr !== "admin") {
          router.push(`/dashboard/${tenantId}`);
          return;
        }

        const [tenantRes, teamRes, projRes, deptRes, rolesRes] =
          await Promise.all([
            fetchAPI(`/api/tenants/${tenantId}`),
            fetchAPI(`/api/tenants/${tenantId}/team`),
            fetchAPI(`/api/records?tenant_id=${tenantId}`),
            fetchAPI(`/api/tenants/${tenantId}/departments`),
            fetchAPI(`/api/tenants/${tenantId}/roles`),
          ]);

        if (deptRes.ok) setDepartments(await deptRes.json());
        if (rolesRes.ok) setCustomRoles(await rolesRes.json());

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setWorkspaceName(tenantData.name || "");
          const currentUsageType = tenantData.usage_type || "team";
          setUsageType(currentUsageType);

          if (currentUsageType === "team") setActiveTab("team");
          else setActiveTab("advanced");

          if (tenantData.logo_url) setLogoUrl(tenantData.logo_url);
          if (tenantData.timezone) setTimezone(tenantData.timezone);
          if (tenantData.date_format) setDateFormat(tenantData.date_format);

          if (tenantData.tier === "pro") setTier("Pro Plan");
          else if (tenantData.tier === "advanced") setTier("Advanced Plan");
          else setTier("Free Plan");
        }

        if (teamRes.ok) {
          const membersData = await teamRes.json();
          setMembers(membersData);
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          if (Array.isArray(projData)) {
            const actualItems = projData.filter(
              (item: { module_name?: string }) =>
                item.module_name !== "workspace_modules",
            );
            setProjectsCount(actualItems.length);
          } else {
            setProjectsCount(0);
          }
        }
      } catch (err: unknown) {
        console.error("Auth Error:", err);
        router.push("/login");
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [tenantId, router, API_BASE_URL]);

  const showNotification = (type: "error" | "success", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = Cookies.get("token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload logo.");
      const data = await res.json();
      setLogoUrl(data.logo_url);
      updateTenantState({ logo_url: data.logo_url });
      showNotification("success", "Workspace logo updated!");
    } catch (err) {
      showNotification("error", "Error uploading logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setIsSavingName(true);

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: workspaceName,
          timezone: timezone,
          date_format: dateFormat,
        }),
      });

      if (!res.ok) throw new Error("Failed to update workspace settings.");
      showNotification("success", "Settings saved successfully!");

      updateTenantState({
        name: workspaceName,
        timezone: timezone,
        date_format: dateFormat,
      });
    } catch (err: unknown) {
      showNotification("error", "Error saving settings.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirmName = prompt(
      `To confirm deletion, please type the workspace name: "${workspaceName}"`,
    );
    if (confirmName !== workspaceName) {
      if (confirmName !== null)
        showNotification("error", "Workspace name did not match.");
      return;
    }

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete workspace.");
      router.push("/login");
    } catch (err: unknown) {
      showNotification(
        "error",
        "Failed to delete workspace. Ensure you are the owner.",
      );
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsInviting(true);

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/team`, {
        method: "POST",
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to invite user.");
      }

      showNotification("success", "Team member invited successfully!");
      setNewEmail("");
      setNewRole("employee");

      const res2 = await fetchAPI(`/api/tenants/${tenantId}/team`);
      if (res2.ok) setMembers(await res2.json());
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      showNotification("error", errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/team/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to remove member.");
      }
      setMembers(members.filter((m) => m.id !== memberId));
      showNotification("success", "Member removed from the workspace.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      showNotification("error", errorMessage);
    }
  };

  // 2. Takım üyesinin rolünü, departmanını veya özel rolünü güncelleyen yeni fonksiyon
  const handleMemberUpdate = async (
    memberId: string,
    field: "role" | "custom_role_id" | "department_id",
    value: string,
  ) => {
    try {
      const payload = { [field]: value === "" ? null : value };

      const res = await fetchAPI(`/api/tenants/${tenantId}/team/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update member.");
      }

      setMembers(
        members.map((m) =>
          m.id === memberId
            ? { ...m, [field]: value === "" ? null : value }
            : m,
        ),
      );
      showNotification("success", "Member updated successfully.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      showNotification("error", errorMessage);
    }
  };

  const handleTransferOwnership = async (
    memberId: string,
    memberEmail: string,
  ) => {
    if (
      !window.confirm(
        `WARNING: Are you sure you want to transfer ownership to ${memberEmail}?`,
      )
    )
      return;

    try {
      const res = await fetchAPI(
        `/api/tenants/${tenantId}/transfer-ownership`,
        {
          method: "POST",
          body: JSON.stringify({ new_owner_member_id: memberId }),
        },
      );

      if (!res.ok) throw new Error("Failed to transfer ownership.");
      showNotification("success", "Ownership transferred successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      showNotification("error", "Error transferring ownership.");
    }
  };

  const handleUpgradeTier = async (newTier: "advanced" | "pro") => {
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/tier`, {
        method: "PUT",
        body: JSON.stringify({ tier: newTier }),
      });

      if (res.ok) {
        showNotification(
          "success",
          `Plan upgraded to ${newTier === "pro" ? "Pro" : "Advanced"} successfully!`,
        );
        setTier(newTier === "pro" ? "Pro Plan" : "Advanced Plan");
      } else {
        showNotification("error", "Failed to upgrade plan.");
      }
    } catch (e) {
      showNotification("error", "Server connection error.");
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsCreatingDept(true);

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/departments`, {
        method: "POST",
        body: JSON.stringify({ name: newDeptName }),
      });
      if (!res.ok) throw new Error("Failed to create department");

      const newDept = await res.json();
      setDepartments([...departments, newDept]);
      setNewDeptName("");
      showNotification("success", "Department created successfully.");
    } catch (error) {
      showNotification("error", "Error creating department.");
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this department? Members in this department will be unassigned.",
      )
    )
      return;
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/departments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete department");

      setDepartments(departments.filter((d) => d.id !== id));
      showNotification("success", "Department removed.");

      // Lokal state üzerindeki atanmış üyeleri temizle
      setMembers(
        members.map((m) =>
          m.department_id === id ? { ...m, department_id: null } : m,
        ),
      );
    } catch (error) {
      showNotification("error", "Error removing department.");
    }
  };

  const handleAddCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setIsCreatingRole(true);

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/roles`, {
        method: "POST",
        body: JSON.stringify({ name: newRoleName }),
      });
      if (!res.ok) throw new Error("Failed to create custom role");

      const newRole = await res.json();
      setCustomRoles([...customRoles, newRole]);
      setNewRoleName("");
      showNotification("success", "Custom role created successfully.");
    } catch (error) {
      showNotification("error", "Error creating custom role.");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleDeleteCustomRole = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this role? Members with this role will be unassigned.",
      )
    )
      return;
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/roles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete role");

      setCustomRoles(customRoles.filter((r) => r.id !== id));
      showNotification("success", "Role removed.");

      // Lokal state üzerindeki atanmış üyeleri temizle
      setMembers(
        members.map((m) =>
          m.custom_role_id === id ? { ...m, custom_role_id: null } : m,
        ),
      );
    } catch (error) {
      showNotification("error", "Error removing role.");
    }
  };

  const getAvatarGradient = (email: string) => {
    const colors = [
      "from-blue-500 to-indigo-500",
      "from-emerald-400 to-teal-500",
      "from-orange-400 to-rose-500",
      "from-purple-500 to-pink-500",
    ];
    const index = email.length % colors.length;
    return colors[index];
  };

  const getProjectLimit = () => {
    if (tier === "Pro Plan") return "Unlimited";
    if (tier === "Advanced Plan") return 50;
    return 5;
  };

  const getMemberLimit = () => {
    if (tier === "Pro Plan") return "Unlimited";
    if (tier === "Advanced Plan") return 50;
    return 3;
  };

  if (isCheckingAccess) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4 mb-8"></div>
        <div className="flex gap-4 mb-8 border-b border-zinc-200 pb-4">
          <div className="h-6 bg-zinc-200 rounded w-24"></div>
          <div className="h-6 bg-zinc-200 rounded w-24"></div>
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-zinc-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] min-h-screen">
      <div className="max-w-5xl mx-auto w-full p-6 md:p-10 lg:p-12 pb-32 md:pb-40">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your{" "}
            {usageType === "individual"
              ? "personal workspace"
              : "workspace team"}
            , billing, and preferences.
          </p>
        </div>

        <div className="flex items-center gap-6 border-b border-zinc-200 mb-8 overflow-x-auto select-none">
          {usageType === "team" && (
            <>
              <TabButton
                active={activeTab === "team"}
                onClick={() => setActiveTab("team")}
                icon={<Users className="w-4 h-4" />}
                label="Team Members"
              />
              <TabButton
                active={activeTab === "organization"}
                onClick={() => setActiveTab("organization")}
                icon={<Building2 className="w-4 h-4" />}
                label="Organization"
              />
            </>
          )}
          <TabButton
            active={activeTab === "billing"}
            onClick={() => setActiveTab("billing")}
            icon={<CreditCard className="w-4 h-4" />}
            label="Billing & Plan"
          />
          <TabButton
            active={activeTab === "advanced"}
            onClick={() => setActiveTab("advanced")}
            icon={<Settings className="w-4 h-4" />}
            label="Advanced"
          />
        </div>

        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="text-sm font-semibold">{notification.msg}</p>
          </div>
        )}

        {/* ================= TEAM TAB ================= */}
        {usageType === "team" && activeTab === "team" && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <form onSubmit={handleInvite}>
                <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8">
                  <div className="w-full md:w-1/3">
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-zinc-400" /> Invite
                      Members
                    </h3>
                    <p className="text-sm text-zinc-500 mt-2">
                      Invite new colleagues to collaborate in your workspace.
                      You will be billed for additional seats on pro plans.
                    </p>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex flex-1 sm:flex-[2] items-center">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="relative flex-1">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all font-medium text-zinc-900 appearance-none bg-[url('/down-arrow.svg')] bg-[length:16px] bg-no-repeat bg-[position:right_1rem_center]"
                      >
                        <option value="employee">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50/80 px-6 py-4 border-t border-zinc-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isInviting ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200 bg-white">
                <h3 className="text-base font-bold text-zinc-900">
                  Workspace Members
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Manage access levels and roles for all active members.
                </p>
              </div>

              <div className="divide-y divide-zinc-100">
                {members.map((m) => {
                  const emailStr = m.email || "Pending Invite...";
                  const initial = emailStr.charAt(0).toUpperCase();
                  const isCurrentOwnerRow = m.role === "owner";

                  return (
                    <div
                      key={m.id}
                      className="p-4 sm:px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-tr ${getAvatarGradient(emailStr)} shadow-sm shrink-0`}
                        >
                          {initial}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                            {emailStr}
                            {isCurrentOwnerRow && (
                              <span className="px-1.5 py-0.5 bg-zinc-900 text-white text-[10px] uppercase font-black rounded">
                                Owner
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">
                            Joined{" "}
                            {m.created_at
                              ? new Date(m.created_at).toLocaleDateString()
                              : "Recently"}
                          </span>
                        </div>
                      </div>

                      {/* 3. Dropdown'lar grid yapısı ile yan yana eklendi */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Sistem Rolü (Permissions) */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">
                            System Role
                          </span>
                          <select
                            value={m.role}
                            disabled={isCurrentOwnerRow}
                            onChange={(e) => {
                              if (e.target.value === "transfer_owner")
                                handleTransferOwnership(m.id, emailStr);
                              else
                                handleMemberUpdate(
                                  m.id,
                                  "role",
                                  e.target.value,
                                );
                            }}
                            className={`appearance-none px-3 py-1.5 text-xs font-semibold rounded-md border focus:outline-none focus:ring-2 transition-all min-w-[110px] ${
                              m.role === "admin"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                : m.role === "owner"
                                  ? "bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed"
                                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm"
                            }`}
                          >
                            {isCurrentOwnerRow && (
                              <option value="owner">Owner</option>
                            )}
                            {!isCurrentOwnerRow &&
                              currentUserRole === "owner" && (
                                <option value="transfer_owner">
                                  Transfer Ownership
                                </option>
                              )}
                            {!isCurrentOwnerRow && (
                              <option value="admin">Admin</option>
                            )}
                            {!isCurrentOwnerRow && (
                              <option value="employee">Member</option>
                            )}
                          </select>
                        </div>

                        {/* Özel Rol (Custom Role) Seçici */}
                        {!isCurrentOwnerRow && customRoles.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">
                              Job Title
                            </span>
                            <select
                              value={m.custom_role_id || ""}
                              onChange={(e) =>
                                handleMemberUpdate(
                                  m.id,
                                  "custom_role_id",
                                  e.target.value,
                                )
                              }
                              className="appearance-none px-3 py-1.5 text-xs font-medium rounded-md border bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm min-w-[120px]"
                            >
                              <option value="">-- No Role --</option>
                              {customRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Departman Seçici */}
                        {!isCurrentOwnerRow && departments.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">
                              Department
                            </span>
                            <select
                              value={m.department_id || ""}
                              onChange={(e) =>
                                handleMemberUpdate(
                                  m.id,
                                  "department_id",
                                  e.target.value,
                                )
                              }
                              className="appearance-none px-3 py-1.5 text-xs font-medium rounded-md border bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm min-w-[120px]"
                            >
                              <option value="">-- No Dept --</option>
                              {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Silme Butonu */}
                        {!isCurrentOwnerRow ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-transparent select-none uppercase">
                              .
                            </span>
                            <button
                              onClick={() => removeMember(m.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-[28px]"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <div className="p-8 text-center text-zinc-500 text-sm">
                    No members found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= ORGANIZATION TAB ================= */}
        {usageType === "team" && activeTab === "organization" && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8">
                <div className="w-full md:w-1/3">
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-zinc-400" /> Departments
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">
                    Create departments to organize your workspace and assign
                    teams accordingly.
                  </p>
                </div>

                <div className="w-full md:w-2/3 flex flex-col gap-5">
                  <form onSubmit={handleAddDepartment} className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="e.g. Engineering, Marketing"
                      className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all font-medium text-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingDept}
                      className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />{" "}
                      {isCreatingDept ? "Adding..." : "Add"}
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    {departments.length === 0 && (
                      <span className="text-sm text-zinc-400 italic">
                        No departments created yet.
                      </span>
                    )}
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="group inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-700 hover:border-zinc-300 transition-all"
                      >
                        {dept.name}
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all ml-1"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8">
                <div className="w-full md:w-1/3">
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-zinc-400" /> Custom Roles
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">
                    Create custom roles (like Project Manager, Reviewer) to
                    assign specific permissions later.
                  </p>
                </div>

                <div className="w-full md:w-2/3 flex flex-col gap-5">
                  <form onSubmit={handleAddCustomRole} className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Content Editor, Viewer"
                      className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all font-medium text-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingRole}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />{" "}
                      {isCreatingRole ? "Adding..." : "Add Role"}
                    </button>
                  </form>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customRoles.length === 0 && (
                      <span className="text-sm text-zinc-400 italic">
                        No custom roles created yet.
                      </span>
                    )}
                    {customRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg p-3 group hover:bg-white transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="text-sm font-bold text-zinc-800">
                            {role.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteCustomRole(role.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-1.5 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= BILLING & ADVANCED TABS (Kısaltıldı, Değişmedi) ================= */}
        {activeTab === "billing" && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8 justify-between items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="text-base font-bold text-zinc-900">
                    Current Plan
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">
                    Manage your subscription and billing intervals.
                  </p>
                </div>
                <div className="w-full md:w-2/3">
                  <div className="inline-flex items-center gap-3 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <div className="w-10 h-10 bg-zinc-900 rounded-md flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        {tier}
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Billed monthly. Renews automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden mb-20">
              <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8">
                <div className="w-full md:w-1/3">
                  <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Danger Zone
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">
                    Irreversible actions. Deleting a workspace removes all data.
                  </p>
                </div>
                <div className="w-full md:w-2/3 flex items-center">
                  <div className="w-full p-4 bg-red-50/50 border border-red-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">
                        Delete Workspace
                      </h4>
                    </div>
                    <button
                      onClick={handleDeleteWorkspace}
                      className="bg-white text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
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
      className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-semibold transition-all ${
        active
          ? "border-zinc-900 text-zinc-900"
          : "border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300"
      }`}
    >
      {icon} {label}
    </button>
  );
}
