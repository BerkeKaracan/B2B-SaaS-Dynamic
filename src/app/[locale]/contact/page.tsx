"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import BrandLogo from "@/components/brand/BrandLogo";
import { ArrowLeft, Mail, MessageCircle, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("ContactPage");

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 mb-6">
              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
              {t("badge")}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-6 leading-[1.1]">
              {t("title")}
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed font-medium mb-12">
              {t("subtitle")}
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white border border-zinc-200 shadow-sm rounded-2xl flex items-center justify-center shrink-0 text-zinc-900">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">
                    {t("info.email.title")}
                  </h3>
                  <p className="text-sm text-zinc-500 font-medium mb-2">
                    {t("info.email.desc")}
                  </p>
                  <a
                    href={`mailto:${t("info.email.value")}`}
                    className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                  >
                    {t("info.email.value")}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white border border-zinc-200 shadow-sm rounded-2xl flex items-center justify-center shrink-0 text-zinc-900">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">
                    {t("info.location.title")}
                  </h3>
                  <p className="text-sm text-zinc-500 font-medium mb-2">
                    {t("info.location.desc")}
                  </p>
                  <span className="text-zinc-900 font-bold">
                    {t("info.location.value")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-zinc-200/80 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <form
              className="space-y-6 relative z-10"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-900">
                    {t("form.name")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("form.namePlaceholder")}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-900">
                    {t("form.email")}
                  </label>
                  <input
                    type="email"
                    placeholder={t("form.emailPlaceholder")}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900">
                  {t("form.subject")}
                </label>
                <input
                  type="text"
                  placeholder={t("form.subjectPlaceholder")}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900">
                  {t("form.message")}
                </label>
                <textarea
                  rows={5}
                  placeholder={t("form.messagePlaceholder")}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-zinc-400 resize-none"
                ></textarea>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white rounded-xl font-extrabold text-sm hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                {t("form.button")}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
