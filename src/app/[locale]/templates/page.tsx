'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BookOpen,
  LayoutGrid,
  Rocket,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import MarketingPageChrome, {
  MarketingBreadcrumb,
  MarketingRelatedGrid,
} from '@/components/landing/MarketingPageChrome';
import {
  PROJECT_TEMPLATES,
  type ProjectTemplateId,
} from '@/lib/templates';

type SoftTone = {
  soft: string;
  iconWrap: string;
  bar: string;
  hover: string;
};

const TONE_BY_ID: Record<ProjectTemplateId, SoftTone> = {
  blank: {
    soft: 'from-sky-100 to-sky-50',
    iconWrap: 'bg-sky-50 border-sky-100 text-sky-600',
    bar: 'bg-sky-500',
    hover: 'hover:border-sky-200',
  },
  kanban: {
    soft: 'from-indigo-100 to-indigo-50',
    iconWrap: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    bar: 'bg-indigo-500',
    hover: 'hover:border-indigo-200',
  },
  document: {
    soft: 'from-amber-100 to-amber-50',
    iconWrap: 'bg-amber-50 border-amber-100 text-amber-600',
    bar: 'bg-amber-500',
    hover: 'hover:border-amber-200',
  },
  whiteboard: {
    soft: 'from-emerald-100 to-emerald-50',
    iconWrap: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    bar: 'bg-emerald-500',
    hover: 'hover:border-emerald-200',
  },
  timeline: {
    soft: 'from-violet-100 to-violet-50',
    iconWrap: 'bg-violet-50 border-violet-100 text-violet-600',
    bar: 'bg-violet-500',
    hover: 'hover:border-violet-200',
  },
  database: {
    soft: 'from-teal-100 to-teal-50',
    iconWrap: 'bg-teal-50 border-teal-100 text-teal-600',
    bar: 'bg-teal-500',
    hover: 'hover:border-teal-200',
  },
  mindmap: {
    soft: 'from-orange-100 to-orange-50',
    iconWrap: 'bg-orange-50 border-orange-100 text-orange-600',
    bar: 'bg-orange-500',
    hover: 'hover:border-orange-200',
  },
      retrospective: {
        soft: 'from-rose-100 to-rose-50',
        iconWrap: 'bg-rose-50 border-rose-100 text-rose-600',
        bar: 'bg-rose-500',
        hover: 'hover:border-rose-200',
      },
      calendar: {
        soft: 'from-red-100 to-red-50',
        iconWrap: 'bg-red-50 border-red-100 text-red-600',
        bar: 'bg-red-500',
        hover: 'hover:border-red-200',
      },
    };

