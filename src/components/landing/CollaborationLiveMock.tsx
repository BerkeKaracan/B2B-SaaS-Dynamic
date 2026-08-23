'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const CURSORS = [
  { id: 'alex', color: 'text-sky-600', bg: 'bg-sky-500', x: '18%', y: '28%', dx: 6, dy: -4 },
  { id: 'sam', color: 'text-emerald-600', bg: 'bg-emerald-500', x: '62%', y: '52%', dx: -5, dy: 5 },
  { id: 'jordan', color: 'text-violet-600', bg: 'bg-violet-500', x: '44%', y: '68%', dx: 4, dy: -3 },
] as const;

export default function CollaborationLiveMock() {
  const t = useTranslations('LandingPage.collaboration');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [pulseBlock, setPulseBlock] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setPulseBlock((p) => (p + 1) % 2);
    }, 3200);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion]);

  return (
    <div className="relative w-full">
      <div className="absolute -inset-3 md:-inset-5 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1),transparent_70%)] pointer-events-none" />

      <div className="relative rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(24,24,27,0.25)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex -space-x-2">
              {(['userInitial1', 'userInitial2', 'userInitial3'] as const).map((key, i) => (
                <span
                  key={key}
                  className={`w-7 h-7 rounded-full border-2 border-white ${CURSORS[i].bg} flex items-center justify-center text-[10px] font-black text-white shadow-sm`}
                >
                  {t(key)}
                </span>
              ))}
            </div>
            <span className="text-[11px] font-bold text-zinc-500 truncate hidden sm:inline">
              {t('mockLive')}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black uppercase tracking-wider text-emerald-700 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>

        <div className="relative aspect-[4/3] md:aspect-[16/10] bg-[#fafafa] overflow-hidden">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(24,24,27,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div
            className={`absolute left-[8%] top-[14%] w-[38%] rounded-xl border p-3 transition-all duration-700 ${
              pulseBlock === 0
                ? 'border-sky-300 bg-sky-50/90 shadow-[0_0_0_3px_rgba(14,165,233,0.15)]'
                : 'border-zinc-200/80 bg-white/90 shadow-sm'
            }`}
          >
            <div className="h-2 w-2/5 rounded-full bg-zinc-300 mb-2" />
            <div className="h-2 w-full rounded-full bg-zinc-200/80 mb-1.5" />
            <div className="h-2 w-4/5 rounded-full bg-zinc-200/60" />
            <p className="mt-2 text-[10px] font-bold text-zinc-500">{t('mockBlock1')}</p>
          </div>

          <div
            className={`absolute right-[8%] top-[32%] w-[34%] rounded-xl border p-3 transition-all duration-700 ${
              pulseBlock === 1
                ? 'border-emerald-300 bg-emerald-50/90 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                : 'border-zinc-200/80 bg-white/90 shadow-sm'
            }`}
          >
            <div className="flex gap-1 mb-2">
              <div className="h-5 flex-1 rounded-md bg-emerald-200/60" />
              <div className="h-5 flex-1 rounded-md bg-emerald-200/40" />
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-200/70" />
            <p className="mt-2 text-[10px] font-bold text-zinc-500">{t('mockBlock2')}</p>
          </div>

          <div className="absolute left-[28%] bottom-[14%] w-[30%] rounded-xl border border-zinc-200/80 bg-white/90 p-3 shadow-sm">
            <div className="grid grid-cols-3 gap-1">
              <div className="aspect-square rounded-md bg-violet-100" />
              <div className="aspect-square rounded-md bg-violet-100/70" />
              <div className="aspect-square rounded-md bg-violet-100/50" />
            </div>
          </div>

          {CURSORS.map((c, i) => (
            <div
              key={c.id}
              className={`absolute pointer-events-none lp-collab-cursor lp-collab-cursor-${i + 1}`}
              style={{ left: c.x, top: c.y }}
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-5 h-5 drop-shadow-md ${c.color}`}
                fill="currentColor"
              >
                <path d="M5.5 3.21V20.8c0 .1.1.2.2.15l5.3-3.05 2.7 6.05c.05.1.2.15.3.05l2.05-1c.1-.05.15-.2.05-.3l-2.7-6.05 5.9-.35c.15 0 .2-.2.1-.3L5.7 3.05c-.1-.1-.2 0-.2.16z" />
              </svg>
              <span
                className={`absolute left-4 top-4 px-1.5 py-0.5 rounded-md text-[9px] font-black text-white whitespace-nowrap ${c.bg}`}
              >
                {t(`user${i + 1}` as 'user1')}
              </span>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-zinc-100 bg-white/90">
          <p className="text-[11px] font-medium text-zinc-500">
            <span className="font-bold text-emerald-600">{t('user2')}</span>{' '}
            {t('mockActivity')}
          </p>
        </div>
      </div>
    </div>
  );
}
