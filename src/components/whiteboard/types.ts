export type Point = { x: number; y: number; pressure: number };

export type DrawTool = 'pen' | 'highlighter' | 'eraser';

export type ActiveTool = 'hand' | DrawTool | 'text';

export type Stroke = {
  id: string;
  tool: DrawTool;
  color: string;
  width: number;
  points: Point[];
};

export type FloatingText = {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  size: number;
  font: string;
};

export const COLORS = [
  '#18181b',
  '#ffffff',
  '#ef4444',
  '#0ea5e9',
  '#10b981',
  '#eab308',
  '#f97316',
] as const;

export const FONTS = ['Inter', 'serif', 'monospace', 'Comic Sans MS'] as const;

export const SIZES = [14, 18, 24, 32, 48, 64] as const;
