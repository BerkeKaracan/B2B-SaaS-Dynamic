import { BlockType } from '@/types/record';

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

/** Y advance to place the next block under this one. */
export function getBlockStackStep(type: string): number {
  return getBlockDefaultHeight(type) + BLOCK_STACK_GAP;
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
