'use client';

import { Image as ImageIcon, Smile, MessageSquare } from 'lucide-react';
import { META } from './notepadStyles';

export type NotepadPageActionLabels = {
  addCover: string;
  addIcon: string;
  addComment: string;
};

type NotepadPageActionsProps = {
  visible: boolean;
  labels: NotepadPageActionLabels;
};

export default function NotepadPageActions({
  visible,
  labels,
}: NotepadPageActionsProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-1 mb-5 shrink-0 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-0.5 pointer-events-none group-hover/paper:opacity-100 group-hover/paper:translate-y-0 group-hover/paper:pointer-events-auto group-focus-within/paper:opacity-100 group-focus-within/paper:translate-y-0 group-focus-within/paper:pointer-events-auto'
      }`}
    >
      <button type="button" className={META.action}>
        <ImageIcon className="w-3.5 h-3.5" />
        {labels.addCover}
      </button>
      <button type="button" className={META.action}>
        <Smile className="w-3.5 h-3.5" />
        {labels.addIcon}
      </button>
      <button type="button" className={META.action}>
        <MessageSquare className="w-3.5 h-3.5" />
        {labels.addComment}
      </button>
    </div>
  );
}
