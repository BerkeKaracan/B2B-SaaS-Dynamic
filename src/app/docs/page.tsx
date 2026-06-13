"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function DocsContent() {
  const searchParams = useSearchParams();
  const activeSec = searchParams.get("sec") || "canvas";

  const sections = [
    {
      id: "canvas",
      title: "Canvas Area Editor",
      content:
        "The infinite grid engine maps multi-page layout structures coordinates recursively. It renders absolute elements inside pan and zoom matrices, scaling vector pathways from 20% to 300% without quality degradation.",
    },
    {
      id: "assets",
      title: "Cloud Media Assets",
      content:
        "Each asset block maps securely into public or protected object storage buckets. Built inside real-time listeners, metadata reflects updates simultaneously across collaborators without trigger delays.",
    },
    {
      id: "autosave",
      title: "Background Streaming",
      content:
        "The auto-save layer hooks deeply into React hook states. Upon observing changes in blocks, frames, or custom meta objects, it delays for exactly 1500ms before sending light PATCH bundles directly to database rows.",
    },
    {
      id: "rbac",
      title: "Workspace RBAC & Security",
      content:
        "Row-Level Security (RLS) protects endpoints natively. User roles (owner, admin, employee) dictate custom record permissions, explicitly blinding non-permitted entries from scanning secure relational charts.",
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
          SaaS Core Architecture
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          &larr; Dashboard
        </Link>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-10 px-6 py-12">
        <aside className="w-full md:w-56 shrink-0 space-y-1">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 mb-3">
            Core Reference Docs
          </p>
          {sections.map((s) => (
            <Link
              key={s.id}
              href={`/docs?sec=${s.id}`}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold block transition-all ${
                activeSec === s.id
                  ? "bg-white border border-zinc-200 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/50"
              }`}
            >
              {s.title}
            </Link>
          ))}
        </aside>

        <main className="flex-1 bg-white border border-zinc-200/80 p-8 rounded-3xl shadow-xs max-w-2xl">
          {sections.map((s) => {
            if (s.id !== activeSec) return null;
            return (
              <div key={s.id} className="animate-in fade-in duration-200">
                <span className="px-2.5 py-1 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                  Architecture Engine Spec
                </span>
                <h2 className="text-2xl font-black text-zinc-950 tracking-tight mt-4 mb-4">
                  {s.title}
                </h2>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                  {s.content}
                </p>
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-xs font-bold">
          Loading Engine Specs...
        </div>
      }
    >
      <DocsContent />
    </Suspense>
  );
}
