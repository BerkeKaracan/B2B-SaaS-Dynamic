import { describe, expect, it } from 'vitest';
import {
  FRAME_PAGE_TYPES,
  PROJECT_TEMPLATES,
  getPageFrameDefaults,
  getProjectTemplateMeta,
  isBoardPageType,
  isStandaloneBoardTemplate,
  normalizeProjectTemplate,
  pageTypeToBoardKey,
  projectTemplateToBoardKey,
} from './templates';

describe('templates', () => {
  it('normalizes aliases to canonical template ids', () => {
    expect(normalizeProjectTemplate('notepad')).toBe('document');
    expect(normalizeProjectTemplate('BLANK')).toBe('blank');
    expect(normalizeProjectTemplate(null)).toBe('blank');
    expect(normalizeProjectTemplate('  kanban  ')).toBe('kanban');
  });

  it('exposes color, rail, headerBg, and glow for every template', () => {
    for (const meta of PROJECT_TEMPLATES) {
      expect(meta.color.length).toBeGreaterThan(0);
      expect(meta.rail.length).toBeGreaterThan(0);
      expect(meta.headerBg.length).toBeGreaterThan(0);
      expect(meta.glow.length).toBeGreaterThan(0);
      expect(getProjectTemplateMeta(meta.id)?.id).toBe(meta.id);
    }
  });

  it('keeps blank as the only sky/blue rail accent', () => {
    const blank = getProjectTemplateMeta('blank');
    expect(blank?.rail).toMatch(/sky/);

    for (const meta of PROJECT_TEMPLATES) {
      if (meta.id === 'blank') continue;
      expect(meta.rail).not.toMatch(/sky|blue/);
      expect(meta.color).not.toMatch(/\b(sky|blue)-/);
    }
  });

  it('marks board templates as standalone and blank as canvas', () => {
    expect(isStandaloneBoardTemplate('blank')).toBe(false);
    expect(isStandaloneBoardTemplate('kanban')).toBe(true);
    expect(isStandaloneBoardTemplate('document')).toBe(true);
    expect(projectTemplateToBoardKey('blank')).toBeNull();
    expect(projectTemplateToBoardKey('kanban')).toBe('kanban');
    expect(projectTemplateToBoardKey('notepad')).toBe('document');
  });

  it('maps page types to board keys', () => {
    expect(pageTypeToBoardKey('empty')).toBeNull();
    expect(pageTypeToBoardKey('notes')).toBe('document');
    expect(pageTypeToBoardKey('document')).toBe('document');
    expect(pageTypeToBoardKey('whiteboard')).toBe('whiteboard');
    expect(isBoardPageType('kanban')).toBe(true);
    expect(isBoardPageType('empty')).toBe(false);
  });

  it('returns frame defaults for known page types', () => {
    for (const type of FRAME_PAGE_TYPES) {
      const defaults = getPageFrameDefaults(type);
      expect(defaults.width).toBeGreaterThan(0);
      expect(defaults.height).toBeGreaterThan(0);
      expect(defaults.title.length).toBeGreaterThan(0);
    }
  });
});
