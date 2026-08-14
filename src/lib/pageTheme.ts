/** Shared frame / template page colors (canvas color picker). */
export const PAGE_THEME_COLORS = [
  '#ffffff',
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#2dd4bf',
  '#60a5fa',
  '#a855f7',
  '#f472b6',
  '#18181b',
] as const;

export type PageThemeColor = (typeof PAGE_THEME_COLORS)[number];

export function normalizePageColor(raw?: string | null): string {
  const value = String(raw || '#ffffff').trim().toLowerCase();
  return PAGE_THEME_COLORS.includes(value as PageThemeColor)
    ? value
    : '#ffffff';
}

export function isLightPageColor(hex: string): boolean {
  const color = normalizePageColor(hex);
  return color === '#ffffff' || color === '#facc15' || color === '#4ade80';
}

export type PageTheme = {
  color: string;
  /** Opaque board stage (never transparent over Blank sky). */
  stage: string;
  accent: string;
  wash: string;
};

export function themeFromPageColor(raw?: string | null): PageTheme {
  const color = normalizePageColor(raw);
  if (color === '#ffffff') {
    return {
      color,
      stage: '#f4f4f5',
      accent: '#71717a',
      wash: 'transparent',
    };
  }
  if (color === '#18181b') {
    return {
      color,
      stage: '#09090b',
      accent: '#e4e4e7',
      wash: 'rgba(24,24,27,0.55)',
    };
  }
  return {
    color,
    stage: `color-mix(in srgb, ${color} 28%, #f4f4f5)`,
    accent: color,
    wash: `color-mix(in srgb, ${color} 18%, transparent)`,
  };
}
