'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Footer from '@/components/layout/Footer';
import BrandLogo from '@/components/brand/BrandLogo';
import { fetchAPI } from '@/services/api';
import {
  ArrowLeft,
  ArrowUpRight,
  GitCommitHorizontal,
  Loader2,
  Radio,
  RefreshCw,
  Sparkles,
  Bug,
  Wrench,
  Palette,
  Cog,
} from 'lucide-react';

const GITHUB_REPO = 'https://github.com/BerkeKaracan/B2B-SaaS-Dynamic';

/** Wait for Render cold starts before surfacing an error. */
const RETRY_BUDGET_MS = 60_000;
const RETRY_INTERVAL_MS = 3_000;
const ATTEMPT_TIMEOUT_MS = 12_000;

type ChangelogLabel =
  | 'Feature'
  | 'Bug Fix'
  | 'Improvement'
  | 'Design'
  | 'System Update';

interface ChangelogUpdate {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  labels: string[];
  url: string;
}

type FilterKey = 'all' | ChangelogLabel;

const FILTERS: FilterKey[] = [
  'all',
  'Feature',
  'Bug Fix',
  'Improvement',
  'Design',
  'System Update',
];

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function fetchChangelogWithRetry(
  onRetrying?: () => void
): Promise<ChangelogUpdate[]> {
  const startedAt = Date.now();

  while (true) {
    const elapsedBefore = Date.now() - startedAt;
    const remainingBudget = RETRY_BUDGET_MS - elapsedBefore;
    if (remainingBudget <= 0) break;

    try {
      const res = await fetchAPI('/api/github/changelog?limit=40', {
        signal: AbortSignal.timeout(
          Math.min(ATTEMPT_TIMEOUT_MS, remainingBudget)
        ),
      });
      if (res.ok) {
        return (await res.json()) as ChangelogUpdate[];
      }
    } catch {
      // Render may still be waking — keep trying within the budget.
    }

    const elapsed = Date.now() - startedAt;
    const remaining = RETRY_BUDGET_MS - elapsed;
    if (remaining <= 0) break;

    onRetrying?.();
    await sleep(Math.min(RETRY_INTERVAL_MS, remaining));
  }

  throw new Error('changelog_unavailable');
}

function labelStyle(label: string) {
  switch (label) {
    case 'Feature':
      return {
        chip: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Icon: Sparkles,
      };
    case 'Bug Fix':
      return {
        chip: 'bg-rose-50 text-rose-700 border-rose-100',
        Icon: Bug,
      };
    case 'Improvement':
      return {
        chip: 'bg-sky-50 text-sky-700 border-sky-100',
        Icon: Wrench,
      };
    case 'Design':
      return {
        chip: 'bg-amber-50 text-amber-800 border-amber-100',
        Icon: Palette,
      };
    default:
      return {
        chip: 'bg-zinc-100 text-zinc-600 border-zinc-200',
        Icon: Cog,
      };
  }
}

function timeAgo(dateString: string, locale: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return rtf.format(-mins, 'minute');
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, 'day');
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.floor(months / 12), 'year');
}

