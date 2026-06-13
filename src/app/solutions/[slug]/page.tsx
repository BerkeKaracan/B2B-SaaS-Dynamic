"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Sparkles, Zap } from "lucide-react";

type SolutionContent = {
  title: string;
  badge: string;
  tagline: string;
  description: string;
  valueProposition: string;
  features: { title: string; desc: string }[];
  metrics: { value: string; label: string }[];
};

const solutionRegistry: Record<string, SolutionContent> = {
  engineering: {
    badge: "ENGINEERING & PRODUCT OS",
    title: "Build features, not internal infrastructure tools.",
    tagline:
      "Unify your engineering sprints, feature backlogs, and visual system flowcharts into a single, low-latency relational spatial canvas.",
    description:
      "Traditional project management tables fail to represent complex asynchronous architecture flows. SaaS Engine allows technical product managers and engineering leaders to map technical debt, coordinate multi-team deployments, and visually connect canvas blocks directly to real-time database state rows.",
    valueProposition:
      "Accelerate your product shipment velocities up to 43% while completely eliminating cross-functional alignment overhead.",
    features: [
      {
        title: "Dynamic Sprint Mapping Nodes",
        desc: "Instantly create interactive Kanban blocks linked via vector pathways to track complex critical dependencies.",
      },
      {
        title: "Asynchronous Auto-Save Logging",
        desc: "Zero-latency database background persistence stream secures structural modifications without interruptive load times.",
      },
      {
        title: "Technical Architecture Visualization",
        desc: "Embed cloud storage asset references into structural layouts to create living, self-updating documentations.",
      },
    ],
    metrics: [
      { value: "43%", label: "Faster Deployment Cycles" },
      { value: "Zero", label: "Hydration Sync Failures" },
      { value: "100%", label: "Type-Safe Relational Data" },
    ],
  },
  hr: {
    badge: "ENTERPRISE HUMAN RESOURCES",
    title: "People operations engineered for hyper-growth teams.",
    tagline:
      "Streamline complex organizational charts, cross-departmental alignment workflows, and compliance checklist frameworks seamlessly.",
    description:
      "Managing modern remote or hybrid engineering workforces requires granular visibility. Ditch chaotic spreadsheets. SaaS Engine gives HR professionals a clear spatial area to outline strategic hiring pipelines, visualize organization charts dynamically, and enforce mandatory compliance grids.",
    valueProposition:
      "Reduce employee onboarding operational friction by 60% and securely store identity documents under row-level database security.",
    features: [
      {
        title: "Visual Node-Based Onboarding",
        desc: "Design adaptive onboarding workflows where task cards automatically trigger based on the user's role metadata.",
      },
      {
        title: "Granular Team Access Controls",
        desc: "Secure sensitive personal information using enterprise-grade Row-Level Security (RLS) and custom RBAC permissions.",
      },
      {
        title: "Centralized Asset Repositories",
        desc: "Upload and anchor company guidelines and regional handbook documentation safely inside protected object storage nodes.",
      },
    ],
    metrics: [
      { value: "60%", label: "Operational Friction Reduction" },
      { value: "100%", label: "RBAC Compliance Met" },
      { value: "4.9/5", label: "Onboarding Satisfaction Rate" },
    ],
  },
  sales: {
    badge: "HIGH-VELOCITY REVENUE OS",
    title: "Close larger enterprise deals with structured precision.",
    tagline:
      "Transform your static pipeline boards into dynamic spatial conversion engines. Track custom enterprise parameters dynamically.",
    description:
      "Standard customer relationship platforms isolate deal context inside hard-to-read sub-menus. SaaS Engine brings visual layout parameters to your pipeline strategy, mapping key account touchpoints, complex contract lifecycles, and cross-functional legal review processes onto a fluid spatial interface.",
    valueProposition:
      "Empower your account executives to unlock an automatic 28% increase in contract pipeline win-rates with continuous clarity.",
    features: [
      {
        title: "Infinite Conversion Layouts",
        desc: "Map complex sales cycles visually, linking customer requirements to technical implementation capabilities inside real canvas sheets.",
      },
      {
        title: "Real-Time Pipeline Hydration",
        desc: "As deal parameters slide from one canvas coordinate to another, data streams instantly update global tracking logs.",
      },
      {
        title: "Shared Client Previews",
        desc: "Generate protected read-only web share URLs to present architectural proposals and custom pricing pipelines elegantly to buyers.",
      },
    ],
    metrics: [
      { value: "28%", label: "Higher Pipeline Win Rates" },
      { value: "3.2x", label: "Faster Account Onboarding" },
      { value: "$12M+", label: "Daily Managed Sales Volume" },
    ],
  },
  operations: {
    badge: "STRATEGY & CORPORATE OPERATIONS",
    title: "Orchestrate your company's core strategic roadmap.",
    tagline:
      "Synchronize company OKRs, executive task force timelines, and cross-departmental operations with complete transparency.",
    description:
      "Corporate operational alignment cracks when execution is detached from initial planning blueprints. SaaS Engine bridges this structural gap by embedding living documents, active data metrics, and cross-functional calendars into unified infinite workspace coordinates.",
    valueProposition:
      "Consolidate your disparate operational toolchains into a single operating system, reducing software licensing overheads by up to 35%.",
    features: [
      {
        title: "Executive Timeline Overlays",
        desc: "Build strategic roadmaps that link high-level quarterly target nodes to day-to-day tactical execution components.",
      },
      {
        title: "Cross-Workspace Module Sync",
        desc: "Create dedicated module silos for multiple internal teams while maintaining a global master operational canvas.",
      },
      {
        title: "Built-In Automated Notifications",
        desc: "Keep key stakeholders aligned with real-time system mention notifications across structural project updates.",
      },
    ],
    metrics: [
      { value: "35%", label: "Toolchain Overhead Savings" },
      { value: "100%", label: "Cross-Department Alignment" },
      { value: "Zero", label: "Lost Executive Context" },
    ],
  },
};

