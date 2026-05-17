import React from "react";
import Link from "next/link";

export default function DashboardFooter() {
  return (
    <footer className="h-10 shrink-0 border-t border-zinc-200/60 bg-white flex items-center justify-between px-4 text-[11px] text-zinc-400">
      <span className="font-bold text-zinc-600 tracking-tight uppercase">
        SaaS Engine
      </span>
      <div className="flex items-center gap-4">
        <span>© {new Date().getFullYear()}</span>
        <Link href="/privacy" className="hover:text-zinc-700 transition-colors">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
