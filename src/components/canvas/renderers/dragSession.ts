/**
 * Store-free drag session: during pointermove only GPU transforms are applied.
 * Zustand / Yjs receive a single commit on pointerup (or nothing on cancel).
 *
 * Position model: left/top stay as the persisted world coords from React.
 * During drag we layer `transform: translate3d(dx, dy, 0)` on top; on commit
 * we clear the transform and write the new left/top into the store once.
 */

export type LiveOffset = { dx: number; dy: number };

type PageDragSession = {
  kind: 'page';
  pageId: string;
  el: HTMLElement;
  originX: number;
  originY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  dx: number;
  dy: number;
};

type BlockTarget = {
  blockId: string;
  pageId: string;
  el: HTMLElement;
  originX: number;
  originY: number;
};

type BlockDragSession = {
  kind: 'block';
  primaryBlockId: string;
  primaryPageId: string;
  targets: BlockTarget[];
  /** Grab point relative to primary block's page-local origin. */
  grabOffsetX: number;
  grabOffsetY: number;
  /** Primary page world origin at drag start (for computing canvas coords). */
  primaryPageX: number;
  primaryPageY: number;
  dx: number;
  dy: number;
};

type ResizeSession = {
  kind: 'resize';
  pageId: string;
  el: HTMLElement;
  edge: string;
  /** Board/template frames use fixed height (not just minHeight). */
  fixedHeight: boolean;
  startClientX: number;
  startClientY: number;
  startW: number;
  startH: number;
  startPageX: number;
  startPageY: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
  dx: number;
  dy: number;
};

const PAGE_MIN_SIZE = 300;

type BlockResizeSession = {
  kind: 'blockResize';
  pageId: string;
  blockId: string;
  el: HTMLElement;
  edge: string;
  startClientX: number;
  startClientY: number;
  startW: number;
  startH: number;
  startBlockX: number;
  startBlockY: number;
  width: number;
  height: number;
  blockX: number;
  blockY: number;
  dx: number;
  dy: number;
};

type DragSession =
  | PageDragSession
  | BlockDragSession
  | ResizeSession
  | BlockResizeSession;

let session: DragSession | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function applyTransform(el: HTMLElement, dx: number, dy: number) {
  el.style.willChange = 'transform';
  el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
}

function clearTransform(el: HTMLElement) {
  el.style.transform = '';
  el.style.willChange = '';
}

export function subscribeDragSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** World-space offsets keyed by pageId or blockId for live connection paint. */
export function getLiveOffsets(): Map<string, LiveOffset> {
  const map = new Map<string, LiveOffset>();
  if (!session) return map;

  if (session.kind === 'page') {
    map.set(session.pageId, { dx: session.dx, dy: session.dy });
  } else if (session.kind === 'block') {
    for (const t of session.targets) {
      map.set(t.blockId, { dx: session.dx, dy: session.dy });
    }
  } else if (session.kind === 'resize') {
    map.set(session.pageId, { dx: session.dx, dy: session.dy });
  } else if (session.kind === 'blockResize') {
    map.set(session.blockId, { dx: session.dx, dy: session.dy });
  }
  return map;
}

export function isDragSessionActive(): boolean {
  return session != null;
}

export function getActiveDragPageId(): string | null {
  if (!session) return null;
  if (
    session.kind === 'page' ||
    session.kind === 'resize' ||
    session.kind === 'blockResize'
  )
    return session.pageId;
  return session.primaryPageId;
}

export function getActiveDragBlockIds(): string[] {
  if (!session) return [];
  if (session.kind === 'block') return session.targets.map((t) => t.blockId);
  if (session.kind === 'blockResize') return [session.blockId];
  return [];
}

export function startPageDrag(args: {
  el: HTMLElement;
  pageId: string;
  originX: number;
  originY: number;
  grabOffsetX: number;
  grabOffsetY: number;
}) {
  cancelDragSession();
  session = {
    kind: 'page',
    pageId: args.pageId,
    el: args.el,
    originX: args.originX,
    originY: args.originY,
    grabOffsetX: args.grabOffsetX,
    grabOffsetY: args.grabOffsetY,
    dx: 0,
    dy: 0,
  };
  applyTransform(args.el, 0, 0);
  notify();
}

export function startBlockDrag(args: {
  targets: BlockTarget[];
  primaryBlockId: string;
  primaryPageId: string;
  primaryPageX: number;
  primaryPageY: number;
  grabOffsetX: number;
  grabOffsetY: number;
}) {
  cancelDragSession();
  session = {
    kind: 'block',
    primaryBlockId: args.primaryBlockId,
    primaryPageId: args.primaryPageId,
    targets: args.targets,
    grabOffsetX: args.grabOffsetX,
    grabOffsetY: args.grabOffsetY,
    primaryPageX: args.primaryPageX,
    primaryPageY: args.primaryPageY,
    dx: 0,
    dy: 0,
  };
  for (const t of args.targets) applyTransform(t.el, 0, 0);
  notify();
}