export default function SolutionLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const content = solutionRegistry[slug];

  if (!content) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-black text-zinc-950 mb-2">
          Architecture Node Not Configured
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          The selected dynamic solution profile does not exist in our core
          registry registry.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-950 text-white font-bold rounded-xl text-xs"
        >
          Return to Main Terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans antialiased selection:bg-zinc-200 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center transform-gpu">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)] opacity-[0.25]"></div>
      </div>

      <header className="h-16 border-b border-zinc-200/50 bg-white/75 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/"
          className="flex items-center gap-3 font-extrabold text-sm tracking-tight uppercase"
        >
          <div className="w-7 h-7 bg-zinc-950 rounded-lg flex items-center justify-center text-white text-[10px] font-mono border border-zinc-800">
            B2
          </div>
          SaaS Engine
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="px-4 py-1.5 bg-zinc-950 text-white font-bold rounded-lg text-xs hover:bg-zinc-800 transition-all shadow-sm"
          >
            Launch App
          </Link>
        </div>
      </header>

      <main className="flex-1 relative z-10 max-w-5xl mx-auto w-full px-6 pt-20 pb-24 flex flex-col items-center text-center">
        <span className="px-3 py-1 bg-zinc-950 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-xs mb-6 animate-fade-in">
          {content.badge}
        </span>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-950 max-w-4xl leading-[1.1] mb-6">
          {content.title}
        </h1>

        <p className="text-base md:text-lg text-zinc-500 font-medium max-w-3xl leading-relaxed mb-10">
          {content.tagline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
          <Link
            href="/register"
            className="px-6 py-3.5 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-950/10 flex items-center justify-center gap-2 group"
          >
            Deploy This Solution{" "}
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
          <Link
            href="/demo"
            className="px-6 py-3.5 bg-white border border-zinc-200 text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-all shadow-xs flex items-center justify-center"
          >
            Explore Live Demo
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 w-full bg-zinc-200/40 border border-zinc-200/80 rounded-3xl p-1.5 backdrop-blur-xs mb-24 shadow-xs">
          {content.metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-2xl p-6 text-center">
              <span className="block text-3xl font-black text-zinc-950 tracking-tight mb-1">
                {m.value}
              </span>
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 text-left items-start border-t border-zinc-200 pt-16">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <Sparkles size={18} className="text-zinc-900" /> Architectural
              Depth
            </h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              {content.description}
            </p>
            <div className="bg-zinc-100/70 border border-zinc-200/50 p-4 rounded-2xl mt-6">
              <p className="text-[11px] font-bold text-zinc-800 leading-relaxed italic">
                &ldquo;{content.valueProposition}&rdquo;
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <Zap size={18} className="text-zinc-900" /> Technical Primitives
            </h2>
            <div className="space-y-4">
              {content.features.map((feat) => (
                <div
                  key={feat.title}
                  className="bg-white border border-zinc-200/60 p-5 rounded-2xl shadow-xs flex gap-4 items-start hover:border-zinc-300 transition-colors"
                >
                  <CheckCircle2
                    size={16}
                    className="text-zinc-900 shrink-0 mt-0.5"
                    strokeWidth={3}
                  />
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-950 tracking-tight mb-1">
                      {feat.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-28 w-full bg-zinc-950 text-white rounded-[2rem] p-10 md:p-12 text-left relative overflow-hidden shadow-xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 relative z-10 max-w-xl">
            <h3 className="text-xl md:text-2xl font-black tracking-tight">
              Ready to refactor your operational layer?
            </h3>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Set up your unified workspace in under 60 seconds. Empower your
              teams with structural relational database power natively.
            </p>
          </div>
          <Link
            href="/register"
            className="px-6 py-3.5 bg-white text-zinc-950 rounded-xl text-xs font-black hover:bg-zinc-100 transition-all shadow-md shrink-0 w-full md:w-auto text-center flex items-center justify-center gap-2 group"
          >
            Initialize Cluster <Shield size={14} fill="currentColor" />
          </Link>
        </div>
      </main>
    </div>
  );
}
