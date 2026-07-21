/** Shared surface / chrome tokens — zinc base, amber writing accents */
export const SURFACE = {
  stage:
    'bg-[linear-gradient(168deg,#fafafa_0%,#f4f4f5_45%,#f0f0f1_100%)] dark:bg-[linear-gradient(168deg,#09090b_0%,#18181b_50%,#121214_100%)]',
  paper:
    'bg-white dark:bg-zinc-950/95 border border-zinc-200/90 dark:border-zinc-800 shadow-[0_18px_50px_-28px_rgba(24,24,27,0.45),0_1px_0_rgba(255,255,255,0.7)_inset] dark:shadow-[0_22px_56px_-24px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.04)_inset]',
  paperFocused:
    'shadow-[0_22px_60px_-24px_rgba(24,24,27,0.5),0_0_0_1px_rgba(245,158,11,0.22)] dark:shadow-[0_26px_64px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(245,158,11,0.28)]',
  chrome:
    'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800',
  pill:
    'inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium tabular-nums rounded-md border',
  accentBar: 'bg-amber-500/90 dark:bg-amber-400/80',
} as const;

export const META = {
  chipIdle:
    'text-zinc-500 dark:text-zinc-400 bg-zinc-100/90 dark:bg-zinc-800/80 border-zinc-200/90 dark:border-zinc-700/80',
  chipAmber:
    'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/45 border-amber-200/90 dark:border-amber-800/55',
  chipOutline:
    'text-zinc-500 dark:text-zinc-400 bg-transparent border-zinc-200 dark:border-zinc-700',
  action:
    'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-lg transition-all duration-200',
} as const;

export const FIELD = {
  title:
    'w-full text-[2rem] sm:text-[2.75rem] font-semibold bg-transparent text-zinc-900 dark:text-zinc-50 border-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 resize-none leading-[1.15] tracking-tight',
  titleFocus:
    'caret-amber-500 selection:bg-amber-100 dark:selection:bg-amber-900/50',
  body: 'w-full flex-1 min-h-[min(52vh,460px)] text-[15px] sm:text-[16.5px] bg-transparent text-zinc-700 dark:text-zinc-300 border-none outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none leading-[1.75] tracking-[0.01em]',
  bodyFocus:
    'caret-amber-500 selection:bg-amber-100/80 dark:selection:bg-amber-900/40',
} as const;
