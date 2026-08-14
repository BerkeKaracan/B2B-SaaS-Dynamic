import type { CalendarEventColor } from './types';

export const SURFACE = {
  stage: 'bg-[#f4f4f5] dark:bg-[#09090b]',
  chrome:
    'bg-white/75 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/80',
  toolbarChip:
    'text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums px-2 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm',
  primary:
    'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm',
  ghost:
    'text-zinc-600 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-transparent',
} as const;

export type EventPalette = {
  bar: string;
  fill: string;
  text: string;
  darkFill: string;
  darkText: string;
  dot: string;
};

export const EVENT_PALETTE: Record<CalendarEventColor, EventPalette> = {
  zinc: {
    bar: '#52525b',
    fill: '#f4f4f5',
    text: '#27272a',
    darkFill: '#27272a',
    darkText: '#f4f4f5',
    dot: '#71717a',
  },
  red: {
    bar: '#e11d48',
    fill: '#ffe4e6',
    text: '#9f1239',
    darkFill: '#4c0519',
    darkText: '#fecdd3',
    dot: '#e11d48',
  },
  amber: {
    bar: '#d97706',
    fill: '#fef3c7',
    text: '#92400e',
    darkFill: '#451a03',
    darkText: '#fde68a',
    dot: '#f59e0b',
  },
  emerald: {
    bar: '#059669',
    fill: '#d1fae5',
    text: '#065f46',
    darkFill: '#022c22',
    darkText: '#a7f3d0',
    dot: '#10b981',
  },
  violet: {
    bar: '#7c3aed',
    fill: '#ede9fe',
    text: '#5b21b6',
    darkFill: '#2e1065',
    darkText: '#ddd6fe',
    dot: '#8b5cf6',
  },
  rose: {
    bar: '#db2777',
    fill: '#fce7f3',
    text: '#9d174d',
    darkFill: '#500724',
    darkText: '#fbcfe8',
    dot: '#ec4899',
  },
};

export function eventPalette(color?: string | null): EventPalette {
  if (color && color in EVENT_PALETTE) {
    return EVENT_PALETTE[color as CalendarEventColor];
  }
  return EVENT_PALETTE.red;
}
