'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandLogo';
import { fetchAPI } from '@/services/api';
import {
  Rocket,
  ArrowUpRight,
  Search,
  LayoutTemplate,
  KanbanSquare,
  FileText,
  PenTool,
  Clock,
  Database,
  Network,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Users,
} from 'lucide-react';

type PublicRecord = {
  id: string;
  record_data: {
    name?: string;
    updated_by?: string;
    template?: string;
    [key: string]: unknown;
  };
};

const TEMPLATE_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    soft: string;
    bar: string;
  }
> = {
  blank: {
    label: 'Canvas',
    icon: LayoutTemplate,
    accent: 'text-zinc-600 dark:text-zinc-300',
    soft: 'from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900',
    bar: 'bg-zinc-400',
  },
  kanban: {
    label: 'Kanban',
    icon: KanbanSquare,
    accent: 'text-sky-700 dark:text-sky-300',
    soft: 'from-sky-100 to-sky-50 dark:from-sky-950/50 dark:to-zinc-900',
    bar: 'bg-sky-500',
  },
  document: {
    label: 'Document',
    icon: FileText,
    accent: 'text-amber-700 dark:text-amber-300',
    soft: 'from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-zinc-900',
    bar: 'bg-amber-500',
  },
  whiteboard: {
    label: 'Whiteboard',
    icon: PenTool,
    accent: 'text-emerald-700 dark:text-emerald-300',
    soft: 'from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-zinc-900',
    bar: 'bg-emerald-500',
  },
  timeline: {
    label: 'Timeline',
    icon: Clock,
    accent: 'text-rose-700 dark:text-rose-300',
    soft: 'from-rose-100 to-rose-50 dark:from-rose-950/40 dark:to-zinc-900',
    bar: 'bg-rose-500',
  },
  database: {
    label: 'Database',
    icon: Database,
    accent: 'text-teal-700 dark:text-teal-300',
    soft: 'from-teal-100 to-teal-50 dark:from-teal-950/40 dark:to-zinc-900',
    bar: 'bg-teal-500',
  },
  mindmap: {
    label: 'Mind Map',
    icon: Network,
    accent: 'text-fuchsia-700 dark:text-fuchsia-300',
    soft: 'from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-950/40 dark:to-zinc-900',
    bar: 'bg-fuchsia-500',
  },
  retrospective: {
    label: 'Retro',
    icon: MessageSquare,
    accent: 'text-orange-700 dark:text-orange-300',
    soft: 'from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-zinc-900',
    bar: 'bg-orange-500',
  },
};

function getTemplateMeta(template?: string) {
  const key = (template || 'blank').toLowerCase();
  return TEMPLATE_META[key] || TEMPLATE_META.blank;
}

function authorInitials(name?: string) {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'SA';
}

