"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }
      localStorage.setItem("token", data.access_token);
      router.push(`/dashboard/${data.tenant_id}`);
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
            Welcome back to <br /> your workspace.
          </h1>
          <p className="text-zinc-400 text-base max-w-sm leading-relaxed mb-10">
            Log in to manage your company operations, dynamic data structures,
            and team workflows.
          </p>
        </div>
        <div className="relative z-10 mt-auto pt-10">
          <p className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            SaaS ENGINE // SECURE_AUTH v2.0
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[65%] flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative">
        <div className="w-full max-w-sm mx-auto z-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-2.5 tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto lg:mx-0 leading-relaxed">
              Enter your credentials to access your dashboard.
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

          <form className="space-y-6" onSubmit={handleSubmit}>
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
              <div className="flex items-center justify-between pl-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Password
                </label>
                <Link
                  href="/forgot"
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white rounded-xl py-4 text-base font-bold mt-6 hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-zinc-900 hover:underline transition-all"
            >
              Create a workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
