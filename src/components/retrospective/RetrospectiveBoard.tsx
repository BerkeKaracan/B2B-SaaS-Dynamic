'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import { MessageSquareHeart } from 'lucide-react';
import RetroColumn from './RetroColumn';
import type { RetroCard, RetroColumnId } from './types';
import { SURFACE } from './retrospectiveStyles';

const COLUMN_IDS: RetroColumnId[] = ['glad', 'sad', 'mad'];

function RetrospectiveBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('RetrospectiveBoard');
  const { user } = useAuthStore();
  const { isReadonly, dataSource, persist, migrateLegacyKeys } =
    useBoardPersistence(projectId);

  const persistCards = useCallback(
    (newCards: RetroCard[]) => {
      persist({ retrospectiveCards: newCards });
    },
    [persist]
  );

  const cards = useMemo(
    () => (dataSource.retrospectiveCards as RetroCard[] | undefined) || [],
    [dataSource.retrospectiveCards]
  );

  const [newCardContent, setNewCardContent] = useState<
    Record<RetroColumnId, string>
  >({
    glad: '',
    sad: '',
    mad: '',
  });

  useEffect(() => {
    migrateLegacyKeys(['retrospectiveCards']);
  }, [migrateLegacyKeys]);

  const currentUserIdentifier = user?.email || user?.id || 'anonymous';
  const currentUserName = user?.email
    ? user.email.split('@')[0]
    : t('anonymous');

  const saveCards = useCallback(
    (newCards: RetroCard[]) => {
      persistCards(newCards);
    },
    [persistCards]
  );

  const addCard = useCallback(
    (columnId: RetroColumnId) => {
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
      setNewCardContent((prev) => ({ ...prev, [columnId]: '' }));
    },
    [isReadonly, newCardContent, currentUserName, cards, saveCards]
  );

  const deleteCard = useCallback(
    (id: string) => {
      if (isReadonly) return;
      saveCards(cards.filter((c) => c.id !== id));
    },
    [isReadonly, cards, saveCards]
  );

  const toggleVote = useCallback(
    (id: string) => {
      if (isReadonly) return;
      saveCards(
        cards.map((card) => {
          if (card.id !== id) return card;
          const currentVotes = card.votedBy || [];
          const hasVoted = currentVotes.includes(currentUserIdentifier);
          return {
            ...card,
            votedBy: hasVoted
              ? currentVotes.filter((uid) => uid !== currentUserIdentifier)
              : [...currentVotes, currentUserIdentifier],
          };
        })
      );
    },
    [isReadonly, cards, currentUserIdentifier, saveCards]
  );

  const handleDraftChange = useCallback(
    (columnId: RetroColumnId, value: string) => {
      setNewCardContent((prev) => ({ ...prev, [columnId]: value }));
    },
    []
  );

  const columns = useMemo(
    () =>
      COLUMN_IDS.map((id) => ({
        id,
        title: t(id),
        desc: t(`${id}Desc`),
      })),
    [t]
  );

  const cardsByColumn = useMemo(() => {
    const grouped: Record<RetroColumnId, RetroCard[]> = {
      glad: [],
      sad: [],
      mad: [],
    };
    cards.forEach((c) => {
      if (grouped[c.columnId]) grouped[c.columnId].push(c);
    });
    COLUMN_IDS.forEach((k) =>
      grouped[k].sort(
        (a, b) =>
          (b.votedBy || []).length - (a.votedBy || []).length ||
          a.createdAt - b.createdAt
      )
    );
    return grouped;
  }, [cards]);

  const columnLabels = useMemo(
    () => ({
      addCard: t('addCard'),
      typeAndEnter: t('typeAndEnter'),
      emptyColumn: t('emptyColumn'),
      emptyHint: t('emptyHint'),
      deleteCard: t('deleteCard'),
      votes: t('votes'),
    }),
    [t]
  );

  const hasToolbarSlot = useHasProjectToolbarSlot();
  const cardCountChip =
    cards.length > 0 ? (
      <span className={SURFACE.toolbarChip}>
        {t('cardCount', { count: cards.length })}
      </span>
    ) : null;

  const toolbarActions = (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
        {t('columnsLabel')}
      </span>
      {cardCountChip}
    </div>
  );
  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  return (
    <div
      className={`absolute inset-0 flex flex-col h-full min-h-0 overflow-hidden transition-colors duration-300 ${SURFACE.stage}`}
    >
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div
          className={`h-14 px-5 flex items-center justify-between shrink-0 z-10 ${SURFACE.chrome}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t('title')}
              </h1>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                {t('columnsLabel')}
              </p>
            </div>
          </div>
          {cardCountChip}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar p-4 sm:p-5">
        <div className="flex gap-3.5 h-full min-h-0 min-w-[52rem] max-w-7xl mx-auto">
          {columns.map((col, index) => (
            <RetroColumn
              key={col.id}
              id={col.id}
              title={col.title}
              desc={col.desc}
              cards={cardsByColumn[col.id]}
              draft={newCardContent[col.id] || ''}
              isReadonly={isReadonly}
              currentUserIdentifier={currentUserIdentifier}
              currentUserName={currentUserName}
              labels={columnLabels}
              staggerIndex={index}
              onDraftChange={handleDraftChange}
              onAdd={addCard}
              onVote={toggleVote}
              onDelete={deleteCard}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(RetrospectiveBoard);
