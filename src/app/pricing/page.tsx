"use client";
import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Basic / Free",
      price: "$0",
      description:
        "Ideal for individual creators building workflow infrastructures.",
      features: [
        "Up to 5 custom projects / canvases",
        "Infinite Node Canvas layout",
        "Real-time background Auto-Save",
        "Standard JSONB data structures",
        "Single workspace architecture",
      ],
      cta: "Start Free",
      href: "/register",
      popular: false,
    },
    {
      name: "Advanced",
      price: "$49",
      period: "/month",
      description:
        "Perfect for growing teams requiring collaborative pipelines.",
      features: [
        "Up to 100 custom projects / canvases",
        "Advanced Team Collaboration",
        "Workspace RBAC & Roles management",
        "Custom Workflow Modules creation",
        "Priority application support",
      ],
      cta: "Upgrade Engine",
      href: "/register",
      popular: true,
    },
    {
      name: "Pro",
      price: "$149",
      period: "/month",
      description:
        "Built for enterprise scale with unlimited structural power.",
      features: [
        "Unlimited custom projects / canvases",
        "Row-Level Database Security (RLS)",
        "Dedicated Supabase asset node storage",
        "Smart global notification alerts",
        "Dedicated architect manager support",
      ],
      cta: "Go Unlimited",
      href: "/register",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans antialiased selection:bg-zinc-200 flex flex-col">
      <header className="h-16 border-b border-zinc-200/50 bg-white/75 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <Link
          href="/"
          className="flex items-center gap-3 font-extrabold text-sm tracking-tight uppercase"
        >
          <div className="w-7 h-7 bg-zinc-950 rounded-lg flex items-center justify-center text-white text-[10px] font-mono">
            B2
          </div>
          SaaS Engine
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          Back to app &rarr;
        </Link>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950 mb-4">
            Sleek, transparent pricing.
          </h1>
          <p className="text-zinc-500 text-sm md:text-base max-w-md mx-auto font-medium">
            Choose the core structure that scales with your deployment. Fully
            linked with our structural limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white border rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-300 shadow-sm relative ${
                plan.popular
                  ? "border-zinc-950 ring-2 ring-zinc-950/10 md:-translate-y-4 shadow-xl"
                  : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-md"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-950 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-black text-zinc-950 tracking-tight mb-2">
                  {plan.name}
                </h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-6">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black tracking-tight text-zinc-950">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-zinc-400 text-xs font-bold">
                      {plan.period}
                    </span>
                  )}
                </div>

                <div className="h-px bg-zinc-100 mb-8" />

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-3 text-xs text-zinc-600 font-medium"
                    >
                      <Check
                        size={14}
                        className="text-zinc-900 shrink-0 mt-0.5"
                        strokeWidth={3}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all shadow-xs ${
                  plan.popular
                    ? "bg-zinc-950 text-white hover:bg-zinc-800"
                    : "bg-zinc-50 text-zinc-900 border border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