export function startPageResize(args: {
  el: HTMLElement;
  pageId: string;
  edge: string;
  startClientX: number;
  startClientY: number;
  startW: number;
  startH: number;
  startPageX: number;
  startPageY: number;
  /** Board/template frames pin height so shrink actually clips content. */
  fixedHeight?: boolean;
}) {
  cancelDragSession();
  const startW = Math.max(PAGE_MIN_SIZE, Number(args.startW) || PAGE_MIN_SIZE);
  const startH = Math.max(PAGE_MIN_SIZE, Number(args.startH) || PAGE_MIN_SIZE);
  session = {
    kind: 'resize',
    pageId: args.pageId,
    el: args.el,
    edge: args.edge,
    fixedHeight: !!args.fixedHeight,
    startClientX: args.startClientX,
    startClientY: args.startClientY,
    startW,
    startH,
    startPageX: args.startPageX,
    startPageY: args.startPageY,
    width: startW,
    height: startH,
    pageX: args.startPageX,
    pageY: args.startPageY,
    dx: 0,
    dy: 0,
  };
  args.el.style.willChange = 'transform, width, height, min-height';
  notify();
}

const BLOCK_MIN_W = 120;
const BLOCK_MIN_H = 60;

export function startBlockResize(args: {
  el: HTMLElement;
  pageId: string;
  blockId: string;
  edge: string;
  startClientX: number;
  startClientY: number;
  startW: number;
  startH: number;
  startBlockX: number;
  startBlockY: number;
}) {
  cancelDragSession();
  session = {
    kind: 'blockResize',
    pageId: args.pageId,
    blockId: args.blockId,
    el: args.el,
    edge: args.edge,
    startClientX: args.startClientX,
    startClientY: args.startClientY,
    startW: args.startW,
    startH: args.startH,
    startBlockX: args.startBlockX,
    startBlockY: args.startBlockY,
    width: args.startW,
    height: args.startH,
    blockX: args.startBlockX,
    blockY: args.startBlockY,
    dx: 0,
    dy: 0,
  };
  args.el.style.willChange = 'transform, width, height, min-height';
  notify();
}

/**
 * Apply the latest pointer position in world (canvas) coords for page/block
 * drag, or client deltas for resize. Call from rAF — never writes to the store.
 */
export function applyDragPointer(args: {
  mouseCanvasX: number;
  mouseCanvasY: number;
  clientX: number;
  clientY: number;
  scale: number;
}) {
  if (!session) return;

  if (session.kind === 'page') {
    const nextX = args.mouseCanvasX - session.grabOffsetX;
    const nextY = args.mouseCanvasY - session.grabOffsetY;
    session.dx = nextX - session.originX;
    session.dy = nextY - session.originY;
    applyTransform(session.el, session.dx, session.dy);
    notify();
    return;
  }

  if (session.kind === 'block') {
    const nextX =
      args.mouseCanvasX - session.primaryPageX - session.grabOffsetX;
    const nextY =
      args.mouseCanvasY - session.primaryPageY - session.grabOffsetY;
    const primaryId = session.primaryBlockId;
    const primaryOrigin = session.targets.find((t) => t.blockId === primaryId);
    if (!primaryOrigin) return;
    session.dx = nextX - primaryOrigin.originX;
    session.dy = nextY - primaryOrigin.originY;
    for (const t of session.targets) {
      applyTransform(t.el, session.dx, session.dy);
    }
    notify();
    return;
  }

  if (session.kind === 'resize') {
    const deltaX = (args.clientX - session.startClientX) / args.scale;
    const deltaY = (args.clientY - session.startClientY) / args.scale;

    let newW = session.startW;
    let newH = session.startH;
    let newX = session.startPageX;
    let newY = session.startPageY;
    const edge = session.edge;

    if (edge.includes('r')) {
      newW = Math.max(PAGE_MIN_SIZE, session.startW + deltaX);
    }
    if (edge.includes('l')) {
      newW = Math.max(PAGE_MIN_SIZE, session.startW - deltaX);
      // Keep the right edge fixed even when clamped to min width.
      newX = session.startPageX + (session.startW - newW);
    }
    if (edge.includes('b')) {
      newH = Math.max(PAGE_MIN_SIZE, session.startH + deltaY);
    }
    if (edge.includes('t')) {
      newH = Math.max(PAGE_MIN_SIZE, session.startH - deltaY);
      newY = session.startPageY + (session.startH - newH);
    }

    session.width = newW;
    session.height = newH;
    session.pageX = newX;
    session.pageY = newY;
    session.dx = newX - session.startPageX;
    session.dy = newY - session.startPageY;

    session.el.style.width = `${newW}px`;
    session.el.style.minHeight = `${newH}px`;
    if (session.fixedHeight) {
      session.el.style.height = `${newH}px`;
    }
    applyTransform(session.el, session.dx, session.dy);
    notify();
    return;
  }

  if (session.kind === 'blockResize') {
    const deltaX = (args.clientX - session.startClientX) / args.scale;
    const deltaY = (args.clientY - session.startClientY) / args.scale;

    let newW = session.startW;
    let newH = session.startH;
    let newX = session.startBlockX;
    let newY = session.startBlockY;
    const edge = session.edge;

    if (edge.includes('e')) {
      newW = Math.max(BLOCK_MIN_W, session.startW + deltaX);
    }
    if (edge.includes('w')) {
      newW = Math.max(BLOCK_MIN_W, session.startW - deltaX);
      // Keep the right edge fixed even when clamped to min width.
      newX = session.startBlockX + (session.startW - newW);
    }
    if (edge.includes('s')) {
      newH = Math.max(BLOCK_MIN_H, session.startH + deltaY);
    }
    if (edge.includes('n')) {
      newH = Math.max(BLOCK_MIN_H, session.startH - deltaY);
      newY = session.startBlockY + (session.startH - newH);
    }

    session.width = newW;
    session.height = newH;
    session.blockX = newX;
    session.blockY = newY;
    session.dx = newX - session.startBlockX;
    session.dy = newY - session.startBlockY;

    session.el.style.width = `${newW}px`;
    session.el.style.minHeight = `${newH}px`;
    applyTransform(session.el, session.dx, session.dy);
    notify();
  }
}

