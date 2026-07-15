'use client';

import React, { use } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  GitMerge,
  Users,
  TrendingUp,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingAtmosphere from '@/components/landing/LandingAtmosphere';
import Footer from '@/components/layout/Footer';

type SolutionSlug = 'engineering' | 'hr' | 'sales' | 'operations';

type SolutionMeta = {
  icon: LucideIcon;
  accent: string;
  soft: string;
  bar: string;
  iconWrap: string;
};

type SolutionContent = {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  valueProposition: string;
  features: { title: string; desc: string }[];
  metrics: { value: string; label: string }[];
  shortLabel: string;
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
    badge: 'Engineering & Product OS',
    title: 'Build features, not internal infrastructure tools.',
    tagline:
      'Unify your engineering sprints, feature backlogs, and visual system flowcharts into a single, low-latency relational spatial canvas.',
    description:
      'Traditional project management tables fail to represent complex asynchronous architecture flows. SaaS Engine allows technical product managers and engineering leaders to map technical debt, coordinate multi-team deployments, and visually connect canvas blocks directly to real-time database state rows.',
    valueProposition:
      'Accelerate your product shipment velocities up to 43% while completely eliminating cross-functional alignment overhead.',
    features: [
      {
        title: 'Dynamic Sprint Mapping Nodes',
        desc: 'Instantly create interactive Kanban blocks linked via vector pathways to track complex critical dependencies.',
      },
      {
        title: 'Asynchronous Auto-Save Logging',
        desc: 'Zero-latency database background persistence stream secures structural modifications without interruptive load times.',
      },
      {
        title: 'Technical Architecture Visualization',
        desc: 'Embed cloud storage asset references into structural layouts to create living, self-updating documentation.',
      },
    ],
    metrics: [
      { value: '43%', label: 'Faster Deployment Cycles' },
      { value: 'Zero', label: 'Hydration Sync Failures' },
      { value: '100%', label: 'Type-Safe Relational Data' },
    ],
  },
  hr: {
    shortLabel: 'Human Resources',
    badge: 'Enterprise Human Resources',
    title: 'People operations engineered for hyper-growth teams.',
    tagline:
      'Streamline complex organizational charts, cross-departmental alignment workflows, and compliance checklist frameworks seamlessly.',
    description:
      'Managing modern remote or hybrid engineering workforces requires granular visibility. Ditch chaotic spreadsheets. SaaS Engine gives HR professionals a clear spatial area to outline strategic hiring pipelines, visualize organization charts dynamically, and enforce mandatory compliance grids.',
    valueProposition:
      'Reduce employee onboarding operational friction by 60% and securely store identity documents under row-level database security.',
    features: [
      {
        title: 'Visual Node-Based Onboarding',
        desc: 'Design adaptive onboarding workflows where task cards automatically trigger based on the user\'s role metadata.',
      },
      {
        title: 'Granular Team Access Controls',
        desc: 'Secure sensitive personal information using enterprise-grade Row-Level Security (RLS) and custom RBAC permissions.',
      },
      {
        title: 'Centralized Asset Repositories',
        desc: 'Upload and anchor company guidelines and regional handbook documentation safely inside protected object storage nodes.',
      },
    ],
    metrics: [
      { value: '60%', label: 'Operational Friction Reduction' },
      { value: '100%', label: 'RBAC Compliance Met' },
      { value: '4.9/5', label: 'Onboarding Satisfaction Rate' },
    ],
  },
  sales: {
    shortLabel: 'Sales & CRM',
    badge: 'High-Velocity Revenue OS',
    title: 'Close larger enterprise deals with structured precision.',
    tagline:
      'Transform your static pipeline boards into dynamic spatial conversion engines. Track custom enterprise parameters dynamically.',
    description:
      'Standard customer relationship platforms isolate deal context inside hard-to-read sub-menus. SaaS Engine brings visual layout parameters to your pipeline strategy, mapping key account touchpoints, complex contract lifecycles, and cross-functional legal review processes onto a fluid spatial interface.',
    valueProposition:
      'Empower your account executives to unlock an automatic 28% increase in contract pipeline win-rates with continuous clarity.',
    features: [
      {
        title: 'Infinite Conversion Layouts',
        desc: 'Map complex sales cycles visually, linking customer requirements to technical implementation capabilities inside real canvas sheets.',
      },
      {
        title: 'Real-Time Pipeline Hydration',
        desc: 'As deal parameters slide from one canvas coordinate to another, data streams instantly update global tracking logs.',
      },
      {
        title: 'Shared Client Previews',
        desc: 'Generate protected read-only web share URLs to present architectural proposals and custom pricing pipelines elegantly to buyers.',
      },
    ],
    metrics: [
      { value: '28%', label: 'Higher Pipeline Win Rates' },
      { value: '3.2x', label: 'Faster Account Onboarding' },
      { value: '$12M+', label: 'Daily Managed Sales Volume' },
    ],
  },
  operations: {
    shortLabel: 'Strategy & Ops',
    badge: 'Strategy & Corporate Operations',
    title: "Orchestrate your company's core strategic roadmap.",
    tagline:
      'Synchronize company OKRs, executive task force timelines, and cross-departmental operations with complete transparency.',
    description:
      'Corporate operational alignment cracks when execution is detached from initial planning blueprints. SaaS Engine bridges this structural gap by embedding living documents, active data metrics, and cross-functional calendars into unified infinite workspace coordinates.',
    valueProposition:
      'Consolidate your disparate operational toolchains into a single operating system, reducing software licensing overheads by up to 35%.',
    features: [
      {
        title: 'Executive Timeline Overlays',
        desc: 'Build strategic roadmaps that link high-level quarterly target nodes to day-to-day tactical execution components.',
      },
      {
        title: 'Cross-Workspace Module Sync',
        desc: 'Create dedicated module silos for multiple internal teams while maintaining a global master operational canvas.',
      },
      {
        title: 'Built-In Automated Notifications',
        desc: 'Keep key stakeholders aligned with real-time system mention notifications across structural project updates.',
      },
    ],
    metrics: [
      { value: '35%', label: 'Toolchain Overhead Savings' },
      { value: '100%', label: 'Cross-Department Alignment' },
      { value: 'Zero', label: 'Lost Executive Context' },
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
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-black text-zinc-950 mb-2">
          Solution not found
        </h2>
        <p className="text-sm text-zinc-500 mb-6 max-w-sm">
          This industry solution is not in the registry.
        </p>
        <Link
          href="/solutions/engineering"
          className="px-4 py-2.5 bg-zinc-950 text-white font-bold rounded-xl text-sm hover:bg-sky-600 transition-colors"
        >
          Browse solutions
        </Link>
      </div>
    );
  }

  const content = solutionRegistry[slug];
  const meta = SOLUTION_META[slug];
  const Icon = meta.icon;

  const siblings = SLUGS.filter((s) => s !== slug).map((s) => ({
    slug: s,
    content: solutionRegistry[s],
    meta: SOLUTION_META[s],
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-zinc-900 font-sans antialiased selection:bg-sky-100 flex flex-col relative overflow-hidden">
      <LandingAtmosphere />
      <LandingNavbar />

      <main className="relative z-10 flex-1 pt-28 md:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 md:mb-14">
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
                Deploy this solution
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-sm font-bold hover:border-sky-200 hover:text-sky-700 transition-colors"
              >
                Explore live demo
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
            {content.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm"
              >
                <span className={`block text-3xl font-black tracking-tight mb-1 ${meta.accent}`}>
                  {m.value}
                </span>
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm mb-16">
            <div className={`h-1.5 w-full ${meta.bar}`} />
            <div
              className={`bg-linear-to-br ${meta.soft} px-6 md:px-10 py-8 md:py-10 border-b border-zinc-100`}
            >
              <p className="text-sm md:text-base text-zinc-600 font-medium leading-relaxed max-w-3xl mb-4">
                {content.description}
              </p>
              <p className={`text-sm font-bold leading-relaxed italic ${meta.accent}`}>
                &ldquo;{content.valueProposition}&rdquo;
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

          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                Solutions
              </p>
              <h2 className="text-xl font-black text-zinc-950 tracking-tight">
                Explore other use cases
              </h2>
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
                Ready to refactor your operational layer?
              </h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                Set up your unified workspace in under 60 seconds. Empower your
                teams with structural relational database power natively.
              </p>
            </div>
            <Link
              href="/register"
              className="relative z-10 shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-zinc-950 text-sm font-black hover:bg-sky-50 transition-colors"
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
