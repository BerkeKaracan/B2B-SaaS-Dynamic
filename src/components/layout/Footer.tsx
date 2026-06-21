"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="pt-20 pb-10 border-t border-zinc-200/80 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center shadow-md border border-zinc-800">
                <span className="text-white text-xs font-black font-mono tracking-tighter">
                  B2
                </span>
              </div>
              <span className="text-base font-extrabold text-zinc-900 tracking-tight uppercase">
                SaaS Engine
              </span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-6">
              {t("description")}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
              {t("product.title")}
            </h4>
            <ul className="space-y-3 text-sm font-medium text-zinc-500">
              <li>
                <Link
                  href="/features"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("product.features")}
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("product.integrations")}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("product.pricing")}
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("product.changelog")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
              {t("resources.title")}
            </h4>
            <ul className="space-y-3 text-sm font-medium text-zinc-500">
              <li>
                <Link
                  href="/docs"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("resources.documentation")}
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("resources.templateGallery")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("resources.blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("resources.community")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
              {t("company.title")}
            </h4>
            <ul className="space-y-3 text-sm font-medium text-zinc-500">
              <li>
                <Link
                  href="/about"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("company.aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("company.careers")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-zinc-950 transition-colors"
                >
                  {t("company.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-400 text-sm font-medium">
            © {new Date().getFullYear()} SaaS Engine Inc. {t("bottom.rights")}
          </p>
          <div className="flex gap-6 text-sm font-medium text-zinc-400">
            <Link
              href="/privacy"
              className="hover:text-zinc-900 transition-colors"
            >
              {t("bottom.privacy")}
            </Link>
            <Link
              href="/terms"
              className="hover:text-zinc-900 transition-colors"
            >
              {t("bottom.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
