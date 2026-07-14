"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import BrandLogo from "@/components/brand/BrandLogo";
import { ArrowLeft, Blocks, ArrowRight } from "lucide-react";

export default function IntegrationsPage() {
  const t = useTranslations("IntegrationsPage");

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
            <Blocks className="w-3.5 h-3.5 text-rose-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-6 leading-[1.1]">
            {t("title")}
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-200/20 rounded-full blur-3xl -z-10 group-hover:bg-zinc-200/40 transition-colors"></div>
            <div className="w-12 h-12 bg-white border border-zinc-200 text-zinc-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
              <svg
                viewBox="0 0 100 100"
                className="w-6 h-6"
                fill="currentColor"
              >
                <path
                  d="M20,20 L80,20 L80,80 L20,80 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <path d="M35,35 L45,35 L65,65 L65,35 L75,35 L75,75 L65,75 L45,45 L45,75 L35,75 Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              {t("cards.notion.title")}
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium mb-8 flex-1">
              {t("cards.notion.desc")}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
              Active
            </div>
          </div>

          <div className="bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-900/5 rounded-full blur-3xl -z-10 group-hover:bg-zinc-900/10 transition-colors"></div>
            <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              {t("cards.resend.title")}
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium mb-8 flex-1">
              {t("cards.resend.desc")}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
              Active
            </div>
          </div>

          <div className="bg-white p-8 rounded-4xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-900/5 rounded-full blur-3xl -z-10 group-hover:bg-zinc-900/10 transition-colors"></div>
            <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              {t("cards.github.title")}
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium mb-8 flex-1">
              {t("cards.github.desc")}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
              Active
            </div>
          </div>
        </div>

        <div className="mt-10 bg-zinc-950 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
              {t("cta.title")}
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto text-base font-medium">
              {t("cta.subtitle")}
            </p>
            <Link
              href="/docs"
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
