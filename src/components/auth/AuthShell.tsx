'use client';

import React from 'react';
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google';
import BrandLogo, { BrandMark } from '@/components/brand/BrandLogo';
import { Loader2 } from 'lucide-react';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-auth-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-auth-body',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-auth-mono',
  display: 'swap',
});

export type AuthShellProps = {
  children: React.ReactNode;
  /** Large display line on the brand panel */
  panelTitle: React.ReactNode;
  panelSubtitle: string;
  /** Optional visual under the subtitle (nodes, steps, etc.) */
  panelVisual?: React.ReactNode;
  formMaxWidthClassName?: string;
};

export function AuthCheckingScreen({ label = 'Checking session' }: { label?: string }) {
  return (
    <div
      className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable} min-h-screen flex items-center justify-center bg-[#eef2f6]`}
      style={{ fontFamily: 'var(--font-auth-body), system-ui, sans-serif' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-xl animate-pulse" />
          <Loader2 className="relative w-9 h-9 text-zinc-800 animate-spin" />
        </div>
        <span
          className="text-[11px] uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: 'var(--font-auth-mono), monospace' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Split auth layout: brand-first dark panel + form column.
 * Zinc/sky palette (matches BrandMark) — no purple/cream AI defaults.
 */
export default function AuthShell({
  children,
  panelTitle,
  panelSubtitle,
  panelVisual,
  formMaxWidthClassName = 'max-w-[420px]',
}: AuthShellProps) {
  return (
    <div
      className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable} min-h-screen flex text-zinc-900 selection:bg-sky-200/70 overflow-hidden relative`}
      style={{ fontFamily: 'var(--font-auth-body), system-ui, sans-serif' }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes auth-grid-drift {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }
        @keyframes auth-rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes auth-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .auth-grid-drift { animation: auth-grid-drift 28s linear infinite; }
        .auth-rise { animation: auth-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .auth-rise-delay { animation: auth-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both; }
        .auth-orbit { animation: auth-orbit 48s linear infinite; }
      `,
        }}
      />

      {/* Brand panel — full-bleed atmosphere */}
      <aside className="hidden lg:flex flex-col justify-between w-[46%] min-h-screen relative overflow-hidden bg-[#0c1117] text-white px-12 py-11">
        <div
          className="absolute inset-0 auth-grid-drift opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(125,211,252,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_10%_0%,rgba(56,189,248,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_90%_100%,rgba(16,185,129,0.12),transparent_50%)]" />
        <div className="absolute -right-24 top-1/3 w-[420px] h-[420px] rounded-full border border-white/5 auth-orbit pointer-events-none" />
        <div className="absolute -right-8 top-[38%] w-[280px] h-[280px] rounded-full border border-sky-400/10 auth-orbit pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '36s' }} />

        <div className="relative z-10 auth-rise">
          <BrandLogo size="md" inverted showTagline href="/" />
        </div>

        <div className="relative z-10 max-w-md auth-rise-delay">
          <p
            className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80 mb-5"
            style={{ fontFamily: 'var(--font-auth-mono), monospace' }}
          >
            B2 SaaS Engine
          </p>
          <h1
            className="text-[2.75rem] xl:text-5xl font-semibold leading-[1.05] tracking-tight text-white mb-5"
            style={{ fontFamily: 'var(--font-auth-display), system-ui, sans-serif' }}
          >
            {panelTitle}
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed font-normal max-w-sm">
            {panelSubtitle}
          </p>
          {panelVisual ? <div className="mt-10">{panelVisual}</div> : null}
        </div>

        <div
          className="relative z-10 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500"
          style={{ fontFamily: 'var(--font-auth-mono), monospace' }}
        >
          <span>© {new Date().getFullYear()} Portfolio demo</span>
          <span className="text-sky-400/70">Workspace OS</span>
        </div>
      </aside>

      {/* Form column */}
      <main className="relative w-full lg:w-[54%] min-h-screen flex items-center justify-center px-5 sm:px-10 py-12 bg-[#eef2f6]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.9), transparent 45%)',
          }}
        />
        <div className={`relative z-10 w-full ${formMaxWidthClassName} auth-rise`}>
          <div className="lg:hidden flex justify-center mb-8">
            <BrandMark size="lg" />
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-7 sm:p-9 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthPanelNodes() {
  return (
    <div className="relative h-36 rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(56,189,248,0.08)_100%)]" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 144" fill="none" aria-hidden>
        <line x1="48" y1="72" x2="140" y2="40" stroke="rgba(125,211,252,0.35)" strokeWidth="1.2" />
        <line x1="140" y1="40" x2="220" y2="88" stroke="rgba(125,211,252,0.25)" strokeWidth="1.2" />
        <line x1="220" y1="88" x2="300" y2="52" stroke="rgba(16,185,129,0.35)" strokeWidth="1.2" />
        <circle cx="48" cy="72" r="7" fill="#0c1117" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx="140" cy="40" r="9" fill="#0c1117" stroke="#7dd3fc" strokeWidth="1.5" />
        <circle cx="220" cy="88" r="7" fill="#0c1117" stroke="#34d399" strokeWidth="1.5" />
        <circle cx="300" cy="52" r="8" fill="#0c1117" stroke="#38bdf8" strokeWidth="1.5" />
      </svg>
      <div
        className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: 'var(--font-auth-mono), monospace' }}
      >
        Spatial canvas · live
      </div>
    </div>
  );
}
