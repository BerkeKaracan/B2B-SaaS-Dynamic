import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { blurActiveEditable, closeSettingsPanel } from './focusHygiene';

describe('focusHygiene', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('blurs the active textarea', () => {
    const area = document.createElement('textarea');
    document.body.appendChild(area);
    area.focus();
    expect(document.activeElement).toBe(area);
    blurActiveEditable();
    expect(document.activeElement).not.toBe(area);
  });

  it('closeSettingsPanel blurs then closes', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const setOpen = vi.fn();
    closeSettingsPanel(setOpen);
    expect(setOpen).toHaveBeenCalledWith(false);
    expect(document.activeElement).not.toBe(input);
  });
});
