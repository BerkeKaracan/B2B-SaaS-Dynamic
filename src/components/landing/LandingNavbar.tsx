'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Layers,
  Radio,
  Lock,
  Cloud,
  Users,
  Briefcase,
  TrendingUp,
  GitMerge,
  FileText,
  Activity,
  Rocket,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  LayoutGrid,
  Puzzle,
  Building2,
  Newspaper,
  Mail,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';

const megaPanel =
  'absolute top-[calc(100%+8px)] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_28px_70px_-20px_rgba(24,24,27,0.28)] rounded-3xl opacity-0 scale-[0.98] pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-300 ease-out origin-top z-50 overflow-hidden';

const navTrigger =
  'text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-zinc-100/80 group-hover:bg-zinc-100/80';

const megaLabel =
  'text-[10px] font-black text-zinc-400 uppercase tracking-[0.14em]';

type ListLink = {
  href: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  tone: string;
  accent: string;
};

export default function LandingNavbar() {
  const t = useTranslations('LandingPage');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const closeMobile = () => setIsMobileMenuOpen(false);

  const solutions = [
    {
      href: '/solutions/engineering',
      icon: GitMerge,
      title: t('nav.engineeringProduct'),
      desc: t('nav.engineeringProductDesc'),
      soft: 'from-sky-100/80 via-sky-50/40 to-transparent',
      ring: 'group-hover/sol:ring-sky-200/80',
      iconBg: 'bg-sky-50 text-sky-600 ring-sky-100',
      titleHover: 'group-hover/sol:text-sky-700',
      dot: 'bg-sky-500',
    },
    {
      href: '/solutions/hr',
      icon: Users,
      title: t('nav.humanResources'),
      desc: t('nav.humanResourcesDesc'),
      soft: 'from-rose-100/80 via-rose-50/40 to-transparent',
      ring: 'group-hover/sol:ring-rose-200/80',
      iconBg: 'bg-rose-50 text-rose-600 ring-rose-100',
      titleHover: 'group-hover/sol:text-rose-700',
      dot: 'bg-rose-500',
    },
    {
      href: '/solutions/sales',
      icon: TrendingUp,
      title: t('nav.salesCrm'),
      desc: t('nav.salesCrmDesc'),
      soft: 'from-emerald-100/80 via-emerald-50/40 to-transparent',
      ring: 'group-hover/sol:ring-emerald-200/80',
      iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      titleHover: 'group-hover/sol:text-emerald-700',
      dot: 'bg-emerald-500',
    },
    {
      href: '/solutions/operations',
      icon: Briefcase,
      title: t('nav.strategyOps'),
      desc: t('nav.strategyOpsDesc'),
      soft: 'from-amber-100/80 via-amber-50/40 to-transparent',
      ring: 'group-hover/sol:ring-amber-200/80',
      iconBg: 'bg-amber-50 text-amber-600 ring-amber-100',
      titleHover: 'group-hover/sol:text-amber-700',
      dot: 'bg-amber-500',
    },
  ];

  const resourceLinks: ListLink[] = [
    {
      href: '/docs',
      icon: FileText,
      titleKey: 'documentation',
      descKey: 'docsDesc',
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
      accent: 'group-hover/link:bg-sky-50/70',
    },
    {
      href: '/changelog',
      icon: Activity,
      titleKey: 'changelog',
      descKey: 'changelogDesc',
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
      accent: 'group-hover/link:bg-amber-50/70',
    },
    {
      href: '/features',
      icon: Sparkles,
      titleKey: 'features',
      descKey: 'featuresDesc',
      tone: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
      accent: 'group-hover/link:bg-zinc-50',
    },
    {
      href: '/templates',
      icon: LayoutGrid,
      titleKey: 'templates',
      descKey: 'templatesDesc',
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      accent: 'group-hover/link:bg-emerald-50/70',
    },
    {
      href: '/integrations',
      icon: Puzzle,
      titleKey: 'integrations',
      descKey: 'integrationsDesc',
      tone: 'bg-teal-50 text-teal-600 ring-teal-100',
      accent: 'group-hover/link:bg-teal-50/70',
    },
  ];

  const companyLinks: ListLink[] = [
    {
      href: '/about',
      icon: Building2,
      titleKey: 'about',
      descKey: 'aboutDesc',
      tone: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
      accent: 'group-hover/link:bg-zinc-50',
    },
    {
      href: '/careers',
      icon: Briefcase,
      titleKey: 'careers',
      descKey: 'careersDesc',
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
      accent: 'group-hover/link:bg-sky-50/70',
    },
    {
      href: '/blog',
      icon: Newspaper,
      titleKey: 'blog',
      descKey: 'blogDesc',
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
      accent: 'group-hover/link:bg-amber-50/70',
    },
    {
      href: '/contact',
      icon: Mail,
      titleKey: 'contact',
      descKey: 'contactDesc',
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      accent: 'group-hover/link:bg-emerald-50/70',
    },
    {
      href: '/community',
      icon: HeartHandshake,
      titleKey: 'community',
      descKey: 'communityDesc',
      tone: 'bg-rose-50 text-rose-600 ring-rose-100',
      accent: 'group-hover/link:bg-rose-50/70',
    },
  ];

  const renderListMega = (links: ListLink[], featuredDemo = false) => (
    <div className="p-2.5">
      <div className="space-y-0.5">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group/link flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${item.accent}`}
            >
              <div
                className={`w-9 h-9 rounded-xl ring-1 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/link:scale-105 ${item.tone}`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-zinc-900 leading-tight">
                  {t(`nav.${item.titleKey}`)}
                </p>
                <p className="text-[11px] font-medium text-zinc-500 mt-0.5 leading-snug truncate">
                  {t(`nav.${item.descKey}`)}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>
      {featuredDemo ? (
        <div className="pt-2 mt-1.5 border-t border-zinc-100">
          <Link
            href="/demo"
            className="group/hub relative block overflow-hidden rounded-2xl bg-zinc-950 p-4 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-emerald-400/25 blur-2xl" />
            <div className="pointer-events-none absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-sky-500/20 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/15 text-emerald-300 flex items-center justify-center shrink-0">
                <Rocket className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300/90">
                    <Sparkles className="w-2.5 h-2.5" />
                    {t('nav.featured')}
                  </span>
                </div>
                <p className="text-sm font-black text-white tracking-tight">
                  {t('nav.templateHub')}
                </p>
                <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                  {t('nav.hubDesc')}
                </p>
                <span className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold text-emerald-300">
                  {t('nav.livePreview')}
                  <ArrowRight className="w-3 h-3 transition-transform group-hover/hub:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      ) : null}
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 md:px-6 pt-3 pointer-events-none">
      <div
        className={`pointer-events-auto mx-auto max-w-6xl transition-all duration-300 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-xl border border-zinc-200/80 shadow-[0_12px_40px_-16px_rgba(24,24,27,0.35)]'
            : 'bg-white/70 backdrop-blur-md border border-zinc-200/50 shadow-sm'
        } rounded-2xl`}
      >
        <div className="h-14 md:h-16 px-3 sm:px-4 md:px-5 flex items-center justify-between gap-3">
          <BrandLogo
            showTagline
            markClassName="group-hover:bg-zinc-800 transition-colors"
            onClick={closeMobile}
          />

          <nav className="hidden lg:flex items-center gap-0.5 h-full">
            {/* Platform */}
            <div className="relative group h-full flex items-center">
              <button type="button" className={navTrigger}>
                {t('nav.platform')}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full inset-x-0 h-3 z-40" />
              <div
                className={`${megaPanel} left-1/2 -translate-x-1/2 w-[720px] -translate-y-1 group-hover:translate-y-0`}
              >
                <div className="flex">
                  <div className="flex-1 p-5">
                    <span className={megaLabel}>
                      {t('nav.coreCapabilities')}
                    </span>

                    <div className="mt-4 space-y-2">
                      <Link
                        href="/platform/canvas"
                        className="group/feature relative flex items-stretch gap-4 rounded-2xl p-3 -mx-1 transition-colors hover:bg-sky-50/60"
                      >
                        <div className="relative w-[92px] h-[78px] shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-sky-50 ring-1 ring-sky-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                          <div className="absolute inset-2.5 flex flex-col gap-1.5 opacity-70">
                            <div className="h-1.5 w-3/4 rounded-full bg-white/90" />
                            <div className="h-1.5 w-1/2 rounded-full bg-white/70" />
                            <div className="mt-auto grid grid-cols-2 gap-1">
                              <div className="h-5 rounded-md bg-white/80 shadow-sm" />
                              <div className="h-5 rounded-md bg-white/55" />
                            </div>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-500" />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-sky-50 ring-1 ring-sky-100 text-sky-600 flex items-center justify-center transition-transform duration-300 group-hover/feature:scale-110">
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-sm font-black text-zinc-900 tracking-tight group-hover/feature:text-sky-700 transition-colors">
                              {t('nav.spatialCanvas')}
                            </h4>
                          </div>
                          <p className="text-[12px] text-zinc-500 font-medium leading-relaxed pr-6">
                            {t('nav.spatialCanvasDesc')}
                          </p>
                        </div>
                        <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 opacity-0 translate-x-[-4px] group-hover/feature:opacity-100 group-hover/feature:translate-x-0 transition-all" />
                      </Link>

                      <Link
                        href="/platform/sync"
                        className="group/feature relative flex items-stretch gap-4 rounded-2xl p-3 -mx-1 transition-colors hover:bg-emerald-50/60"
                      >
                        <div className="relative w-[92px] h-[78px] shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 ring-1 ring-emerald-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                          <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-3 opacity-70">
                            <div className="h-2 rounded-full bg-white/90 w-full" />
                            <div className="h-2 rounded-full bg-white/70 w-4/5" />
                            <div className="h-2 rounded-full bg-white/50 w-3/5" />
                          </div>
                          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600 flex items-center justify-center transition-transform duration-300 group-hover/feature:scale-110">
                              <Radio className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-sm font-black text-zinc-900 tracking-tight group-hover/feature:text-emerald-700 transition-colors">
                              {t('nav.realTimeSync')}
                            </h4>
                          </div>
                          <p className="text-[12px] text-zinc-500 font-medium leading-relaxed pr-6">
                            {t('nav.realTimeSyncDesc')}
                          </p>
                        </div>
                        <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 opacity-0 translate-x-[-4px] group-hover/feature:opacity-100 group-hover/feature:translate-x-0 transition-all" />
                      </Link>
                    </div>
                  </div>

                  <div className="w-[248px] relative border-l border-zinc-100/90 p-5 flex flex-col gap-2.5 bg-[linear-gradient(180deg,#F8FAFB_0%,#F3F6F8_100%)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.09),_transparent_55%)]" />
                    <span className={`relative ${megaLabel}`}>
                      {t('nav.securityData')}
                    </span>

                    <Link
                      href="/platform/rbac"
                      className="relative group/item rounded-2xl bg-white/80 ring-1 ring-zinc-200/60 p-3.5 hover:ring-teal-200 hover:shadow-[0_8px_24px_-12px_rgba(13,148,136,0.35)] transition-all"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 ring-1 ring-teal-100 text-teal-600 flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-teal-700 transition-colors">
                          {t('nav.enterpriseRbac')}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        {t('nav.enterpriseRbacDesc')}
                      </p>
                    </Link>

                    <Link
                      href="/platform/storage"
                      className="relative group/item rounded-2xl bg-white/80 ring-1 ring-zinc-200/60 p-3.5 hover:ring-amber-200 hover:shadow-[0_8px_24px_-12px_rgba(217,119,6,0.28)] transition-all"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 ring-1 ring-amber-100 text-amber-600 flex items-center justify-center">
                          <Cloud className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-amber-700 transition-colors">
                          {t('nav.cloudStorage')}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        {t('nav.cloudStorageDesc')}
                      </p>
                    </Link>
                  </div>
                </div>

                <div className="border-t border-zinc-100 bg-zinc-50/70 px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white ring-1 ring-zinc-200 text-zinc-500 items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 truncate">
                        {t('nav.exploreDocs')}
                      </p>
                      <p className="text-[10px] font-medium text-zinc-500 truncate">
                        {t('nav.exploreDocsDesc')}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/docs"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-sky-600 transition-colors"
                  >
                    {t('nav.docsShort')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Solutions */}
            <div className="relative group h-full flex items-center">
              <button type="button" className={navTrigger}>
                {t('nav.solutions')}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full inset-x-0 h-3 z-40" />
              <div
                className={`${megaPanel} left-1/2 -translate-x-1/2 w-[580px] -translate-y-1 group-hover:translate-y-0`}
              >
                <div className="p-5">
                  <span className={megaLabel}>
                    {t('nav.industryUseCases')}
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    {solutions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group/sol relative overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(24,24,27,0.28)] ${item.ring}`}
                        >
                          <div
                            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.soft} opacity-80`}
                          />
                          <div className="relative flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl ring-1 flex items-center justify-center shrink-0 bg-white/90 shadow-sm transition-transform duration-300 group-hover/sol:scale-105 ${item.iconBg}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${item.dot}`}
                                />
                                <h4
                                  className={`text-[13px] font-black text-zinc-900 tracking-tight transition-colors ${item.titleHover}`}
                                >
                                  {item.title}
                                </h4>
                              </div>
                              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-zinc-100 bg-zinc-50/70 px-5 py-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-700">
                    {t('nav.browseTemplates')}
                  </p>
                  <Link
                    href="/templates"
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors"
                  >
                    {t('nav.open')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="relative group h-full flex items-center">
              <button type="button" className={navTrigger}>
                {t('nav.resources')}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full inset-x-0 h-3 z-40" />
              <div
                className={`${megaPanel} left-0 w-[360px] -translate-y-1 group-hover:translate-y-0`}
              >
                {renderListMega(resourceLinks, true)}
              </div>
            </div>

            {/* Company */}
            <div className="relative group h-full flex items-center">
              <button type="button" className={navTrigger}>
                {t('nav.company')}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full inset-x-0 h-3 z-40" />
              <div
                className={`${megaPanel} left-0 w-[340px] -translate-y-1 group-hover:translate-y-0`}
              >
                {renderListMega(companyLinks, false)}
              </div>
            </div>

            <Link
              href="/pricing"
              className="text-[13px] font-bold text-zinc-500 hover:text-zinc-950 transition-colors px-3 py-2 rounded-xl hover:bg-zinc-100/80"
            >
              {t('nav.pricing')}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center justify-center px-3.5 py-2 text-[13px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all active:scale-95"
            >
              {t('nav.signIn')}
            </Link>
            <Link
              href="/register"
              className="lp-btn-shine hidden md:inline-flex text-[13px] font-extrabold bg-zinc-950 text-white px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md items-center gap-2 hover:-translate-y-0.5 active:scale-95"
            >
              {t('nav.deployWorkspace')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/login"
              className="md:hidden inline-flex items-center justify-center text-[12px] font-extrabold bg-zinc-900 text-white px-3.5 py-2 rounded-xl shadow-sm active:scale-95"
            >
              {t('nav.signIn')}
            </Link>

            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <div
          className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
            isMobileMenuOpen
              ? 'max-h-[min(82vh,720px)] opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-zinc-100 px-4 py-5 overflow-y-auto max-h-[min(82vh,720px)]">
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-zinc-200/80 overflow-hidden bg-white">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3.5 pt-3 pb-2">
                  {t('nav.platform')}
                </p>
                {[
                  {
                    href: '/platform/canvas',
                    icon: Layers,
                    title: 'spatialCanvas',
                    desc: 'spatialCanvasDesc',
                    hover: 'hover:bg-sky-50',
                    iconBg: 'bg-sky-50 border-sky-100 text-sky-600',
                  },
                  {
                    href: '/platform/sync',
                    icon: Radio,
                    title: 'realTimeSync',
                    desc: 'realTimeSyncDesc',
                    hover: 'hover:bg-emerald-50',
                    iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
                  },
                  {
                    href: '/platform/rbac',
                    icon: Lock,
                    title: 'enterpriseRbac',
                    desc: 'enterpriseRbacDesc',
                    hover: 'hover:bg-teal-50',
                    iconBg: 'bg-teal-50 border-teal-100 text-teal-600',
                  },
                  {
                    href: '/platform/storage',
                    icon: Cloud,
                    title: 'cloudStorage',
                    desc: 'cloudStorageDesc',
                    hover: 'hover:bg-amber-50',
                    iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
                  },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <Link
                      key={row.href}
                      href={row.href}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 px-3.5 py-3 border-t border-zinc-100 ${row.hover}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${row.iconBg}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">
                          {t(`nav.${row.title}`)}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {t(`nav.${row.desc}`)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div>
                <p className={`${megaLabel} px-1 mb-2`}>
                  {t('nav.solutions')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {solutions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        className="relative overflow-hidden rounded-2xl ring-1 ring-zinc-200/80 bg-white p-3"
                      >
                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.soft}`}
                        />
                        <div className="relative flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg ring-1 flex items-center justify-center bg-white/90 shrink-0 ${item.iconBg}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[11px] font-bold text-zinc-900 leading-snug min-w-0">
                            {item.title}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 mb-2">
                  {t('nav.resources')}
                </p>
                <div className="flex flex-col gap-0.5 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden">
                  {[
                    ...resourceLinks,
                    {
                      href: '/demo',
                      icon: Rocket,
                      titleKey: 'templateHub',
                      descKey: 'hubDesc',
                      tone: '',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-50 border-t border-zinc-100 first:border-t-0"
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {t(`nav.${item.titleKey}`)}
                          </span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 mb-2">
                  {t('nav.company')}
                </p>
                <div className="flex flex-col gap-0.5 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden">
                  {companyLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-50 border-t border-zinc-100 first:border-t-0"
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {t(`nav.${item.titleKey}`)}
                          </span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              <Link
                href="/pricing"
                onClick={closeMobile}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-50"
              >
                {t('nav.pricing')}
                <ArrowRight className="w-4 h-4 text-zinc-300" />
              </Link>

              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className="w-full py-3 bg-zinc-100 text-zinc-900 text-center text-sm font-extrabold rounded-xl"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobile}
                  className="w-full py-3 bg-zinc-950 text-white text-center text-sm font-extrabold rounded-xl shadow-md"
                >
                  {t('nav.deployWorkspace')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
