"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import BrandLogo from "@/components/brand/BrandLogo";
import {
  ArrowLeft,
  Briefcase,
  Globe,
  TrendingUp,
  Heart,
  BookOpen,
  ChevronRight,
  Mail,
} from "lucide-react";

export default function CareersPage() {
  const t = useTranslations("CareersPage");

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

      <main className="flex-1 pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 mb-6">
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight mb-6 leading-[1.1]">
            {t("title")}
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-black text-zinc-900 mb-10 text-center">
            {t("benefits.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">
                  {t("benefits.b1.title")}
                </h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  {t("benefits.b1.desc")}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">
                  {t("benefits.b2.title")}
                </h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  {t("benefits.b2.desc")}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">
                  {t("benefits.b3.title")}
                </h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  {t("benefits.b3.desc")}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">
                  {t("benefits.b4.title")}
                </h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  {t("benefits.b4.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-black text-zinc-900 mb-10">
            {t("openings.title")}
          </h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold text-zinc-400 mb-4 uppercase tracking-widest">
                {t("openings.engineering")}
              </h3>
              <div className="space-y-4">
                <Link
                  href="/contact"
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-zinc-200/80 rounded-2xl hover:border-blue-500/50 hover:shadow-md transition-all"
                >
                  <div className="mb-4 md:mb-0">
                    <h4 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors mb-2">
                      {t("openings.roles.r1.title")}
                    </h4>
                    <div className="flex gap-3 text-sm font-medium text-zinc-500">
                      <span className="bg-zinc-100 px-2.5 py-1 rounded-md">
                        {t("openings.roles.r1.type")}
                      </span>
                      <span className="bg-zinc-100 px-2.5 py-1 rounded-md">
                        {t("openings.roles.r1.location")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-blue-600 transition-colors">
                    {t("openings.apply")}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>

                <Link
                  href="/contact"
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-zinc-200/80 rounded-2xl hover:border-blue-500/50 hover:shadow-md transition-all"
                >
                  <div className="mb-4 md:mb-0">
                    <h4 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors mb-2">
                      {t("openings.roles.r2.title")}
                    </h4>
                    <div className="flex gap-3 text-sm font-medium text-zinc-500">
                      <span className="bg-zinc-100 px-2.5 py-1 rounded-md">
                        {t("openings.roles.r2.type")}
                      </span>
                      <span className="bg-zinc-100 px-2.5 py-1 rounded-md">
                        {t("openings.roles.r2.location")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-blue-600 transition-colors">
                    {t("openings.apply")}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-400 mb-4 uppercase tracking-widest">
                {t("openings.design")}
              </h3>
              <div className="space-y-4">
                <Link
                  href="/contact"
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-zinc-200/80 rounded-2xl hover:border-blue-500/50 hover:shadow-md transition-all"
                >
                  <div className="mb-4 md:mb-0">
                    <h4 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors mb-2">
                      {t("openings.roles.r3.title")}
                    </h4>
                    <div className="flex gap-3 text-sm font-medium text-zinc-500">
                      <span className="bg-zinc-100 px-2.5 py-1 rounded-md">
                        {t("openings.roles.r3.type")}
                      </span>
                      <span className="bg-zinc-100 px-2.5 py-1 rounded-md">
                        {t("openings.roles.r3.location")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-blue-600 transition-colors">
                    {t("openings.apply")}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center bg-blue-50 border border-blue-100 rounded-[2.5rem] p-12 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="text-zinc-600 mb-8 max-w-md mx-auto text-base font-medium">
            {t("cta.subtitle")}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg"
          >
            {t("cta.button")}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
