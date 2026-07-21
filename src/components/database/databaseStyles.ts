import type { PropertyType } from './types';

/** Shared surface / chrome tokens — zinc base, sky/teal identity accents */
export const SURFACE = {
  stage:
    'bg-[linear-gradient(168deg,#fafafa_0%,#f4f4f5_42%,#eef2f6_100%)] dark:bg-[linear-gradient(168deg,#09090b_0%,#18181b_48%,#0c1218_100%)]',
  shell:
    'rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/80 shadow-[0_14px_40px_-24px_rgba(24,24,27,0.4)] dark:shadow-[0_16px_44px_-22px_rgba(0,0,0,0.65)] backdrop-blur-[2px]',
  header:
    'bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800',
  popover:
    'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_14px_40px_-14px_rgba(24,24,27,0.35)] dark:shadow-[0_14px_40px_-12px_rgba(0,0,0,0.65)] rounded-lg',
  cellFocus:
    'focus-within:ring-1 focus-within:ring-inset focus-within:ring-sky-500/30 focus-within:bg-sky-50/50 dark:focus-within:bg-sky-950/30',
} as const;

export const TOOLBAR = {
  idle: 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100',
  activeView:
    'bg-sky-50 text-sky-800 border border-sky-200/90 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800/70',
  idleView:
    'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200 border border-transparent',
  activeTool:
    'bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/45 dark:text-teal-200 dark:border-teal-800/60',
  idleTool:
    'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent',
  primary:
    'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm shadow-zinc-900/15 dark:shadow-none',
  export:
    'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm',
} as const;

/** Per-property-type icon / chip colors */
export const PROPERTY_UI: Record<
  PropertyType,
  {
    icon: string;
    chip: string;
    accent: string;
  }
> = {
  text: {
    icon: 'text-sky-600 dark:text-sky-400',
    chip: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
    accent: 'bg-sky-500',
  },
  number: {
    icon: 'text-teal-600 dark:text-teal-400',
    chip: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60',
    accent: 'bg-teal-500',
  },
  select: {
    icon: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/45 dark:text-amber-200 dark:border-amber-800/55',
    accent: 'bg-amber-500',
  },
  date: {
    icon: 'text-sky-700 dark:text-sky-300',
    chip: 'bg-sky-50/90 text-sky-800 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800/50',
    accent: 'bg-sky-600',
  },
  checkbox: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/45 dark:text-emerald-300 dark:border-emerald-800/55',
    accent: 'bg-emerald-500',
  },
};

export const ROW = {
  base: 'group/row border-b border-zinc-100 dark:border-zinc-800/80 transition-colors duration-150',
  hover:
    'hover:bg-sky-50/40 dark:hover:bg-sky-950/20 hover:shadow-[inset_2px_0_0_0_rgb(14_165_233)]',
  selected:
    'bg-sky-50/70 dark:bg-sky-950/35 shadow-[inset_2px_0_0_0_rgb(14_165_233)]',
} as const;
