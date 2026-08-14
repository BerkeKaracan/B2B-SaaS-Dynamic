import type { CalendarEventColor } from './types';

export const SURFACE = {
  stage:
    'bg-[linear-gradient(168deg,#fafafa_0%,#f4f4f5_42%,#fafafa_100%)] dark:bg-[linear-gradient(168deg,#09090b_0%,#18181b_48%,#0c0c0e_100%)]',
  chrome:
    'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800',
  toolbarChip:
    'text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
  primary:
    'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm',
  ghost:
    'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent',
} as const;

export const EVENT_UI: Record<
  CalendarEventColor,
  { chip: string; bar: string; dot: string }
> = {
  zinc: {
    chip: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
    bar: 'bg-zinc-500',
    dot: 'bg-zinc-500',
  },
  red: {
    chip: 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-800 dark:bg-violet-950/45 dark:text-violet-200',
    bar: 'bg-violet-500',
    dot: 'bg-violet-500',
  },
  rose: {
    chip: 'bg-rose-50 text-rose-800 dark:bg-rose-950/45 dark:text-rose-200',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
  },
};
