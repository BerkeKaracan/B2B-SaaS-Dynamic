/** Engine toolkit chrome — zinc base, indigo reserved for AI affordances. */
export const SURFACE = {
  panel:
    'rounded-2xl bg-white/90 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-[0_0_0_1px_rgba(24,24,27,0.04),0_18px_50px_-22px_rgba(15,23,42,0.35)] dark:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.7)]',
  header:
    'border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40',
  footer:
    'border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40',
  divider: 'h-px bg-zinc-200/80 dark:bg-zinc-800/80',
  title:
    'text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400',
  hint: 'text-[10px] font-medium text-zinc-400 dark:text-zinc-500',
  iconButton:
    'inline-flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-white/25 select-none caret-transparent',
  search:
    'w-full pl-8.5 pr-8 py-2 rounded-xl text-xs font-medium bg-zinc-100/70 dark:bg-zinc-900/70 border border-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-zinc-950 focus:border-zinc-300 dark:focus:border-zinc-700 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/15 transition-colors',
} as const;

/** Expanded list rows (blocks + frames). */
export const ROW = {
  base: 'group w-full flex items-center gap-2.5 p-2 rounded-xl border border-transparent text-left cursor-grab active:cursor-grabbing transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:border-zinc-200/80 dark:hover:border-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-white/25 select-none caret-transparent',
  icon: 'shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 group-hover:border-zinc-900 dark:group-hover:border-zinc-100 transition-colors pointer-events-none',
  title:
    'text-[12px] font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight truncate',
  desc: 'text-[10px] leading-tight text-zinc-400 dark:text-zinc-500 truncate',
} as const;

/** Section headers with a count chip. */
export const SECTION = {
  toggle:
    'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-white/25',
  label:
    'text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500',
  labelAi:
    'text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500 dark:text-indigo-400',
  chip: 'text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400',
  chevron: 'w-3 h-3 shrink-0 text-zinc-400 dark:text-zinc-500',
  chevronAi: 'w-3 h-3 shrink-0 text-indigo-400 dark:text-indigo-500',
} as const;

/** AI generator card + rail tile. */
export const AI = {
  card: 'group w-full flex items-center gap-2.5 p-2 rounded-xl text-left cursor-pointer border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 select-none caret-transparent',
  icon: 'shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-600 dark:group-hover:border-indigo-500 transition-colors',
  title:
    'text-[12px] font-semibold text-indigo-700 dark:text-indigo-200 tracking-tight truncate',
  desc: 'text-[10px] leading-tight text-indigo-500/80 dark:text-indigo-400/80 truncate',
  kbd: 'shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-300',
  railTile:
    'shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white hover:border-indigo-600 dark:hover:border-indigo-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 select-none caret-transparent',
} as const;

/** Collapsed icon rail. */
export const RAIL = {
  tile: 'shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/70 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 hover:shadow-sm cursor-grab active:cursor-grabbing transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-white/25 select-none caret-transparent',
  action:
    'shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-white/25 select-none caret-transparent',
  divider: 'w-6 h-px my-0.5 shrink-0 bg-zinc-200 dark:bg-zinc-800',
  tooltip:
    'pointer-events-none absolute z-99999 -translate-y-1/2 w-max max-w-52 rounded-xl px-3 py-2 bg-zinc-900/95 dark:bg-zinc-100/95 backdrop-blur-sm shadow-[0_14px_40px_-18px_rgba(0,0,0,0.6)]',
  tooltipTitle:
    'text-[11px] font-semibold text-white dark:text-zinc-900 tracking-tight',
  tooltipDesc:
    'text-[10px] leading-snug text-zinc-300 dark:text-zinc-600 line-clamp-2',
} as const;
