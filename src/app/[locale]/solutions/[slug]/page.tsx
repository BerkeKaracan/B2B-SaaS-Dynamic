'use client';

import React, { use } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GitMerge,
  Layers,
  LayoutGrid,
  Radio,
  Rocket,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import MarketingPageChrome, {
  MarketingBreadcrumb,
  MarketingRelatedGrid,
} from '@/components/landing/MarketingPageChrome';

type SolutionSlug = 'engineering' | 'hr' | 'sales' | 'operations';

type SolutionMeta = {
  icon: LucideIcon;
  accent: string;
  soft: string;
  bar: string;
  iconWrap: string;
};

type SolutionContent = {
  shortLabel: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  valueProposition: string;
  features: { title: string; desc: string }[];
  uses: { label: string; href: string }[];
};

const SOLUTION_META: Record<SolutionSlug, SolutionMeta> = {
  engineering: {
    icon: GitMerge,
    accent: 'text-sky-700',
    soft: 'from-sky-100 to-sky-50',
    bar: 'bg-sky-500',
    iconWrap: 'bg-sky-50 border-sky-100 text-sky-600',
  },
  hr: {
    icon: Users,
    accent: 'text-rose-700',
    soft: 'from-rose-100 to-rose-50',
    bar: 'bg-rose-500',
    iconWrap: 'bg-rose-50 border-rose-100 text-rose-600',
  },
  sales: {
    icon: TrendingUp,
    accent: 'text-emerald-700',
    soft: 'from-emerald-100 to-emerald-50',
    bar: 'bg-emerald-500',
    iconWrap: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  },
  operations: {
    icon: Briefcase,
    accent: 'text-amber-700',
    soft: 'from-amber-100 to-amber-50',
    bar: 'bg-amber-500',
    iconWrap: 'bg-amber-50 border-amber-100 text-amber-600',
  },
};

