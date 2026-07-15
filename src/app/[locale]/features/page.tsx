'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Footer from '@/components/layout/Footer';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingAtmosphere from '@/components/landing/LandingAtmosphere';
import {
  Layers,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  Cloud,
} from 'lucide-react';

const cards = [
  {
    href: '/platform/canvas',
    icon: Layers,
    soft: 'from-sky-100 to-sky-50',
    iconWrap: 'bg-sky-50 border-sky-100 text-sky-600',
    bar: 'bg-sky-500',
    hover: 'hover:border-sky-200',
    titleKey: 'canvas.title' as const,
    descKey: 'canvas.desc' as const,
  },
  {
    href: '/platform/sync',
    icon: Zap,
    soft: 'from-emerald-100 to-emerald-50',
    iconWrap: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    bar: 'bg-emerald-500',
    hover: 'hover:border-emerald-200',
    titleKey: 'realtime.title' as const,
    descKey: 'realtime.desc' as const,
  },
  {
    href: '/platform/rbac',
    icon: Lock,
    soft: 'from-teal-100 to-teal-50',
    iconWrap: 'bg-teal-50 border-teal-100 text-teal-600',
    bar: 'bg-teal-500',
    hover: 'hover:border-teal-200',
    titleKey: 'security.title' as const,
    descKey: 'security.desc' as const,
  },
  {
    href: '/platform/storage',
    icon: Cloud,
    soft: 'from-amber-100 to-amber-50',
    iconWrap: 'bg-amber-50 border-amber-100 text-amber-600',
    bar: 'bg-amber-500',
    hover: 'hover:border-amber-200',
    titleKey: 'storage.title' as const,
    descKey: 'storage.desc' as const,
  },
];

export default function FeaturesPage() {
  const t = useTranslations('FeaturesPage');

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-zinc-900 font-sans flex flex-col selection:bg-sky-100 relative overflow-hidden">
      <LandingAtmosphere />
      <LandingNavbar />

      <main className="relative z-10 flex-1 pt-28 md:pt-32 pb-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-xs font-bold text-sky-700 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            {t('badge')}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-950 tracking-tight mb-6 leading-[1.08]">
            {t('title').split('.')[0]}. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-sky-600 to-cyan-500">
              {t('title').split('.')[1]}.
            </span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed font-medium">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md ${card.hover} transition-all`}
              >
                <div className={`h-20 bg-gradient-to-br ${card.soft} border-b border-zinc-100 relative`}>
                  <div
                    className={`absolute top-4 left-5 w-11 h-11 rounded-2xl border flex items-center justify-center bg-white/90 ${card.iconWrap}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`absolute bottom-0 inset-x-0 h-1 ${card.bar}`} />
                </div>
                <div className="p-7 md:p-8">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl font-black text-zinc-950 tracking-tight">
                      {t(card.titleKey)}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                  <p className="text-zinc-500 leading-relaxed font-medium text-sm md:text-[15px]">
                    {t(card.descKey)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 md:mt-20 rounded-[2rem] bg-zinc-950 p-10 md:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.2),transparent_55%)]" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8 tracking-tight">
              {t('cta.title')}
            </h2>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-extrabold text-sm hover:bg-sky-50 transition-colors"
            >
              {t('cta.button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
