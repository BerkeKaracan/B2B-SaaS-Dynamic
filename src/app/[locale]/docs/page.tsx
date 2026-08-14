import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Cloud,
  Database,
  FolderTree,
  GitBranch,
  Lock,
  Radio,
  Server,
  Shield,
  Terminal,
  Workflow,
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Architecture & Docs',
  description: `${BRAND_NAME} architecture notes — Next.js BFF, FastAPI, Supabase, live canvas WebSockets, and Cloud Run deploy.`,
};

const stack = [
  {
    icon: Workflow,
    title: 'Frontend',
    items: [
      'Next.js 16 (App Router)',
      'React 19 + TypeScript',
      'Zustand + Yjs',
      'Tailwind CSS 4 · next-intl',
    ],
  },
  {
    icon: Server,
    title: 'Backend',
    items: [
      'FastAPI + Pydantic v2',
      'Gunicorn · Uvicorn workers',
      'Redis rate limits',
      'WebSocket canvas hub',
    ],
  },
  {
    icon: Database,
    title: 'Data & auth',
    items: [
      'Supabase Auth (JWT)',
      'PostgreSQL + JSONB records',
      'RLS as defense-in-depth',
      'HttpOnly session cookie',
    ],
  },
  {
    icon: Cloud,
    title: 'Ship path',
    items: [
      'Frontend → Vercel',
      'API → Cloud Run (GCP)',
      'Artifact Registry + Actions',
      'Docker Compose (local)',
    ],
  },
] as const;

const decisions = [
  {
    icon: Lock,
    title: 'Auth is cookie + BFF, not localStorage JWTs',
    body: 'The browser never stores access tokens in localStorage. Next establishes an HttpOnly cookie via /api/session. Client calls go through /api/backend/* (and related BFF routes); the server attaches Authorization before FastAPI.',
  },
  {
    icon: Radio,
    title: 'Live canvas uses FastAPI WebSockets + Yjs',
    body: 'Cursors and optional CRDT co-edit share /ws/canvas/{room_id}. Supabase Presence was tried for cursors, then replaced after unstable CLOSED / channel races. Yjs follows LIVE by default; set NEXT_PUBLIC_COLLAB_DOC_SYNC=false for cursors-only.',
  },
  {
    icon: Boxes,
    title: 'Projects are JSONB documents, not a node table farm',
    body: 'Blank canvas pages/blocks and board templates persist in records.record_data. Zustand owns the editor model; the API saves the document. That keeps spatial UIs flexible without a rigid relational schema for every block type.',
  },
  {
    icon: Shield,
    title: 'Tenant isolation is enforced in the API first',
    body: 'FastAPI uses the Supabase service_role and checks tenant membership / roles in application logic. Postgres RLS remains as a second fence — not the only fence — so demos stay honest about where isolation actually lives.',
  },
] as const;

