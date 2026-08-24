import { PAGE_THEME_COLORS, type PageThemeColor } from '@/lib/pageTheme';

export const BLOCK_BACKGROUND_DEFAULT = 'default';
export const BLOCK_BACKGROUND_TRANSPARENT = 'transparent';

/** Page palette plus transparent. Do not add transparent to PAGE_THEME_COLORS. */
export const BLOCK_THEME_COLORS = [
  ...PAGE_THEME_COLORS,
  BLOCK_BACKGROUND_TRANSPARENT,
] as const;

export type BlockThemeColor = (typeof BLOCK_THEME_COLORS)[number];
export type BlockBackground =
  | typeof BLOCK_BACKGROUND_DEFAULT
  | BlockThemeColor;

export function normalizeBlockBackground(
  raw?: string | null
): BlockBackground {
  if (raw == null || raw === '') return BLOCK_BACKGROUND_DEFAULT;
  const value = String(raw).trim().toLowerCase();
  if (value === BLOCK_BACKGROUND_DEFAULT) return BLOCK_BACKGROUND_DEFAULT;
  if (value === BLOCK_BACKGROUND_TRANSPARENT || value === 'none') {
    return BLOCK_BACKGROUND_TRANSPARENT;
  }
  if (PAGE_THEME_COLORS.includes(value as PageThemeColor)) {
    return value as PageThemeColor;
  }
  return BLOCK_BACKGROUND_DEFAULT;
}

export function isTransparentBlock(
  raw?: string | null
): boolean {
  return normalizeBlockBackground(raw) === BLOCK_BACKGROUND_TRANSPARENT;
}

export type BlockChrome = {
  className: string;
  style?: { backgroundColor: string };
};

const CHROME_BASE = 'absolute cursor-default select-none group rounded-2xl';
const CHROME_CARD =
  'border border-zinc-200/80 dark:border-zinc-800/80 p-5 pt-10 sm:pt-8';
const CHROME_CLEAR = 'bg-transparent border-0 shadow-none px-1 pt-6 pb-1';

function chromeState(
  background: BlockBackground,
  opts: { isActive?: boolean; connectHover?: boolean }
): string {
  const parts = [
    opts.isActive ? 'ring-2 ring-indigo-500 z-50' : 'z-10',
    opts.connectHover ? 'hover:ring-2 hover:ring-indigo-400' : '',
  ];
  if (background !== BLOCK_BACKGROUND_TRANSPARENT) {
    parts.push(opts.isActive ? 'shadow-lg' : 'shadow-sm');
  }
  return parts.filter(Boolean).join(' ');
}

/** Card vs clear chrome for the empty-page block wrapper. */
export function getBlockChrome(
  raw?: string | null,
  opts: { isActive?: boolean; connectHover?: boolean } = {}
): BlockChrome {
  const background = normalizeBlockBackground(raw);
  const state = chromeState(background, opts);

  if (background === BLOCK_BACKGROUND_TRANSPARENT) {
    return { className: `${CHROME_BASE} ${CHROME_CLEAR} ${state}` };
  }

  if (background === BLOCK_BACKGROUND_DEFAULT) {
    return {
      className: `${CHROME_BASE} bg-white dark:bg-zinc-900 ${CHROME_CARD} ${state}`,
    };
  }

  return {
    className: `${CHROME_BASE} ${CHROME_CARD} ${state}`,
    style: { backgroundColor: background },
  };
}
