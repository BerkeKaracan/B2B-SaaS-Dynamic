'use client';

import React from 'react';
import { Plus, Smile, Frown, Angry, type LucideIcon } from 'lucide-react';
import RetroCardItem, { type RetroCardItemLabels } from './RetroCardItem';
import type { RetroCard, RetroColumnId } from './types';
import { COLUMN_UI, hexWithAlpha } from './retrospectiveStyles';

const COLUMN_ICONS: Record<RetroColumnId, LucideIcon> = {
  glad: Smile,
  sad: Frown,
  mad: Angry,
};

export interface RetroColumnLabels extends RetroCardItemLabels {
  addCard: string;
  typeAndEnter: string;
  emptyColumn: string;
  emptyHint: string;
}

interface RetroColumnProps {
  id: RetroColumnId;
  title: string;
  desc: string;
  cards: RetroCard[];
  draft: string;
  isReadonly: boolean;
  currentUserIdentifier: string;
  currentUserName: string;
  labels: RetroColumnLabels;
  staggerIndex?: number;
  onDraftChange: (columnId: RetroColumnId, value: string) => void;
  onAdd: (columnId: RetroColumnId) => void;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
}

function RetroColumn({
  id,
  title,
  desc,
  cards,
  draft,
  isReadonly,
  currentUserIdentifier,
  currentUserName,
  labels,
  staggerIndex = 0,
  onDraftChange,
  onAdd,
  onVote,
  onDelete,
}: RetroColumnProps) {
  const ui = COLUMN_UI[id];
  const color = ui.color;
  const Icon = COLUMN_ICONS[id];

  const washStrong = hexWithAlpha(color, 0.22);
  const washSoft = hexWithAlpha(color, 0.07);
  const borderTint = hexWithAlpha(color, 0.34);
  const badgeBg = hexWithAlpha(color, 0.18);
  const badgeBorder = hexWithAlpha(color, 0.42);

  return (
    <div
      className="relative flex-1 min-w-[16.5rem] max-w-md flex flex-col h-full min-h-0 rounded-2xl border overflow-hidden transition-[box-shadow,border-color] duration-300 bg-zinc-50 dark:bg-zinc-950/50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] animate-in fade-in slide-in-from-bottom-3"
      style={{
        borderColor: borderTint,
        animationDelay: `${staggerIndex * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Column body tint wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-80"
        style={{
          background: `linear-gradient(180deg, ${washStrong} 0%, ${washSoft} 32%, transparent 62%)`,
        }}
        aria-hidden
      />

      {/* Accent rail */}
      <div
        className="relative h-1.5 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${hexWithAlpha(color, 0.8)} 55%, ${hexWithAlpha(color, 0.2)} 100%)`,
        }}
        aria-hidden
      />

      {/* Header */}
      <div
        className="relative px-3.5 py-3 flex flex-col gap-1 shrink-0 border-b backdrop-blur-[2px]"
        style={{
          borderColor: borderTint,
          background: `linear-gradient(90deg, ${washStrong} 0%, ${hexWithAlpha(color, 0.05)} 100%)`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:shadow-none"
            style={{
              background: `linear-gradient(145deg, ${washStrong}, ${hexWithAlpha(color, 0.06)})`,
              borderColor: badgeBorder,
              color,
            }}
          >
            <Icon className="w-4 h-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className={`text-[13px] font-bold tracking-wide uppercase truncate ${ui.headerText}`}
            >
              {title}
            </h2>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {desc}
            </p>
          </div>
          <span
            className="min-w-6 h-6 px-1.5 inline-flex items-center justify-center rounded-lg text-[11px] font-bold tabular-nums shrink-0 border"
            style={{
              backgroundColor: badgeBg,
              borderColor: badgeBorder,
              color,
            }}
          >
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="relative flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2.5 custom-scrollbar">
        {cards.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-12 px-4 text-center pointer-events-none min-h-36">
            <div
              className="w-11 h-11 rounded-xl border border-dashed flex items-center justify-center"
              style={{
                borderColor: badgeBorder,
                background: `linear-gradient(145deg, ${washStrong}, ${hexWithAlpha(color, 0.04)})`,
                boxShadow: `inset 0 0 0 1px ${hexWithAlpha(color, 0.12)}`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color }}>
                {labels.emptyColumn}
              </p>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                {labels.emptyHint}
              </p>
            </div>
          </div>
        )}

        {cards.map((card) => {
          const currentVotes = card.votedBy || [];
          const hasVoted = currentVotes.includes(currentUserIdentifier);
          const isOwnCard = card.author === currentUserName;

          return (
            <RetroCardItem
              key={card.id}
              card={card}
              columnId={id}
              hasVoted={hasVoted}
              isOwnCard={isOwnCard}
              isReadonly={isReadonly}
              labels={labels}
              onVote={onVote}
              onDelete={onDelete}
            />
          );
        })}
      </div>

      {/* Add row */}
      {!isReadonly && (
        <div
          className="relative p-2.5 border-t shrink-0 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-[2px]"
          style={{ borderColor: borderTint }}
        >
          <div className="relative">
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onAdd(id);
                }
              }}
              placeholder={labels.addCard}
              rows={2}
              className={`w-full bg-zinc-50/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 pr-[4.5rem] text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none outline-none transition-[border-color,box-shadow,background-color] duration-150 ${ui.inputFocus}`}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <span className="text-[9px] font-medium text-zinc-400 hidden xl:block pointer-events-none">
                {labels.typeAndEnter}
              </span>
              <button
                type="button"
                onClick={() => onAdd(id)}
                disabled={!draft.trim()}
                className={`p-1.5 rounded-lg transition-[background-color,transform,opacity] duration-150 active:scale-95 ${ui.addButton}`}
                aria-label={labels.addCard}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(RetroColumn);
