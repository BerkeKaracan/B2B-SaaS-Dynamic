'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import {
  Image as ImageIcon,
  Smile,
  MessageSquare,
  Clock,
  FileText,
} from 'lucide-react';

function NotepadBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('NotepadBoard');
  const { isReadonly, isPageScoped, dataSource, canvasPage, persist } =
    useBoardPersistence(projectId);
  const updatePageTitle = useCanvasStore((s) => s.updatePageTitle);

  const [title, setTitle] = useState(
    (dataSource.notepadTitle as string) || canvasPage?.title || ''
  );
  const [content, setContent] = useState(
    (dataSource.notepadContent as string) ||
      (dataSource.documentContent as string) ||
      ''
  );
  const [isClient, setIsClient] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    const nextTitle = dataSource.notepadTitle as string | undefined;
    const nextContent =
      (dataSource.notepadContent as string | undefined) ??
      (dataSource.documentContent as string | undefined);

    if (nextTitle !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(nextTitle);
    } else if (canvasPage?.title) {
      setTitle(canvasPage.title);
    }
    if (nextContent !== undefined) {
      setContent(nextContent);
    }
  }, [
    dataSource.notepadTitle,
    dataSource.notepadContent,
    dataSource.documentContent,
    canvasPage?.title,
  ]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadonly) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (isPageScoped) {
      updatePageTitle(projectId, newTitle || 'Untitled Note');
    }
    persist({ notepadTitle: newTitle });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isReadonly) return;
    const newContent = e.target.value;
    setContent(newContent);
    persist({ notepadContent: newContent, documentContent: newContent });
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isEmpty = !title.trim() && !content.trim();
  const hasToolbarSlot = useHasProjectToolbarSlot();

  const toolbarActions = (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="inline-flex items-center px-2 py-1 text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 rounded-md">
        {wordCount} {t('wordCount')}
      </span>
      <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-md">
        <Clock className="w-3 h-3" />
        {t('lastEdited')}
      </span>
    </div>
  );

  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent transition-colors duration-300 overflow-hidden cursor-default">
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div className="h-14 shrink-0 z-10 flex items-center justify-between px-4 md:px-5 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95">
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
          {toolbarActions}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl w-full mx-auto px-6 sm:px-12 pt-8 pb-24 min-h-full flex flex-col">
          <div
            className={`flex flex-wrap items-center gap-1.5 mb-6 shrink-0 transition-opacity ${
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

          <div className="flex-1 flex flex-col min-h-[min(70vh,640px)]">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              readOnly={isReadonly}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={() => setIsEditorFocused(false)}
              placeholder={t('titlePlaceholder')}
              className={`w-full text-4xl sm:text-5xl font-bold bg-transparent text-zinc-900 dark:text-zinc-100 border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 mb-4 resize-none leading-tight tracking-tight px-0.5 shrink-0 ${isReadonly ? 'cursor-default' : ''}`}
            />

            <textarea
              value={content}
              onChange={handleContentChange}
              readOnly={isReadonly}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={() => setIsEditorFocused(false)}
              placeholder={t('contentPlaceholder')}
              className={`w-full flex-1 min-h-[min(55vh,480px)] text-base sm:text-lg bg-transparent text-zinc-800 dark:text-zinc-300 border-none outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none leading-relaxed px-0.5 ${isReadonly ? 'cursor-default' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(NotepadBoard);
