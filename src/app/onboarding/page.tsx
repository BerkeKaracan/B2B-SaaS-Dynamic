"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [usageType, setUsageType] = useState<"individual" | "team" | null>(
    null,
  );
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      // If user already has a workspace, redirect them to dashboard
      const tenant = localStorage.getItem("tenant_id");
      if (tenant) {
        router.replace(`/dashboard/${tenant}/projects`);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsChecking(false);
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageType) {
      setError("Please select how you want to use the system.");
      return;
    }
    if (usageType === "team" && !workspaceName.trim()) {
      setError("Workspace name is required for team usage.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authService.completeOnboarding({
        usage_type: usageType,
        workspace_name: usageType === "team" ? workspaceName : undefined,
      });

      if (res.tenant_id) {
        localStorage.setItem("tenant_id", res.tenant_id);
        router.push(`/dashboard/${res.tenant_id}/projects`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during onboarding.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafb]">
        <span className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafb] font-sans text-zinc-900 px-4">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white text-sm font-bold font-mono">B2</span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/60 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900"></div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-2">
              Welcome aboard!
            </h1>
            <p className="text-sm text-zinc-500">
              How are you planning to use SaaS Engine?
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Individual Option */}
              <button
                type="button"
                onClick={() => setUsageType("individual")}
                className={`flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all ${
                  usageType === "individual"
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${usageType === "individual" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 mb-1">
                  Just for me
                </h3>
                <p className="text-xs text-zinc-500">
                  Set up a personal workspace for my own projects.
                </p>
              </button>

              {/* Team Option */}
              <button
                type="button"
                onClick={() => setUsageType("team")}
                className={`flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all ${
                  usageType === "team"
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${usageType === "team" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 mb-1">
                  With my team
                </h3>
                <p className="text-xs text-zinc-500">
                  Create a company workspace and invite others.
                </p>
              </button>
            </div>

            {/* Dynamic Workspace Name Input for Teams */}
            <div
              className={`transition-all duration-300 overflow-hidden ${usageType === "team" ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="space-y-1.5 group pt-2">
                <label className="text-xs font-semibold text-zinc-700 pl-1">
                  Workspace / Company Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Corp."
                  className="w-full px-4 py-3 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-inner"
                  required={usageType === "team"}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !usageType}
              className="w-full bg-zinc-900 text-white rounded-xl py-4 text-sm font-bold mt-2 hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Setting up...
                </>
              ) : (
                <>
                  Continue
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-[11px] text-zinc-400 font-mono tracking-wider">
          SaaS ENGINE // ONBOARDING v1.0
        </div>
      </div>
    </div>
  );
}
