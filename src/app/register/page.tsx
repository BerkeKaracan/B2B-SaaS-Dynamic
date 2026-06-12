"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import ColdStartAlert from "@/components/ColdStartAlert";

export default function RegisterPage() {
  const router = useRouter();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const savedTenant = localStorage.getItem("tenant_id");
      if (savedTenant) {
        router.replace(`/dashboard/${savedTenant}/projects`);
      } else {
        router.replace("/onboarding");
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || "An error occurred during registration.",
        );
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setError("System configuration error: Missing Supabase URL.");
      return;
    }
    const redirectTo = encodeURIComponent(`${window.location.origin}/login`);
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafb]">
        <span className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fafafb] font-sans text-zinc-900 selection:bg-zinc-200 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 lg:hidden bg-linear-to-r from-zinc-900 to-zinc-600"></div>

      <div className="hidden lg:flex flex-col justify-between lg:w-[35%] bg-zinc-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-zinc-800 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-40"></div>

        <div className="relative z-10 flex-1">
          <Link href="/" className="flex items-center gap-2 mb-20 group">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-zinc-900 text-xs font-bold font-mono">
                B2
              </span>
            </div>
            <span className="text-sm font-bold tracking-tight uppercase text-white">
              SaaS Engine
            </span>
          </Link>

          <h1 className="text-4xl font-extrabold leading-tight mb-8 tracking-tighter">
            Start building your <br /> company&apos;s operating system.
          </h1>
          <p className="text-zinc-400 text-base max-w-sm leading-relaxed mb-10">
            Join thousands of modern teams who use SaaS Engine to manage their
            projects, roles, and dynamic workflows.
          </p>

          <div className="space-y-4 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 text-emerald-400 text-[10px]">
                ✓
              </span>
              Dynamic blocks for custom flow
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 text-emerald-400 text-[10px]">
                ✓
              </span>
              Role-based access (RBAC)
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 text-emerald-400 text-[10px]">
                ✓
              </span>
              Real-time collaboration
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-10">
          <div className="flex -space-x-3 mb-4 grayscale opacity-70 shadow-inner">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-700"></div>
            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-600"></div>
            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-500"></div>
            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-white flex items-center justify-center text-zinc-900 text-xs font-bold shadow-inner">
              +2k
            </div>
          </div>
          <p className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            Trusted by founders worldwide.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[65%] flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative">
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md z-30 px-6 flex items-center shadow-sm">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold font-mono">B2</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto z-10 lg:pt-0 pt-24 pb-16">
          <ColdStartAlert />
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-2.5 tracking-tight">
              Create Account
            </h2>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto lg:mx-0 leading-relaxed">
              Set up your account in seconds.
            </p>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200/80 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200/80 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              GitHub
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-[#fafafb] px-4 text-zinc-400">
                Or sign up with email
              </span>
            </div>
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5 group">
              <label className="text-xs font-semibold text-zinc-700 pl-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors z-20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="relative z-10 w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-xs font-semibold text-zinc-700 pl-1">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors z-20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@acme.com"
                  className="relative z-10 w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-xs font-semibold text-zinc-700 pl-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors z-20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="relative z-10 w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-xs font-semibold text-zinc-700 pl-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors z-20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="relative z-10 w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white rounded-xl py-4 text-base font-bold mt-6 hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  Processing...
                </>
              ) : (
                <>
                  Create Account
                  <svg
                    width="18"
                    height="18"
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

          <p className="mt-10 text-center text-sm text-zinc-500 relative z-10">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-zinc-900 hover:underline transition-all"
            >
              Log In
            </Link>
          </p>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-zinc-400/60 font-mono tracking-wider z-9">
          SaaS ENGINE // AUTH_REG v2.0
        </div>
      </div>
    </div>
  );
}
