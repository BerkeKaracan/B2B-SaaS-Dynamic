'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetchAPI } from '@/services/api';
import {
  Globe,
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
  Users,
  Sparkles,
  ExternalLink,
  MessageSquareHeart,
} from 'lucide-react';
import { FEEDBACK_PORTAL_URL } from '@/lib/feedbackPortal';

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

export default function CommunityHubPage() {
  const [demos, setDemos] = useState<PublicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCommunityRecords = async () => {
      try {
        const res = await fetchAPI(
          `/api/public/records?limit=20&t=${new Date().getTime()}`
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
    fetchCommunityRecords();
  }, []);

  const templatesInUse = useMemo(() => {
    const set = new Set<string>();
    demos.forEach((d) => {
      const t = (d.record_data.template || 'blank').toLowerCase();
      set.add(t);
    });
    return Array.from(set).sort();
  }, [demos]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return demos.filter((d) => {
      const template = (d.record_data.template || 'blank').toLowerCase();
      if (templateFilter !== 'all' && template !== templateFilter) return false;
      if (!q) return true;
      const hay = `${d.record_data.name || ''} ${d.record_data.updated_by || ''} ${template}`.toLowerCase();
      return hay.includes(q);
    });
  }, [demos, searchQuery, templateFilter]);

  return (
    <div className="relative flex-1 overflow-y-auto h-full w-full custom-scrollbar">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[#F4F6F8] dark:bg-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.06),transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(24,24,27,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-6xl mx-auto w-full p-6 md:p-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8 md:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Globe className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300 mb-2">
                <Sparkles className="w-3 h-3" />
                Public gallery
              </div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                Community Hub
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium leading-relaxed max-w-xl">
                Browse frameworks and templates published by workspaces around
                the world — open any to explore the live canvas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
                Published
              </p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                {demos.length}
              </p>
            </div>
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
                Showing
              </p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                {filtered.length}
              </p>
            </div>
          </div>
        </div>

        <a
          href={FEEDBACK_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 md:px-5 md:py-4 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Feedback & Support
            </p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Share bugs, feature ideas, and votes in our feedback portal for
              this product.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 shrink-0 group-hover:gap-2 transition-all">
            Open portal
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </span>
        </a>

        {/* Toolbar */}
        <div className="mb-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 md:p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, author, or template…"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400/60 transition-all"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="appearance-none w-full sm:w-45 pl-3 pr-9 py-2.5 bg-zinc-50/80 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400/60 cursor-pointer"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white/60 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="relative overflow-hidden bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08),transparent_60%)] pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Users className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">
                {demos.length === 0
                  ? 'No public frameworks yet'
                  : 'No matches found'}
              </h3>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {demos.length === 0
                  ? 'Be the first to publish. Open a project, use Web Share Options, and make it public to the hub.'
                  : 'Try a different search or clear the template filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {/* Preview strip */}
                  <div
                    className={`relative h-28 bg-linear-to-br ${meta.soft} border-b border-zinc-100 dark:border-zinc-800 overflow-hidden`}
                  >
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute top-4 left-4 right-10 h-2 rounded-full bg-white/70 dark:bg-white/10" />
                      <div className="absolute top-9 left-4 w-2/3 h-2 rounded-full bg-white/50 dark:bg-white/5" />
                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <div className="w-12 h-8 rounded-lg bg-white/80 dark:bg-white/10 border border-white/40 dark:border-white/5" />
                        <div className="w-12 h-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/5" />
                        <div className="w-12 h-8 rounded-lg bg-white/40 dark:bg-white/3 border border-white/20 dark:border-white/5" />
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 dark:bg-zinc-950/70 backdrop-blur border border-zinc-200/60 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider">
                      <Icon className={`w-3 h-3 ${meta.accent}`} />
                      <span className={meta.accent}>{meta.label}</span>
                    </div>

                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 ${meta.bar} opacity-80`}
                    />
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight line-clamp-2 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                      {title}
                    </h3>

                    <div className="mt-3 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black flex items-center justify-center shrink-0">
                        {authorInitials(author)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                          {author}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                          Publisher
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        Live preview
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-sm group-hover:bg-sky-600 dark:group-hover:bg-sky-400 transition-colors">
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
      </div>
    </div>
  );
}
