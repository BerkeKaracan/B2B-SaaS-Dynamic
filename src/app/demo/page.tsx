"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/services/api";

type PublicRecord = {
  id: string;
  record_data: {
    name?: string;
    updated_by?: string;
    [key: string]: unknown;
  };
};

export default function DemoHubPage() {
  const [demos, setDemos] = useState<PublicRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEightDemos = async () => {
      try {
        const res = await fetchAPI(
          `/api/public/records?limit=8&t=${new Date().getTime()}`,
        );
        if (res.ok) {
          const data = await res.json();
          setDemos(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEightDemos();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-[0.3]"></div>

      <header className="relative z-50 h-14 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-zinc-800 hover:scale-95 transition-transform"
          >
            <span className="text-white text-[10px] font-black font-mono">
              B2
            </span>
          </Link>
          <div className="h-4 w-px bg-zinc-300"></div>
          <span className="text-xs font-black uppercase tracking-widest text-zinc-950">
            Global Template Hub
          </span>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors bg-white border border-zinc-200 px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md"
        >
          Return Home
        </Link>
      </header>

      <main className="flex-1 relative z-10 max-w-6xl w-full mx-auto px-6 py-16">
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-[10px] font-extrabold text-zinc-600 mb-4 uppercase tracking-widest">
              Live Ecosystem
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tight">
              System Demonstrations
            </h1>
            <p className="text-sm md:text-base font-medium text-zinc-500 mt-3 max-w-xl leading-relaxed">
              Explore the top 8 public system frameworks currently live on the
              engine pipeline. Clone architectures built by the community.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
          </div>
        ) : demos.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <span className="text-4xl block mb-4 grayscale opacity-50">📭</span>
            <h3 className="text-lg font-bold text-zinc-950 mb-2">
              No Public Frameworks Yet
            </h3>
            <p className="text-sm font-medium text-zinc-500">
              Be the first to publish your workspace globally. Open your
              project, click on Web Share Options and make it public.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {demos.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-zinc-200 p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center font-black text-lg text-zinc-400 mb-5 uppercase group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                    {(d.record_data.name || "U").charAt(0)}
                  </div>
                  <h3 className="text-sm font-black text-zinc-950 tracking-tight line-clamp-1 mb-1">
                    {d.record_data.name || "Untitled Workspace"}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    By {d.record_data.updated_by || "System Architect"}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-100">
                  <a
                    href={`/share/${d.id}`}
                    className="w-full text-center py-2.5 bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl text-xs font-bold block group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shadow-sm"
                  >
                    Open Framework
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
