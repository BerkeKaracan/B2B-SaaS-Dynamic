import { describe, expect, it } from 'vitest';
import { PAGE_THEME_COLORS } from './pageTheme';
import {
  BLOCK_BACKGROUND_DEFAULT,
  BLOCK_BACKGROUND_TRANSPARENT,
  BLOCK_THEME_COLORS,
  getBlockChrome,
  isTransparentBlock,
  normalizeBlockBackground,
} from './blockTheme';

describe('blockTheme', () => {
  it('accepts transparent and page palette hexes', () => {
    expect(normalizeBlockBackground('transparent')).toBe(
      BLOCK_BACKGROUND_TRANSPARENT
    );
    expect(normalizeBlockBackground('#60a5fa')).toBe('#60a5fa');
    expect(BLOCK_THEME_COLORS).toContain(BLOCK_BACKGROUND_TRANSPARENT);
    expect(BLOCK_THEME_COLORS).toHaveLength(PAGE_THEME_COLORS.length + 1);
  });

  it('falls unknown and missing values back to default card chrome', () => {
    expect(normalizeBlockBackground(undefined)).toBe(BLOCK_BACKGROUND_DEFAULT);
    expect(normalizeBlockBackground('#nope')).toBe(BLOCK_BACKGROUND_DEFAULT);
    expect(isTransparentBlock(undefined)).toBe(false);
    expect(isTransparentBlock('transparent')).toBe(true);
  });

  it('does not put transparent on the page palette', () => {
    expect(PAGE_THEME_COLORS).not.toContain('transparent');
    expect(PAGE_THEME_COLORS).toHaveLength(11);
    expect(PAGE_THEME_COLORS).toContain('#fafafa');
  });

  it('uses clear chrome for transparent and a card for default', () => {
    const clear = getBlockChrome('transparent');
    expect(clear.className).toContain('bg-transparent');
    expect(clear.className).toContain('border-0');
    expect(clear.className).not.toContain('shadow-sm');
    expect(clear.style).toBeUndefined();

    const card = getBlockChrome(undefined);
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('shadow-sm');

    const tinted = getBlockChrome('#60a5fa');
    expect(tinted.style?.backgroundColor).toBe('#60a5fa');
    expect(tinted.className).toContain('shadow-sm');
  });

  it('keeps the selection ring on transparent blocks', () => {
    const chrome = getBlockChrome('transparent', { isActive: true });
    expect(chrome.className).toContain('ring-2');
    expect(chrome.className).toContain('ring-indigo-500');
    expect(chrome.className).not.toContain('shadow-lg');
  });
});
