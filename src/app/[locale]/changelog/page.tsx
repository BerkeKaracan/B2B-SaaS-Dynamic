'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import { fetchAPI } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface ChangelogUpdate {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  labels: string[];
  url: string;
}

export default function ChangelogPage() {
  const [updates, setUpdates] = useState<ChangelogUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const res = await fetchAPI('/api/github/changelog?limit=30');
        if (res.ok) { 
          const data: ChangelogUpdate[] = await res.json();
          setUpdates(data);
        }
      } catch (error) {
        console.error('Failed to fetch changelog:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChangelog();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Feature':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Bug Fix':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'Improvement':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Design':
        return 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100';
      default:
        return 'bg-zinc-50 text-zinc-500 border-zinc-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans antialiased selection:bg-zinc-200 flex flex-col">
      <header className="h-16 border-b border-zinc-200/50 bg-white/75 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <BrandLogo size="sm" />
        <Link
          href="/"
          className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          &larr; Back home
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <div className="mb-16 border-b border-zinc-200 pb-8">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 mb-2">
            Changelog
          </h1>
          <p className="text-zinc-400 text-xs uppercase font-black tracking-widest">
            Live updates synced directly from GitHub Commits
          </p>
        </div>

        <div className="space-y-16 relative before:absolute before:inset-y-0 before:left-4 md:before:left-[120px] before:w-0.5 before:bg-zinc-200">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-zinc-900" />
              <p className="text-sm font-bold tracking-widest uppercase">
                Fetching updates from GitHub...
              </p>
            </div>
          ) : updates.length === 0 ? (
            <div className="pl-10 md:pl-0 text-center md:text-left md:ml-[140px] text-zinc-500 font-medium bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              No commits found in the repository yet.
            </div>
          ) : (
            updates.map((update) => (
              <div
                key={update.id}
                className="relative flex flex-col md:flex-row gap-4 md:gap-16 pl-10 md:pl-0 group"
              >
                <div className="md:w-[120px] md:text-right pt-1 shrink-0 flex md:flex-col items-start md:items-end gap-2">
                  <a
                    href={update.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-black text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded transition-colors block"
                  >
                    {update.id}
                  </a>
                  <span className="text-[10px] font-bold text-zinc-400 block">
                    {formatDate(update.date)}
                  </span>
                </div>

                <div className="absolute left-[3px] md:left-[117px] top-2.5 w-2.5 h-2.5 rounded-full bg-zinc-300 group-hover:bg-zinc-950 ring-4 ring-white z-10 transition-colors" />

                <div className="flex-1 bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-base font-extrabold text-zinc-950 tracking-tight mb-3">
                    {update.title}
                  </h3>
                  {update.description && (
                    <div className="text-zinc-600 text-[13px] font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                      {update.description}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
                    <div className="flex flex-wrap gap-1.5">
                      {update.labels.map((t) => (
                        <span
                          key={t}
                          className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded ${getLabelColor(t)}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                      by {update.author}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
