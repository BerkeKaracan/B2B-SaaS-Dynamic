'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingAtmosphere from '@/components/landing/LandingAtmosphere';
import Footer from '@/components/layout/Footer';

export type MarketingCrumb = {
  href?: string;
  label: string;
};

export type MarketingRelatedLink = {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
};

export function MarketingBreadcrumb({ items }: { items: MarketingCrumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-zinc-400 mb-6"
    >
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 ? <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" /> : null}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-zinc-800 transition-colors truncate max-w-[10rem] sm:max-w-none"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-700 truncate max-w-[14rem] sm:max-w-none">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function MarketingRelatedGrid({
  title,
  links,
}: {
  title: string;
  links: MarketingRelatedLink[];
}) {
  return (
    <section className="mb-16">
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-zinc-200/90 bg-white p-4 hover:border-sky-200 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center mb-3 group-hover:bg-sky-600 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-zinc-950 group-hover:text-sky-700 transition-colors">
                {link.label}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-relaxed">
                {link.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Shared chrome for marketing capability / solution interiors. */
export default function MarketingPageChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F9FB] text-zinc-900 font-sans antialiased selection:bg-sky-100 flex flex-col relative overflow-hidden">
      <LandingAtmosphere />
      <LandingNavbar />
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  );
}
