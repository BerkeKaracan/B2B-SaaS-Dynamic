'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import ProjectCardsGrid from '@/components/workspace/ProjectCardsGrid';

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'active';
  const isTrash = view === 'trash';
  const isArchive = view === 'archive';
  const isStorageView = isTrash || isArchive;

  return (
    <div className="relative flex-1 overflow-y-auto h-full w-full custom-scrollbar">
      <div className="pointer-events-none absolute inset-0 bg-[#f7f9fb] dark:bg-zinc-950" />
      <div
        className={`pointer-events-none absolute inset-0 ${
          isTrash
            ? 'bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(244,63,94,0.10),transparent_55%)]'
            : isArchive
              ? 'bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(245,158,11,0.12),transparent_55%)]'
              : 'bg-[radial-gradient(ellipse_70%_45%_at_0%_0%,rgba(56,189,248,0.12),transparent_50%),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(255,255,255,0.7),transparent_45%)] dark:bg-[radial-gradient(ellipse_70%_45%_at_0%_0%,rgba(56,189,248,0.08),transparent_50%)]'
        }`}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(24,24,27,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.035) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div
        className={`relative mx-auto w-full max-w-6xl px-5 sm:px-8 ${
          isStorageView ? 'py-8 md:py-10 pb-28' : 'py-8 md:py-10'
        }`}
      >
        <ProjectCardsGrid />
      </div>
    </div>
  );
}
