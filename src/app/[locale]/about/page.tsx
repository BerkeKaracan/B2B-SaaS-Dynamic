"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import BrandLogo from "@/components/brand/BrandLogo";
import {
  ArrowLeft,
  Rocket,
  Globe,
  ArrowRight,
  Zap,
  Shield,
  Heart,
  Infinity,
} from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("AboutPage");

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

      <main className="flex-1 pt-32 pb-20 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 mb-6">
            <Rocket className="w-3.5 h-3.5 text-blue-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight mb-6 leading-[1.1]">
            {t("title")}
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 items-center">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 mb-6">
              {t("story.title")}
            </h2>
            <p className="text-zinc-500 leading-relaxed font-medium mb-6 text-lg">
              {t("story.p1")}
            </p>
            <p className="text-zinc-500 leading-relaxed font-medium text-lg">
              {t("story.p2")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 text-center shadow-sm">
              <div className="text-4xl font-black text-blue-600 mb-2">
                {t("stats.1.value")}
              </div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {t("stats.1.label")}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 text-center shadow-sm">
              <div className="text-4xl font-black text-emerald-600 mb-2">
                {t("stats.2.value")}
              </div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {t("stats.2.label")}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 text-center shadow-sm sm:col-span-2 flex flex-col items-center justify-center">
              <Globe className="w-8 h-8 text-indigo-500 mb-4" />
              <div className="text-3xl font-black text-zinc-900 mb-2">
                {t("stats.3.value")}
              </div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {t("stats.3.label")}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-zinc-900">
              {t("values.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                  {t("values.v1.title")}
                </h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  {t("values.v1.desc")}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                  {t("values.v2.title")}
                </h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  {t("values.v2.desc")}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                  {t("values.v3.title")}
                </h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  {t("values.v3.desc")}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100">
                <Infinity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                  {t("values.v4.title")}
                </h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  {t("values.v4.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-zinc-900 mb-4">
              {t("team.title")}
            </h2>
            <p className="text-lg text-zinc-500 font-medium">
              {t("team.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-40 h-40 mx-auto rounded-[2rem] bg-linear-to-br from-blue-100 to-indigo-100 mb-6 overflow-hidden border border-zinc-200/80 flex items-center justify-center group-hover:-translate-y-2 transition-transform shadow-sm">
                <span className="text-4xl font-black text-blue-300">JD</span>
              </div>
              <h4 className="text-xl font-bold text-zinc-900">John Doe</h4>
              <p className="text-sm font-medium text-blue-600 mt-1">
                {t("team.roles.ceo")}
              </p>
            </div>

            <div className="text-center group">
              <div className="w-40 h-40 mx-auto rounded-[2rem] bg-linear-to-br from-emerald-100 to-teal-100 mb-6 overflow-hidden border border-zinc-200/80 flex items-center justify-center group-hover:-translate-y-2 transition-transform shadow-sm">
                <span className="text-4xl font-black text-emerald-300">AS</span>
              </div>
              <h4 className="text-xl font-bold text-zinc-900">Alice Smith</h4>
              <p className="text-sm font-medium text-emerald-600 mt-1">
                {t("team.roles.cto")}
              </p>
            </div>

            <div className="text-center group">
              <div className="w-40 h-40 mx-auto rounded-[2rem] bg-linear-to-br from-rose-100 to-orange-100 mb-6 overflow-hidden border border-zinc-200/80 flex items-center justify-center group-hover:-translate-y-2 transition-transform shadow-sm">
                <span className="text-4xl font-black text-rose-300">MJ</span>
              </div>
              <h4 className="text-xl font-bold text-zinc-900">Mike Johnson</h4>
              <p className="text-sm font-medium text-rose-600 mt-1">
                {t("team.roles.design")}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center bg-zinc-950 rounded-[3rem] p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              {t("cta.title")}
            </h2>
            <p className="text-zinc-400 mb-10 max-w-xl mx-auto text-lg font-medium">
              {t("cta.subtitle")}
            </p>
            <Link
              href="/careers"
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
