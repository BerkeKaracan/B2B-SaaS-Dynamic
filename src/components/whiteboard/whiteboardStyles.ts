import type { ActiveTool } from './types';

/** Shared surface / chrome tokens for the whiteboard studio UI */
export const SURFACE = {
  stage:
    'bg-[linear-gradient(165deg,#f4f4f5_0%,#e4e4e7_48%,#fafafa_100%)] dark:bg-[linear-gradient(165deg,#09090b_0%,#18181b_52%,#0c0c0e_100%)]',
  paper:
    'bg-[#fafafa] dark:bg-zinc-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(24,24,27,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.45)]',
  chrome:
    'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 shadow-[0_10px_40px_-18px_rgba(24,24,27,0.35)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.65)]',
  pill:
    'rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50/90 dark:bg-zinc-800/70',
} as const;

export const TOOL_ACTIVE: Record<
  ActiveTool,
  { btn: string; ring: string; label: string }
> = {
  hand: {
    btn: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm',
    ring: 'ring-zinc-400/40',
    label: 'zinc',
  },
  pen: {
    btn: 'bg-sky-600 text-white shadow-sm shadow-sky-600/25',
    ring: 'ring-sky-400/50',
    label: 'sky',
  },
  highlighter: {
    btn: 'bg-amber-500 text-amber-950 shadow-sm shadow-amber-500/30',
    ring: 'ring-amber-400/50',
    label: 'amber',
  },
  eraser: {
    btn: 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/25',
    ring: 'ring-emerald-400/40',
    label: 'emerald',
  },
  text: {
    btn: 'bg-sky-700 text-white shadow-sm shadow-sky-700/25',
    ring: 'ring-sky-400/40',
    label: 'sky',
  },
};

export const TOOL_IDLE =
  'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100';
