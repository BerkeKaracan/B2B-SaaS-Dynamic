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
    <div
      className={`flex-1 overflow-y-auto h-full w-full transition-colors duration-300 ${
        isStorageView ? 'relative custom-scrollbar' : 'bg-zinc-50 dark:bg-zinc-950 p-10'
      }`}
    >
      {isStorageView && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[#F4F6F8] dark:bg-black" />
          <div
            className={`pointer-events-none absolute inset-0 ${
              isTrash
                ? 'bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(251,113,133,0.08),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.07),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(251,113,133,0.05),_transparent_50%)]'
                : 'bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(161,98,7,0.08),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(161,98,7,0.05),_transparent_50%)]'
            }`}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(24,24,27,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </>
      )}

      <div
        className={`relative mx-auto w-full ${
          isStorageView ? 'max-w-5xl p-6 md:p-10 pb-32' : 'max-w-5xl'
        }`}
      >
        <ProjectCardsGrid />
      </div>
    </div>
  );
}
