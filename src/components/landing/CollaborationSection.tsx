'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/landing/Reveal';
import CollaborationLiveMock from '@/components/landing/CollaborationLiveMock';
import { Users, MousePointer2, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: MousePointer2, soft: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-600', key: 1 },
  { icon: Users, soft: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', key: 2 },
  { icon: ShieldCheck, soft: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600', key: 3 },
] as const;

export default function CollaborationSection() {
  const t = useTranslations('LandingPage.collaboration');

  return (
    <section className="py-12 lg:py-32 relative overflow-hidden border-t border-zinc-200/60 mt-6 md:mt-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-sky-50 via-transparent to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <Reveal className="flex-1 space-y-5 md:space-y-6" variant="slide-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-xs font-bold text-sky-700 shadow-sm">
              <Users className="w-4 h-4" strokeWidth={2.25} />
              {t('badge')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight leading-[1.1]">
              {t('title1')}{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-sky-600 to-emerald-600">
                {t('title2')}
              </span>
            </h2>
            <p className="text-base md:text-lg text-zinc-500 leading-relaxed max-w-lg">
              {t('desc')}
            </p>

            <ul className="space-y-3 md:space-y-4 pt-2 md:pt-4">
              {FEATURES.map(({ icon: Icon, soft, border, text, key }) => (
                <li key={key} className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl ${soft} border ${border} flex items-center justify-center shrink-0 ${text} shadow-sm`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm md:text-[15px] font-bold text-zinc-800 leading-snug">
                      {t(`feat${key}Title` as 'feat1Title')}
                    </p>
                    <p className="text-xs md:text-sm text-zinc-500 mt-1 leading-relaxed">
                      {t(`feat${key}Desc` as 'feat1Desc')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="flex-1 w-full" variant="slide-right" delay={120}>
            <CollaborationLiveMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
