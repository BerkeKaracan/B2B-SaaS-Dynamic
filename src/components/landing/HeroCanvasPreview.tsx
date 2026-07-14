'use client';

import React from 'react';

/** Floating spatial-canvas preview under the hero — soft block drift. */
export default function HeroCanvasPreview() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-12 md:mt-16 lp-hero-preview">
      <div className="absolute -inset-4 md:-inset-8 bg-[radial-gradient(ellipse_at_center,_rgba(14,165,233,0.12),_transparent_65%)] pointer-events-none" />

      <div className="relative rounded-2xl md:rounded-3xl border border-zinc-200/80 bg-white/70 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(24,24,27,0.35)] overflow-hidden aspect-[16/9] md:aspect-[2/1]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(24,24,27,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Floating blocks */}
        <div className="lp-float-block lp-float-a absolute left-[8%] top-[18%] w-[28%] h-[34%] rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 border border-sky-200/80 shadow-sm p-3">
          <div className="h-2 w-1/2 rounded-full bg-sky-300/80 mb-2" />
          <div className="h-2 w-3/4 rounded-full bg-sky-200/70 mb-1.5" />
          <div className="h-2 w-2/3 rounded-full bg-sky-200/50" />
        </div>

        <div className="lp-float-block lp-float-b absolute right-[10%] top-[14%] w-[32%] h-[28%] rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/80 shadow-sm p-3">
          <div className="flex gap-1.5 mb-3">
            <div className="h-6 flex-1 rounded-md bg-emerald-200/70" />
            <div className="h-6 flex-1 rounded-md bg-emerald-200/50" />
            <div className="h-6 flex-1 rounded-md bg-emerald-200/40" />
          </div>
          <div className="h-2 w-full rounded-full bg-emerald-200/60" />
        </div>

        <div className="lp-float-block lp-float-c absolute left-[22%] bottom-[12%] w-[36%] h-[30%] rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/80 shadow-sm p-3">
          <div className="h-2 w-2/5 rounded-full bg-amber-300/80 mb-3" />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="aspect-square rounded-md bg-amber-200/70" />
            <div className="aspect-square rounded-md bg-amber-200/50" />
            <div className="aspect-square rounded-md bg-amber-200/40" />
          </div>
        </div>

        <div className="lp-float-block lp-float-d absolute right-[18%] bottom-[18%] w-[22%] h-[22%] rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 border border-rose-200/70 shadow-sm flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-rose-300/60 lp-pulse-ring" />
        </div>

        {/* Cursor ghost */}
        <div className="lp-cursor-ghost absolute left-[48%] top-[42%] w-4 h-4 pointer-events-none">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-800 drop-shadow">
            <path
              fill="currentColor"
              d="M5.5 3.21V20.8c0 .1.1.2.2.15l5.3-3.05 2.7 6.05c.05.1.2.15.3.05l2.05-1c.1-.05.15-.2.05-.3l-2.7-6.05 5.9-.35c.15 0 .2-.2.1-.3L5.7 3.05c-.1-.1-.2 0-.2.16z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
