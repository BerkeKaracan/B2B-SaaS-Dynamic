import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '@/store/useCanvasStore';

describe('addGeneratedPage', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      pages: [],
      activePageId: null,
      selectedBlocks: [],
      past: [],
      future: [],
    });
  });

  it('stacks empty dashboard blocks and keeps board metadata', () => {
    useCanvasStore.getState().addGeneratedPage({
      type: 'empty',
      title: 'Applicant intake',
      x: 40,
      y: 60,
      width: 1000,
      height: 800,
      blocks: [
        {
          type: 'text',
          value: 'Apply',
          x: 0,
          y: 0,
          settings: { backgroundColor: 'transparent' },
        },
        {
          type: 'form',
          value: '',
          x: 0,
          y: 0,
          settings: { label: 'Name', backgroundColor: 'transparent' },
        },
      ],
    });

    const emptyPage = useCanvasStore.getState().pages[0];
    expect(emptyPage.type).toBe('empty');
    expect(emptyPage.blocks).toHaveLength(2);
    expect(emptyPage.blocks[0].y).toBeLessThan(emptyPage.blocks[1].y);
    expect(emptyPage.title).toBe('Applicant intake');
    expect(emptyPage.settings?.backgroundColor).toBe('#fafafa');
    expect(emptyPage.blocks[0].settings?.backgroundColor).toBe('transparent');

    useCanvasStore.getState().addGeneratedPage({
      type: 'kanban',
      title: 'Sprint',
      x: 80,
      y: 80,
      width: 1000,
      height: 800,
      blocks: [{ type: 'text', value: 'junk', x: 0, y: 0 }],
      metadata: {
        kanbanColumns: [{ id: 'TO DO', title: 'TO DO' }],
        kanbanTasks: [{ title: 'Ship', status: 'TO DO' }],
      },
    });

    const board = useCanvasStore.getState().pages[1];
    expect(board.type).toBe('kanban');
    expect(board.blocks).toEqual([]);
    expect(board.settings?.kanbanTasks).toEqual([
      { title: 'Ship', status: 'TO DO' },
    ]);
    expect(board.settings?.backgroundColor).toBe('#f4f4f5');
  });

  it('lays out paired half fields side by side', () => {
    useCanvasStore.getState().addGeneratedPage({
      type: 'empty',
      title: 'Intake',
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
      blocks: [
        {
          type: 'text',
          value: 'Hire',
          x: 0,
          y: 0,
          settings: { isBold: true, fontSize: '28px' },
        },
        {
          type: 'dropdown',
          value: '',
          x: 0,
          y: 0,
          settings: { label: 'Role', layout: 'half' },
        },
        {
          type: 'date',
          value: '',
          x: 0,
          y: 0,
          settings: { label: 'Start', layout: 'half' },
        },
      ],
    });

    const page = useCanvasStore.getState().pages[0];
    const [, left, right] = page.blocks;
    expect(left.y).toBe(right.y);
    expect(left.x).toBeLessThan(right.x);
    expect(page.blocks[0].width ?? 0).toBeGreaterThan(left.width ?? 0);
    expect(page.height).toBeLessThanOrEqual(800);
  });

  it('places multiple generated pages with horizontal offset', () => {
    useCanvasStore.getState().addGeneratedPages(
      [
        {
          type: 'kanban',
          title: 'Sprint',
          x: 0,
          y: 0,
          width: 1000,
          height: 800,
          metadata: { kanbanColumns: [{ id: 'TO DO', title: 'TO DO' }] },
        },
        {
          type: 'timeline',
          title: 'Roadmap',
          x: 0,
          y: 0,
          width: 1000,
          height: 720,
          metadata: { timelineEvents: [] },
        },
      ],
      { x: 40, y: 60 }
    );

    const pages = useCanvasStore.getState().pages;
    expect(pages).toHaveLength(2);
    expect(pages[0].x).toBe(40);
    expect(pages[0].y).toBe(60);
    expect(pages[1].x).toBeGreaterThan(pages[0].x);
    expect(pages[1].y).toBe(60);
    expect(useCanvasStore.getState().activePageId).toBe(pages[1].id);
  });
});
