import type { MindNode, NodeDimensions, NodeTier } from './types';
import { NODE_DIM } from './types';

/** Zinc stage + cyan/sky identity — shared with other board redesigns */
export const SURFACE = {
  stage:
    'bg-[linear-gradient(165deg,#f4f4f5_0%,#e4e4e7_42%,#fafafa_100%)] dark:bg-[linear-gradient(165deg,#09090b_0%,#18181b_52%,#0c0c0e_100%)]',
  paper:
    'bg-[#f8fafc] dark:bg-zinc-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(24,24,27,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.45)]',
  chrome:
    'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 shadow-[0_10px_40px_-18px_rgba(24,24,27,0.35)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.65)]',
  chip:
    'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm backdrop-blur-sm',
} as const;

export const NODE_UI: Record<
  NodeTier,
  {
    shell: string;
    border: string;
    text: string;
    accentBar: string;
    glow: string;
    ring: string;
  }
> = {
  root: {
    shell:
      'bg-gradient-to-br from-sky-600 via-sky-600 to-cyan-700 dark:from-sky-500 dark:via-sky-500 dark:to-cyan-600 text-white shadow-[0_12px_32px_-12px_rgba(14,165,233,0.55)]',
    border: 'border-sky-500/80 dark:border-sky-400/50',
    text: 'text-white',
    accentBar: 'bg-white/35',
    glow: 'shadow-sky-500/30',
    ring: 'ring-sky-300/50 dark:ring-sky-400/40',
  },
  branch: {
    shell:
      'bg-gradient-to-br from-sky-50 via-white to-white dark:from-sky-950/50 dark:via-zinc-900 dark:to-zinc-900 shadow-[0_8px_24px_-14px_rgba(14,165,233,0.35)]',
    border: 'border-sky-200/90 dark:border-sky-800/55',
    text: 'text-zinc-900 dark:text-zinc-100',
    accentBar: 'bg-sky-500',
    glow: 'shadow-sky-500/15',
    ring: 'ring-sky-400/35 dark:ring-sky-500/30',
  },
  leaf: {
    shell:
      'bg-gradient-to-br from-zinc-50 via-white to-white dark:from-zinc-800/80 dark:via-zinc-900 dark:to-zinc-900 shadow-[0_6px_18px_-12px_rgba(24,24,27,0.25)]',
    border: 'border-zinc-200/95 dark:border-zinc-700',
    text: 'text-zinc-800 dark:text-zinc-100',
    accentBar: 'bg-cyan-500',
    glow: 'shadow-zinc-900/10',
    ring: 'ring-cyan-400/30 dark:ring-cyan-500/25',
  },
};

/** Canvas / export stroke palette */
export const LINK = {
  strokeClass: 'stroke-sky-300/80 dark:stroke-sky-700/70',
  strokeHexLight: '#7dd3fc',
  strokeHexDark: '#0369a1',
  exportBg: '#f8fafc',
  exportRootFill: '#0284c7',
  exportRootStroke: '#0369a1',
  exportBranchFill: '#ffffff',
  exportBranchStroke: '#bae6fd',
  exportLeafFill: '#ffffff',
  exportLeafStroke: '#e4e4e7',
  exportRootText: '#ffffff',
  exportBranchText: '#18181b',
} as const;

export function isRootNode(node: Pick<MindNode, 'parentId'>): boolean {
  return node.parentId === null;
}

export function getNodeDepth(
  node: MindNode,
  byId: Map<string, MindNode>
): number {
  let depth = 0;
  let current: MindNode | undefined = node;
  const seen = new Set<string>();
  while (current?.parentId) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    depth += 1;
    current = byId.get(current.parentId);
    if (depth > 32) break;
  }
  return depth;
}

export function getNodeTier(
  node: MindNode,
  byId: Map<string, MindNode>
): NodeTier {
  if (isRootNode(node)) return 'root';
  return getNodeDepth(node, byId) <= 1 ? 'branch' : 'leaf';
}

export function getNodeDim(
  node: MindNode,
  byId: Map<string, MindNode>
): NodeDimensions {
  return NODE_DIM[getNodeTier(node, byId)];
}

export function getNodeCenter(
  node: MindNode,
  byId: Map<string, MindNode>
): { x: number; y: number } {
  const dim = getNodeDim(node, byId);
  return { x: node.x + dim.w / 2, y: node.y + dim.h / 2 };
}

/** Smooth cubic link between node centers */
export function connectionPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const dx = Math.abs(x2 - x1);
  const tension = Math.max(48, Math.min(160, dx * 0.45));
  const c1x = x1 + (x2 >= x1 ? tension : -tension);
  const c2x = x2 - (x2 >= x1 ? tension : -tension);
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
}
