import React from "react";
import Link from "next/link";
import {
  Layout,
  Server,
  Database,
  Shield,
  Zap,
  Box,
  FolderTree,
  ArrowLeft,
  Terminal,
  Cpu,
} from "lucide-react";

export default function DocsAndArchitecturePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-200 font-sans pb-20">
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black font-mono">
                B2
              </span>
            </div>
            <span className="font-extrabold text-sm tracking-tight uppercase text-zinc-900">
              Architecture & Docs
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12 space-y-16">
        <section className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold uppercase tracking-widest mb-6">
            <Cpu className="w-3.5 h-3.5" />
            System Overview
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight leading-[1.1] mb-6">
            Building a Scalable <br />
            <span className="text-zinc-400">B2B SaaS Architecture.</span>
          </h1>
          <p className="text-base font-medium text-zinc-500 leading-relaxed">
            Welcome to the developer documentation. This platform is built on a
            decoupled, high-performance architecture designed for multi-tenant
            SaaS applications. Below is a comprehensive breakdown of our
            technology stack, system design, and repository structure.
          </p>
        </section>

        <hr className="border-zinc-200" />

        <section>
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mb-2">
              Core Technology Stack
            </h2>
            <p className="text-sm font-medium text-zinc-500">
              The foundational technologies powering the frontend, backend, and
              infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mb-4">
                <Layout className="w-5 h-5 text-zinc-700" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">
                Frontend Application
              </h3>
              <ul className="space-y-2 text-xs font-medium text-zinc-500">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Next.js
                  15 (App Router)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> React &
                  TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Zustand
                  (State Mgt.)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Tailwind
                  CSS & Framer
                </li>
              </ul>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mb-4">
                <Server className="w-5 h-5 text-zinc-700" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">
                Backend Services
              </h3>
              <ul className="space-y-2 text-xs font-medium text-zinc-500">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Python
                  3.12
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> FastAPI
                  Engine
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Pydantic
                  Validation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> RESTful
                  Architecture
                </li>
              </ul>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-zinc-700" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">
                Database & Auth
              </h3>
              <ul className="space-y-2 text-xs font-medium text-zinc-500">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Supabase
                  Platform
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />{" "}
                  PostgreSQL
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Row
                  Level Security (RLS)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> JWT
                  Authentication
                </li>
              </ul>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mb-4">
                <Box className="w-5 h-5 text-zinc-700" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">
                DevOps & Infra
              </h3>
              <ul className="space-y-2 text-xs font-medium text-zinc-500">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Docker
                  Containerization
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />{" "}
                  Kubernetes (K8s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> AWS ALB
                  Ingress
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" /> Sentry
                  Error Tracking
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-zinc-800 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight mb-4">
                Enterprise-Grade Security & Isolation
              </h2>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-6">
                Our multi-tenant architecture ensures strict data isolation.
                Every request is authenticated and routed through strict Row
                Level Security (RLS) policies at the database level. Workspaces
                cannot access each other&lsquo;s data, ensuring complete
                privacy.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold">
                    Strict Tenant Isolation via RLS
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold">
                    Low Latency Edge Functions
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 font-mono text-xs text-zinc-300">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <span>Multi-tenant Data Request Flow</span>
              </div>
              <div className="space-y-3">
                <p>
                  <span className="text-emerald-400">1. Client:</span> Sends
                  Request + JWT Token + Tenant ID
                </p>
                <p>
                  <span className="text-blue-400">2. FastAPI:</span> Validates
                  Token & Injects Tenant Context
                </p>
                <p>
                  <span className="text-purple-400">3. Database:</span> Applies
                  RLS Policy (tenant_id = auth.jwt)
                </p>
                <p>
                  <span className="text-emerald-400">4. Response:</span> Returns
                  Secure, Isolated Data Payload
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mb-2 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-zinc-400" />
              Repository Structure
            </h2>
            <p className="text-sm font-medium text-zinc-500">
              Understanding where things live in the codebase.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
              <div className="p-6">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
                  /src (Frontend)
                </h3>
                <ul className="space-y-3 text-sm font-medium text-zinc-600 font-mono text-[13px]">
                  <li>
                    <span className="text-zinc-400">├─</span> /app{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (Next.js Router)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span> /components{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (React UI)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span> /lib{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (Utils/Config)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span> /services{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (API Calls)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">└─</span> /store{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (Zustand State)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-6">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
                  /backend (API)
                </h3>
                <ul className="space-y-3 text-sm font-medium text-zinc-600 font-mono text-[13px]">
                  <li>
                    <span className="text-zinc-400">├─</span> main.py{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (FastAPI Entry)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span> /api/routers{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (Endpoints)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span> /core{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (DB & Settings)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span> /models{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (Pydantic)
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-400">└─</span> Dockerfile{" "}
                    <span className="text-zinc-400 text-xs ml-1 font-sans">
                      (Container)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-6">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
                  /k8s & /supabase
                </h3>
                <ul className="space-y-3 text-sm font-medium text-zinc-600 font-mono text-[13px]">
                  <li>
                    <span className="text-zinc-400">├─</span> /k8s/frontend.yaml
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span> /k8s/backend.yaml
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span>{" "}
                    /k8s/ingress-aws-alb.yaml
                  </li>
                  <li>
                    <span className="text-zinc-400">├─</span>{" "}
                    /supabase/migrations
                  </li>
                  <li>
                    <span className="text-zinc-400">└─</span> config.toml
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