const solutionRegistry: Record<SolutionSlug, SolutionContent> = {
  engineering: {
    shortLabel: 'Engineering & Product',
    badge: 'Engineering & Product',
    title: 'Ship features on one spatial workspace.',
    tagline:
      'Sprint boards, architecture sketches, and living docs on the same infinite canvas — with LIVE when the team needs to co-edit.',
    description:
      'Tables alone struggle with dependency graphs and async architecture decisions. WORKSPACE OS lets PMs and eng leads map debt, connect Kanban columns to whiteboard notes, and keep durable project state in Postgres JSONB while optional LIVE cursors keep the room aligned.',
    valueProposition:
      'One canvas for backlog, design notes, and deployment checklists — not five tools stitched with screenshots.',
    features: [
      {
        title: 'Kanban + whiteboard in one room',
        desc: 'Drop sprint columns next to system diagrams without exporting between products.',
      },
      {
        title: 'Durable autosave',
        desc: 'Structural edits persist through the Next BFF into Postgres — LIVE is additive, not the source of truth.',
      },
      {
        title: 'Tenant-safe assets',
        desc: 'Attach specs and diagrams from protected storage scoped to the project ACL.',
      },
    ],
    uses: [
      { label: 'Spatial canvas', href: '/platform/canvas' },
      { label: 'LIVE sync', href: '/platform/sync' },
      { label: 'Board templates', href: '/templates' },
    ],
  },
  hr: {
    shortLabel: 'Human Resources',
    badge: 'People ops',
    title: 'Onboarding and org clarity on a shared canvas.',
    tagline:
      'Hiring pipelines, checklist boards, and handbooks live in one workspace with role-aware access.',
    description:
      'Hybrid teams drown in spreadsheets and shared drives. WORKSPACE OS gives HR a spatial area for onboarding flows, org maps, and policy docs — with HttpOnly sessions, BFF auth, and RLS as defense-in-depth for sensitive material.',
    valueProposition:
      'Replace scattered onboarding folders with one ACL-aware board your managers can actually navigate.',
    features: [
      {
        title: 'Role-aware boards',
        desc: 'Invite managers and new hires with project ACL instead of forwarding inbox links.',
      },
      {
        title: 'Checklist canvases',
        desc: 'Step cards for Day 1–30 sit beside handbook blocks and asset uploads.',
      },
      {
        title: 'Protected uploads',
        desc: 'Guidelines and regional docs stay in tenant-isolated storage attached to the project.',
      },
    ],
    uses: [
      { label: 'RBAC & ACL', href: '/platform/rbac' },
      { label: 'Boards & assets', href: '/platform/storage' },
      { label: 'Onboarding template', href: '/templates' },
    ],
  },
  sales: {
    shortLabel: 'Sales & CRM',
    badge: 'Revenue ops',
    title: 'Map deals spatially — not only in list views.',
    tagline:
      'Pipeline stages, account notes, and proposal assets on one canvas your AE and SE can share.',
    description:
      'CRM rows hide context in submenus. WORKSPACE OS keeps deal stages as boards, links requirements to implementation notes, and supports read-friendly share flows when you present to a buyer — without inventing fake win-rate guarantees.',
    valueProposition:
      'Keep account context next to the pipeline so handoffs between AE, SE, and legal stay on one surface.',
    features: [
      {
        title: 'Pipeline boards',
        desc: 'Kanban stages for opportunities with notes and attachments on the same sheet.',
      },
      {
        title: 'LIVE for deal rooms',
        desc: 'Optional live cursors when prep calls need two people on the same board.',
      },
      {
        title: 'Shareable surfaces',
        desc: 'Present proposals from the workspace instead of detached slide dumps.',
      },
    ],
    uses: [
      { label: 'Spatial canvas', href: '/platform/canvas' },
      { label: 'LIVE sync', href: '/platform/sync' },
      { label: 'CRM template', href: '/templates' },
    ],
  },
  operations: {
    shortLabel: 'Strategy & Ops',
    badge: 'Strategy & ops',
    title: 'OKRs and execution on one operating canvas.',
    tagline:
      'Roadmaps, timelines, and cross-team checklists stay linked so planning does not detach from delivery.',
    description:
      'Ops breaks when strategy lives in slides and execution lives elsewhere. WORKSPACE OS embeds living docs, timeline boards, and team modules in one infinite workspace — with RBAC so exec views and working boards can differ by ACL.',
    valueProposition:
      'Connect quarterly targets to day-to-day boards without another status-meeting spreadsheet.',
    features: [
      {
        title: 'Timeline + board overlays',
        desc: 'Roadmap lanes sit beside execution Kanban without copy-paste between tools.',
      },
      {
        title: 'Cross-team modules',
        desc: 'Separate project rooms under one tenant while linking related canvases.',
      },
      {
        title: 'Mention-friendly updates',
        desc: 'Keep stakeholders on structural changes from the same workspace stream.',
      },
    ],
    uses: [
      { label: 'Boards & assets', href: '/platform/storage' },
      { label: 'RBAC & ACL', href: '/platform/rbac' },
      { label: 'Platform overview', href: '/features' },
    ],
  },
};

const SLUGS: SolutionSlug[] = ['engineering', 'hr', 'sales', 'operations'];

function isSolutionSlug(value: string): value is SolutionSlug {
  return SLUGS.includes(value as SolutionSlug);
}

