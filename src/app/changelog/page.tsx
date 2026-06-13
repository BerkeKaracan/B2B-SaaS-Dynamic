"use client";
import React from "react";
import Link from "next/link";

export default function ChangelogPage() {
  const updates = [
    {
      version: "v2.0.0",
      date: "June 2026",
      title: "Community Framework Showcase & Layout Fixes",
      description:
        "We have safely unrolled the Community Hub pipeline allowing teams to securely preview, clone, and share advanced modular blueprints safely without breaking hydration or unmount lifecycles.",
      tags: ["Feature", "Community Hub", "Performance"],
    },
    {
      version: "v1.5.0",
      date: "May 2026",
      title: "Real-Time Infrastructure Protection & Smart Bell Alerts",
      description:
        "Introduced cross-workspace project invitations coupled with a secure notification engine protected against server-side rendering state updating anomalies.",
      tags: ["Security", "Alerts"],
    },
    {
      version: "v1.0.0",
      date: "April 2026",
      title: "The Birth of SaaS Canvas Architecture",
      description:
        "Initial release of our relational database builder utilizing infinite drag-and-drop frames, PostgreSQL JSONB storage primitives, and zero-latency auto-saving algorithms.",
      tags: ["Core", "Database"],
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
          href="/"
          className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          &larr; Back home
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <div className="mb-16 border-b border-zinc-200 pb-8">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 mb-2">
            Changelog
          </h1>
          <p className="text-zinc-400 text-xs uppercase font-black tracking-widest">
            Tracking engine modifications and updates
          </p>
        </div>

        <div className="space-y-16 relative before:absolute before:inset-y-0 before:left-4 md:before:left-[120px] before:w-0.5 before:bg-zinc-200">
          {updates.map((update) => (
            <div
              key={update.version}
              className="relative flex flex-col md:flex-row gap-4 md:gap-16 pl-10 md:pl-0"
            >
              <div className="md:w-[120px] md:text-right pt-1 shrink-0 flex md:flex-col items-start md:items-end gap-2">
                <span className="text-xs font-black text-zinc-950 block">
                  {update.version}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 block">
                  {update.date}
                </span>
              </div>

              <div className="absolute left-[3px] md:left-[117px] top-2.5 w-2.5 h-2.5 rounded-full bg-zinc-950 ring-4 ring-white z-10" />

              <div className="flex-1 bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-xs">
                <h3 className="text-base font-extrabold text-zinc-950 tracking-tight mb-3">
                  {update.title}
                </h3>
                <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-4">
                  {update.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {update.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-zinc-50 border border-zinc-100 text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
