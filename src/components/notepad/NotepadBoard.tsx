'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  Image as ImageIcon,
  Smile,
  MessageSquare,
  MoreHorizontal,
  Clock,
  Share,
  Globe,
} from 'lucide-react';

interface CustomStyle extends React.CSSProperties {
  fieldSizing?: 'content' | 'fixed';
}

export default function NotepadBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('NotepadBoard');

  const { updatePageTitle, pages, updatePageSettings } = useCanvasStore();

  const currentPage = pages.find((p) => p.id === projectId);

  const settings = currentPage?.settings || {};

  const [title, setTitle] = useState(
    (settings.notepadTitle as string) || currentPage?.title || ''
  );
  const [content, setContent] = useState(
    (settings.notepadContent as string) || ''
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (settings.notepadTitle !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(settings.notepadTitle as string);
    }
    if (settings.notepadContent !== undefined) {
      setContent(settings.notepadContent as string);
    }
  }, [settings.notepadTitle, settings.notepadContent]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updatePageTitle(projectId, newTitle || 'Untitled Note');
    updatePageSettings(projectId, { notepadTitle: newTitle });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updatePageSettings(projectId, { notepadContent: newContent });
  };

  if (!isClient) return null;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="absolute inset-0 flex flex-col bg-white dark:bg-[#191919] transition-colors duration-300 overflow-y-auto custom-scrollbar cursor-text">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-12 py-3 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('lastEdited')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 mr-2">
            {wordCount} {t('wordCount')}
          </span>
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Share className="w-3.5 h-3.5" />
            {t('share')}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors">
            <Globe className="w-3.5 h-3.5" />
            {t('publish')}
          </button>
          <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 sm:px-12 pt-8 pb-32">
        <div className="flex items-center gap-4 mb-6 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <ImageIcon className="w-4 h-4" />
            {t('addCover')}
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <Smile className="w-4 h-4" />
            {t('addIcon')}
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <MessageSquare className="w-4 h-4" />
            {t('addComment')}
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder={t('titlePlaceholder')}
          className="w-full text-4xl sm:text-5xl font-bold bg-transparent text-zinc-900 dark:text-zinc-100 border-none outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 mb-6 resize-none leading-tight"
        />

        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder={t('contentPlaceholder')}
          className="w-full min-h-[500px] text-base sm:text-lg bg-transparent text-zinc-800 dark:text-zinc-300 border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 resize-none leading-relaxed"
          style={{ fieldSizing: 'content' } as CustomStyle}
        />
      </div>
    </div>
  );
}
