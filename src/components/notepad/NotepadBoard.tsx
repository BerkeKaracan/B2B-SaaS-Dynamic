'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import { Clock, FileText } from 'lucide-react';
import { SURFACE, FIELD } from './notepadStyles';
import NotepadToolbar from './NotepadToolbar';
import NotepadPageActions from './NotepadPageActions';

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
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const isEmpty = !title.trim() && !content.trim();
  const hasToolbarSlot = useHasProjectToolbarSlot();

  const toolbarActions = (
    <NotepadToolbar
      wordCount={wordCount}
      isReadonly={isReadonly}
      isEditing={isEditorFocused}
      labels={{
        wordCount: t('wordCount'),
        lastEdited: t('lastEdited'),
        readingTime: t('readingTime', {
          n: wordCount === 0 ? 0 : readingMinutes,
        }),
        documentBadge: t('documentBadge'),
        readonlyBadge: t('readonlyBadge'),
      }}
    />
  );

  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  if (!isClient) return null;

  return (
    <div
      className={`absolute inset-0 flex flex-col h-full min-h-0 overflow-hidden transition-colors duration-300 cursor-default ${SURFACE.stage}`}
    >
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div
          className={`h-14 shrink-0 z-20 flex items-center justify-between px-4 md:px-5 ${SURFACE.chrome}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 mr-3">
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50 shrink-0 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                {title.trim() || t('untitled')}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">{t('boardSub')}</span>
              </div>
            </div>
          </div>
          {toolbarActions}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
        {/* Soft stage atmosphere */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-50"
          aria-hidden
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,158,11,0.08), transparent 55%),
              radial-gradient(ellipse 60% 40% at 85% 90%, rgba(113,113,122,0.06), transparent 50%)
            `,
          }}
        />

        <div className="relative max-w-[44rem] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div
            className={`group/paper relative flex-1 flex flex-col rounded-2xl px-5 sm:px-10 pt-6 sm:pt-9 pb-10 sm:pb-14 transition-shadow duration-300 ${SURFACE.paper} ${
              isEditorFocused ? SURFACE.paperFocused : ''
            }`}
          >
            {/* Amber accent rail */}
            <div
              className={`absolute left-0 top-8 bottom-8 w-[3px] rounded-full transition-all duration-300 ${SURFACE.accentBar} ${
                isEditorFocused
                  ? 'opacity-100 scale-y-100'
                  : 'opacity-40 scale-y-90'
              }`}
              aria-hidden
            />

            <NotepadPageActions
              visible={isEmpty || isEditorFocused}
              labels={{
                addCover: t('addCover'),
                addIcon: t('addIcon'),
                addComment: t('addComment'),
              }}
            />

            <div className="flex-1 flex flex-col min-h-[min(68vh,620px)]">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                readOnly={isReadonly}
                onFocus={() => setIsEditorFocused(true)}
                onBlur={() => setIsEditorFocused(false)}
                placeholder={t('titlePlaceholder')}
                className={`${FIELD.title} ${FIELD.titleFocus} mb-3 sm:mb-4 shrink-0 ${
                  isReadonly ? 'cursor-default' : ''
                }`}
              />

              <div
                className={`h-px w-16 mb-5 sm:mb-6 transition-all duration-300 ${
                  isEditorFocused
                    ? 'bg-amber-400/80 w-24'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
                aria-hidden
              />

              <textarea
                value={content}
                onChange={handleContentChange}
                readOnly={isReadonly}
                onFocus={() => setIsEditorFocused(true)}
                onBlur={() => setIsEditorFocused(false)}
                placeholder={t('contentPlaceholder')}
                className={`${FIELD.body} ${FIELD.bodyFocus} ${
                  isReadonly ? 'cursor-default' : ''
                }`}
              />
            </div>

            {/* Footer meta on paper */}
            <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              <span className="tabular-nums">
                {wordCount} {t('wordCount')}
                {wordCount > 0
                  ? ` · ${t('readingTime', { n: readingMinutes })}`
                  : ''}
              </span>
              <span className="inline-flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 shrink-0" />
                {t('lastEdited')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(NotepadBoard);
