import { describe, expect, it } from 'vitest';
import {
  PAGE_THEME_COLORS,
  normalizePageColor,
  themeFromPageColor,
} from './pageTheme';

describe('pageTheme', () => {
  it('normalizes unknown colors to white', () => {
    expect(normalizePageColor('#f87171')).toBe('#f87171');
    expect(normalizePageColor('#nope')).toBe('#ffffff');
    expect(normalizePageColor(undefined)).toBe('#ffffff');
  });

  it('uses a neutral stage for white and the picked color as accent otherwise', () => {
    expect(themeFromPageColor('#ffffff').accent).toBe('#71717a');
    expect(themeFromPageColor('#60a5fa').accent).toBe('#60a5fa');
    expect(themeFromPageColor('#60a5fa').stage).toContain('#60a5fa');
    expect(PAGE_THEME_COLORS).toHaveLength(10);
  });
});
