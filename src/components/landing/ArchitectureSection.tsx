'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/landing/Reveal';
import {
  Boxes,
  Cpu,
  Database,
  Activity,
  Container,
  Zap,
  ChevronRight,
} from 'lucide-react';

type LayerAccent = {
  icon: React.ReactNode;
  rail: string;
  soft: string;
  ring: string;
  text: string;
  bar: string;
};

const ACCENTS: LayerAccent[] = [
  {
    icon: <Zap className="w-4 h-4" strokeWidth={2.5} />,
    rail: 'bg-zinc-900',
    soft: 'bg-zinc-100',
    ring: 'ring-zinc-900/15',
    text: 'text-zinc-900',
    bar: 'from-zinc-900 to-zinc-600',
  },
  {
    icon: <Cpu className="w-4 h-4" strokeWidth={2.5} />,
    rail: 'bg-emerald-500',
    soft: 'bg-emerald-50',
    ring: 'ring-emerald-500/20',
    text: 'text-emerald-700',
    bar: 'from-emerald-600 to-teal-500',
  },
  {
    icon: <Boxes className="w-4 h-4" strokeWidth={2.5} />,
    rail: 'bg-sky-500',
    soft: 'bg-sky-50',
    ring: 'ring-sky-500/20',
    text: 'text-sky-700',
    bar: 'from-sky-600 to-cyan-500',
  },
  {
    icon: <Database className="w-4 h-4" strokeWidth={2.5} />,
    rail: 'bg-teal-600',
    soft: 'bg-teal-50',
    ring: 'ring-teal-500/20',
    text: 'text-teal-700',
    bar: 'from-teal-600 to-emerald-500',
  },
  {
    icon: <Activity className="w-4 h-4" strokeWidth={2.5} />,
    rail: 'bg-amber-500',
    soft: 'bg-amber-50',
    ring: 'ring-amber-500/25',
    text: 'text-amber-700',
    bar: 'from-amber-500 to-orange-500',
  },
  {
    icon: <Container className="w-4 h-4" strokeWidth={2.5} />,
    rail: 'bg-slate-700',
    soft: 'bg-slate-100',
    ring: 'ring-slate-500/20',
    text: 'text-slate-700',
    bar: 'from-slate-700 to-slate-500',
  },
];

const LAYER_KEYS = [1, 2, 3, 4, 5, 6] as const;

export default function ArchitectureSection() {
  const t = useTranslations('LandingPage.architecture');
  const [active, setActive] = useState(0);
  const accent = ACCENTS[active];

  return (
    <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden border-t border-zinc-200/60 mt-6 md:mt-10">
      {/* Atmosphere — blueprint grid + soft wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(24,24,27,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.035) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] w-[480px] h-[480px] rounded-full bg-sky-200/30 blur-3xl -z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-8%] w-[360px] h-[360px] rounded-full bg-emerald-100/50 blur-3xl -z-10"
      />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <Reveal className="lg:col-span-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-600/90 mb-4">
              System stack
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tight leading-[1.08]">
              {t('title1')}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-500 via-zinc-400 to-sky-500">
                {t('title2')}
              </span>
            </h2>
            <p className="mt-5 text-sm md:text-base text-zinc-500 leading-relaxed font-medium max-w-md">
              {t('desc')}
            </p>

            {/* Mini signal path */}
            <div className="mt-8 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              {['Edge', 'API', 'RAG', 'DB', 'APM', 'Ship'].map((label, i) => (
                <React.Fragment key={label}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      active === i
                        ? `${accent.soft} ${accent.text} ring-1 ${accent.ring}`
                        : 'hover:bg-zinc-100 hover:text-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                  {i < 5 && (
                    <span className="text-zinc-300 select-none" aria-hidden>
                      →
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-7 w-full">
            <div className="relative rounded-[1.75rem] border border-zinc-200/80 bg-white/80 backdrop-blur-md shadow-[0_24px_60px_-28px_rgba(24,24,27,0.35)] overflow-hidden">
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${accent.bar} transition-all duration-500`}
              />

              <div className="flex flex-col md:flex-row min-h-[380px]">
                {/* Vertical rail */}
                <div className="md:w-[42%] border-b md:border-b-0 md:border-r border-zinc-100 p-4 md:p-5 bg-zinc-50/50">
                  <div className="relative flex md:flex-col gap-2 md:gap-0 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                    <div
                      aria-hidden
                      className="hidden md:block absolute left-[27px] top-5 bottom-5 w-px bg-zinc-200"
                    />
                    {LAYER_KEYS.map((n, i) => {
                      const a = ACCENTS[i];
                      const isActive = active === i;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setActive(i)}
                          className={`relative flex items-center gap-3 shrink-0 md:w-full text-left rounded-xl px-2.5 py-2.5 md:py-3 transition-all duration-300 ${
                            isActive
                              ? `bg-white shadow-sm ring-1 ${a.ring}`
                              : 'hover:bg-white/70'
                          }`}
                        >
                          <span
                            className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform duration-300 ${a.rail} ${
                              isActive ? 'scale-110 shadow-md' : 'opacity-80'
                            }`}
                          >
                            {a.icon}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block text-xs font-black tracking-tight truncate ${
                                isActive ? 'text-zinc-950' : 'text-zinc-600'
                              }`}
                            >
                              {t(`t${n}`)}
                            </span>
                            <span className="hidden md:block text-[10px] font-bold text-zinc-400 mt-0.5">
                              Layer 0{n}
                            </span>
                          </span>
                          {isActive && (
                            <ChevronRight
                              className={`hidden md:block w-4 h-4 ml-auto shrink-0 ${a.text}`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detail pane */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                  <div
                    key={active}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-400"
                  >
                    <div
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 ${accent.soft} ${accent.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${accent.rail}`}
                      />
                      Active runtime
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight mb-3">
                      {t(`t${LAYER_KEYS[active]}`)}
                    </h3>
                    <p className="text-sm md:text-[15px] text-zinc-500 leading-relaxed font-medium mb-6">
                      {t(`d${LAYER_KEYS[active]}`)}
                    </p>
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 md:p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-2">
                        Deep dive
                      </p>
                      <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                        {t(`dd${LAYER_KEYS[active]}`)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