export type PageDragCommit = {
  kind: 'page';
  pageId: string;
  x: number;
  y: number;
};

export type BlockDragCommit = {
  kind: 'block';
  pageId: string;
  blockId: string;
  x: number;
  y: number;
};

export type ResizeCommit = {
  kind: 'resize';
  pageId: string;
  width: number;
  height: number;
  x: number;
  y: number;
  moved: boolean;
};

export type BlockResizeCommit = {
  kind: 'blockResize';
  pageId: string;
  blockId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DragCommit =
  | PageDragCommit
  | BlockDragCommit
  | ResizeCommit
  | BlockResizeCommit;

/**
 * Write final geometry onto the element, then clear the drag transform so
 * there is no frame where minHeight/width is missing (absolute children do
 * not contribute to parent height — clearing minHeight collapses the page).
 */
export function commitDragSession(): DragCommit | null {
  if (!session) return null;

  const current = session;
  session = null;

  if (current.kind === 'page') {
    const x = current.originX + current.dx;
    const y = current.originY + current.dy;
    current.el.style.left = `${x}px`;
    current.el.style.top = `${y}px`;
    clearTransform(current.el);
    const commit: PageDragCommit = {
      kind: 'page',
      pageId: current.pageId,
      x,
      y,
    };
    notify();
    return commit;
  }

  if (current.kind === 'block') {
    for (const t of current.targets) {
      t.el.style.left = `${t.originX + current.dx}px`;
      t.el.style.top = `${t.originY + current.dy}px`;
      clearTransform(t.el);
    }
    const primary = current.targets.find(
      (t) => t.blockId === current.primaryBlockId
    );
    if (!primary) {
      notify();
      return null;
    }
    const commit: BlockDragCommit = {
      kind: 'block',
      pageId: current.primaryPageId,
      blockId: current.primaryBlockId,
      x: primary.originX + current.dx,
      y: primary.originY + current.dy,
    };
    notify();
    return commit;
  }

  if (current.kind === 'blockResize') {
    current.el.style.left = `${current.blockX}px`;
    current.el.style.top = `${current.blockY}px`;
    current.el.style.width = `${current.width}px`;
    current.el.style.minHeight = `${current.height}px`;
    clearTransform(current.el);
    current.el.style.willChange = '';
    const commit: BlockResizeCommit = {
      kind: 'blockResize',
      pageId: current.pageId,
      blockId: current.blockId,
      x: current.blockX,
      y: current.blockY,
      width: current.width,
      height: current.height,
    };
    notify();
    return commit;
  }

  // page resize — keep width/minHeight (and height for boards) so the frame
  // never collapses before React re-applies store styles.
  current.el.style.left = `${current.pageX}px`;
  current.el.style.top = `${current.pageY}px`;
  current.el.style.width = `${current.width}px`;
  current.el.style.minHeight = `${current.height}px`;
  if (current.fixedHeight) {
    current.el.style.height = `${current.height}px`;
  }
  clearTransform(current.el);
  current.el.style.willChange = '';
  const commit: ResizeCommit = {
    kind: 'resize',
    pageId: current.pageId,
    width: current.width,
    height: current.height,
    x: current.pageX,
    y: current.pageY,
    moved:
      current.pageX !== current.startPageX ||
      current.pageY !== current.startPageY,
  };
  notify();
  return commit;
}

/** Abort without writing to the store — restores DOM to React-owned styles. */
export function cancelDragSession() {
  if (!session) return;

  const current = session;
  session = null;

  if (current.kind === 'page') {
    clearTransform(current.el);
  } else if (current.kind === 'block') {
    for (const t of current.targets) clearTransform(t.el);
  } else {
    // page resize or block resize — drop live overrides so React styles win
    clearTransform(current.el);
    current.el.style.width = '';
    current.el.style.minHeight = '';
    current.el.style.height = '';
    current.el.style.willChange = '';
  }
  notify();
}
