import { describe, expect, it } from 'vitest';
import {
  BLOCK_COLUMN_GAP,
  BLOCK_STACK_ORIGIN_X,
  BLOCK_STACK_ORIGIN_Y,
  BLOCK_STACK_PAGE_PAD,
  HEADING_LAYOUT_HEIGHT,
  getGeneratedLayout,
  layoutGeneratedBlocks,
} from './blockConfig';

describe('layoutGeneratedBlocks', () => {
  it('spans headings full width from the left inset', () => {
    const pageWidth = 1000;
    const { positioned, nextY } = layoutGeneratedBlocks(
      [
        {
          type: 'text',
          value: 'Applicant intake',
          settings: { isBold: true, fontSize: '28px' },
        },
        { type: 'form', settings: { label: 'Name', layout: 'full' } },
      ],
      pageWidth
    );

    const heading = positioned[0];
    const usable = pageWidth - BLOCK_STACK_ORIGIN_X * 2;
    expect(heading.x).toBe(BLOCK_STACK_ORIGIN_X);
    expect(heading.width).toBe(usable);
    expect(heading.height).toBe(HEADING_LAYOUT_HEIGHT);
    expect(heading.y).toBe(BLOCK_STACK_ORIGIN_Y);
    expect(positioned[1].y).toBeGreaterThan(heading.y);
    expect(nextY + BLOCK_STACK_PAGE_PAD).toBeGreaterThan(
      heading.y + (heading.height ?? 0)
    );
  });

  it('places two half fields on the same row', () => {
    const pageWidth = 1000;
    const { positioned, nextY } = layoutGeneratedBlocks(
      [
        {
          type: 'dropdown',
          settings: { label: 'Role', layout: 'half' },
        },
        {
          type: 'date',
          settings: { label: 'Start', layout: 'half' },
        },
      ],
      pageWidth
    );

    expect(positioned).toHaveLength(2);
    expect(positioned[0].y).toBe(positioned[1].y);
    expect(positioned[0].x).toBe(BLOCK_STACK_ORIGIN_X);
    expect(positioned[1].x).toBeGreaterThan(positioned[0].x);
    const usable = pageWidth - BLOCK_STACK_ORIGIN_X * 2;
    const halfWidth = Math.floor((usable - BLOCK_COLUMN_GAP) / 2);
    expect(positioned[0].width).toBe(halfWidth);
    expect(positioned[1].width).toBe(halfWidth);
    expect(positioned[1].x).toBe(
      BLOCK_STACK_ORIGIN_X + halfWidth + BLOCK_COLUMN_GAP
    );
    expect(nextY).toBeGreaterThan(positioned[0].y + (positioned[0].height || 0));
  });

  it('infers half for short forms and full for textareas', () => {
    expect(getGeneratedLayout({ type: 'date', settings: {} })).toBe('half');
    expect(getGeneratedLayout({ type: 'form', settings: {} })).toBe('half');
    expect(
      getGeneratedLayout({
        type: 'form',
        settings: { inputType: 'textarea' },
      })
    ).toBe('full');
  });

  it('stretches an unpaired half field to full width', () => {
    const pageWidth = 1000;
    const { positioned } = layoutGeneratedBlocks(
      [{ type: 'date', settings: { label: 'Start', layout: 'half' } }],
      pageWidth
    );
    const usable = pageWidth - BLOCK_STACK_ORIGIN_X * 2;
    expect(positioned[0].width).toBe(usable);
  });

  it('pairs two short forms on one row', () => {
    const pageWidth = 1000;
    const { positioned } = layoutGeneratedBlocks(
      [
        { type: 'form', settings: { label: 'Name' } },
        { type: 'form', settings: { label: 'Email' } },
      ],
      pageWidth
    );
    expect(positioned[0].y).toBe(positioned[1].y);
    expect(positioned[0].width).toBeLessThan(
      pageWidth - BLOCK_STACK_ORIGIN_X * 2
    );
  });
});