function TemplatePreview({ id }: { id: ProjectTemplateId }) {
  switch (id) {
    case 'blank':
      return (
        <div className="absolute inset-3 opacity-70">
          <div className="absolute left-[8%] top-[18%] w-[34%] h-[36%] rounded-lg bg-white/85 border border-white/90 shadow-sm" />
          <div className="absolute right-[10%] top-[22%] w-[38%] h-[28%] rounded-lg bg-white/70 border border-white/80" />
          <div className="absolute left-[22%] bottom-[14%] w-[42%] h-[30%] rounded-lg bg-white/75 border border-white/85" />
        </div>
      );
    case 'kanban':
      return (
        <div className="absolute inset-3 grid grid-cols-3 gap-1.5 opacity-75">
          {[0, 1, 2].map((col) => (
            <div key={col} className="rounded-lg bg-white/70 p-1.5 space-y-1">
              <div className="h-1 w-1/2 rounded-full bg-zinc-300/80" />
              <div className="h-5 rounded-md bg-white shadow-sm" />
              <div className="h-5 rounded-md bg-white/80" />
              {col < 2 ? <div className="h-5 rounded-md bg-white/60" /> : null}
            </div>
          ))}
        </div>
      );
    case 'document':
      return (
        <div className="absolute inset-4 flex flex-col gap-1.5 opacity-75">
          <div className="h-2 w-2/5 rounded-full bg-white/90" />
          <div className="h-1.5 w-full rounded-full bg-white/70" />
          <div className="h-1.5 w-[92%] rounded-full bg-white/60" />
          <div className="h-1.5 w-[85%] rounded-full bg-white/50" />
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/55" />
          <div className="h-1.5 w-[78%] rounded-full bg-white/45" />
        </div>
      );
    case 'whiteboard':
      return (
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-[18%] top-[28%] w-[42%] h-0.5 rotate-[-18deg] bg-white/80 rounded-full" />
          <div className="absolute left-[28%] top-[42%] w-[36%] h-0.5 rotate-[12deg] bg-white/65 rounded-full" />
          <div className="absolute right-[22%] top-[30%] w-10 h-10 rounded-full border-2 border-white/70" />
          <div className="absolute left-[20%] bottom-[22%] w-14 h-8 rounded-lg border border-white/60 bg-white/30" />
        </div>
      );
    case 'timeline':
      return (
        <div className="absolute inset-3 flex flex-col gap-2 opacity-75">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-2">
              <div className="w-6 h-1.5 rounded-full bg-white/50 shrink-0" />
              <div
                className="h-5 rounded-md bg-white/80 shadow-sm"
                style={{ width: `${48 + row * 14}%` }}
              />
            </div>
          ))}
        </div>
      );
    case 'database':
      return (
        <div className="absolute inset-3 rounded-lg overflow-hidden bg-white/55 opacity-80">
          <div className="grid grid-cols-3 gap-px bg-white/40">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`h-5 ${i < 3 ? 'bg-white/90' : 'bg-white/65'}`}
              />
            ))}
          </div>
        </div>
      );
    case 'mindmap':
      return (
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-6 rounded-full bg-white/90 shadow-sm" />
          <div className="absolute left-[18%] top-[28%] w-8 h-5 rounded-full bg-white/70" />
          <div className="absolute right-[16%] top-[26%] w-8 h-5 rounded-full bg-white/70" />
          <div className="absolute left-[22%] bottom-[24%] w-8 h-5 rounded-full bg-white/60" />
          <div className="absolute right-[20%] bottom-[22%] w-8 h-5 rounded-full bg-white/60" />
        </div>
      );
    case 'retrospective':
      return (
        <div className="absolute inset-3 grid grid-cols-3 gap-1.5 opacity-75">
          {['Glad', 'Sad', 'Mad'].map((label) => (
            <div
              key={label}
              className="rounded-lg bg-white/70 p-1.5 flex flex-col gap-1"
            >
              <div className="h-1 w-3/5 rounded-full bg-zinc-300/70 mx-auto" />
              <div className="h-4 rounded bg-white/90" />
              <div className="h-4 rounded bg-white/70" />
            </div>
          ))}
        </div>
      );
    case 'calendar':
      return (
        <div className="absolute inset-3 grid grid-cols-7 gap-px opacity-80">
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-[3px] ${
                i === 10 ? 'bg-white shadow-sm' : 'bg-white/55'
              }`}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}

export default function TemplatesPage() {
  const t = useTranslations('TemplatesPage');
  const tPlat = useTranslations('PlatformPage');

  const related = [
    {
      href: '/demo',
      icon: Rocket as LucideIcon,
      label: t('related.demo'),
      desc: t('related.demoDesc'),
    },
    {
      href: '/features',
      icon: Sparkles as LucideIcon,
      label: t('related.features'),
      desc: t('related.featuresDesc'),
    },
    {
      href: '/docs',
      icon: BookOpen as LucideIcon,
      label: t('related.docs'),
      desc: t('related.docsDesc'),
    },
    {
      href: '/platform/canvas',
      icon: LayoutGrid as LucideIcon,
      label: t('related.canvas'),
      desc: t('related.canvasDesc'),
    },
  ];

  return (
    <MarketingPageChrome>
      <main className="flex-1 pt-28 md:pt-32 pb-20 px-6 max-w-6xl mx-auto w-full">
        <MarketingBreadcrumb
          items={[
            { href: '/', label: tPlat('crumb.home') },
            { label: t('badge') },
          ]}
        />

        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-xs font-bold text-sky-700 mb-6">
            <LayoutGrid className="w-3.5 h-3.5 text-sky-500" />
            {t('badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tight mb-5 leading-[1.08]">
            {t('title')}
          </h1>
          <p className="text-base md:text-lg text-zinc-500 leading-relaxed font-medium">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-16">
          {PROJECT_TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            const tone = TONE_BY_ID[tpl.id];
            return (
              <Link
                key={tpl.id}
                href="/register"
                className={`group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 ${tone.hover} transition-all`}
              >
                <div
                  className={`relative h-28 bg-linear-to-br ${tone.soft} border-b border-zinc-100/80`}
                >
                  <TemplatePreview id={tpl.id} />
                  <div
                    className={`absolute bottom-0 inset-x-0 h-0.5 ${tone.bar}`}
                  />
                  <div
                    className={`absolute top-3 right-3 w-9 h-9 rounded-xl border flex items-center justify-center bg-white/95 shadow-sm ${tone.iconWrap}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-[15px] font-black text-zinc-950 tracking-tight">
                      {t(`items.${tpl.id}.title`)}
                    </h3>
                  </div>
                  <span className="inline-flex self-start text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 mb-2">
                    {tpl.isStandaloneBoard
                      ? t('kind.board')
                      : t('kind.canvas')}
                  </span>
                  <p className="text-[12px] text-zinc-500 font-medium leading-relaxed flex-1">
                    {t(`items.${tpl.id}.desc`)}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold text-zinc-700 group-hover:text-sky-700 transition-colors">
                    {t('openCta')}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mb-16 rounded-[2rem] bg-zinc-950 p-8 md:p-12 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                {t('cta.title')}
              </h2>
              <p className="text-sm md:text-base text-zinc-400 font-medium leading-relaxed">
                {t('cta.subtitle')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-zinc-950 rounded-2xl font-extrabold text-sm hover:bg-zinc-100 transition-all"
              >
                {t('cta.button')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 text-white ring-1 ring-white/15 rounded-2xl font-bold text-sm hover:bg-white/15 transition-all"
              >
                {t('cta.demo')}
              </Link>
            </div>
          </div>
        </div>

        <MarketingRelatedGrid title={t('related.title')} links={related} />
      </main>
    </MarketingPageChrome>
  );
}
