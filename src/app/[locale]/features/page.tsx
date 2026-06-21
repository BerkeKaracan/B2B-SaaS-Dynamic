"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import {
  Layers,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function FeaturesPage() {
  const t = useTranslations("FeaturesPage");

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans flex flex-col selection:bg-zinc-200">
      <header className="h-16 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl fixed top-0 w-full z-50 px-6 lg:px-10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          <span className="text-sm font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors">
            {t("back")}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-950 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-black font-mono tracking-tighter">
              B2
            </span>
          </div>
          <span className="text-sm font-black text-zinc-950 tracking-tight uppercase">
            SaaS Engine
          </span>
        </div>
        <div className="w-16"></div>
      </header>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight mb-6 leading-[1.1]">
            {t("title").split(".")[0]}. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-500 to-zinc-400">
              {t("title").split(".")[1]}.
            </span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <div className="group bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              {t("canvas.title")}
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium">
              {t("canvas.desc")}
            </p>
          </div>

          <div className="group bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              {t("realtime.title")}
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium">
              {t("realtime.desc")}
            </p>
          </div>

          <div className="group bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -z-10 group-hover:bg-rose-500/10 transition-colors"></div>
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              {t("security.title")}
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium">
              {t("security.desc")}
            </p>
          </div>

          <div className="group bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-colors"></div>
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              {t("ai.title")}
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium">
              {t("ai.desc")}
            </p>
          </div>
        </div>

        <div className="mt-20 bg-zinc-950 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8 tracking-tight">
              {t("cta.title")}
            </h2>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-extrabold text-sm hover:bg-zinc-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:-translate-y-1"
            >
              {t("cta.button")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
