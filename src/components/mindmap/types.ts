export type MindNode = {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  /** Legacy Tailwind class string — presentation no longer depends on it */
  color?: string;
  page_id?: string;
};

export type NodeTier = 'root' | 'branch' | 'leaf';

export type NodeDimensions = {
  w: number;
  h: number;
};

export const NODE_DIM: Record<NodeTier, NodeDimensions> = {
  root: { w: 196, h: 60 },
  branch: { w: 172, h: 52 },
  leaf: { w: 160, h: 48 },
};