export default function DemoHubPage() {
  const [demos, setDemos] = useState<PublicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');

  useEffect(() => {
    const fetchEightDemos = async () => {
      try {
        const res = await fetchAPI(
          `/api/public/records?limit=8&t=${new Date().getTime()}`
        );
        if (res.ok) {
          const data = await res.json();
          setDemos(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEightDemos();
  }, []);

  const templatesInUse = useMemo(() => {
    const set = new Set<string>();
    demos.forEach((d) => {
      set.add((d.record_data.template || 'blank').toLowerCase());
    });
    return Array.from(set).sort();
  }, [demos]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return demos.filter((d) => {
      const template = (d.record_data.template || 'blank').toLowerCase();
      if (templateFilter !== 'all' && template !== templateFilter) return false;
      if (!q) return true;
      const hay =
        `${d.record_data.name || ''} ${d.record_data.updated_by || ''} ${template}`.toLowerCase();
      return hay.includes(q);
    });
  }, [demos, searchQuery, templateFilter]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-zinc-900 font-sans selection:bg-sky-200/60">
      <div className="pointer-events-none absolute inset-0 bg-[#F4F6F8]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.12),_transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(24,24,27,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <header className="relative z-50 h-14 border-b border-zinc-200/60 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:scale-95 transition-transform inline-flex">
            <BrandMark size="sm" />
          </Link>
          <div className="h-4 w-px bg-zinc-300" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-950">
            Global Template Hub
          </span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors bg-white/90 border border-zinc-200 px-4 py-1.5 rounded-xl shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return Home
        </Link>
      </header>

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 md:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white border border-sky-200/80 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Rocket className="w-5 h-5 text-sky-600" />
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-100 text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-2">
                <Sparkles className="w-3 h-3" />
                Live ecosystem
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-950 tracking-tight">
                System Demonstrations
              </h1>
              <p className="text-sm md:text-base font-medium text-zinc-500 mt-1.5 max-w-xl leading-relaxed">
                Explore the top public system frameworks currently live on the
                engine pipeline — open any to try the canvas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur border border-zinc-200/80 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
                Live
              </p>
              <p className="text-2xl font-black text-zinc-900 tabular-nums leading-none">
                {demos.length}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-sky-200/60 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600/70 mb-0.5">
                Showing
              </p>
              <p className="text-2xl font-black text-sky-700 tabular-nums leading-none">
                {filtered.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-white/80 backdrop-blur-md border border-zinc-200/80 rounded-2xl p-3 md:p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, author, or template…"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400/60 transition-all"
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="appearance-none w-full sm:w-[180px] pl-3 pr-9 py-2.5 bg-zinc-50/80 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400/60 cursor-pointer"
            >
              <option value="all">All templates</option>
              {templatesInUse.map((t) => (
                <option key={t} value={t}>
                  {getTemplateMeta(t).label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white/60 border border-zinc-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="relative overflow-hidden bg-white/90 border border-zinc-200 rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.08),_transparent_60%)] pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-sky-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">
                {demos.length === 0
                  ? 'No public frameworks yet'
                  : 'No matches found'}
              </h3>
              <p className="text-sm font-medium text-zinc-500 max-w-md mx-auto leading-relaxed">
                {demos.length === 0
                  ? 'Be the first to publish. Open a project, use Web Share Options, and make it public.'
                  : 'Try a different search or clear the template filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((d) => {
              const template = (d.record_data.template || 'blank').toLowerCase();
              const meta = getTemplateMeta(template);
              const Icon = meta.icon;
              const title = d.record_data.name || 'Untitled Workspace';
              const author = d.record_data.updated_by || 'System Architect';

              return (
                <a
                  key={d.id}
                  href={`/share/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-zinc-200/80 shadow-sm hover:shadow-lg hover:border-zinc-300 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div
                    className={`relative h-24 bg-gradient-to-br ${meta.soft} border-b border-zinc-100 overflow-hidden`}
                  >
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute top-4 left-4 right-10 h-2 rounded-full bg-white/70" />
                      <div className="absolute top-9 left-4 w-2/3 h-2 rounded-full bg-white/50" />
                      <div className="absolute bottom-3 left-4 flex gap-2">
                        <div className="w-10 h-7 rounded-lg bg-white/80 border border-white/40" />
                        <div className="w-10 h-7 rounded-lg bg-white/60 border border-white/30" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 backdrop-blur border border-zinc-200/60 text-[10px] font-bold uppercase tracking-wider">
                      <Icon className={`w-3 h-3 ${meta.accent}`} />
                      <span className={meta.accent}>{meta.label}</span>
                    </div>
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 ${meta.bar} opacity-80`}
                    />
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight line-clamp-2 group-hover:text-sky-700 transition-colors">
                      {title}
                    </h3>

                    <div className="mt-3 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {authorInitials(author)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-700 truncate">
                          {author}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                          Publisher
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 group-hover:text-sky-600 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        Live preview
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-bold shadow-sm group-hover:bg-sky-600 transition-colors">
                        Open
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
