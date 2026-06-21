"use client";

import React, { useEffect, useState } from "react";
import { fetchAPI } from "@/services/api";
import { Globe, ArrowUpRight } from "lucide-react";

type PublicRecord = {
  id: string;
  record_data: {
    name?: string;
    updated_by?: string;
    template?: string;
    [key: string]: unknown;
  };
};

export default function CommunityHubPage() {
  const [demos, setDemos] = useState<PublicRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCommunityRecords = async () => {
      try {
        const res = await fetchAPI(
          `/api/public/records?limit=20&t=${new Date().getTime()}`,
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
    fetchCommunityRecords();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 md:p-10 h-full w-full custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Globe size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Community Hub
              </h1>
            </div>
            <p className="text-sm text-zinc-500 font-medium">
              Explore public frameworks and templates shared by the community.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
          </div>
        ) : demos.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {demos.map((d) => {
              const isTemplate =
                d.record_data.template && d.record_data.template !== "blank";

              return (
                <div
                  key={d.id}
                  className="bg-white border border-zinc-200 p-5 md:p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center font-black text-lg text-zinc-400 uppercase group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                        {(d.record_data.name || "U").charAt(0)}
                      </div>
                      {isTemplate && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded shadow-xs border border-blue-100">
                          {d.record_data.template}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-zinc-950 tracking-tight line-clamp-1 mb-1">
                      {d.record_data.name || "Untitled Workspace"}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      By {d.record_data.updated_by || "System Architect"}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100">
                    <a
                      href={`/share/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl text-xs font-bold group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shadow-sm"
                    >
                      Open Framework <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
