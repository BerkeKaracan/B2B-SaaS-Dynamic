'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectEditMode } from '@/hooks/useProjectEditMode';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import { ThumbsUp, Plus, Trash2, MessageSquareHeart } from 'lucide-react';

type RetroCard = {
  id: string;
  columnId: 'glad' | 'sad' | 'mad';
  content: string;
  votedBy?: string[];
  author: string;
  createdAt: number;
};

function RetrospectiveBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('RetrospectiveBoard');
  const { isReadonly } = useProjectEditMode();
  // Granular selectors — a whole-store subscription re-rendered every mounted
  // board at 60fps during pan/zoom (setPan/setZoom write to the store per rAF).
  const metadata = useCanvasStore((s) => s.metadata);
  const updateMetadata = useCanvasStore((s) => s.updateMetadata);
  const pages = useCanvasStore((s) => s.pages);
  const updatePageSettings = useCanvasStore((s) => s.updatePageSettings);
  const { user } = useAuthStore();

  const canvasPage = useMemo(
    () => pages.find((p) => p.id === projectId),
    [pages, projectId]
  );
  const isPageScoped = !!canvasPage;
  const pageSettings = useMemo(
    () => (canvasPage?.settings || {}) as Record<string, unknown>,
    [canvasPage?.settings]
  );

  const dataSource = useMemo(() => {
    return isPageScoped ? pageSettings : metadata;
  }, [isPageScoped, pageSettings, metadata]);

  const persistCards = useCallback(
    (newCards: RetroCard[]) => {
      if (isReadonly) return;
      if (isPageScoped) {
        updatePageSettings(projectId, { retrospectiveCards: newCards });
      } else {
        updateMetadata({ retrospectiveCards: newCards });
      }
    },
    [isReadonly, isPageScoped, projectId, updatePageSettings, updateMetadata]
  );

  const cards = useMemo(
    () => (dataSource.retrospectiveCards as RetroCard[] | undefined) || [],
    [dataSource.retrospectiveCards]
  );

  const [newCardContent, setNewCardContent] = useState<{
    [key: string]: string;
  }>({
    glad: '',
    sad: '',
    mad: '',
  });

  useEffect(() => {
    if (!isPageScoped) return;
    if (pageSettings.retrospectiveCards !== undefined) return;
    if (metadata.retrospectiveCards === undefined) return;
    const otherOwns = pages.some(
      (p) =>
        p.id !== projectId &&
        (p.settings as Record<string, unknown> | undefined)
          ?.retrospectiveCards !== undefined
    );
    if (otherOwns) return;
    updatePageSettings(projectId, {
      retrospectiveCards: metadata.retrospectiveCards,
    });
  }, [
    isPageScoped,
    projectId,
    pages,
    pageSettings.retrospectiveCards,
    metadata.retrospectiveCards,
    updatePageSettings,
  ]);

  const currentUserIdentifier = user?.email || user?.id || 'anonymous';
  const currentUserName = user?.email
    ? user.email.split('@')[0]
    : t('anonymous');

  const saveCards = (newCards: RetroCard[]) => {
    persistCards(newCards);
  };

  const addCard = (columnId: 'glad' | 'sad' | 'mad') => {
    if (isReadonly) return;
    const content = newCardContent[columnId]?.trim();
    if (!content) return;

    const newCard: RetroCard = {
      // eslint-disable-next-line react-hooks/purity
      id: `retro-${Date.now()}`,
      columnId,
      content,
      votedBy: [],
      author: currentUserName,
      // eslint-disable-next-line react-hooks/purity
      createdAt: Date.now(),
    };

    saveCards([...cards, newCard]);
    setNewCardContent({ ...newCardContent, [columnId]: '' });
  };

  const deleteCard = (id: string) => {
    if (isReadonly) return;
    saveCards(cards.filter((c) => c.id !== id));
  };

  const toggleVote = (id: string) => {
    if (isReadonly) return;
    saveCards(
      cards.map((card) => {
        if (card.id === id) {
          const currentVotes = card.votedBy || [];
          const hasVoted = currentVotes.includes(currentUserIdentifier);
          return {
            ...card,
            votedBy: hasVoted
              ? currentVotes.filter((uid) => uid !== currentUserIdentifier)
              : [...currentVotes, currentUserIdentifier],
          };
        }
        return card;
      })
    );
  };

  const columns = useMemo<
    Array<{
      id: 'glad' | 'sad' | 'mad';
      title: string;
      desc: string;
      accent: string;
      accentSoft: string;
      headerText: string;
      columnTint: string;
      cardSurface: string;
    }>
  >(
    () => [
      {
        id: 'glad',
        title: t('glad'),
        desc: t('gladDesc'),
        accent: 'bg-emerald-500',
        accentSoft: 'bg-emerald-500/15 dark:bg-emerald-400/20',
        headerText: 'text-emerald-800 dark:text-emerald-300',
        columnTint: 'bg-emerald-50/40 dark:bg-emerald-950/15',
        cardSurface:
          'bg-white dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-700/80 border-l-emerald-400 dark:border-l-emerald-500',
      },
      {
        id: 'sad',
        title: t('sad'),
        desc: t('sadDesc'),
        accent: 'bg-amber-500',
        accentSoft: 'bg-amber-500/15 dark:bg-amber-400/20',
        headerText: 'text-amber-800 dark:text-amber-300',
        columnTint: 'bg-amber-50/40 dark:bg-amber-950/15',
        cardSurface:
          'bg-white dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-700/80 border-l-amber-400 dark:border-l-amber-500',
      },
      {
        id: 'mad',
        title: t('mad'),
        desc: t('madDesc'),
        accent: 'bg-rose-500',
        accentSoft: 'bg-rose-500/15 dark:bg-rose-400/20',
        headerText: 'text-rose-800 dark:text-rose-300',
        columnTint: 'bg-rose-50/40 dark:bg-rose-950/15',
        cardSurface:
          'bg-white dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-700/80 border-l-rose-400 dark:border-l-rose-500',
      },
    ],
    [t]
  );

  const cardsByColumn = useMemo(() => {
    const grouped: Record<'glad' | 'sad' | 'mad', RetroCard[]> = {
      glad: [],
      sad: [],
      mad: [],
    };
    cards.forEach((c) => {
      if (grouped[c.columnId]) grouped[c.columnId].push(c);
    });
    (Object.keys(grouped) as Array<'glad' | 'sad' | 'mad'>).forEach((k) =>
      grouped[k].sort(
        (a, b) =>
          (b.votedBy || []).length - (a.votedBy || []).length ||
          a.createdAt - b.createdAt
      )
    );
    return grouped;
  }, [cards]);

  const hasToolbarSlot = useHasProjectToolbarSlot();
  const cardCountChip =
    cards.length > 0 ? (
      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
        {cards.length} cards
      </span>
    ) : null;
  const toolbarActions = (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
        Glad · Sad · Mad
      </span>
      {cardCountChip}
    </div>
  );
  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent transition-colors duration-300 overflow-hidden">
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-5 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t('title')}
              </h1>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                Glad · Sad · Mad
              </p>
            </div>
          </div>
          {cardCountChip}
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-5">
        <div className="flex gap-4 h-full min-w-[900px] max-w-7xl mx-auto">
          {columns.map((col) => {
            const colCards = cardsByColumn[col.id];

            return (
              <div
                key={col.id}
                className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${col.accent}`}
                      aria-hidden
                    />
                    <h2
                      className={`text-sm font-semibold tracking-tight ${col.headerText}`}
                    >
                      {col.title}
                    </h2>
                    <span
                      className={`ml-auto text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${col.accentSoft} ${col.headerText}`}
                    >
                      {colCards.length}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 pl-4">
                    {col.desc}
                  </p>
                </div>

                <div
                  className={`flex-1 overflow-y-auto p-3 space-y-2.5 ${col.columnTint}`}
                >
                  {colCards.length === 0 && (
                    <div className="h-full min-h-[120px] flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${col.accentSoft}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${col.accent}`}
                          aria-hidden
                        />
                      </div>
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                        {col.desc}
                      </p>
                    </div>
                  )}

                  {colCards.map((card) => {
                    const currentVotes = card.votedBy || [];
                    const hasVoted = currentVotes.includes(
                      currentUserIdentifier
                    );
                    const isOwnCard = card.author === currentUserName;

                    return (
                      <div
                        key={card.id}
                        className={`group relative p-3.5 rounded-lg shadow-sm hover:shadow transition-shadow animate-in fade-in slide-in-from-bottom-2 border border-l-[3px] ${col.cardSurface}`}
                      >
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap leading-relaxed pr-5">
                          {card.content}
                        </p>

                        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[9px] font-semibold uppercase text-zinc-600 dark:text-zinc-300 shrink-0">
                              {card.author?.charAt(0) || '?'}
                            </div>
                            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">
                              {card.author}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOwnCard && !isReadonly && (
                              <button
                                onClick={() => deleteCard(card.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-all"
                                title="Delete your card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => toggleVote(card.id)}
                              disabled={isReadonly}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                                hasVoted
                                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-zinc-900 dark:border-zinc-100'
                                  : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300'
                              }`}
                            >
                              <ThumbsUp
                                className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`}
                              />
                              {currentVotes.length}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isReadonly && (
                  <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="relative">
                      <textarea
                        value={newCardContent[col.id] || ''}
                        onChange={(e) =>
                          setNewCardContent({
                            ...newCardContent,
                            [col.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addCard(col.id);
                          }
                        }}
                        placeholder={t('addCard')}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 pr-20 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                        rows={2}
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <span className="text-[9px] font-medium text-zinc-400 hidden lg:block pointer-events-none">
                          {t('typeAndEnter')}
                        </span>
                        <button
                          onClick={() => addCard(col.id)}
                          disabled={!newCardContent[col.id]?.trim()}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white disabled:opacity-40 disabled:hover:bg-zinc-900 dark:disabled:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-md transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(RetrospectiveBoard);
