'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
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
} from 'lucide-react';
import LandingChatbot from '@/components/chat/LandingChatbot';
import DraggableFeatureBox from '@/components/ui/DraggableFeatureBox';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import ColdStartAlert from '@/components/ColdStartAlert';

interface BackgroundShapeState {
  x: number;
  y: number;
  visible: boolean;
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations('LandingPage');

  const [isMounted, setIsMounted] = useState(false);

  const [shapesState, setShapesState] = useState<BackgroundShapeState[]>([
    { x: -1000, y: -1000, visible: false },
    { x: -1000, y: -1000, visible: false },
    { x: -1000, y: -1000, visible: false },
    { x: -1000, y: -1000, visible: false },
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    const safeDistance = 250;

    const getSafePosition = (
      currentIndex: number,
      currentShapes: BackgroundShapeState[]
    ) => {
      let newX = 0;
      let newY = 0;
      let isValid = false;
      let attempts = 0;

      const margin = 100;
      const maxWidth = window.innerWidth - margin;
      const maxHeight = window.innerHeight - margin;

      while (!isValid && attempts < 50) {
        newX = Math.floor(Math.random() * (maxWidth - margin) + margin);
        newY = Math.floor(Math.random() * (maxHeight - margin) + margin);
        isValid = true;

        for (let i = 0; i < currentShapes.length; i++) {
          if (i === currentIndex) continue;

          const dx = currentShapes[i].x - newX;
          const dy = currentShapes[i].y - newY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < safeDistance) {
            isValid = false;
            break;
          }
        }
        attempts++;
      }
      return { x: newX, y: newY };
    };

    setShapesState((prev) => {
      const initialShapes = [...prev];
      for (let i = 0; i < initialShapes.length; i++) {
        const { x, y } = getSafePosition(i, initialShapes);
        initialShapes[i] = { x, y, visible: true };
      }
      return initialShapes;
    });

    const intervals = shapesState.map((_, index) => {
      const cycleTime = 6000 + Math.random() * 4000;

      return setInterval(() => {
        setShapesState((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], visible: false };
          return next;
        });

        setTimeout(() => {
          setShapesState((prev) => {
            const next = [...prev];
            const { x, y } = getSafePosition(index, next);
            next[index] = {
              ...next[index],
              x,
              y,
              visible: true,
            };
            return next;
          });
        }, 1000);
      }, cycleTime);
    });

    return () => {
      intervals.forEach(clearInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fafafb] text-zinc-900 font-sans antialiased selection:bg-zinc-200 flex flex-col overflow-hidden">
      <ColdStartAlert />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        <div
          className={`absolute w-48 h-48 border-[3px] border-dashed border-zinc-200 rounded-full transition-opacity duration-1000 ease-in-out animate-[spin_40s_linear_infinite] pulse-slow ${
            shapesState[0].visible ? 'opacity-40' : 'opacity-0'
          }`}
          style={{
            left: shapesState[0].x,
            top: shapesState[0].y,
            transform: 'translate(-50%, -50%)',
          }}
        ></div>

        <div
          className={`absolute w-40 h-40 border-2 border-zinc-200 rounded-[2rem] transition-opacity duration-1000 ease-in-out animate-[pulse_5s_ease-in-out_infinite] ${
            shapesState[1].visible ? 'opacity-50' : 'opacity-0'
          }`}
          style={{
            left: shapesState[1].x,
            top: shapesState[1].y,
            transform: 'translate(-50%, -50%) rotate(12deg)',
          }}
        ></div>

        <div
          className={`absolute w-24 h-24 border-2 border-dashed border-zinc-300 rounded-2xl transition-opacity duration-1000 ease-in-out animate-[spin_50s_linear_infinite_reverse] pulse-slower ${
            shapesState[2].visible ? 'opacity-40' : 'opacity-0'
          }`}
          style={{
            left: shapesState[2].x,
            top: shapesState[2].y,
            transform: 'translate(-50%, -50%) rotate(-6deg)',
          }}
        ></div>

        <div
          className={`absolute w-80 h-32 border border-zinc-200 rounded-full transition-opacity duration-1000 ease-in-out animate-[pulse_7s_ease-in-out_infinite] ${
            shapesState[3].visible ? 'opacity-30' : 'opacity-0'
          }`}
          style={{
            left: shapesState[3].x,
            top: shapesState[3].y,
            transform: 'translate(-50%, -50%)',
          }}
        ></div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .pulse-slow { animation: customPulse 8s ease-in-out infinite; }
          .pulse-slower { animation: customPulse 12s ease-in-out infinite alternate; }
          @keyframes customPulse {
            0%, 100% { opacity: 0.1; transform: scale(0.95); }
            50% { opacity: 0.6; transform: scale(1.05); }
          }
        `,
          }}
        />
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center transform-gpu will-change-transform">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-[0.3] transform-gpu"></div>
        <svg
          className="absolute top-0 left-0 w-full md:w-1/2 h-full opacity-5 text-zinc-900"
          preserveAspectRatio="none"
          viewBox="0 0 500 1000"
          fill="none"
        >
          <path
            d="M0,0 C200,200 50,400 300,600 C500,800 100,900 0,1000 Z"
            fill="currentColor"
          />
          <path
            d="M0,0 C300,300 0,500 400,700 C600,900 200,1000 0,1000 Z"
            fill="currentColor"
          />
        </svg>
        <svg
          className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-5 text-zinc-900"
          preserveAspectRatio="none"
          viewBox="0 0 500 1000"
          fill="none"
        >
          <path
            d="M500,0 C300,200 450,400 200,600 C0,800 400,900 500,1000 Z"
            fill="currentColor"
          />
          <path
            d="M500,0 C200,300 500,500 100,700 C-100,900 300,1000 500,1000 Z"
            fill="currentColor"
          />
        </svg>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white rounded-full blur-[100px] opacity-80 transform-gpu will-change-transform"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl z-50 px-4 md:px-6 lg:px-10 flex items-center justify-between transition-all">
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group transform-gpu active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 bg-zinc-950 rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-zinc-800 group-hover:bg-zinc-800 transition-colors relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-white text-xs font-black font-mono tracking-tighter">
              B2
            </span>
          </div>
          <span className="text-sm font-black text-zinc-950 tracking-tight uppercase">
            SaaS Engine
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 h-full">
          <div className="relative group h-full flex items-center">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/80">
              {t('nav.platform')}
              <svg
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="absolute top-[calc(100%-10px)] left-0 w-full h-[20px] bg-transparent z-40"></div>
            <div className="absolute top-[calc(100%+5px)] left-1/2 -translate-x-1/2 w-[650px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-4xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform-gpu origin-top -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden flex">
              <div className="w-2/3 p-6 grid grid-cols-1 gap-3 bg-white">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
                  {t('nav.coreCapabilities')}
                </span>
                <Link
                  href="/docs?sec=canvas"
                  className="group/feature relative p-4 bg-white hover:bg-zinc-50/80 rounded-2xl border border-zinc-100 hover:border-indigo-200 transition-all block overflow-hidden transform-gpu hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10 group-hover/feature:bg-indigo-500/10 transition-colors"></div>
                  <h4 className="text-sm font-black text-zinc-900 flex items-center gap-3 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner group-hover/feature:scale-110 transition-transform transform-gpu">
                      <Layers className="w-4 h-4" />
                    </div>
                    {t('nav.spatialCanvas')}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed pl-11">
                    {t('nav.spatialCanvasDesc')}
                  </p>
                </Link>
                <Link
                  href="/docs?sec=autosave"
                  className="group/feature relative p-4 bg-white hover:bg-zinc-50/80 rounded-2xl border border-zinc-100 hover:border-emerald-200 transition-all block overflow-hidden transform-gpu hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10 group-hover/feature:bg-emerald-500/10 transition-colors"></div>
                  <h4 className="text-sm font-black text-zinc-900 flex items-center gap-3 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner group-hover/feature:scale-110 transition-transform transform-gpu">
                      <Database className="w-4 h-4" />
                    </div>
                    {t('nav.realTimeSync')}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed pl-11">
                    {t('nav.realTimeSyncDesc')}
                  </p>
                </Link>
              </div>
              <div className="w-1/3 bg-zinc-50/50 p-6 border-l border-zinc-100 flex flex-col gap-5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  {t('nav.securityData')}
                </span>
                <Link
                  href="/docs?sec=rbac"
                  className="group/item flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-200/50 flex items-center justify-center text-zinc-600 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-blue-600 transition-colors">
                      {t('nav.enterpriseRbac')}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                      {t('nav.enterpriseRbacDesc')}
                    </p>
                  </div>
                </Link>
                <Link
                  href="/docs?sec=assets"
                  className="group/item flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-200/50 flex items-center justify-center text-zinc-600 group-hover/item:bg-purple-100 group-hover/item:text-purple-600 transition-colors">
                    <Cloud className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-zinc-900 group-hover/item:text-purple-600 transition-colors">
                      {t('nav.cloudStorage')}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                      {t('nav.cloudStorageDesc')}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="relative group h-full flex items-center">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/80">
              {t('nav.solutions')}
              <svg
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="absolute top-[calc(100%-10px)] left-0 w-full h-[20px] bg-transparent z-40"></div>
            <div className="absolute top-[calc(100%+5px)] left-1/2 -translate-x-1/2 w-[520px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-4xl p-5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform-gpu origin-top -translate-y-2 group-hover:translate-y-0 grid grid-cols-2 gap-x-4 gap-y-2 z-50">
              <div className="col-span-2 px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-2">
                {t('nav.industryUseCases')}
              </div>
              <Link
                href="/solutions/engineering"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <GitMerge className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-indigo-600" />
                  {t('nav.engineeringProduct')}
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  {t('nav.engineeringProductDesc')}
                </p>
              </Link>
              <Link
                href="/solutions/hr"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-rose-600" />
                  {t('nav.humanResources')}
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  {t('nav.humanResourcesDesc')}
                </p>
              </Link>
              <Link
                href="/solutions/sales"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-emerald-600" />
                  {t('nav.salesCrm')}
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  {t('nav.salesCrmDesc')}
                </p>
              </Link>
              <Link
                href="/solutions/operations"
                className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors block border border-transparent hover:border-zinc-200/60 hover:shadow-sm group/sol"
              >
                <h4 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400 group-hover/sol:text-amber-600" />
                  {t('nav.strategyOps')}
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 pl-5.5">
                  {t('nav.strategyOpsDesc')}
                </p>
              </Link>
            </div>
          </div>

          <div className="relative group h-full flex items-center">
            <button className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100/80">
              {t('nav.developers')}
              <svg
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="absolute top-[calc(100%-10px)] left-0 w-full h-[20px] bg-transparent z-40"></div>
            <div className="absolute top-[calc(100%+5px)] left-0 w-[260px] bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 rounded-3xl p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform-gpu origin-top -translate-y-2 group-hover:translate-y-0 flex flex-col z-50">
              <Link
                href="/docs"
                className="px-4 py-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 group/link transition-colors"
              >
                <FileText className="w-4 h-4 text-zinc-400 group-hover/link:text-zinc-900" />
                <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                  {t('nav.documentation')}
                </span>
              </Link>
              <Link
                href="/changelog"
                className="px-4 py-3 hover:bg-zinc-50 rounded-xl flex items-center justify-between group/link transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-zinc-400 group-hover/link:text-zinc-900" />
                  <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                    {t('nav.changelog')}
                  </span>
                </div>
                <span className="text-[9px] font-black bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                  {t('nav.new')}
                </span>
              </Link>
              <div className="h-px bg-zinc-100 my-1 mx-3"></div>
              <Link
                href="/demo"
                className="px-4 py-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 group/link transition-colors"
              >
                <Rocket className="w-4 h-4 text-zinc-400 group-hover/link:text-zinc-900" />
                <span className="text-[13px] font-bold text-zinc-700 group-hover/link:text-zinc-950">
                  {t('nav.communityHub')}
                </span>
              </Link>
            </div>
          </div>

          <Link
            href="/pricing"
            className="text-[13px] font-bold text-zinc-500 hover:text-zinc-950 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100/80"
          >
            {t('nav.pricing')}
          </Link>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/login"
            className="hidden md:inline-flex items-center justify-center px-4 py-2 text-[13px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer select-none"
          >
            {t('nav.signIn')}
          </Link>
          <div className="h-4 w-px bg-zinc-200 hidden md:block"></div>
          <Link
            href="/register"
            className="hidden md:flex text-[13px] font-extrabold bg-zinc-950 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] items-center gap-2 transform-gpu hover:-translate-y-0.5 active:scale-95"
          >
            {t('nav.deployWorkspace')}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>

          <Link
            href="/login"
            className="md:hidden flex items-center justify-center text-[12px] font-extrabold bg-zinc-900 text-white px-4 py-1.5 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:bg-zinc-800 hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(0,0,0,0.15)] transition-all transform-gpu active:scale-95"
          >
            {t('nav.signIn')}
          </Link>

          <button
            className="md:hidden flex items-center justify-center p-2 -mr-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-zinc-200/80 shadow-2xl animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[calc(100vh-64px)]">
            <div className="flex flex-col px-6 py-6 space-y-6">
              <div className="flex flex-col space-y-4">
                <Link
                  href="/docs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-bold text-zinc-900 flex items-center justify-between"
                >
                  {t('nav.platform')}{' '}
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>

                <div className="flex flex-col space-y-4 pt-2 pb-2">
                  <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">
                    {t('nav.solutions')}
                  </span>
                  <div className="flex flex-col space-y-4 pl-2">
                    <Link
                      href="/solutions/engineering"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-zinc-700 flex items-center gap-3"
                    >
                      <GitMerge className="w-4 h-4 text-indigo-500" />{' '}
                      {t('nav.engineeringProduct')}
                    </Link>
                    <Link
                      href="/solutions/hr"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-zinc-700 flex items-center gap-3"
                    >
                      <Users className="w-4 h-4 text-rose-500" />{' '}
                      {t('nav.humanResources')}
                    </Link>
                    <Link
                      href="/solutions/sales"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-zinc-700 flex items-center gap-3"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-500" />{' '}
                      {t('nav.salesCrm')}
                    </Link>
                    <Link
                      href="/solutions/operations"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-zinc-700 flex items-center gap-3"
                    >
                      <Briefcase className="w-4 h-4 text-amber-500" />{' '}
                      {t('nav.strategyOps')}
                    </Link>
                  </div>
                </div>

                <Link
                  href="/docs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-bold text-zinc-900 flex items-center justify-between"
                >
                  {t('nav.developers')}{' '}
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-bold text-zinc-900 flex items-center justify-between"
                >
                  {t('nav.pricing')}{' '}
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
              </div>
              <div className="h-px bg-zinc-200/80 w-full my-2"></div>
              <div className="flex flex-col space-y-3 pb-4">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3.5 bg-zinc-100 text-zinc-900 text-center font-extrabold rounded-xl"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3.5 bg-zinc-950 text-white text-center font-extrabold rounded-xl shadow-lg"
                >
                  {t('nav.deployWorkspace')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-10">
        <section className="pt-32 pb-12 md:pt-40 md:pb-20 px-4 md:px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-xs font-semibold text-zinc-600 mb-6 md:mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            {t('hero.versionLive')}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 mb-4 md:mb-6 leading-[1.1]">
            {t('hero.title1')}{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-900 to-zinc-500">
              {t('hero.title2')}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-zinc-500 mb-8 md:mb-10 max-w-2xl leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full justify-center px-4 sm:px-0">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-4 md:px-8 bg-zinc-900 text-white rounded-xl font-bold text-[15px] md:text-base hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {t('hero.createWorkspace')}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto px-6 py-4 md:px-8 bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl font-bold text-[15px] md:text-base hover:border-zinc-300 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {t('hero.viewDemo')}
            </Link>
          </div>
        </section>

        <section className="py-6 md:py-10 border-y border-zinc-200/60 bg-white/60 backdrop-blur-md overflow-hidden flex flex-col relative">
          <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 md:mb-8 relative z-20">
            {t('hero.trustedBy')}
          </p>
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-r from-[#fafafb] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-l from-[#fafafb] to-transparent z-10 pointer-events-none"></div>

          <div className="flex whitespace-nowrap overflow-hidden group">
            <div className="flex items-center gap-12 md:gap-16 animate-marquee group-hover:[animation-play-state:paused] px-4 md:px-8">
              {[
                { name: 'Lethal Company IC.', style: 'font-serif font-black' },
                { name: 'ACME Corp.', style: 'tracking-tighter font-bold' },
                {
                  name: 'Stark Ind.',
                  style: 'uppercase tracking-widest font-black',
                },
                { name: 'Globex', style: 'italic font-bold' },
                { name: 'InGen', style: 'font-mono tracking-tight font-bold' },
                { name: 'Wayne Ent.', style: 'font-serif italic font-bold' },
                {
                  name: 'Massive Dynamic',
                  style: 'uppercase font-medium tracking-[0.2em]',
                },
                {
                  name: 'Cyberdyne Systems',
                  style: 'font-black tracking-tighter',
                },
                { name: 'Umbrella Corp.', style: 'uppercase font-bold' },
                { name: 'Hooli', style: 'lowercase font-black text-2xl' },
                {
                  name: 'Vandelay Ind.',
                  style: 'font-serif font-bold text-xl',
                },
                { name: 'Pied Piper', style: 'font-mono font-bold' },
              ].map((company, i) => (
                <span
                  key={i}
                  className={`text-lg md:text-xl text-zinc-400 hover:text-zinc-900 transition-colors cursor-default ${company.style}`}
                >
                  {company.name}
                </span>
              ))}
            </div>

            <div
              className="flex items-center gap-12 md:gap-16 animate-marquee group-hover:[animation-play-state:paused] px-4 md:px-8"
              aria-hidden="true"
            >
              {[
                { name: 'Lethal Company IC.', style: 'font-serif font-black' },
                { name: 'ACME Corp.', style: 'tracking-tighter font-bold' },
                {
                  name: 'Stark Ind.',
                  style: 'uppercase tracking-widest font-black',
                },
                { name: 'Globex', style: 'italic font-bold' },
                { name: 'InGen', style: 'font-mono tracking-tight font-bold' },
                { name: 'Wayne Ent.', style: 'font-serif italic font-bold' },
                {
                  name: 'Massive Dynamic',
                  style: 'uppercase font-medium tracking-[0.2em]',
                },
                {
                  name: 'Cyberdyne Systems',
                  style: 'font-black tracking-tighter',
                },
                { name: 'Umbrella Corp.', style: 'uppercase font-bold' },
                { name: 'Hooli', style: 'lowercase font-black text-2xl' },
                {
                  name: 'Vandelay Ind.',
                  style: 'font-serif font-bold text-xl',
                },
                { name: 'Pied Piper', style: 'font-mono font-bold' },
              ].map((company, i) => (
                <span
                  key={`copy-${i}`}
                  className={`text-lg md:text-xl text-zinc-400 hover:text-zinc-900 transition-colors cursor-default ${company.style}`}
                >
                  {company.name}
                </span>
              ))}
            </div>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-100%); }
            }
            .animate-marquee {
              animation: marquee 35s linear infinite;
            }
          `,
            }}
          />
        </section>

        <section className="py-12 md:py-24 px-4 md:px-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 space-y-5 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 mb-2 shadow-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {t('ai.badge')}
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight leading-[1.1]">
                {t('ai.title1')} <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-violet-600">
                  {t('ai.title2')}
                </span>
              </h2>
              <p className="text-base md:text-lg text-zinc-500 leading-relaxed">
                {t('ai.desc')}
              </p>

              <ul className="space-y-3 md:space-y-4 mt-6 md:mt-8">
                <li className="flex items-center gap-4 text-zinc-700 font-bold text-[13px] md:text-sm">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    ✓
                  </div>
                  {t('ai.feat1')}
                </li>
                <li className="flex items-center gap-4 text-zinc-700 font-bold text-[13px] md:text-sm">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                    ✓
                  </div>
                  {t('ai.feat2')}
                </li>
                <li className="flex items-center gap-4 text-zinc-700 font-bold text-[13px] md:text-sm">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 shrink-0">
                    ✓
                  </div>
                  {t('ai.feat3')}
                </li>
              </ul>
            </div>

            <div className="flex-1 w-full bg-zinc-950 rounded-3xl md:rounded-4xl p-2 md:p-3 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500 hover:shadow-indigo-500/20">
              <div className="bg-zinc-900 rounded-[20px] md:rounded-3xl border border-zinc-800 p-4 md:p-6 flex flex-col h-auto md:h-[400px]">
                <div className="flex items-center gap-2 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-zinc-800/80">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    RAG_Engine_Active
                  </span>
                </div>

                <div className="flex flex-col gap-4 md:gap-5 flex-1 overflow-hidden font-sans">
                  <div className="self-end bg-indigo-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-2xl rounded-tr-sm text-xs md:text-[13px] shadow-sm max-w-[85%] font-medium">
                    {t('ai.chatQ')}
                  </div>

                  <div className="self-start flex gap-2 md:gap-3 max-w-[95%] md:max-w-[90%]">
                    <div className="w-6 h-6 rounded-md bg-linear-to-br from-indigo-500 to-violet-600 shrink-0 flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="bg-zinc-800 text-zinc-300 px-3 md:px-4 py-3 rounded-2xl rounded-tl-sm text-xs md:text-[13px] shadow-sm border border-zinc-700/50 leading-relaxed">
                      {t('ai.chatA1')}
                      <br />
                      <br />
                      <span className="text-white font-bold">
                        {t('ai.chatA2')}
                      </span>
                      <br />
                      <span className="text-white font-bold">
                        {t('ai.chatA3')}
                      </span>
                      <br />
                      <span className="text-white font-bold">
                        {t('ai.chatA4')}
                      </span>
                      <br />
                      <br />
                      {t('ai.chatA5')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingChatbot />

        <section className="py-12 md:py-24 px-4 md:px-6 max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
              {t('features.title')}
            </h2>
            <p className="text-zinc-500 mt-3 md:mt-4 text-sm md:text-base">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-5 md:mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-2">
                {t('features.f1Title')}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-xs md:text-sm">
                {t('features.f1Desc')}
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-5 md:mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-2">
                {t('features.f2Title')}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-xs md:text-sm">
                {t('features.f2Desc')}
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-5 md:mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-2">
                {t('features.f3Title')}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-xs md:text-sm">
                {t('features.f3Desc')}
              </p>
            </div>

            <div className="hidden md:block p-6 md:p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-5 md:mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-2">
                {t('features.f4Title')}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-xs md:text-sm">
                {t('features.f4Desc')}
              </p>
            </div>

            <div className="hidden md:block p-6 md:p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-5 md:mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-2">
                {t('features.f5Title')}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-xs md:text-sm">
                {t('features.f5Desc')}
              </p>
            </div>

            <div className="hidden md:block p-6 md:p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/60 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center mb-5 md:mb-6 text-zinc-900 group-hover:scale-110 transition-transform">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-2">
                {t('features.f6Title')}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-xs md:text-sm">
                {t('features.f6Desc')}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 px-4 md:px-6 max-w-6xl mx-auto border-t border-zinc-200/60 mt-6 md:mt-10">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
              {t('architecture.title1')} <br className="hidden sm:block" />
              <span className="text-zinc-400">{t('architecture.title2')}</span>
            </h2>
            <p className="text-zinc-500 mt-3 md:mt-4 max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">
              {t('architecture.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <DraggableFeatureBox
              title={t('architecture.t1')}
              desc={t('architecture.d1')}
              deepDive={t('architecture.dd1')}
              icon={
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.987 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm-3.66-6.42l-1.32.96v-9.08l1.32-.96v9.08zm4.98 0l-1.32.96V11.2l-3.32 4.42-1.32-.96 4.64-5.38v7.3zm1.66 0l1.32.96V7.46l-1.32-.96v9.08z" />
                </svg>
              }
            />

            <DraggableFeatureBox
              title={t('architecture.t2')}
              desc={t('architecture.d2')}
              deepDive={t('architecture.dd2')}
              icon={
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />

            <DraggableFeatureBox
              title={t('architecture.t3')}
              desc={t('architecture.d3')}
              deepDive={t('architecture.dd3')}
              icon={
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-.988-2.386l-.548-.547z"
                  />
                </svg>
              }
            />

            <div className="hidden md:block">
              <DraggableFeatureBox
                title={t('architecture.t4')}
                desc={t('architecture.d4')}
                deepDive={t('architecture.dd4')}
                icon={
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                }
              />
            </div>

            <div className="hidden md:block">
              <DraggableFeatureBox
                title={t('architecture.t5')}
                desc={t('architecture.d5')}
                deepDive={t('architecture.dd5')}
                icon={
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                }
              />
            </div>

            <div className="hidden md:block">
              <DraggableFeatureBox
                title={t('architecture.t6')}
                desc={t('architecture.d6')}
                deepDive={t('architecture.dd6')}
                icon={
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-32 relative overflow-hidden border-t border-zinc-200/60 mt-6 md:mt-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-100 via-transparent to-transparent -z-10"></div>

          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="w-full lg:w-5/12 space-y-6 md:space-y-8 z-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] md:text-xs font-bold text-blue-600 mb-4 md:mb-6 shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {t('anatomy.badge')}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4 md:mb-5 leading-[1.1]">
                    {t('anatomy.title1')} <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                      {t('anatomy.title2')}
                    </span>
                  </h2>
                  <p className="text-base md:text-lg text-zinc-500 leading-relaxed font-medium">
                    {t('anatomy.desc')}
                  </p>
                </div>

                <div className="space-y-4 md:space-y-6 pt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-1 shadow-sm">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-zinc-900">
                        {t('anatomy.f1Title')}
                      </h4>
                      <p className="text-xs md:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                        {t('anatomy.f1Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-1 shadow-sm">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-zinc-900">
                        {t('anatomy.f2Title')}
                      </h4>
                      <p className="text-xs md:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                        {t('anatomy.f2Desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-7/12 relative z-10 group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/20 blur-[100px] rounded-full -z-10 transition-opacity duration-700 opacity-70 group-hover:opacity-100"></div>
                <div className="relative w-full rounded-2xl md:rounded-3xl border border-zinc-200/80 shadow-2xl shadow-indigo-900/10 bg-white/60 backdrop-blur-xl p-2 md:p-3 transition-transform duration-700 hover:-translate-y-2">
                  <div className="flex items-center gap-1.5 px-2 pb-2 md:pb-3 pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                  </div>
                  <div className="rounded-lg md:rounded-xl border border-zinc-200/50 overflow-hidden bg-zinc-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/dashboard.png"
                      alt="SaaS Engine Workspace Dashboard"
                      className="w-full h-auto block"
                    />
                  </div>
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/2 rounded-2xl md:rounded-3xl pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12 px-4 md:px-6 max-w-5xl mx-auto mt-6 md:mt-10">
          <div className="relative w-full bg-zinc-950 rounded-3xl md:rounded-4xl border border-zinc-800 p-6 md:p-12 overflow-hidden shadow-2xl group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-[80px] group-hover:bg-indigo-500/30 transition-colors duration-700 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-[80px] group-hover:bg-fuchsia-500/30 transition-colors duration-700 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
              <div className="text-left flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-4 md:mb-6 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  {t('promo.badge')}
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3 md:mb-4 leading-tight">
                  {t('promo.title1')}{' '}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-yellow-400 to-amber-600">
                    {t('promo.title2')}
                  </span>{' '}
                  {t('promo.title3')}
                </h3>
                <p className="text-zinc-400 text-sm md:text-lg font-medium max-w-xl leading-relaxed">
                  {t('promo.desc')}
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto flex flex-col items-center md:items-end">
                <Link
                  href="/register"
                  className="w-full md:w-auto px-6 py-4 md:px-8 bg-white text-zinc-950 font-extrabold rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-1"
                >
                  {t('promo.claim')}
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <p className="text-center md:text-right text-[11px] text-zinc-500 mt-4 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t('promo.spots')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-32 px-4 md:px-6 max-w-7xl mx-auto border-t border-zinc-200/60 mt-8 md:mt-10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-100 via-transparent to-transparent -z-10"></div>
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            <div className="flex-1 space-y-6 md:space-y-8 lg:pr-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] md:text-xs font-bold text-zinc-600 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                {t('personal.badge')}
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.05]">
                {t('personal.title1')} <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-400 to-zinc-600">
                  {t('personal.title2')}
                </span>
              </h2>
              <p className="text-base md:text-xl text-zinc-500 leading-relaxed max-w-lg">
                {t('personal.desc1')}
                <strong className="text-zinc-900 font-bold">
                  {t('personal.descStrong')}
                </strong>
                {t('personal.desc2')}
              </p>

              <div className="pt-2 md:pt-4 flex gap-6 items-center">
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black text-zinc-900">
                    100%
                  </span>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {t('personal.private')}
                  </span>
                </div>
                <div className="w-px h-8 md:h-10 bg-zinc-200"></div>
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black text-zinc-900">
                    ∞
                  </span>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {t('personal.blocks')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <div className="group relative bg-white p-5 md:p-8 rounded-3xl md:rounded-4xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/80 rounded-full blur-3xl -z-10 group-hover:bg-orange-200 transition-colors duration-500 translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-linear-to-br from-orange-50 to-orange-100 border border-orange-200 text-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                  <svg
                    className="w-6 h-6 md:w-7 md:h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h4 className="text-lg md:text-xl font-bold text-zinc-900 mb-2 md:mb-3">
                  {t('personal.t1')}
                </h4>
                <p className="text-[13px] md:text-sm text-zinc-500 leading-relaxed font-medium">
                  {t('personal.d1')}
                </p>
              </div>

              <div className="group relative bg-white p-5 md:p-8 rounded-3xl md:rounded-4xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden hover:-translate-y-1">
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-sky-100/80 rounded-full blur-3xl -z-10 group-hover:bg-sky-200 transition-colors duration-500 translate-x-1/2 translate-y-1/2"></div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-linear-to-br from-sky-50 to-sky-100 border border-sky-200 text-sky-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                  <svg
                    className="w-6 h-6 md:w-7 md:h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg md:text-xl font-bold text-zinc-900 mb-2 md:mb-3">
                  {t('personal.t2')}
                </h4>
                <p className="text-[13px] md:text-sm text-zinc-500 leading-relaxed font-medium">
                  {t('personal.d2')}
                </p>
              </div>

              <div className="group relative bg-zinc-950 p-6 sm:p-10 rounded-3xl md:rounded-[2.5rem] border border-zinc-800 shadow-xl sm:col-span-2 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden mt-1 sm:mt-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-size-[2rem_2rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
                <div className="relative z-10 flex flex-col sm:flex-row gap-5 md:gap-6 items-start sm:items-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-800/80 backdrop-blur-md text-indigo-400 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 border border-zinc-700/50 shadow-inner group-hover:scale-105 group-hover:text-indigo-300 transition-all duration-500">
                    <svg
                      className="w-6 h-6 md:w-8 md:h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {t('personal.t3')}
                    </h4>
                    <p className="text-zinc-400 leading-relaxed font-medium max-w-lg text-[13px] md:text-sm">
                      {t('personal.d3')}
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 md:px-6 max-w-5xl mx-auto mb-8 md:mb-10">
          <div className="bg-zinc-900 rounded-[2rem] md:rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-6xl font-black text-white mb-4 md:mb-6 tracking-tighter">
                {t('cta.title')}
              </h2>
              <p className="text-zinc-400 mb-8 md:mb-10 max-w-xl mx-auto text-sm md:text-lg font-medium">
                {t('cta.desc')}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 md:px-10 md:py-5 bg-white text-zinc-950 rounded-2xl font-extrabold text-[15px] md:text-base hover:bg-zinc-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1"
              >
                {t('cta.button')}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
