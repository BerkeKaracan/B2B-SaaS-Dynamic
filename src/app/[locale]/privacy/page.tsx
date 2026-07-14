"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import BrandLogo from "@/components/brand/BrandLogo";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPage");

  return (
    <div className="min-h-screen bg-[#fafafb] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-300">
      <header className="h-16 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl fixed top-0 w-full z-50 px-6 lg:px-10 flex items-center justify-between transition-colors duration-300">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
            {t("back")}
          </span>
        </Link>
        <BrandLogo href={false} size="sm" />
        <div className="w-16"></div>
      </header>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-6 transition-colors duration-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            {t("lastUpdated")}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-6 mb-12 flex items-start gap-4 transition-colors duration-300">
          <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 leading-relaxed">
            {t("disclaimer")}
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">
              {t("sections.1.title")}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              {t("sections.1.content")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">
              {t("sections.2.title")}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              {t("sections.2.content")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">
              {t("sections.3.title")}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              {t("sections.3.content")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">
              {t("sections.4.title")}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              {t("sections.4.content")}
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t("contact")}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