export default function SolutionLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  if (!isSolutionSlug(slug)) {
    return (
      <MarketingPageChrome>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-28">
          <h2 className="text-xl font-black text-zinc-950 mb-2">Solution not found</h2>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm">
            This industry solution is not in the registry.
          </p>
          <Link
            href="/solutions/engineering"
            className="px-4 py-2.5 bg-zinc-950 text-white font-bold rounded-xl text-sm hover:bg-sky-600 transition-colors"
          >
            Browse solutions
          </Link>
        </main>
      </MarketingPageChrome>
    );
  }

  const content = solutionRegistry[slug];
  const meta = SOLUTION_META[slug];
  const Icon = meta.icon;
  const idx = SLUGS.indexOf(slug);
  const prev = SLUGS[(idx - 1 + SLUGS.length) % SLUGS.length];
  const next = SLUGS[(idx + 1) % SLUGS.length];

  const siblings = SLUGS.filter((s) => s !== slug).map((s) => ({
    slug: s,
    content: solutionRegistry[s],
    meta: SOLUTION_META[s],
  }));

  return (
    <MarketingPageChrome>
      <main className="flex-1 pt-28 md:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <MarketingBreadcrumb
            items={[
              { href: '/', label: 'Home' },
              { href: '/solutions/engineering', label: 'Solutions' },
              { label: content.shortLabel },
            ]}
          />

          <div className="mb-10 md:mb-12">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest mb-5 bg-linear-to-br ${meta.soft} border-white/80`}
            >
              <span
                className={`w-5 h-5 rounded-md border flex items-center justify-center ${meta.iconWrap}`}
              >
                <Icon className="w-3 h-3" />
              </span>
              <span className={meta.accent}>{content.badge}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight text-zinc-950 leading-[1.08] max-w-3xl mb-5">
              {content.title}
            </h1>
            <p className="text-base md:text-lg text-zinc-500 font-medium leading-relaxed max-w-2xl mb-8">
              {content.tagline}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-950 text-white text-sm font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-zinc-950/10"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-sm font-bold hover:border-sky-200 hover:text-sky-700 transition-colors"
              >
                Open demo
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sky-700 text-sm font-bold hover:bg-sky-50 transition-colors"
              >
                View platform
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-10">
            {content.uses.map((u) => (
              <Link
                key={u.href + u.label}
                href={u.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:border-sky-200 hover:text-sky-700 transition-colors"
              >
                {u.label}
                <ArrowRight className="w-3 h-3 opacity-50" />
              </Link>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm mb-12">
            <div className={`h-1.5 w-full ${meta.bar}`} />
            <div
              className={`bg-linear-to-br ${meta.soft} px-6 md:px-10 py-8 md:py-10 border-b border-zinc-100`}
            >
              <p className="text-sm md:text-base text-zinc-600 font-medium leading-relaxed max-w-3xl mb-4">
                {content.description}
              </p>
              <p className={`text-sm font-bold leading-relaxed ${meta.accent}`}>
                {content.valueProposition}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
              {content.features.map((feat) => (
                <div key={feat.title} className="p-6 md:p-7">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${meta.accent}`}
                      strokeWidth={2.5}
                    />
                    <div>
                      <h3 className="text-sm font-black text-zinc-950 tracking-tight mb-1.5">
                        {feat.title}
                      </h3>
                      <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MarketingRelatedGrid
            title="Continue exploring"
            links={[
              {
                href: '/features',
                label: 'Platform features',
                desc: 'Canvas, LIVE, RBAC, and boards at a glance.',
                icon: Layers,
              },
              {
                href: '/platform/sync',
                label: 'LIVE collaboration',
                desc: 'Cursors and optional Yjs over FastAPI WebSockets.',
                icon: Radio,
              },
              {
                href: '/docs',
                label: 'Documentation',
                desc: 'BFF, auth, and how the stack is actually wired.',
                icon: BookOpen,
              },
              {
                href: '/demo',
                label: 'Interactive demo',
                desc: 'Try the product surface without a sales call.',
                icon: Rocket,
              },
            ]}
          />

          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                Solutions
              </p>
              <h2 className="text-xl font-black text-zinc-950 tracking-tight">
                Other use cases
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={`/solutions/${prev}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-600 hover:border-sky-200 hover:text-sky-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {solutionRegistry[prev].shortLabel}
              </Link>
              <Link
                href={`/solutions/${next}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-600 hover:border-sky-200 hover:text-sky-700"
              >
                {solutionRegistry[next].shortLabel}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-16">
            {siblings.map((item) => {
              const SibIcon = item.meta.icon;
              return (
                <Link
                  key={item.slug}
                  href={`/solutions/${item.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white hover:border-sky-200 hover:shadow-md transition-all"
                >
                  <div
                    className={`h-14 bg-linear-to-br ${item.meta.soft} border-b border-zinc-100 relative`}
                  >
                    <div
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl border flex items-center justify-center bg-white/90 ${item.meta.iconWrap}`}
                    >
                      <SibIcon className="w-3.5 h-3.5" />
                    </div>
                    <div
                      className={`absolute bottom-0 inset-x-0 h-1 ${item.meta.bar} opacity-80`}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-black text-zinc-900 group-hover:text-sky-700 transition-colors truncate">
                      {item.content.shortLabel}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-1 line-clamp-2">
                      {item.content.tagline}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="rounded-4xl bg-zinc-950 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.22),transparent_55%)]" />
            <div className="relative z-10 max-w-xl">
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">
                Ready to try this workspace?
              </h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                Create a tenant, open a canvas, and invite your team — same stack as production.
              </p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-zinc-950 text-sm font-black hover:bg-sky-50 transition-colors"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/15 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                Templates
              </Link>
            </div>
          </div>
        </div>
      </main>
    </MarketingPageChrome>
  );
}
