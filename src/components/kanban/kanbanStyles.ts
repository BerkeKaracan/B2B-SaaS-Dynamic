import type { TaskPriority } from './types';

/** Select/legacy color map — used by filters & modal option affinity */
export const PRIORITIES: Record<string, string> = {
  URGENT: '#E3123B',
  HIGH: '#D97706',
  MEDIUM: '#0EA5E9',
  LOW: '#71717A',
  'NO PRIORITY': '#A1A1AA',
};

export const PRIORITY_WEIGHTS: Record<string, number> = {
  URGENT: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  'NO PRIORITY': 1,
};

export const DEFAULT_COLUMNS = [
  { id: 'TO DO', title: 'TO DO', color: '#0EA5E9' },
  { id: 'IN PROGRESS', title: 'IN PROGRESS', color: '#F59E0B' },
  { id: 'DONE', title: 'DONE', color: '#10B981' },
];

/** Card surface + chip tokens — stronger priority presence, dark-aware */
export const PRIORITY_UI: Record<
  TaskPriority,
  {
    accent: string;
    chip: string;
    card: string;
    border: string;
    meta: string;
    divider: string;
    label: string;
  }
> = {
  URGENT: {
    accent: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-800 border-rose-300/90 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700/70',
    card: 'bg-gradient-to-br from-rose-50 via-white to-white dark:from-rose-950/45 dark:via-zinc-900 dark:to-zinc-900',
    border: 'border-rose-200/90 dark:border-rose-800/55',
    meta: 'border-rose-200/70 bg-rose-50/80 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200',
    divider: 'border-rose-200/70 dark:border-rose-900/50',
    label: 'URGENT',
  },
  HIGH: {
    accent: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-900 border-amber-300/90 dark:bg-amber-950/55 dark:text-amber-200 dark:border-amber-700/60',
    card: 'bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900',
    border: 'border-amber-200/90 dark:border-amber-800/50',
    meta: 'border-amber-200/70 bg-amber-50/80 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/35 dark:text-amber-200',
    divider: 'border-amber-200/70 dark:border-amber-900/45',
    label: 'HIGH',
  },
  MEDIUM: {
    accent: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-800 border-sky-300/90 dark:bg-sky-950/55 dark:text-sky-200 dark:border-sky-700/60',
    card: 'bg-gradient-to-br from-sky-50 via-white to-white dark:from-sky-950/40 dark:via-zinc-900 dark:to-zinc-900',
    border: 'border-sky-200/90 dark:border-sky-800/50',
    meta: 'border-sky-200/70 bg-sky-50/80 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/35 dark:text-sky-200',
    divider: 'border-sky-200/70 dark:border-sky-900/45',
    label: 'MEDIUM',
  },
  LOW: {
    accent: 'bg-zinc-500',
    chip: 'bg-zinc-200/90 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-600/70',
    card: 'bg-gradient-to-br from-zinc-100/90 via-white to-white dark:from-zinc-800/50 dark:via-zinc-900 dark:to-zinc-900',
    border: 'border-zinc-300/90 dark:border-zinc-700',
    meta: 'border-zinc-200 bg-zinc-100/80 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300',
    divider: 'border-zinc-200/80 dark:border-zinc-800',
    label: 'LOW',
  },
  'NO PRIORITY': {
    accent: 'bg-zinc-400 dark:bg-zinc-500',
    chip: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/90 dark:text-zinc-400 dark:border-zinc-700/60',
    card: 'bg-white dark:bg-zinc-900',
    border: 'border-zinc-200 dark:border-zinc-800',
    meta: 'border-zinc-200/90 bg-zinc-50 text-zinc-600 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-300',
    divider: 'border-zinc-200/80 dark:border-zinc-800',
    label: 'NONE',
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
