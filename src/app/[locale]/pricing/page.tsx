'use client';

import React from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import BillingPlanCards from '@/components/billing/BillingPlanCards';
import { formatMoney } from '@/lib/currency';

export default function PricingPage() {
  const formatPrice = (amountUsd: number) => formatMoney(amountUsd, 'USD');

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans antialiased selection:bg-zinc-200 flex flex-col">
      <header className="h-16 border-b border-zinc-200/50 bg-white/75 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <BrandLogo size="sm" />
        <Link
          href="/login"
          className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          Back to app &rarr;
        </Link>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950 mb-4">
            Sleek, transparent pricing.
          </h1>
          <p className="text-zinc-500 text-sm md:text-base max-w-md mx-auto font-medium">
            Choose the core structure that scales with your deployment. Fully
            linked with our structural limits.
          </p>
        </div>

        <BillingPlanCards mode="marketing" formatPrice={formatPrice} />
      </main>
    </div>
  );
}