export default function ChangelogPage() {
  const t = useTranslations('ChangelogPage');
  const locale = useLocale();
  const [updates, setUpdates] = useState<ChangelogUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const applySuccess = useCallback((data: ChangelogUpdate[]) => {
    setUpdates(data);
    setHasError(false);
    setIsRetrying(false);
    setIsLoading(false);
  }, []);

  const applyFailure = useCallback(() => {
    setUpdates([]);
    setHasError(true);
    setIsRetrying(false);
    setIsLoading(false);
  }, []);

  const loadChangelog = useCallback(async () => {
    setIsLoading(true);
    setIsRetrying(false);
    setHasError(false);
    try {
      const data = await fetchChangelogWithRetry(() => setIsRetrying(true));
      applySuccess(data);
    } catch {
      applyFailure();
    }
  }, [applyFailure, applySuccess]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchChangelogWithRetry(() => {
          if (!cancelled) setIsRetrying(true);
        });
        if (!cancelled) applySuccess(data);
      } catch {
        if (!cancelled) applyFailure();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyFailure, applySuccess]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return updates;
    return updates.filter((u) => u.labels.includes(filter));
  }, [updates, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChangelogUpdate[]>();
    const unknown = t('unknownMonth');
    for (const update of filtered) {
      const d = new Date(update.date);
      const key = Number.isNaN(d.getTime())
        ? unknown
        : d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
      const list = map.get(key) || [];
      list.push(update);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered, locale, t]);

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: updates.length,
      Feature: 0,
      'Bug Fix': 0,
      Improvement: 0,
      Design: 0,
      'System Update': 0,
    };
    for (const u of updates) {
      for (const label of u.labels) {
        if (label in base) {
          base[label as ChangelogLabel] += 1;
        }
      }
    }
    return base;
  }, [updates]);

  const filterLabel = (key: FilterKey) => {
    if (key === 'all') return t('filters.all');
    if (key === 'Feature') return t('filters.feature');
    if (key === 'Bug Fix') return t('filters.bugFix');
    if (key === 'Improvement') return t('filters.improvement');
    if (key === 'Design') return t('filters.design');
    return t('filters.system');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-zinc-900 font-sans flex flex-col selection:bg-sky-200/60">
      <header className="h-16 border-b border-zinc-200/60 bg-white/75 backdrop-blur-xl fixed top-0 w-full z-50 px-6 lg:px-10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          <span className="text-sm font-semibold text-zinc-500 group-hover:text-zinc-900 transition-colors">
            {t('back')}
          </span>
        </Link>
        <BrandLogo href={false} size="sm" />
        <div className="w-16" />
      </header>

      <main className="flex-1 pt-28 pb-16 px-6 max-w-4xl mx-auto w-full">
        <div className="relative mb-12 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white px-6 py-10 md:px-10 md:py-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 12% 20%, rgba(56,189,248,0.16), transparent 45%), radial-gradient(ellipse at 88% 10%, rgba(16,185,129,0.12), transparent 40%), linear-gradient(to bottom, #ffffff, #f8fafc)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(24,24,27,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.05) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-zinc-200 text-xs font-semibold text-zinc-600 mb-5 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              {t('badge')}
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-950 mb-4 leading-[1.1]">
              {t('title')}
            </h1>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl leading-relaxed mb-7">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                {t('viewOnGithub')}
                <ArrowUpRight className="w-4 h-4 opacity-80" />
              </a>
              <button
                type="button"
                onClick={loadChangelog}
                disabled={isLoading}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                {t('refresh')}
              </button>
              {!isLoading && !hasError && (
                <span className="text-xs font-medium text-zinc-400 tabular-nums">
                  {t('commitCount', { count: updates.length })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {FILTERS.map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                {filterLabel(key)}
                <span
                  className={`tabular-nums ${
                    active ? 'text-zinc-300' : 'text-zinc-400'
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-zinc-800" />
            <p className="text-sm font-semibold tracking-wide uppercase">
              {isRetrying ? t('waking') : t('loading')}
            </p>
            {isRetrying && (
              <p className="mt-2 text-xs font-medium text-zinc-400 max-w-sm text-center">
                {t('wakingHint')}
              </p>
            )}
          </div>
        ) : hasError ? (
          <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-zinc-900 mb-2">
              {t('errorTitle')}
            </p>
            <p className="text-sm text-zinc-500 mb-5">{t('errorDesc')}</p>
            <button
              type="button"
              onClick={loadChangelog}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-10 text-center">
            <GitCommitHorizontal className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-800">{t('empty')}</p>
            <p className="text-xs text-zinc-500 mt-1.5">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(([month, items]) => (
              <section key={month}>
                <div className="sticky top-20 z-20 mb-5 -mx-1 px-1 py-2 backdrop-blur-md bg-[#f7f9fb]/85">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    {month}
                  </h2>
                </div>

                <div className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200">
                  {items.map((update) => {
                    const primaryLabel = update.labels[0] || 'System Update';
                    const { chip, Icon } = labelStyle(primaryLabel);
                    return (
                      <article
                        key={update.id}
                        className="relative pl-12 group"
                      >
                        <div className="absolute left-[9px] top-5 w-3.5 h-3.5 rounded-full bg-white border-2 border-zinc-300 group-hover:border-sky-500 group-hover:bg-sky-50 transition-colors z-10" />

                        <a
                          href={update.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-2xl border border-zinc-200/90 bg-white p-5 md:p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] hover:border-zinc-300 hover:shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition-all"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-semibold uppercase tracking-wider rounded-md ${chip}`}
                            >
                              <Icon className="w-3 h-3" />
                              {filterLabel(primaryLabel as FilterKey)}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">
                              {update.id}
                            </span>
                            <span className="text-[11px] font-medium text-zinc-400 ml-auto">
                              {timeAgo(update.date, locale)}
                              <span className="mx-1.5 text-zinc-300">·</span>
                              {formatDate(update.date)}
                            </span>
                          </div>

                          <h3 className="text-[15px] md:text-base font-semibold text-zinc-950 tracking-tight group-hover:text-sky-800 transition-colors">
                            {update.title}
                          </h3>

                          {update.description ? (
                            <p className="mt-2 text-sm text-zinc-500 leading-relaxed whitespace-pre-wrap line-clamp-4">
                              {update.description}
                            </p>
                          ) : null}

                          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                            <span className="text-[11px] font-medium text-zinc-400 truncate">
                              {t('byAuthor', { author: update.author })}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 group-hover:text-sky-700 transition-colors shrink-0">
                              {t('viewCommit')}
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </a>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
