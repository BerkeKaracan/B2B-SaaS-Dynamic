import { BlockType } from '@/types/record';

export const BLOCK_DIMENSIONS: Record<
  BlockType,
  { defaultWidth: number; defaultHeight: number; spacing: number }
> = {
  text: { defaultWidth: 400, defaultHeight: 80, spacing: 100 },
  form: { defaultWidth: 400, defaultHeight: 80, spacing: 100 },
  dropdown: { defaultWidth: 400, defaultHeight: 80, spacing: 100 },
  checkbox: { defaultWidth: 400, defaultHeight: 80, spacing: 100 },
  badge_selector: { defaultWidth: 400, defaultHeight: 80, spacing: 100 },
  date: { defaultWidth: 400, defaultHeight: 80, spacing: 100 },
  asset_stream: { defaultWidth: 400, defaultHeight: 240, spacing: 260 },
  container: { defaultWidth: 400, defaultHeight: 200, spacing: 220 },
};
