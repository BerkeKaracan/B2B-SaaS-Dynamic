'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ProjectCardsGrid from '@/components/workspace/ProjectCardsGrid';

export default function ProjectsPage() {
  const t = useTranslations('ProjectsPage');

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-10 h-full w-full transition-colors duration-300">
      <div className="max-w-5xl mx-auto w-full">
        <ProjectCardsGrid />
      </div>
    </div>
  );
}
