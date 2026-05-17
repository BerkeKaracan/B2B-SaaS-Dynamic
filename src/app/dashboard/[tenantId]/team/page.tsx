"use client";
import React, { useState, useEffect, use } from "react";
type TeamMember = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export default function TeamBillingPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;

  const [tier, setTier] = useState<string>("basic");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    try {
      const tRes = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTier(tData.tier || "basic");
      }
      const mRes = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/team`);
      if (mRes.ok) {
        setMembers(await mRes.json());
      }
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

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        role: "employee",
      }),
    });

    if (res.ok) {
      setNewEmail("");
      setNewPassword("");
      fetchData();
    } else {
      const errData = await res.json();
      setError(errData.detail || "Failed to add user");
    }
  };

  const removeMember = async (memberId: string) => {
    const res = await fetch(
      `${API_BASE_URL}/api/tenants/${tenantId}/team/${memberId}`,
      {
        method: "DELETE",
      },
    );
    if (res.ok) fetchData();
  };

  const limitMap: Record<string, number | string> = {
    basic: 3,
    advanced: 50,
    pro: "Unlimited",
  };
  const maxSeats = limitMap[tier];
  const seatsUsed = members.length;
  const isLimitReached = tier !== "pro" && seatsUsed >= (maxSeats as number);

  return (
    <div className="flex flex-col h-screen bg-[#fafafb] font-sans text-zinc-900 overflow-hidden w-full">
      <main className="flex-1 overflow-y-auto p-10 bg-[#fafafb] h-full">
        <div className="max-w-4xl mx-auto w-full space-y-10">
          <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-zinc-900 mb-6">
              Subscription Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["basic", "advanced", "pro"].map((plan) => (
                <div
                  key={plan}
                  onClick={() => changeTier(plan)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${tier === plan ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-300"}`}
                >
                  <h3 className="font-bold uppercase tracking-wider text-sm mb-1">
                    {plan}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-4">
                    {plan === "basic"
                      ? "Up to 3 seats"
                      : plan === "advanced"
                        ? "Up to 50 seats"
                        : "Unlimited seats"}
                  </p>
                  <div
                    className={`text-[10px] font-bold py-1 px-3 rounded-full inline-block ${tier === plan ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}
                  >
                    {tier === plan ? "CURRENT PLAN" : "UPGRADE"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-zinc-900">
                Team Members
              </h2>
              <span className="text-xs font-bold px-3 py-1 bg-zinc-100 rounded-full text-zinc-500">
                Seats Used: {seatsUsed} / {maxSeats}
              </span>
            </div>

            <form onSubmit={addMember} className="flex gap-3 mb-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Employee Email"
                className="flex-1 border border-zinc-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                required
              />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Temp Password (min 6)"
                className="w-48 border border-zinc-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={isLimitReached}
                className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                Add Member
              </button>
            </form>
            {error && (
              <p className="text-red-500 text-xs font-bold mb-4">{error}</p>
            )}

            <div className="divide-y divide-zinc-100 border-t border-zinc-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="py-4 flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-900">
                      {member.email}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize">
                      {member.role}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="py-4 text-sm text-zinc-500 text-center">
                  No team members yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
