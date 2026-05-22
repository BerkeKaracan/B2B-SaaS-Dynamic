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
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-zinc-800">
            <span className="text-white text-xs font-black font-mono">B2</span>
          </div>
          <span className="text-sm font-extrabold text-zinc-900 tracking-tight uppercase">
            SaaS Engine
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <div className="relative group py-5">
            <button className="text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-100/60">
              Product
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

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[520px] bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 grid grid-cols-2 gap-2 z-50">
              <Link
                href="#"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-zinc-100 block"
              >
                <h4 className="text-sm font-extrabold text-zinc-950">
                  Canvas Editor
                </h4>
                <p className="text-xs text-zinc-400 font-medium mt-1">
                  Visual dynamic block workflow constructor.
                </p>
              </Link>
              <Link
                href="#"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-zinc-100 block"
              >
                <h4 className="text-sm font-extrabold text-zinc-950">
                  Cloud Assets
                </h4>
                <p className="text-xs text-zinc-400 font-medium mt-1">
                  Real-time media sync with Supabase Storage.
                </p>
              </Link>
              <Link
                href="#"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-zinc-100 block"
              >
                <h4 className="text-sm font-extrabold text-zinc-950">
                  Auto-Save Engine
                </h4>
                <p className="text-xs text-zinc-400 font-medium mt-1">
                  Zero-latency background database streaming.
                </p>
              </Link>
              <Link
                href="#"
                className="p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-zinc-100 block"
              >
                <h4 className="text-sm font-extrabold text-zinc-950">
                  Enterprise RLS
                </h4>
                <p className="text-xs text-zinc-400 font-medium mt-1">
                  Row-level database security policies built-in.
                </p>
              </Link>
            </div>
          </div>

          <div className="relative group py-5">
            <button className="text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-100/60">
              Templates
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

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[400px] bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 flex flex-col gap-0.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-1">
                Popular Community Templates
              </div>
              <Link
                href="#"
                className="p-2.5 hover:bg-zinc-50 rounded-xl transition-colors flex items-center justify-between group/item"
              >
                <span className="text-sm font-bold text-zinc-700 group-hover/item:text-zinc-950">
                  HR Processes Hub
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                  Free
                </span>
              </Link>
              <Link
                href="#"
                className="p-2.5 hover:bg-zinc-50 rounded-xl transition-colors flex items-center justify-between group/item"
              >
                <span className="text-sm font-bold text-zinc-700 group-hover/item:text-zinc-950">
                  CRM Deal Pipeline
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                  Free
                </span>
              </Link>
              <Link
                href="#"
                className="p-2.5 hover:bg-zinc-50 rounded-xl transition-colors flex items-center justify-between group/item"
              >
                <span className="text-sm font-bold text-zinc-700 group-hover/item:text-zinc-950">
                  Invoice & Finance Tracker
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                  Free
                </span>
              </Link>
            </div>
          </div>

          <div className="relative group py-5">
            <button className="text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-100/60">
              Resources
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

            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 flex flex-col z-50">
              <Link
                href="#"
                className="px-3.5 py-2 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="#"
                className="px-3.5 py-2 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Community Havuz
              </Link>
              <Link
                href="#"
                className="px-3.5 py-2 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                Changelog
              </Link>
            </div>
          </div>

          <Link
            href="#"
            className="text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors px-3 py-1.5 rounded-xl hover:bg-zinc-100/60"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-6 shrink-0">
          <Link
            href="/login"
            className="text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-zinc-950 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
          >
            Start for Free
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
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 border border-zinc-200 rounded-xl font-bold text-base hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 shadow-sm">
              View Demo
            </button>
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
                Role-Based Access (RBAC)
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Admins see everything, while your team sees only what they need
                to. Perfect security.
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