export default function DocsAndArchitecturePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-zinc-900 selection:bg-sky-200/60 font-sans">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="sm" href="/" showTagline={false} />
            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 border-l border-zinc-200 pl-3">
              Docs
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16 space-y-16">
        <section className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700/80 mb-4">
            Architecture notes · v1.5
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 leading-[1.12] mb-4">
            How {BRAND_NAME} is wired
          </h1>
          <p className="text-[15px] text-zinc-500 leading-relaxed">
            Portfolio documentation for reviewers — not a marketing SDK site.
            Stack versions and deploy targets match what ships today: Next.js
            on Vercel, FastAPI on Cloud Run, Supabase for auth/Postgres, and a
            custom WebSocket hub for live Infinite canvas.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <a
              href="https://github.com/BerkeKaracan/B2B-SaaS-Dynamic"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 text-white text-xs font-semibold px-3.5 py-2 hover:bg-zinc-800 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              GitHub repo
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </a>
            <Link
              href="/changelog"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold px-3.5 py-2 hover:border-zinc-300 transition-colors"
            >
              Changelog
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-lg font-black tracking-tight text-zinc-950">
              Stack (as deployed)
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              No Kubernetes / AWS ALB leftovers — those paths were retired.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stack.map(({ icon: Icon, title, items }) => (
              <div
                key={title}
                className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_0_rgba(24,24,27,0.04)]"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-950">{title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="text-[13px] text-zinc-500 flex gap-2 leading-snug"
                    >
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-sky-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-zinc-950">
              Design decisions that matter
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Why the code looks the way it does — not a buzzword list.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {decisions.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-zinc-950 mb-1.5">
                      {title}
                    </h3>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-zinc-950 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(56,189,248,0.18),transparent_55%)] pointer-events-none" />
          <div className="relative p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <h2 className="text-xl font-black tracking-tight mb-3">
                Authenticated request path
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                Browser → Next BFF → FastAPI → Supabase. Tokens stay
                server-side after login; tenant context travels as headers the
                BFF and API both understand.
              </p>
              <ul className="space-y-2.5 text-sm text-zinc-300">
                <li className="flex gap-2">
                  <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  App-level tenant ACL on records / members
                </li>
                <li className="flex gap-2">
                  <Radio className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  Canvas LIVE sockets authenticated (prod JWT; local insecure
                  flag for Docker)
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-[12px] leading-relaxed text-zinc-300">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 text-zinc-500">
                <Terminal className="w-3.5 h-3.5" />
                request flow
              </div>
              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  <span className="text-emerald-400">Browser</span> hits{' '}
                  <span className="text-sky-300">/api/backend/…</span> with
                  cookies
                </li>
                <li>
                  <span className="text-emerald-400">Next BFF</span> reads
                  HttpOnly session → Bearer JWT
                </li>
                <li>
                  <span className="text-emerald-400">FastAPI</span> verifies JWT
                  (local secret or GoTrue fallback)
                </li>
                <li>
                  <span className="text-emerald-400">Service role</span> +
                  tenant checks → JSON response
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-zinc-950 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-zinc-400" />
                Repository map
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Where to look when reviewing a PR.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
              <div className="p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                  src/
                </h3>
                <ul className="space-y-2 font-mono text-[12px] text-zinc-600">
                  <li>
                    <span className="text-zinc-400">├</span> app/ — routes,
                    BFF, OG
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> components/ —
                    canvas, auth, brand
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> hooks/ — collab,
                    Yjs bridge
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> lib/ — flags,
                    brand, WS URL
                  </li>
                  <li>
                    <span className="text-zinc-400">└</span> store/ — Zustand
                  </li>
                </ul>
              </div>
              <div className="p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                  backend/
                </h3>
                <ul className="space-y-2 font-mono text-[12px] text-zinc-600">
                  <li>
                    <span className="text-zinc-400">├</span> main.py — app
                    entry
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> api/routers/ —
                    REST + WS
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> core/ — JWT,
                    flags, limits
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> models/ —
                    Pydantic
                  </li>
                  <li>
                    <span className="text-zinc-400">└</span> tests/ — pytest
                  </li>
                </ul>
              </div>
              <div className="p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                  ops /
                </h3>
                <ul className="space-y-2 font-mono text-[12px] text-zinc-600">
                  <li>
                    <span className="text-zinc-400">├</span> docker-compose.yml
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span>{' '}
                    .github/workflows/
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> supabase/
                    migrations
                  </li>
                  <li>
                    <span className="text-zinc-400">├</span> messages/ — en /
                    tr
                  </li>
                  <li>
                    <span className="text-zinc-400">└</span> tests/ —
                    Playwright
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-black tracking-tight text-zinc-950 mb-2">
            Local + production pointers
          </h2>
          <ul className="text-[13px] text-zinc-500 space-y-2 leading-relaxed">
            <li>
              Local full stack:{' '}
              <code className="text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[12px]">
                docker compose up -d --build
              </code>{' '}
              → app on :3000, API docs on :8000/docs.
            </li>
            <li>
              LIVE in prod needs{' '}
              <code className="text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[12px]">
                NEXT_PUBLIC_WS_URL=wss://…
              </code>{' '}
              (and HTTPS API URL) baked into the Vercel build for CSP + client
              routing.
            </li>
            <li>
              Feature flags: Pulse Flag when healthy;{' '}
              <code className="text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[12px]">
                FEATURE_FLAGS_DISABLED
              </code>{' '}
              for Pulse-free Docker.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
