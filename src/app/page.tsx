"use client";
import React from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import {
  Layers,
  Database,
  Lock,
  Cloud,
  Users,
  Briefcase,
  TrendingUp,
  GitMerge,
  FileText,
  Activity,
  Rocket,
} from "lucide-react";

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

      <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl z-50 px-6 lg:px-10 flex items-center justify-between transition-all">
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group transform-gpu active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 bg-zinc-950 rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-zinc-800 group-hover:bg-zinc-800 transition-colors relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-white text-xs font-black font-mono tracking-tighter">
              B2
            </span>
          </div>
          <span className="text-sm font-black text-zinc-950 tracking-tight uppercase">
            SaaS Engine
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 h-full">
          <div className="relative group h-full flex items-center">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/80">
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

            <div className="absolute top-[calc(100%-10px)] left-0 w-full h-[20px] bg-transparent z-40"></div>

            <div className="absolute top-[calc(100%+5px)] left-1/2 -translate-x-1/2 w-[650px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-[2rem] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform-gpu origin-top -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden flex">
              <div className="w-2/3 p-6 grid grid-cols-1 gap-3 bg-white">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
                  Core Capabilities
                </span>

                <Link
                  href="/docs?sec=canvas"
                  className="group/feature relative p-4 bg-white hover:bg-zinc-50/80 rounded-2xl border border-zinc-100 hover:border-indigo-200 transition-all block overflow-hidden transform-gpu hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10 group-hover/feature:bg-indigo-500/10 transition-colors"></div>
                  <h4 className="text-sm font-black text-zinc-900 flex items-center gap-3 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner group-hover/feature:scale-110 transition-transform transform-gpu">
                      <Layers className="w-4 h-4" />
                    </div>
                    Spatial Canvas Engine
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed pl-11">
                    Infinite vector grids for dynamic block orchestration and
                    infinite workflow mapping.
                  </p>
                </Link>

                <Link
                  href="/docs?sec=autosave"
                  className="group/feature relative p-4 bg-white hover:bg-zinc-50/80 rounded-2xl border border-zinc-100 hover:border-emerald-200 transition-all block overflow-hidden transform-gpu hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10 group-hover/feature:bg-emerald-500/10 transition-colors"></div>
                  <h4 className="text-sm font-black text-zinc-900 flex items-center gap-3 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner group-hover/feature:scale-110 transition-transform transform-gpu">
                      <Database className="w-4 h-4" />
                    </div>
                    Real-Time Sync (JSONB)
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed pl-11">
                    Zero-latency background data streaming utilizing advanced
                    PostgreSQL primitives.
                  </p>
                </Link>
              </div>

              <div className="w-1/3 bg-zinc-50/50 p-6 border-l border-zinc-100 flex flex-col gap-5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  Security & Data
                </span>

                <Link
                  href="/docs?sec=rbac"
                  className="group/item flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-200/50 flex items-center justify-center text-zinc-600 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-blue-600 transition-colors">
                      Enterprise RBAC
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                      Granular Row-Level Security.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/docs?sec=assets"
                  className="group/item flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-200/50 flex items-center justify-center text-zinc-600 group-hover/item:bg-purple-100 group-hover/item:text-purple-600 transition-colors">
                    <Cloud className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-purple-600 transition-colors">
                      Cloud Storage
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                      Protected Supabase buckets.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="relative group h-full flex items-center">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/80">
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

            <div className="absolute top-[calc(100%-10px)] left-0 w-full h-[20px] bg-transparent z-40"></div>

            <div className="absolute top-[calc(100%+5px)] left-1/2 -translate-x-1/2 w-[520px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-[2rem] p-5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform-gpu origin-top -translate-y-2 group-hover:translate-y-0 grid grid-cols-2 gap-x-4 gap-y-2 z-50">
              <div className="col-span-2 px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-2">
                Industry Use Cases
              </div>

              <Link
                href="/solutions/engineering"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <GitMerge className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-indigo-600" />
                  Engineering & Product
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  Sprint planning & bug tracking.
                </p>
              </Link>

              <Link
                href="/solutions/hr"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-rose-600" />
                  Human Resources
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  Onboarding workflows & policies.
                </p>
              </Link>

              <Link
                href="/solutions/sales"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-emerald-600" />
                  Sales & CRM
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  Deal pipelines & conversion grids.
                </p>
              </Link>

              <Link
                href="/solutions/operations"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-amber-600" />
                  Strategy & Ops
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  OKRs and executive timelines.
                </p>
              </Link>
            </div>
          </div>

          <div className="relative group h-full flex items-center">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/80">
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

            <div className="absolute top-[calc(100%-10px)] left-0 w-full h-[20px] bg-transparent z-40"></div>

            <div className="absolute top-[calc(100%+5px)] left-0 w-[260px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-[1.5rem] p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform-gpu origin-top -translate-y-2 group-hover:translate-y-0 flex flex-col z-50">
              <Link
                href="/docs"
                className="px-4 py-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 group/link transition-colors"
              >
                <FileText className="w-4 h-4 text-zinc-400 group-hover/link:text-zinc-900" />
                <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                  Documentation
                </span>
              </Link>

              <Link
                href="/changelog"
                className="px-4 py-3 hover:bg-zinc-50 rounded-xl flex items-center justify-between group/link transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-zinc-400 group-hover/link:text-zinc-900" />
                  <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                    Changelog
                  </span>
                </div>
                <span className="text-[9px] font-black bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                  New
                </span>
              </Link>

              <div className="h-px bg-zinc-100 my-1 mx-3"></div>

              <Link
                href="/demo"
                className="px-4 py-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 group/link transition-colors"
              >
                <Rocket className="w-4 h-4 text-zinc-400 group-hover/link:text-zinc-900" />
                <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                  Community Hub
                </span>
              </Link>
            </div>
          </div>

          <Link
            href="/pricing"
            className="text-[13px] font-bold text-zinc-500 hover:text-zinc-950 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100/80"
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
            className="text-[13px] font-extrabold bg-zinc-950 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center gap-2 transform-gpu hover:-translate-y-0.5 active:scale-95"
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

        <section className="py-10 border-y border-zinc-200/60 bg-white/60 backdrop-blur-md overflow-hidden flex flex-col relative">
          <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-8 relative z-20">
            Trusted by Industry Leaders
          </p>
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#fafafb] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#fafafb] to-transparent z-10 pointer-events-none"></div>

          <div className="flex whitespace-nowrap overflow-hidden group">
            <div className="flex items-center gap-16 animate-marquee group-hover:[animation-play-state:paused] px-8">
              {[
                { name: "Lethal Company IC.", style: "font-serif font-black" },
                { name: "ACME Corp.", style: "tracking-tighter font-bold" },
                {
                  name: "Stark Ind.",
                  style: "uppercase tracking-widest font-black",
                },
                { name: "Globex", style: "italic font-bold" },
                { name: "InGen", style: "font-mono tracking-tight font-bold" },
                { name: "Wayne Ent.", style: "font-serif italic font-bold" },
                {
                  name: "Massive Dynamic",
                  style: "uppercase font-medium tracking-[0.2em]",
                },
                {
                  name: "Cyberdyne Systems",
                  style: "font-black tracking-tighter",
                },
                { name: "Umbrella Corp.", style: "uppercase font-bold" },
                { name: "Hooli", style: "lowercase font-black text-2xl" },
                {
                  name: "Vandelay Ind.",
                  style: "font-serif font-bold text-xl",
                },
                { name: "Pied Piper", style: "font-mono font-bold" },
              ].map((company, i) => (
                <span
                  key={i}
                  className={`text-xl text-zinc-400 hover:text-zinc-900 transition-colors cursor-default ${company.style}`}
                >
                  {company.name}
                </span>
              ))}
            </div>

            <div
              className="flex items-center gap-16 animate-marquee group-hover:[animation-play-state:paused] px-8"
              aria-hidden="true"
            >
              {[
                { name: "Lethal Company IC.", style: "font-serif font-black" },
                { name: "ACME Corp.", style: "tracking-tighter font-bold" },
                {
                  name: "Stark Ind.",
                  style: "uppercase tracking-widest font-black",
                },
                { name: "Globex", style: "italic font-bold" },
                { name: "InGen", style: "font-mono tracking-tight font-bold" },
                { name: "Wayne Ent.", style: "font-serif italic font-bold" },
                {
                  name: "Massive Dynamic",
                  style: "uppercase font-medium tracking-[0.2em]",
                },
                {
                  name: "Cyberdyne Systems",
                  style: "font-black tracking-tighter",
                },
                { name: "Umbrella Corp.", style: "uppercase font-bold" },
                { name: "Hooli", style: "lowercase font-black text-2xl" },
                {
                  name: "Vandelay Ind.",
                  style: "font-serif font-bold text-xl",
                },
                { name: "Pied Piper", style: "font-mono font-bold" },
              ].map((company, i) => (
                <span
                  key={`copy-${i}`}
                  className={`text-xl text-zinc-400 hover:text-zinc-900 transition-colors cursor-default ${company.style}`}
                >
                  {company.name}
                </span>
              ))}
            </div>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-100%); }
            }
            .animate-marquee {
              animation: marquee 35s linear infinite;
            }
          `,
            }}
          />
        </section>

        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 mb-2 shadow-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Introducing Workspace AI
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight leading-[1.1]">
                Chat directly with <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">
                  your Canvas Data.
                </span>
              </h2>
              <p className="text-lg text-zinc-500 leading-relaxed">
                Meet your context-aware AI assistant. Our built-in RAG engine
                reads your active blocks in real-time. Ask questions, summarize
                projects, or use the Generative Wand to let AI structure your
                thoughts instantly.
              </p>

              <ul className="space-y-4 mt-8">
                <li className="flex items-center gap-4 text-zinc-700 font-bold text-sm">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    ✓
                  </div>
                  Context-Aware Chatbot (Llama 3.3)
                </li>
                <li className="flex items-center gap-4 text-zinc-700 font-bold text-sm">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                    ✓
                  </div>
                  Generative Magic Wand
                </li>
                <li className="flex items-center gap-4 text-zinc-700 font-bold text-sm">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 shrink-0">
                    ✓
                  </div>
                  Real-time Canvas Parsing
                </li>
              </ul>
            </div>

            <div className="flex-1 w-full bg-zinc-950 rounded-[2rem] p-3 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500 hover:shadow-indigo-500/20">
              <div className="bg-zinc-900 rounded-[1.5rem] border border-zinc-800 p-5 md:p-6 flex flex-col h-[400px]">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800/80">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    RAG_Engine_Active
                  </span>
                </div>

                <div className="flex flex-col gap-5 flex-1 overflow-hidden font-sans">
                  <div className="self-end bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-[13px] shadow-sm max-w-[85%] font-medium">
                    Summarize the Q3 Roadmap items on my canvas.
                  </div>

                  <div className="self-start flex gap-3 max-w-[90%]">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0 flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="bg-zinc-800 text-zinc-300 px-4 py-3 rounded-2xl rounded-tl-sm text-[13px] shadow-sm border border-zinc-700/50 leading-relaxed">
                      Based on your current canvas, the Q3 Roadmap focuses on:
                      <br />
                      <br />
                      <span className="text-white font-bold">
                        1. Multi-tenant SSO
                      </span>
                      <br />
                      <span className="text-white font-bold">
                        2. New Block Types
                      </span>
                      <br />
                      <span className="text-white font-bold">
                        3. Database Sharding
                      </span>
                      <br />
                      <br />
                      Should I generate a timeline block for these?
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-zinc-200/60 mt-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
              Enterprise-grade architecture. <br className="hidden sm:block" />
              <span className="text-zinc-400">Zero compromises.</span>
            </h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              SaaS Engine isn&lsquo;t just another wrapper. It&lsquo;s built
              from the ground up using a modern, scalable, and secure technology
              stack designed for real-world performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-zinc-950 text-white rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.987 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm-3.66-6.42l-1.32.96v-9.08l1.32-.96v9.08zm4.98 0l-1.32.96V11.2l-3.32 4.42-1.32-.96 4.64-5.38v7.3zm1.66 0l1.32.96V7.46l-1.32-.96v9.08z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">
                Next.js 16 & Zustand
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Lightning-fast React rendering on the edge, combined with
                Zustand for zero-lag synchronous state management across your
                canvas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">
                FastAPI & Python Engine
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                High-performance asynchronous backend architecture to handle
                complex RAG pipelines and heavy data processing instantly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">
                Llama 3.3 (Groq RAG)
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                State-of-the-art open-weight AI models providing real-time,
                context-aware generations directly inside your workspace.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">
                Supabase & PostgreSQL
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Dynamic canvas data stored seamlessly in JSONB structures,
                backed by Row Level Security (RLS) for strict multi-tenant
                isolation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">
                Sentry APM
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Enterprise-grade application performance monitoring and error
                tracking ensuring 99.99% uptime and immediate bug resolution.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">
                Docker Containerized
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Fully containerized infrastructure allowing consistent
                deployments and extreme scalability across any cloud
                environment.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-200/60 mt-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
              Anatomy of a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Smart Workspace.
              </span>
            </h2>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Everything is exactly where you need it. No clutter, just pure
              productivity mapped out on an infinite canvas.
            </p>
          </div>

          <div className="relative w-full aspect-square md:aspect-[16/9] bg-zinc-900 rounded-[2rem] border-[8px] border-zinc-100 shadow-2xl p-4 flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center opacity-80">
              <span className="text-zinc-700 font-bold text-xl tracking-widest uppercase">
                [ YOUR WORKSPACE SCREENSHOT HERE ]
              </span>
            </div>

            <div className="absolute top-10 left-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-zinc-200/50 max-w-[200px] animate-bounce-slow">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h4 className="font-bold text-zinc-900 text-sm">
                  Dynamic Sidebar
                </h4>
              </div>
              <p className="text-[11px] text-zinc-600 font-medium">
                Switch between projects, views, and settings instantly.
              </p>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-indigo-500 max-w-[240px] hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <h4 className="font-bold text-white text-sm">
                  Infinite JSONB Canvas
                </h4>
              </div>
              <p className="text-[11px] text-indigo-100 font-medium">
                Drag & drop any block type. Data synchronizes in real-time.
              </p>
            </div>

            <div className="absolute bottom-10 right-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-zinc-200/50 max-w-[220px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <h4 className="font-bold text-zinc-900 text-sm">
                  Context-Aware AI
                </h4>
              </div>
              <p className="text-[11px] text-zinc-600 font-medium">
                The RAG engine sits right here, reading your canvas live.
              </p>
            </div>

            <div className="absolute top-10 right-10 bg-zinc-800/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-zinc-700 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-red-400 border-2 border-zinc-800"></div>
                <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-zinc-800"></div>
              </div>
              <span className="text-xs font-bold text-white">
                Multiplayer Ready
              </span>
            </div>
          </div>
        </section>

        <section className="py-8 px-6 max-w-5xl mx-auto mt-10">
          <div className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-1 relative overflow-hidden shadow-2xl hover:shadow-indigo-500/20 transition-all">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>

            <div className="bg-zinc-950/40 backdrop-blur-sm w-full h-full rounded-[1.4rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left z-10 flex-1">
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-3 backdrop-blur-md border border-white/20">
                  Early Adopter Special
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                  Unlock the{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
                    Pro Edition
                  </span>{" "}
                  today.
                </h3>
                <p className="text-indigo-100/80 text-sm font-medium max-w-md leading-relaxed">
                  Join the beta now and get lifetime access to the Llama 3.3 RAG
                  engine, unlimited dynamic blocks, and priority support. No
                  credit card required for the first 14 days.
                </p>
              </div>

              <div className="z-10 shrink-0 w-full md:w-auto">
                <a
                  href="/register"
                  className="w-full md:w-auto px-8 py-4 bg-white text-indigo-950 font-black rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
                >
                  Claim Your Offer
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
                <p className="text-center text-[10px] text-white/50 mt-3 uppercase tracking-widest font-bold">
                  Limited spots available
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-zinc-200/60 mt-10">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight leading-[1.1]">
                Not just for teams. <br className="hidden md:block" />
                <span className="text-zinc-400">Built for your life.</span>
              </h2>
              <p className="text-lg text-zinc-500 leading-relaxed max-w-md">
                You don&apos;t need a company to harness the power of our
                platform. Turn your workspace into a{" "}
                <strong>Personal Second Brain</strong>. Organize your studies,
                plan your freelance projects, or track your daily life with the
                same enterprise-grade tools.
              </p>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-5">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-zinc-900 mb-2">
                  Students & Research
                </h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Drop your notes onto the canvas and let our AI instantly quiz
                  you or summarize complex chapters.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-5">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-zinc-900 mb-2">
                  Freelancers
                </h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Manage multiple clients, project timelines, and workflows in
                  beautifully isolated personal workspaces.
                </p>
              </div>

              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-sm sm:col-span-2 hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-zinc-800 text-pink-400 rounded-2xl flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    Life & Habit Organization
                  </h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Build your custom habit trackers, fitness logs, and travel
                  itineraries with dynamic check-blocks and date widgets. Make
                  it yours.
                </p>
              </div>
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
