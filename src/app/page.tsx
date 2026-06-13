"use client";
import React from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#fafafb] text-zinc-900 font-sans antialiased selection:bg-zinc-200 flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center transform-gpu will-change-transform">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-[0.3] transform-gpu"></div>

        <svg
          className="absolute top-0 left-0 w-full md:w-1/2 h-full opacity-5 text-zinc-900"
          preserveAspectRatio="none"
          viewBox="0 0 500 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C200,200 50,400 300,600 C500,800 100,900 0,1000 Z"
            fill="currentColor"
          />
          <path
            d="M0,0 C300,300 0,500 400,700 C600,900 200,1000 0,1000 Z"
            fill="currentColor"
          />
        </svg>

        <svg
          className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-5 text-zinc-900"
          preserveAspectRatio="none"
          viewBox="0 0 500 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M500,0 C300,200 450,400 200,600 C0,800 400,900 500,1000 Z"
            fill="currentColor"
          />
          <path
            d="M500,0 C200,300 500,500 100,700 C-100,900 300,1000 500,1000 Z"
            fill="currentColor"
          />
        </svg>

        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white rounded-full blur-[100px] opacity-80 transform-gpu will-change-transform"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl z-50 px-6 lg:px-10 flex items-center justify-between transition-all">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-zinc-800 group-hover:bg-zinc-900 transition-colors">
            <span className="text-white text-xs font-black font-mono tracking-tighter">
              B2
            </span>
          </div>
          <span className="text-sm font-extrabold text-zinc-950 tracking-tight uppercase">
            SaaS Engine
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <div className="relative group py-5 px-2">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/50">
              Platform
              <svg
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[600px] bg-white border border-zinc-200/80 shadow-2xl rounded-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 z-50 overflow-hidden flex">
              <div className="w-2/3 p-5 grid grid-cols-1 gap-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-3">
                  Core Capabilities
                </span>
                <Link
                  href="/docs?sec=canvas"
                  className="p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent block"
                >
                  <h4 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    Spatial Canvas Engine
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                    Infinite vector grids for dynamic block orchestration and
                    workflow mapping.
                  </p>
                </Link>
                <Link
                  href="/docs?sec=autosave"
                  className="p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent block"
                >
                  <h4 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    Real-Time Synchronization
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                    Zero-latency background data streaming utilizing JSONB
                    database primitives.
                  </p>
                </Link>
              </div>
              <div className="w-1/3 bg-zinc-50/80 p-5 border-l border-zinc-100 flex flex-col gap-4">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  Security & Data
                </span>
                <Link href="/docs?sec=rbac" className="group/item">
                  <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-blue-600 transition-colors">
                    Enterprise RBAC
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Granular Row-Level Security.
                  </p>
                </Link>
                <Link href="/docs?sec=assets" className="group/item">
                  <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-blue-600 transition-colors">
                    Cloud Storage
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Protected Supabase buckets.
                  </p>
                </Link>
              </div>
            </div>
          </div>

          <div className="relative group py-5 px-2">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/50">
              Solutions
              <svg
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[480px] bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 grid grid-cols-2 gap-x-2 gap-y-1 z-50">
              <div className="col-span-2 px-3 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-2">
                Industry Use Cases
              </div>

              <Link
                href="/solutions/engineering"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-colors block"
              >
                <h4 className="text-[13px] font-extrabold text-zinc-900">
                  Engineering & Product
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">
                  Sprint planning & bug tracking layouts.
                </p>
              </Link>
              <Link
                href="/solutions/hr"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-colors block"
              >
                <h4 className="text-[13px] font-extrabold text-zinc-900">
                  Human Resources
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">
                  Onboarding workflows & policy maps.
                </p>
              </Link>
              <Link
                href="/solutions/sales"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-colors block"
              >
                <h4 className="text-[13px] font-extrabold text-zinc-900">
                  Sales & CRM
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">
                  Deal pipelines & conversion grids.
                </p>
              </Link>
              <Link
                href="/solutions/operations"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-colors block"
              >
                <h4 className="text-[13px] font-extrabold text-zinc-900">
                  Strategy & Ops
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">
                  OKRs and executive timelines.
                </p>
              </Link>
            </div>
          </div>

          <div className="relative group py-5 px-2">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/50">
              Developers
              <svg
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="absolute top-[60px] left-0 w-[240px] bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform origin-top scale-95 group-hover:scale-100 flex flex-col z-50">
              <Link
                href="/docs"
                className="px-4 py-2.5 hover:bg-zinc-50 rounded-xl flex items-center justify-between group/link transition-colors"
              >
                <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                  Documentation
                </span>
              </Link>
              <Link
                href="/changelog"
                className="px-4 py-2.5 hover:bg-zinc-50 rounded-xl flex items-center justify-between group/link transition-colors"
              >
                <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                  Changelog
                </span>
                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">
                  New
                </span>
              </Link>
              <div className="h-px bg-zinc-100 my-1 mx-2"></div>
              <Link
                href="/demo"
                className="px-4 py-2.5 hover:bg-zinc-50 rounded-xl flex items-center justify-between group/link transition-colors"
              >
                <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                  Community Hub
                </span>
              </Link>
            </div>
          </div>

          <Link
            href="/pricing"
            className="text-[13px] font-bold text-zinc-500 hover:text-zinc-950 transition-colors px-4 py-1.5 rounded-lg hover:bg-zinc-100/50"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/login"
            className="hidden md:block text-[13px] font-extrabold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            Sign In
          </Link>
          <div className="h-4 w-px bg-zinc-200 hidden md:block"></div>
          <Link
            href="/register"
            className="text-[13px] font-extrabold bg-zinc-950 text-white px-5 py-2 rounded-xl hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10 hover:shadow-lg flex items-center gap-2"
          >
            Deploy Workspace
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        <section className="pt-40 pb-20 px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-xs font-semibold text-zinc-600 mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            SaaS Engine v2.0 is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-[1.1]">
            The Operating System for{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-900 to-zinc-500">
              your Company.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-2xl leading-relaxed">
            Manage your projects, design your custom workflow with dynamic
            blocks, and organize your team in seconds with role-based access.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold text-base hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Create Your Workspace
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
            </Link>
            <a
              href="/demo"
              className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-200 rounded-2xl font-bold text-base hover:border-zinc-300 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              View Demo
            </a>
          </div>
        </section>

        <section className="py-10 border-y border-zinc-200/60 bg-white/60 backdrop-blur-md">
          <p className="text-center text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6">
            Trusted by Industry Leaders
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xl font-black font-serif">
              Lethal Company IC.
            </span>
            <span className="text-xl font-bold tracking-tighter">
              ACME Corp.
            </span>
            <span className="text-xl font-black uppercase tracking-widest">
              Stark Ind.
            </span>
            <span className="text-xl font-bold italic">Globex</span>
          </div>
        </section>

        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
              Everything you need, out of the box.
            </h2>
            <p className="text-zinc-500 mt-4">
              No complex setups, just focus on your work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all duration-300 transform hover:-translate-y-2 hover:border-zinc-300 hover:shadow-xl group">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Dynamic Work Blocks
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Drag and drop text, dates, and form fields to shape your
                projects exactly how you want them.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all duration-300 transform hover:-translate-y-2 hover:border-zinc-300 hover:shadow-xl group">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Workspace RBAC
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Admins see everything, while your team sees only what they need
                to. Perfect workspace security.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all duration-300 transform hover:-translate-y-2 hover:border-zinc-300 hover:shadow-xl group">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Real-Time Auto Save
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Everything is saved instantly in the background as you work.
                Never lose data again.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all duration-300 transform hover:-translate-y-2 hover:border-zinc-300 hover:shadow-xl group">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="24"
                  height="24"
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
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Project-Level Access
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Invite specific teammates to view or edit individual projects
                without giving full workspace access.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all duration-300 transform hover:-translate-y-2 hover:border-zinc-300 hover:shadow-xl group">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Smart Notifications
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Get real-time application alerts for project invites and role
                updates right in your dashboard.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all duration-300 transform hover:-translate-y-2 hover:border-zinc-300 hover:shadow-xl group">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                JSONB Architecture
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Store complex custom data structures securely with
                lightning-fast PostgreSQL JSONB queries.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 max-w-5xl mx-auto mb-10">
          <div className="bg-zinc-900 rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                Ready to start the engine?
              </h2>
              <p className="text-zinc-400 mb-10 max-w-xl mx-auto text-lg font-medium">
                No credit card required. Set up your workspace and invite your
                team in seconds. Join the revolution.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-10 py-5 bg-white text-zinc-950 rounded-2xl font-extrabold text-base hover:bg-zinc-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1"
              >
                Create Free Account
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
