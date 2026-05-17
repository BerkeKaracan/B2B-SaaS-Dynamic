import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-10 border-t border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold font-mono">B2</span>
          </div>
          <span className="text-sm font-bold text-zinc-800 tracking-tight uppercase">SaaS Engine</span>
        </div>
        
        <p className="text-zinc-400 text-sm">
          © {new Date().getFullYear()} SaaS Engine. All rights reserved.
        </p>
        
        <div className="flex gap-6 text-sm font-medium text-zinc-500">
          <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-zinc-900 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}