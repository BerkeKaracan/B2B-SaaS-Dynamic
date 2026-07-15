'use client';

import React from 'react';
import Link from 'next/link';
import BrandLogo, { BrandMark } from '@/components/brand/BrandLogo';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-200 overflow-hidden relative">
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-zinc-950 text-white p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-zinc-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-zinc-400/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <BrandLogo size="md" inverted showTagline href={false} />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto mt-10">
          <h1 className="text-5xl font-black leading-[1.05] tracking-tighter mb-6 text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-500">
            Portfolio demo
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed font-medium">
            Password reset is not wired in this portfolio build. Use your
            existing login or reach out via the contact page.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] font-black text-zinc-600 uppercase tracking-widest mt-10">
          <span>© {new Date().getFullYear()} B2 SaaS Engine · Portfolio demo</span>
        </div>
      </div>

      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative z-10 bg-[#fafafb] lg:bg-transparent">
        <div className="w-full max-w-[420px] relative z-10">
          <div className="bg-white p-8 sm:p-12 rounded-4xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-zinc-200/60 relative">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-950 text-xs font-semibold mb-8 transition-colors group/back"
            >
              <svg
                className="w-3.5 h-3.5 transform group-hover/back:-translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to login
            </Link>

            <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
              <BrandMark size="md" />
            </div>

            <div className="mb-6">
              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md mb-4">
                Portfolio demo
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2">
                Reset not available
              </h2>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                This page does not send recovery emails. Password reset is out of
                scope for the portfolio demo — no link will be emailed.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full bg-zinc-950 text-white rounded-xl py-3 text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Return to login
              </Link>
              <Link
                href="/contact"
                className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl py-3 text-sm font-semibold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
              >
                Contact via email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
