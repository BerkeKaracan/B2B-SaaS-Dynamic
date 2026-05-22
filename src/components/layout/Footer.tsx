import React from "react";
import Link from "next/link";

export default function Footer() {
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
              The ultimate operating system for your company. Build, manage, and
              scale your workflows with absolute precision.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm font-medium text-zinc-500">
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
              Resources
            </h4>
            <ul className="space-y-3 text-sm font-medium text-zinc-500">
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Template Gallery
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm font-medium text-zinc-500">
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-400 text-sm font-medium">
            © {new Date().getFullYear()} SaaS Engine Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-zinc-400">
            <Link
              href="/privacy"
              className="hover:text-zinc-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-zinc-900 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
