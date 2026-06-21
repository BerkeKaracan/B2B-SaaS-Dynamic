"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, BookOpen, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const t = useTranslations("BlogPage");

  const posts = [
    {
      id: "1",
      color: "bg-blue-500",
      imgGradient: "from-blue-500/20 to-indigo-500/20",
    },
    {
      id: "2",
      color: "bg-emerald-500",
      imgGradient: "from-emerald-500/20 to-teal-500/20",
    },
    {
      id: "3",
      color: "bg-rose-500",
      imgGradient: "from-rose-500/20 to-pink-500/20",
    },
  ];

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
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-6">
            {t("title")}
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              href="/register"
              key={post.id}
              className="group flex flex-col bg-white rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div
                className={`h-48 w-full bg-linear-to-br ${post.imgGradient} relative overflow-hidden flex items-center justify-center`}
              >
                <div
                  className={`absolute inset-0 bg-white/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                ></div>
                <div className="w-16 h-16 bg-white/50 rounded-2xl border border-white/60 shadow-sm rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600`}
                  >
                    {t(`posts.${post.id}.category`)}
                  </span>
                  <span className="text-xs font-medium text-zinc-400">
                    {t(`posts.${post.id}.date`)}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {t(`posts.${post.id}.title`)}
                </h3>

                <p className="text-sm text-zinc-500 leading-relaxed font-medium mb-6 flex-1">
                  {t(`posts.${post.id}.desc`)}
                </p>

                <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition-colors mt-auto">
                  {t("readMore")}{" "}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
