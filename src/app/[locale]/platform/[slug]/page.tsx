'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Database,
  Lock,
  Cloud,
  type LucideIcon,
} from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingAtmosphere from '@/components/landing/LandingAtmosphere';
import Footer from '@/components/layout/Footer';

type PlatformSlug = 'canvas' | 'sync' | 'rbac' | 'storage';

type PlatformMeta = {
  icon: LucideIcon;
  accent: string;
  soft: string;
  bar: string;
  iconWrap: string;
};

const PLATFORM_META: Record<PlatformSlug, PlatformMeta> = {
  canvas: {
    icon: Layers,
    accent: 'text-sky-700',
    soft: 'from-sky-100 to-sky-50',
    bar: 'bg-sky-500',
    iconWrap: 'bg-sky-50 border-sky-100 text-sky-600',
  },
  sync: {
    icon: Database,
    accent: 'text-emerald-700',
    soft: 'from-emerald-100 to-emerald-50',
    bar: 'bg-emerald-500',
    iconWrap: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  },
  rbac: {
    icon: Lock,
    accent: 'text-teal-700',
    soft: 'from-teal-100 to-teal-50',
    bar: 'bg-teal-500',
    iconWrap: 'bg-teal-50 border-teal-100 text-teal-600',
  },
  storage: {
    icon: Cloud,
    accent: 'text-amber-700',
    soft: 'from-amber-100 to-amber-50',
    bar: 'bg-amber-500',
    iconWrap: 'bg-amber-50 border-amber-100 text-amber-600',
  },
};

const SLUGS: PlatformSlug[] = ['canvas', 'sync', 'rbac', 'storage'];

function isPlatformSlug(value: string): value is PlatformSlug {
  return SLUGS.includes(value as PlatformSlug);
}

export default function PlatformCapabilityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = use(params);
  const slug = resolved.slug;
  const t = useTranslations('PlatformPage');
  const tNav = useTranslations('LandingPage.nav');

  if (!isPlatformSlug(slug)) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-black text-zinc-950 mb-2">{t('notFound.title')}</h2>
        <p className="text-sm text-zinc-500 mb-6 max-w-sm">{t('notFound.desc')}</p>
        <Link
          href="/features"
          className="px-4 py-2.5 bg-zinc-950 text-white font-bold rounded-xl text-sm hover:bg-sky-600 transition-colors"
        >
          {t('notFound.cta')}
        </Link>
      </div>
    );
  }

  const meta = PLATFORM_META[slug];
  const Icon = meta.icon;
  const featureCount = 3;
  const features = Array.from({ length: featureCount }, (_, i) => ({
    title: t(`${slug}.features.${i}.title`),
    desc: t(`${slug}.features.${i}.desc`),
  }));

  const siblings = SLUGS.filter((s) => s !== slug).map((s) => ({
    slug: s,
    title:
      s === 'canvas'
        ? tNav('spatialCanvas')
        : s === 'sync'
          ? tNav('realTimeSync')
          : s === 'rbac'
            ? tNav('enterpriseRbac')
            : tNav('cloudStorage'),
    meta: PLATFORM_META[s],
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-zinc-900 font-sans antialiased selection:bg-sky-100 flex flex-col relative overflow-hidden">
      <LandingAtmosphere />
      <LandingNavbar />

      <main className="relative z-10 flex-1 pt-28 md:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 md:mb-14">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest mb-5 bg-gradient-to-br ${meta.soft} border-white/80`}
            >
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${meta.iconWrap}`}>
                <Icon className="w-3 h-3" />
              </span>
              <span className={meta.accent}>{t(`${slug}.badge`)}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight text-zinc-950 leading-[1.08] max-w-3xl mb-5">
              {t(`${slug}.title`)}
            </h1>
            <p className="text-base md:text-lg text-zinc-500 font-medium leading-relaxed max-w-2xl mb-8">
              {t(`${slug}.subtitle`)}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-950 text-white text-sm font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-zinc-950/10"
              >
                {t('cta.primary')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-sm font-bold hover:border-sky-200 hover:text-sky-700 transition-colors"
              >
                {t('cta.secondary')}
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm mb-16">
            <div className={`h-1.5 w-full ${meta.bar}`} />
            <div className={`bg-gradient-to-br ${meta.soft} px-6 md:px-10 py-8 md:py-10 border-b border-zinc-100`}>
              <p className="text-sm md:text-base text-zinc-600 font-medium leading-relaxed max-w-3xl">
                {t(`${slug}.body`)}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
              {features.map((feat) => (
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
                {t('more.title')}
              </p>
              <h2 className="text-xl font-black text-zinc-950 tracking-tight">
                {t('more.subtitle')}
              </h2>
            </div>
            <Link
              href="/features"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors"
            >
              {t('more.all')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-16">
            {siblings.map((item) => {
              const SibIcon = item.meta.icon;
              return (
                <Link
                  key={item.slug}
                  href={`/platform/${item.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white hover:border-sky-200 hover:shadow-md transition-all"
                >
                  <div className={`h-14 bg-gradient-to-br ${item.meta.soft} border-b border-zinc-100 relative`}>
                    <div
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl border flex items-center justify-center bg-white/90 ${item.meta.iconWrap}`}
                    >
                      <SibIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className={`absolute bottom-0 inset-x-0 h-1 ${item.meta.bar} opacity-80`} />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-black text-zinc-900 group-hover:text-sky-700 transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-1 line-clamp-2">
                      {t(`${item.slug}.subtitle`)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="rounded-[2rem] bg-zinc-950 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.22),transparent_55%)]" />
            <div className="relative z-10 max-w-xl">
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">
                {t('bottomCta.title')}
              </h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                {t('bottomCta.desc')}
              </p>
            </div>
            <Link
              href="/register"
              className="relative z-10 shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-zinc-950 text-sm font-black hover:bg-sky-50 transition-colors"
            >
              {t('bottomCta.button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
