"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KeyRound,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id");

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    let accessToken: string | null = null;

    if (hash && hash.includes("access_token=")) {
      const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
      const params = new URLSearchParams(cleanHash);
      accessToken = params.get("access_token");
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      accessToken = urlParams.get("access_token");
    }

    const errorMsg = new URLSearchParams(hash.replace("#", "?")).get(
      "error_description",
    );
    if (errorMsg) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(`Supabase Auth Error: ${errorMsg}`);
      return;
    }

    if (accessToken) {
      setToken(accessToken);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    } else {
      setError("Invalid invitation link. Token is missing.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token)
      return setError("Session expired. Please click the invite link again.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters long.");

    setIsLoading(true);
    setError("");

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${API_BASE_URL}/api/auth/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to set password.");
      }

      setSuccess(true);
      localStorage.setItem("token", token);

      setTimeout(() => {
        if (tenantId) {
          router.push(`/dashboard/${tenantId}`);
        } else {
          router.push("/login");
        }
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">
          Invite Link Invalid
        </h2>
        <p className="text-sm text-zinc-500 mb-6">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">
          You&apos;re All Set!
        </h2>
        <p className="text-sm text-zinc-500">
          Your password is saved. Redirecting to your workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
          Join Workspace
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Welcome! Please set a secure password to activate your account and
          join the team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <KeyRound className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:bg-white transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !token}
          className="w-full bg-zinc-900 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Join Workspace <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <Suspense
          fallback={
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          }
        >
          <AcceptInviteContent />
        </Suspense>
      </div>
    </div>
  );
}
