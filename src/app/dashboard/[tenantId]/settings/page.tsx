"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CreditCard,
  Settings,
  ShieldAlert,
  Mail,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type TeamMember = {
  id: string;
  email?: string;
  role: string;
  user_id: string;
  tenant_id: string;
  created_at?: string;
};

type Notification = {
  type: "error" | "success";
  msg: string;
};

export default function TeamBillingPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"team" | "billing" | "advanced">(
    "team",
  );
  const [tier, setTier] = useState<string>("Basic Plan");
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("employee");

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isSavingName, setIsSavingName] = useState(false);

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
            localStorage.setItem("token", accessToken);
            window.history.replaceState(null, "", window.location.pathname);
          }
        }

        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Not logged in or token expired");

        const data = await res.json();
        const roleStr = data.role || "employee";

        if (roleStr !== "owner" && roleStr !== "admin") {
          router.push(`/dashboard/${tenantId}`);
          return;
        }

        const res2 = await fetch(
          `${API_BASE_URL}/api/tenants/${tenantId}/team`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res2.ok) {
          const membersData = await res2.json();
          setMembers(membersData);
        }

        const tenantRes = await fetch(
          `${API_BASE_URL}/api/tenants/${tenantId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setWorkspaceName(tenantData.name || "");
          if (tenantData.tier === "pro") setTier("Pro Plan");
          else if (tenantData.tier === "advanced") setTier("Advanced Plan");
          else setTier("Basic Plan");
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

  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setIsSavingName(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: workspaceName }),
      });

      if (!res.ok) throw new Error("Failed to rename workspace.");
      showNotification("success", "Workspace renamed successfully!");
    } catch (err: unknown) {
      showNotification("error", "Error renaming workspace.");
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to invite user.");
      }

      showNotification("success", "Team member invited successfully!");
      setNewEmail("");
      setNewRole("employee");

      const res2 = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/tenants/${tenantId}/team/${memberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

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

  const handleRoleChange = async (memberId: string, updatedRole: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/tenants/${tenantId}/team/${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: updatedRole }),
        },
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update role.");
      }

      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, role: updatedRole } : m,
        ),
      );
      showNotification("success", "Member role updated successfully.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      showNotification("error", errorMessage);
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

  if (isCheckingAccess) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4 mb-8"></div>
        <div className="flex gap-4 mb-8 border-b border-zinc-200 pb-4">
          <div className="h-6 bg-zinc-200 rounded w-24"></div>
          <div className="h-6 bg-zinc-200 rounded w-24"></div>
        </div>
        <div className="h-32 bg-zinc-100 rounded-xl mb-4"></div>
        <div className="h-16 bg-zinc-100 rounded-xl mb-2"></div>
        <div className="h-16 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] min-h-screen">
      <div className="max-w-5xl mx-auto w-full p-6 md:p-10 lg:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Workspace Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your team members, billing plan, and workspace preferences.
          </p>
        </div>

        <div className="flex items-center gap-6 border-b border-zinc-200 mb-8 overflow-x-auto select-none">
          <TabButton
            active={activeTab === "team"}
            onClick={() => setActiveTab("team")}
            icon={<Users className="w-4 h-4" />}
            label="Team Members"
          />
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
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
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

        {activeTab === "team" && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6 shadow-sm">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-zinc-400" /> Invite New Member
              </h2>
              <p className="text-sm text-zinc-500 mb-4">
                Send an email invitation to add someone to this workspace.
              </p>

              <form
                onSubmit={handleInvite}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-[2]">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all font-medium text-zinc-800"
                    />
                  </div>
                  <div className="relative flex-1">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all font-medium text-zinc-800 appearance-none bg-[url('/down-arrow.svg')] bg-[length:16px] bg-no-repeat bg-[position:right_1rem_center]"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </form>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-900">
                  Active Members ({members.length})
                </h3>
              </div>

              <div className="divide-y divide-zinc-100">
                {members.map((m) => {
                  const emailStr = m.email || "Pending Invite...";
                  const initial = emailStr.charAt(0).toUpperCase();

                  return (
                    <div
                      key={m.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-zinc-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-tr ${getAvatarGradient(emailStr)} shadow-sm shrink-0`}
                        >
                          {initial}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-zinc-900">
                            {emailStr}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">
                            Workspace Access
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <div className="relative">
                          <select
                            value={m.role}
                            onChange={(e) =>
                              handleRoleChange(m.id, e.target.value)
                            }
                            className={`appearance-none pr-8 pl-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border cursor-pointer focus:outline-none focus:ring-2 transition-all ${
                              m.role === "admin"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 focus:ring-indigo-500/20"
                                : m.role === "owner"
                                  ? "bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800"
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 focus:ring-zinc-900/20"
                            }`}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="employee">Employee</option>
                          </select>
                          <svg
                            className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 ${m.role === "admin" ? "text-indigo-700" : m.role === "owner" ? "text-white" : "text-zinc-600"}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>

                        <button
                          onClick={() => removeMember(m.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                          title="Remove Member"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <div className="p-8 text-center text-zinc-500 text-sm font-medium">
                    No members found in this workspace.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Current Plan
                </h3>
                <div className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                  {tier}{" "}
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  You are currently on the {tier}. Upgrade for unlimited
                  projects and team members.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(
                      `${API_BASE_URL}/api/tenants/${tenantId}/tier`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ tier: "pro" }),
                      },
                    );

                    if (res.ok) {
                      showNotification(
                        "success",
                        "Plan upgraded to Pro successfully!",
                      );
                      setTier("Pro Plan");
                    } else {
                      showNotification("error", "Failed to upgrade plan.");
                    }
                  } catch (e) {
                    showNotification("error", "Server connection error.");
                  }
                }}
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
              >
                Upgrade to Pro
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 mb-4">
                Workspace Usage
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-zinc-600">Active Projects</span>
                    <span className="text-zinc-900 font-bold">
                      3 / {tier === "Pro Plan" ? "Unlimited" : "5"}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-zinc-600">Team Members</span>
                    <span className="text-zinc-900 font-bold">
                      {members.length} /{" "}
                      {tier === "Pro Plan" ? "Unlimited" : "10"}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width:
                          tier === "Pro Plan"
                            ? "10%"
                            : `${(members.length / 10) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* Rename Workspace Section */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 mb-1">
                Rename Workspace
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Change the visible name of this workspace across your
                organization.
              </p>
              <form
                onSubmit={handleRenameWorkspace}
                className="flex flex-col sm:flex-row gap-3 max-w-xl"
              >
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all font-medium text-zinc-800"
                  required
                />
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isSavingName ? "Saving..." : "Rename"}
                </button>
              </form>
            </div>

            {/* Danger Zone Section */}
            <div className="border border-red-200 bg-red-50/30 rounded-2xl p-6">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-sm text-zinc-600 mb-6">
                Irreversible and destructive actions for your workspace. Proceed
                with extreme caution.
              </p>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-red-100 rounded-xl gap-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    Delete Workspace
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Permanently remove this workspace and all its data. This
                    action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleDeleteWorkspace}
                  className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all shrink-0"
                >
                  Delete Workspace
                </button>
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
      className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-bold transition-all ${
        active
          ? "border-zinc-900 text-zinc-900"
          : "border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300"
      }`}
    >
      {icon} {label}
    </button>
  );
}
