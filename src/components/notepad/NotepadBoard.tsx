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
  FileText,
} from 'lucide-react';

interface CustomStyle extends React.CSSProperties {
  fieldSizing?: 'content' | 'fixed';
}

export default function NotepadBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('NotepadBoard');

  const { updatePageTitle, pages, updatePageSettings, metadata, updateMetadata } =
    useCanvasStore();

  const currentPage =
    pages.find((p) => p.id === projectId) ||
    pages.find((p) => ['notes', 'document'].includes(p.type)) ||
    pages[0];

  const settings = currentPage?.settings || {};
  const pageKey = currentPage?.id || projectId;

  const [title, setTitle] = useState(
    (settings.notepadTitle as string) ||
      (metadata.notepadTitle as string) ||
      currentPage?.title ||
      ''
  );
  const [content, setContent] = useState(
    (settings.notepadContent as string) ||
      (settings.documentContent as string) ||
      (metadata.notepadContent as string) ||
      ''
  );
  const [isClient, setIsClient] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    const nextTitle =
      (settings.notepadTitle as string | undefined) ??
      (metadata.notepadTitle as string | undefined);
    const nextContent =
      (settings.notepadContent as string | undefined) ??
      (settings.documentContent as string | undefined) ??
      (metadata.notepadContent as string | undefined);

    if (nextTitle !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(nextTitle);
    }
    if (nextContent !== undefined) {
      setContent(nextContent);
    }
  }, [
    settings.notepadTitle,
    settings.notepadContent,
    settings.documentContent,
    metadata.notepadTitle,
    metadata.notepadContent,
  ]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentPage) {
      updatePageTitle(pageKey, newTitle || 'Untitled Note');
      updatePageSettings(pageKey, { notepadTitle: newTitle });
    }
    updateMetadata({ notepadTitle: newTitle });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (currentPage) {
      updatePageSettings(pageKey, { notepadContent: newContent });
    }
    updateMetadata({ notepadContent: newContent });
  };

  if (!isClient) return null;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isEmpty = !title.trim() && !content.trim();

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent transition-colors duration-300 overflow-hidden cursor-default">
      <div className="h-14 shrink-0 z-10 flex items-center justify-between px-4 md:px-5 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
              {title.trim() || t('untitled')}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">{t('lastEdited')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline-flex items-center px-2 py-1 text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 rounded-md">
            {wordCount} {t('wordCount')}
          </span>
          <span className="hidden md:inline-flex items-center px-2 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-md">
            {t('private')}
          </span>
          <button
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Share className="w-3.5 h-3.5" />
            {t('share')}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {t('publish')}
          </button>
          <button
            type="button"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl w-full mx-auto px-6 sm:px-12 pt-8 pb-32">
          <div
            className={`flex flex-wrap items-center gap-1.5 mb-6 transition-opacity ${
              isEmpty || isEditorFocused
                ? 'opacity-100'
                : 'opacity-0 hover:opacity-100 focus-within:opacity-100'
            }`}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-lg transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {t('addCover')}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-lg transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
              {t('addIcon')}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-lg transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t('addComment')}
            </button>
          </div>

          <div
            className={`rounded-xl transition-shadow ${
              isEditorFocused
                ? 'ring-1 ring-zinc-200/80 dark:ring-zinc-700/80'
                : ''
            }`}
          >
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={() => setIsEditorFocused(false)}
              placeholder={t('titlePlaceholder')}
              className="w-full text-4xl sm:text-5xl font-bold bg-transparent text-zinc-900 dark:text-zinc-100 border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 mb-4 resize-none leading-tight tracking-tight px-0.5"
            />

            <textarea
              value={content}
              onChange={handleContentChange}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={() => setIsEditorFocused(false)}
              placeholder={t('contentPlaceholder')}
              className="w-full min-h-[500px] text-base sm:text-lg bg-transparent text-zinc-800 dark:text-zinc-300 border-none outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none leading-relaxed px-0.5"
              style={{ fieldSizing: 'content' } as CustomStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
