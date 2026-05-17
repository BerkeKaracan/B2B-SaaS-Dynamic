"use client";
import React from "react";
import Link from "next/link";

export default function RegisterPage() {
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
            Start building your <br /> company's operating system.
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

        <div className="w-full max-w-sm mx-auto z-10 lg:pt-11 pt-24 pb-16">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-zinc-900 mb-2.5 tracking-tight lider">
              Create Workspace
            </h2>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto lg:mx-0 leading-relaxed">
              Set up your account and company space in minutes.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5 group">
              <label className="text-xs font-semibold text-zinc-700 pl-1">
                Workspace Name
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
                    <path d="M3 21h18"></path>
                    <path d="M5 21V7l8-4 8 4v14"></path>
                    <path d="M9 10a6.3 6.3 0 0 1 6 0"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Acme Corp."
                  className="relative z-10 w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-inner"
                  required
                />
              </div>
            </div>

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
                  placeholder="••••••••"
                  className="relative z-10 w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-900 text-white rounded-xl py-4 text-base font-bold mt-6 hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            >
              Create Workspace
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

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-zinc-400/60 font-mono tracking-wider z-10">
          SaaS ENGINE // AUTH_REG v2.0
        </div>
      </div>
    </div>
  );
}
