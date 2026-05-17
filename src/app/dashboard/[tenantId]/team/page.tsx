"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

type TeamMember = {
  id: string;
  email?: string;
  role: string;
  user_id: string;
  tenant_id: string;
  created_at?: string;
};

export default function TeamBillingPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();

  const [tier, setTier] = useState<string>("basic");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.role !== "admin" && data.role !== "owner") {
            router.replace(`/dashboard/${tenantId}/projects`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkAccess();
  }, [tenantId, router, API_BASE_URL]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const tRes = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
        headers,
      });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTier(tData.tier || "basic");
      }

      const mRes = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/team`, {
        headers,
      });
      if (mRes.ok) setMembers(await mRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const changeTier = async (newTier: string) => {
    const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/tier`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: newTier }),
    });
    if (res.ok) fetchData();
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        role: "employee",
      }),
    });

    if (res.ok) {
      setNewEmail("");
      fetchData();
    } else {
      const errData = await res.json();
      setError(errData.detail || "Failed to send invite");
    }
  };

  const removeMember = async (memberId: string) => {
    const res = await fetch(
      `${API_BASE_URL}/api/tenants/${tenantId}/team/${memberId}`,
      { method: "DELETE" },
    );
    if (res.ok) fetchData();
  };

  const limits: Record<string, number | string> = {
    basic: 3,
    advanced: 50,
    pro: "Unlimited",
  };
  const maxSeats = limits[tier] || 3;
  const isLimitReached =
    tier !== "pro" && members.length >= (maxSeats as number);

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full">
      <div className="max-w-4xl mx-auto space-y-10">
        <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h2 className="text-2xl font-extrabold mb-6">Subscription Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["basic", "advanced", "pro"].map((plan) => (
              <div
                key={plan}
                onClick={() => changeTier(plan)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${tier === plan ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-300"}`}
              >
                <h3 className="font-black uppercase tracking-wider">{plan}</h3>
                <p className="text-sm text-zinc-500 mt-2 font-medium">
                  Seats: {limits[plan]}
                </p>
                <div
                  className={`mt-4 text-[10px] font-bold py-1 px-3 rounded-full inline-block ${tier === plan ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}
                >
                  {tier === plan ? "CURRENT PLAN" : "UPGRADE"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold">Team Members</h2>
            <span className="text-xs px-3 py-1 bg-zinc-100 rounded-full font-bold text-zinc-600 uppercase tracking-wider">
              Seats Used: {members.length} / {maxSeats}
            </span>
          </div>

          <form onSubmit={addMember} className="flex gap-3 mb-6">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="employee@company.com"
              className="flex-1 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner"
              required
            />
            <button
              type="submit"
              disabled={isLimitReached}
              className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 hover:bg-zinc-800 transition-colors shadow-md"
            >
              Send Invite
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-xs font-bold mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {members.map((m) => (
              <div
                key={m.id}
                className="py-4 flex justify-between items-center group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-zinc-900">
                    {m.email || "Pending Invite..."}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                    {m.role}
                  </span>
                </div>
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-red-500 text-xs font-bold bg-red-50 px-4 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-zinc-500 py-4 text-center">
                No team members yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
