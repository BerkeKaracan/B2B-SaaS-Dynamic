import { BlockContent, BlockType } from '@/types/record';

/** Vertical gap between stacked AI-generated blocks (page-space px). */
export const BLOCK_STACK_GAP = 20;

/** Top inset when starting a vertical stack on an empty page. */
export const BLOCK_STACK_ORIGIN_Y = 48;

/** Left inset for auto-stacked blocks. */
export const BLOCK_STACK_ORIGIN_X = 40;

/** Extra page height below the last block. */
export const BLOCK_STACK_PAGE_PAD = 96;

/**
 * Visual footprint used for auto-layout.
 * `defaultHeight` should match what CanvasArea renders (content + card padding).
 * Do NOT use oversized "spacing" steps — stack with height + BLOCK_STACK_GAP.
 */
export const BLOCK_DIMENSIONS: Record<
  BlockType,
  { defaultWidth: number; defaultHeight: number }
> = {
  text: { defaultWidth: 520, defaultHeight: 96 },
  form: { defaultWidth: 420, defaultHeight: 108 },
  dropdown: { defaultWidth: 420, defaultHeight: 108 },
  checkbox: { defaultWidth: 420, defaultHeight: 88 },
  badge_selector: { defaultWidth: 420, defaultHeight: 108 },
  date: { defaultWidth: 420, defaultHeight: 108 },
  asset_stream: { defaultWidth: 480, defaultHeight: 240 },
  container: { defaultWidth: 480, defaultHeight: 200 },
};

export function getBlockDefaultWidth(type: string): number {
  return (
    BLOCK_DIMENSIONS[type as BlockType]?.defaultWidth ??
    BLOCK_DIMENSIONS.form.defaultWidth
  );
}

export function getBlockDefaultHeight(type: string): number {
  return (
    BLOCK_DIMENSIONS[type as BlockType]?.defaultHeight ??
    BLOCK_DIMENSIONS.form.defaultHeight
  );
}

/**
 * Resolve a usable height for layout math.
 * AI often invents huge `height` values — clamp to a sane range.
 */
export function resolveBlockHeight(
  type: string,
  height?: number | null
): number {
  const fallback = getBlockDefaultHeight(type);
  if (height == null || !Number.isFinite(height) || height <= 0) {
    return fallback;
  }
  // Allow slight custom sizing, but reject absurd AI values that blow up spacing.
  if (height > fallback * 2.5) return fallback;
  return height;
}

/** Horizontal gap between paired half-width fields. */
export const BLOCK_COLUMN_GAP = 20;

/** Tighter gap under muted section labels. */
export const SECTION_STACK_GAP = 10;

/** Packed height for a hero heading (28px bold). */
export const HEADING_LAYOUT_HEIGHT = 72;

/** Packed height for a muted section label. */
export const SECTION_LAYOUT_HEIGHT = 44;

const HEADING_FONT = '28px';
const SECTION_FONT = '13px';
const SECTION_COLOR = '#71717a';

export type GeneratedLayout = 'full' | 'half';

type LayoutBlock = Pick<Partial<BlockContent>, 'type' | 'settings' | 'height'>;

function blockSettings(block: LayoutBlock): Record<string, unknown> {
  return block.settings && typeof block.settings === 'object'
    ? block.settings
    : {};
}

/** Hero heading: bold text and/or 28px, or a full-width heading hint. */
export function isGeneratedHeading(block: LayoutBlock): boolean {
  if ((block.type || '') !== 'text') return false;
  const settings = blockSettings(block);
  const fontSize = String(settings.fontSize || '');
  return settings.isBold === true || fontSize === HEADING_FONT;
}

/** Small muted section label under a heading. */
export function isGeneratedSectionLabel(block: LayoutBlock): boolean {
  if ((block.type || '') !== 'text') return false;
  if (isGeneratedHeading(block)) return false;
  const settings = blockSettings(block);
  const fontSize = String(settings.fontSize || '');
  const color = String(settings.color || '').toLowerCase();
  return fontSize === SECTION_FONT || color === SECTION_COLOR;
}

/**
 * Resolve full vs half row. Explicit settings.layout wins;
 * otherwise headings/forms span the row and compact fields pair.
 */
export function getGeneratedLayout(block: LayoutBlock): GeneratedLayout {
  const hint = String(blockSettings(block).layout || '').toLowerCase();
  if (hint === 'half' || hint === 'full') return hint;
  const type = block.type || 'form';
  if (isGeneratedHeading(block) || isGeneratedSectionLabel(block)) return 'full';
  if (
    type === 'form' ||
    type === 'asset_stream' ||
    type === 'container' ||
    type === 'text'
  ) {
    return 'full';
  }
  return 'half';
}

function resolveGeneratedHeight(block: LayoutBlock, type: string): number {
  if (isGeneratedSectionLabel(block)) return SECTION_LAYOUT_HEIGHT;
  if (isGeneratedHeading(block)) return HEADING_LAYOUT_HEIGHT;
  return resolveBlockHeight(type, block.height);
}

function gapAfterBlock(block: LayoutBlock): number {
  if (isGeneratedSectionLabel(block)) return SECTION_STACK_GAP;
  if (isGeneratedHeading(block)) return 16;
  return BLOCK_STACK_GAP;
}

function nextBlockId(existing: string | undefined, index: number): string {
  if (existing) return existing;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `gen-${index}`;
}

/**
 * Compose AI empty-page blocks: full-width headings, paired half fields,
 * packed height. Ignores model x/y/width noise.
 */
export function layoutGeneratedBlocks(
  blocks: Partial<BlockContent>[],
  pageWidth = 1000
): { positioned: BlockContent[]; nextY: number } {
  const inset = BLOCK_STACK_ORIGIN_X;
  const usable = Math.max(pageWidth - inset * 2, 280);
  const halfWidth = Math.floor((usable - BLOCK_COLUMN_GAP) / 2);
  const leftX = inset;
  const rightX = inset + halfWidth + BLOCK_COLUMN_GAP;

  let currentY = BLOCK_STACK_ORIGIN_Y;
  const positioned: BlockContent[] = [];
  let index = 0;

  const materialize = (
    block: Partial<BlockContent>,
    x: number,
    y: number,
    width: number,
    height: number
  ): BlockContent => {
    const type = (block.type || 'form') as BlockType;
    const item: BlockContent = {
      ...block,
      id: nextBlockId(block.id, index),
      type,
      value: block.value ?? '',
      settings: block.settings || {},
      x,
      y,
      width,
      height,
    };
    index += 1;
    return item;
  };

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    const type = block.type || 'form';
    const layout = getGeneratedLayout({ ...block, type });
    const height = resolveGeneratedHeight({ ...block, type }, type);
    const next = blocks[i + 1];
    const nextType = next?.type || 'form';
    const nextLayout = next
      ? getGeneratedLayout({ ...next, type: nextType })
      : null;

    if (layout === 'half' && next && nextLayout === 'half') {
      const nextHeight = resolveGeneratedHeight(
        { ...next, type: nextType },
        nextType
      );
      positioned.push(materialize(block, leftX, currentY, halfWidth, height));
      positioned.push(
        materialize(next, rightX, currentY, halfWidth, nextHeight)
      );
      currentY += Math.max(height, nextHeight) + BLOCK_STACK_GAP;
      i += 2;
      continue;
    }

    const width = layout === 'half' ? halfWidth : usable;
    positioned.push(materialize(block, leftX, currentY, width, height));
    currentY += height + gapAfterBlock({ ...block, type });
    i += 1;
  }

  return { positioned, nextY: currentY };
}
