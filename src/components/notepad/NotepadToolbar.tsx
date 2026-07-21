'use client';

import { Clock, Hash, FileText } from 'lucide-react';
import { META, SURFACE } from './notepadStyles';

export type NotepadToolbarLabels = {
  wordCount: string;
  lastEdited: string;
  readingTime: string;
  documentBadge: string;
  readonlyBadge: string;
};

type NotepadToolbarProps = {
  wordCount: number;
  isReadonly: boolean;
  isEditing: boolean;
  labels: NotepadToolbarLabels;
};

export default function NotepadToolbar({
  wordCount,
  isReadonly,
  isEditing,
  labels,
}: NotepadToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0 min-w-0">
      <span
        className={`hidden sm:inline-flex items-center gap-1 ${SURFACE.pill} ${META.chipOutline}`}
      >
        <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold tracking-wide text-[10px] uppercase">
          {labels.documentBadge}
        </span>
      </span>

      <span
        className={`${SURFACE.pill} transition-colors duration-300 ${
          isEditing ? META.chipAmber : META.chipIdle
        }`}
      >
        <Hash className="w-3 h-3 opacity-70" />
        <span>
          {wordCount} {labels.wordCount}
        </span>
      </span>

      <span
        className={`hidden md:inline-flex ${SURFACE.pill} ${META.chipOutline}`}
      >
        {labels.readingTime}
      </span>

      <span
        className={`hidden lg:inline-flex ${SURFACE.pill} ${META.chipOutline}`}
      >
        <Clock className="w-3 h-3" />
        {labels.lastEdited}
      </span>

      {isReadonly ? (
        <span
          className={`${SURFACE.pill} text-[10px] font-semibold uppercase tracking-wide ${META.chipIdle}`}
        >
          {labels.readonlyBadge}
        </span>
      ) : null}
    </div>
  );
}
