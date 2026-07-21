'use client';

import React from 'react';
import { ThumbsUp, Trash2, User } from 'lucide-react';
import type { RetroCard, RetroColumnId } from './types';
import { COLUMN_UI } from './retrospectiveStyles';

export interface RetroCardItemLabels {
  deleteCard: string;
  votes: string;
}

interface RetroCardItemProps {
  card: RetroCard;
  columnId: RetroColumnId;
  hasVoted: boolean;
  isOwnCard: boolean;
  isReadonly: boolean;
  labels: RetroCardItemLabels;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
}

function RetroCardItem({
  card,
  columnId,
  hasVoted,
  isOwnCard,
  isReadonly,
  labels,
  onVote,
  onDelete,
}: RetroCardItemProps) {
  const ui = COLUMN_UI[columnId];
  const voteCount = (card.votedBy || []).length;

  return (
    <article
      className={`group relative flex flex-col rounded-xl border overflow-hidden transition-[box-shadow,transform,border-color] duration-200 animate-in fade-in slide-in-from-bottom-2 ${ui.card} ${ui.border} shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.16)] hover:-translate-y-px`}
    >
      {/* Column accent rail */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[11px] ${ui.accent}`}
        aria-hidden
      />

      <div className="relative pl-3.5 pr-3 pt-3 pb-2.5 flex flex-col gap-2.5">
        <p className="text-[13.5px] font-semibold leading-relaxed tracking-tight text-zinc-950 dark:text-zinc-50 whitespace-pre-wrap pr-1">
          {card.content}
        </p>

        <div
          className={`flex items-center justify-between gap-2 pt-2 border-t ${ui.divider}`}
        >
          <span
            className={`inline-flex items-center gap-1.5 min-w-0 max-w-[55%] px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${ui.meta}`}
          >
            <span className="w-4 h-4 rounded-full bg-white/70 dark:bg-zinc-900/60 border border-inherit flex items-center justify-center shrink-0">
              {card.author?.charAt(0) ? (
                <span className="text-[9px] font-bold uppercase leading-none">
                  {card.author.charAt(0)}
                </span>
              ) : (
                <User className="w-2.5 h-2.5 opacity-80" />
              )}
            </span>
            <span className="truncate">{card.author}</span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {isOwnCard && !isReadonly && (
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-all duration-150"
                title={labels.deleteCard}
                aria-label={labels.deleteCard}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onVote(card.id)}
              disabled={isReadonly}
              title={labels.votes}
              aria-pressed={hasVoted}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold tabular-nums transition-[background-color,border-color,color,transform,box-shadow] duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                hasVoted ? ui.voteActive : ui.voteIdle
              } ${hasVoted ? 'animate-in zoom-in-95 duration-200' : ''}`}
            >
              <ThumbsUp
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  hasVoted ? 'fill-current scale-110' : ''
                }`}
              />
              {voteCount}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default React.memo(RetroCardItem);
