'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Layers,
  Database,
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
  ExternalLink,
} from 'lucide-react';

const megaPanel =
  'absolute top-[calc(100%+8px)] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_28px_70px_-20px_rgba(24,24,27,0.28)] rounded-3xl opacity-0 scale-[0.98] pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-300 ease-out origin-top z-50 overflow-hidden';

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
      soft: 'from-sky-100 to-sky-50',
      bar: 'bg-sky-500',
      iconBg: 'bg-sky-50 border-sky-100 text-sky-600',
      titleHover: 'group-hover/sol:text-sky-700',
    },
    {
      href: '/solutions/hr',
      icon: Users,
      title: t('nav.humanResources'),
      desc: t('nav.humanResourcesDesc'),
      soft: 'from-rose-100 to-rose-50',
      bar: 'bg-rose-500',
      iconBg: 'bg-rose-50 border-rose-100 text-rose-600',
      titleHover: 'group-hover/sol:text-rose-700',
    },
    {
      href: '/solutions/sales',
      icon: TrendingUp,
      title: t('nav.salesCrm'),
      desc: t('nav.salesCrmDesc'),
      soft: 'from-emerald-100 to-emerald-50',
      bar: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      titleHover: 'group-hover/sol:text-emerald-700',
    },
    {
      href: '/solutions/operations',
      icon: Briefcase,
      title: t('nav.strategyOps'),
      desc: t('nav.strategyOpsDesc'),
      soft: 'from-amber-100 to-amber-50',
      bar: 'bg-amber-500',
      iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
      titleHover: 'group-hover/sol:text-amber-700',
    },
  ];

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
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group active:scale-95 transition-transform"
            onClick={closeMobile}
          >
            <div className="relative w-9 h-9 bg-zinc-950 rounded-xl flex items-center justify-center shadow-sm border border-zinc-800 group-hover:bg-zinc-800 transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_55%)] opacity-80" />
              <span className="relative text-white text-xs font-black font-mono tracking-tighter">
                B2
              </span>
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block text-sm font-black text-zinc-950 tracking-tight">
                SaaS Engine
              </span>
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-sky-600/80">
                Workspace OS
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 h-full">
            {/* Platform mega */}
            <div className="relative group h-full flex items-center">
              <button
                type="button"
                className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-zinc-100/80 group-hover:bg-zinc-100/80"
              >
                {t('nav.platform')}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full inset-x-0 h-3 z-40" />
              <div
                className={`${megaPanel} left-1/2 -translate-x-1/2 w-[700px] -translate-y-1 group-hover:translate-y-0`}
              >
                <div className="flex">
                  <div className="flex-1 p-5 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {t('nav.coreCapabilities')}
                      </span>
                    </div>

                    <Link
                      href="/docs?sec=canvas"
                      className="group/feature relative flex overflow-hidden rounded-2xl border border-zinc-200/80 bg-white hover:border-sky-200 hover:shadow-md transition-all"
                    >
                      <div
                        className={`w-[88px] shrink-0 bg-gradient-to-br from-sky-100 to-sky-50 border-r border-sky-100/80 relative`}
                      >
                        <div className="absolute inset-0 opacity-50 p-3">
                          <div className="h-1.5 w-3/4 rounded-full bg-white/80 mb-2" />
                          <div className="h-1.5 w-1/2 rounded-full bg-white/60 mb-3" />
                          <div className="grid grid-cols-2 gap-1">
                            <div className="h-6 rounded-md bg-white/70" />
                            <div className="h-6 rounded-md bg-white/50" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-sky-500" />
                      </div>
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover/feature:scale-110 transition-transform">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="text-sm font-black text-zinc-900 group-hover/feature:text-sky-700 transition-colors">
                            {t('nav.spatialCanvas')}
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          {t('nav.spatialCanvasDesc')}
                        </p>
                      </div>
                      <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 opacity-0 group-hover/feature:opacity-100 group-hover/feature:translate-x-0.5 transition-all" />
                    </Link>

                    <Link
                      href="/docs?sec=autosave"
                      className="group/feature relative flex overflow-hidden rounded-2xl border border-zinc-200/80 bg-white hover:border-emerald-200 hover:shadow-md transition-all"
                    >
                      <div className="w-[88px] shrink-0 bg-gradient-to-br from-emerald-100 to-emerald-50 border-r border-emerald-100/80 relative">
                        <div className="absolute inset-0 opacity-50 p-3 flex flex-col justify-center gap-1.5">
                          <div className="h-2 rounded-full bg-white/80 w-full" />
                          <div className="h-2 rounded-full bg-white/60 w-4/5" />
                          <div className="h-2 rounded-full bg-white/40 w-3/5" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500" />
                      </div>
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover/feature:scale-110 transition-transform">
                            <Database className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="text-sm font-black text-zinc-900 group-hover/feature:text-emerald-700 transition-colors">
                            {t('nav.realTimeSync')}
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          {t('nav.realTimeSyncDesc')}
                        </p>
                      </div>
                      <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 opacity-0 group-hover/feature:opacity-100 transition-all" />
                    </Link>
                  </div>

                  <div className="w-[240px] relative border-l border-zinc-100 p-5 flex flex-col gap-3 bg-[#F7F9FB]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.10),_transparent_60%)]" />
                    <span className="relative text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {t('nav.securityData')}
                    </span>

                    <Link
                      href="/docs?sec=rbac"
                      className="relative group/item rounded-2xl border border-zinc-200/70 bg-white/90 p-3.5 hover:border-teal-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-teal-700 transition-colors">
                          {t('nav.enterpriseRbac')}
                        </h4>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                        {t('nav.enterpriseRbacDesc')}
                      </p>
                    </Link>

                    <Link
                      href="/docs?sec=assets"
                      className="relative group/item rounded-2xl border border-zinc-200/70 bg-white/90 p-3.5 hover:border-amber-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                          <Cloud className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-amber-700 transition-colors">
                          {t('nav.cloudStorage')}
                        </h4>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                        {t('nav.cloudStorageDesc')}
                      </p>
                    </Link>
                  </div>
                </div>

                <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-800 truncate">
                      {t('nav.exploreDocs')}
                    </p>
                    <p className="text-[10px] font-medium text-zinc-500 truncate">
                      {t('nav.exploreDocsDesc')}
                    </p>
                  </div>
                  <Link
                    href="/docs"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-sky-600 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {t('nav.docsShort')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Solutions mega */}
            <div className="relative group h-full flex items-center">
              <button
                type="button"
                className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-zinc-100/80 group-hover:bg-zinc-100/80"
              >
                {t('nav.solutions')}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full inset-x-0 h-3 z-40" />
              <div
                className={`${megaPanel} left-1/2 -translate-x-1/2 w-[560px] -translate-y-1 group-hover:translate-y-0`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4 px-0.5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {t('nav.industryUseCases')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {solutions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group/sol relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 transition-all"
                        >
                          <div
                            className={`relative h-16 bg-gradient-to-br ${item.soft} border-b border-zinc-100`}
                          >
                            <div className="absolute inset-0 opacity-40 p-3">
                              <div className="h-1.5 w-2/3 rounded-full bg-white/80 mb-2" />
                              <div className="h-1.5 w-1/2 rounded-full bg-white/50" />
                            </div>
                            <div
                              className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl border flex items-center justify-center bg-white/90 backdrop-blur ${item.iconBg}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div
                              className={`absolute bottom-0 inset-x-0 h-1 ${item.bar} opacity-80`}
                            />
                          </div>
                          <div className="p-3.5">
                            <h4
                              className={`text-xs font-black text-zinc-900 transition-colors ${item.titleHover}`}
                            >
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-700">
                    {t('nav.viewAllSolutions')}
                  </p>
                  <Link
                    href="/solutions/engineering"
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800"
                  >
                    {t('nav.open')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Developers mega */}
            <div className="relative group h-full flex items-center">
              <button
                type="button"
                className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-zinc-100/80 group-hover:bg-zinc-100/80"
              >
                {t('nav.developers')}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full inset-x-0 h-3 z-40" />
              <div
                className={`${megaPanel} left-0 w-[340px] -translate-y-1 group-hover:translate-y-0`}
              >
                <div className="p-3 space-y-1">
                  <Link
                    href="/docs"
                    className="group/link flex items-start gap-3 rounded-2xl p-3 hover:bg-sky-50/80 border border-transparent hover:border-sky-100 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[13px] font-bold text-zinc-900 group-hover/link:text-sky-700">
                        {t('nav.documentation')}
                      </p>
                      <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
                        {t('nav.docsDesc')}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/changelog"
                    className="group/link flex items-start gap-3 rounded-2xl p-3 hover:bg-amber-50/70 border border-transparent hover:border-amber-100 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pt-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-zinc-900 group-hover/link:text-amber-700">
                          {t('nav.changelog')}
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest bg-sky-50 border border-sky-100 text-sky-700 px-1.5 py-0.5 rounded-md">
                          {t('nav.new')}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
                        {t('nav.changelogDesc')}
                      </p>
                    </div>
                  </Link>
                </div>

                <div className="px-3 pb-3">
                  <Link
                    href="/demo"
                    className="group/hub relative block overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 hover:shadow-md transition-all"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl" />
                    <div className="relative flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        {t('nav.featured')}
                      </span>
                    </div>
                    <div className="relative flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                        <Rocket className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-zinc-900 group-hover/hub:text-emerald-800 transition-colors">
                          {t('nav.communityHub')}
                        </p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5 leading-relaxed">
                          {t('nav.hubDesc')}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-700">
                          <ExternalLink className="w-3 h-3" />
                          {t('nav.livePreview')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
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
              ? 'max-h-[min(78vh,640px)] opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-zinc-100 px-4 py-5 overflow-y-auto max-h-[min(78vh,640px)]">
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-zinc-200/80 overflow-hidden bg-white">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3.5 pt-3 pb-2">
                  {t('nav.platform')}
                </p>
                <Link
                  href="/docs?sec=canvas"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3.5 py-3 hover:bg-sky-50 border-t border-zinc-100"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {t('nav.spatialCanvas')}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {t('nav.spatialCanvasDesc')}
                    </p>
                  </div>
                </Link>
                <Link
                  href="/docs?sec=autosave"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3.5 py-3 hover:bg-emerald-50 border-t border-zinc-100"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {t('nav.realTimeSync')}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {t('nav.realTimeSyncDesc')}
                    </p>
                  </div>
                </Link>
              </div>

              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 mb-2">
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
                        className="rounded-2xl border border-zinc-200/80 overflow-hidden bg-white"
                      >
                        <div
                          className={`h-10 bg-gradient-to-br ${item.soft} relative`}
                        >
                          <div
                            className={`absolute bottom-0 inset-x-0 h-0.5 ${item.bar}`}
                          />
                          <div
                            className={`absolute right-2 top-2 w-6 h-6 rounded-lg border flex items-center justify-center bg-white/90 ${item.iconBg}`}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[11px] font-bold text-zinc-900 leading-snug">
                            {item.title}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Link
                  href="/docs"
                  onClick={closeMobile}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-50"
                >
                  {t('nav.developers')}
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
                <Link
                  href="/pricing"
                  onClick={closeMobile}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-50"
                >
                  {t('nav.pricing')}
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
                <Link
                  href="/demo"
                  onClick={closeMobile}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-zinc-900 hover:bg-emerald-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-emerald-600" />
                    {t('nav.communityHub')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
              </div>

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
