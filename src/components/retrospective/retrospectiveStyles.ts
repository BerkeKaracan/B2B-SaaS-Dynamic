import type { RetroColumnId } from './types';

/** Shared stage / chrome — zinc base, no purple wash */
export const SURFACE = {
  stage:
    'bg-[linear-gradient(165deg,#f4f4f5_0%,#e4e4e7_42%,#fafafa_100%)] dark:bg-[linear-gradient(165deg,#09090b_0%,#18181b_52%,#0c0c0e_100%)]',
  chrome:
    'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800',
  toolbarChip:
    'text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
} as const;

/** Hex accents for glad / sad / mad identity */
export const COLUMN_COLORS: Record<RetroColumnId, string> = {
  glad: '#10B981',
  sad: '#F59E0B',
  mad: '#F43F5E',
};

export const COLUMN_UI: Record<
  RetroColumnId,
  {
    color: string;
    accent: string;
    accentSoft: string;
    headerText: string;
    card: string;
    border: string;
    meta: string;
    divider: string;
    voteIdle: string;
    voteActive: string;
    inputFocus: string;
    addButton: string;
  }
> = {
  glad: {
    color: COLUMN_COLORS.glad,
    accent: 'bg-emerald-500',
    accentSoft: 'bg-emerald-500/15 dark:bg-emerald-400/20',
    headerText: 'text-emerald-800 dark:text-emerald-300',
    card: 'bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-950/45 dark:via-zinc-900 dark:to-zinc-900',
    border:
      'border-emerald-200/90 dark:border-emerald-800/55',
    meta: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200',
    divider: 'border-emerald-200/70 dark:border-emerald-900/50',
    voteIdle:
      'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-300',
    voteActive:
      'bg-emerald-600 dark:bg-emerald-500 text-white border border-emerald-600 dark:border-emerald-500 shadow-sm shadow-emerald-600/25',
    inputFocus:
      'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 dark:focus:border-emerald-600',
    addButton:
      'bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white shadow-sm shadow-emerald-600/20 disabled:opacity-40 disabled:hover:bg-emerald-600 dark:disabled:hover:bg-emerald-500',
  },
  sad: {
    color: COLUMN_COLORS.sad,
    accent: 'bg-amber-500',
    accentSoft: 'bg-amber-500/15 dark:bg-amber-400/20',
    headerText: 'text-amber-900 dark:text-amber-300',
    card: 'bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900',
    border: 'border-amber-200/90 dark:border-amber-800/50',
    meta: 'border-amber-200/70 bg-amber-50/80 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/35 dark:text-amber-200',
    divider: 'border-amber-200/70 dark:border-amber-900/45',
    voteIdle:
      'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-800 dark:hover:text-amber-300',
    voteActive:
      'bg-amber-600 dark:bg-amber-500 text-white border border-amber-600 dark:border-amber-500 shadow-sm shadow-amber-600/25',
    inputFocus:
      'focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 dark:focus:border-amber-600',
    addButton:
      'bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white shadow-sm shadow-amber-600/20 disabled:opacity-40 disabled:hover:bg-amber-600 dark:disabled:hover:bg-amber-500',
  },
  mad: {
    color: COLUMN_COLORS.mad,
    accent: 'bg-rose-500',
    accentSoft: 'bg-rose-500/15 dark:bg-rose-400/20',
    headerText: 'text-rose-800 dark:text-rose-300',
    card: 'bg-gradient-to-br from-rose-50 via-white to-white dark:from-rose-950/45 dark:via-zinc-900 dark:to-zinc-900',
    border: 'border-rose-200/90 dark:border-rose-800/55',
    meta: 'border-rose-200/70 bg-rose-50/80 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200',
    divider: 'border-rose-200/70 dark:border-rose-900/50',
    voteIdle:
      'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-700 dark:hover:text-rose-300',
    voteActive:
      'bg-rose-600 dark:bg-rose-500 text-white border border-rose-600 dark:border-rose-500 shadow-sm shadow-rose-600/25',
    inputFocus:
      'focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 dark:focus:border-rose-600',
    addButton:
      'bg-rose-600 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400 text-white shadow-sm shadow-rose-600/20 disabled:opacity-40 disabled:hover:bg-rose-600 dark:disabled:hover:bg-rose-500',
  },
};

/** Hex + 0–1 alpha → #RRGGBBAA for inline column washes */
export function hexWithAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.slice(0, 6);
  if (full.length !== 6) return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${full}${a}`;
}
