"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import BrandLogo from "@/components/brand/BrandLogo";
import {
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Kanban,
  Users,
  TrendingUp,
  Map,
  Target,
  Calendar,
} from "lucide-react";

export default function TemplatesPage() {
  const t = useTranslations("TemplatesPage");

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
        <BrandLogo href={false} size="sm" />
        <div className="w-16"></div>
      </header>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-6 leading-[1.1]">
            {t("title")}
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/register"
            className="group bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
              <Kanban className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {t("cards.agile.title")}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              {t("cards.agile.desc")}
            </p>
          </Link>

          <Link
            href="/register"
            className="group bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {t("cards.onboarding.title")}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              {t("cards.onboarding.desc")}
            </p>
          </Link>

          <Link
            href="/register"
            className="group bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {t("cards.crm.title")}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              {t("cards.crm.desc")}
            </p>
          </Link>

          <Link
            href="/register"
            className="group bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 bg-sky-50 border border-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {t("cards.roadmap.title")}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              {t("cards.roadmap.desc")}
            </p>
          </Link>

          <Link
            href="/register"
            className="group bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {t("cards.okr.title")}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              {t("cards.okr.desc")}
            </p>
          </Link>

          <Link
            href="/register"
            className="group bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <div className="w-12 h-12 bg-purple-50 border border-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {t("cards.content.title")}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              {t("cards.content.desc")}
            </p>
          </Link>
        </div>

        <div className="mt-20 bg-zinc-900 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
              {t("cta.title")}
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto text-base font-medium">
              {t("cta.subtitle")}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-extrabold text-sm hover:bg-zinc-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1"
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
