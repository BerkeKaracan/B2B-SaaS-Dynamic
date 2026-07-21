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

type DragSession = PageDragSession | BlockDragSession | ResizeSession;

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
  }
  return map;
}

export function isDragSessionActive(): boolean {
  return session != null;
}

export function getActiveDragPageId(): string | null {
  if (!session) return null;
  if (session.kind === 'page' || session.kind === 'resize')
    return session.pageId;
  return session.primaryPageId;
}

export function getActiveDragBlockIds(): string[] {
  if (!session || session.kind !== 'block') return [];
  return session.targets.map((t) => t.blockId);
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
}) {
  cancelDragSession();
  session = {
    kind: 'resize',
    pageId: args.pageId,
    el: args.el,
    edge: args.edge,
    startClientX: args.startClientX,
    startClientY: args.startClientY,
    startW: args.startW,
    startH: args.startH,
    startPageX: args.startPageX,
    startPageY: args.startPageY,
    width: args.startW,
    height: args.startH,
    pageX: args.startPageX,
    pageY: args.startPageY,
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
      newW = Math.max(300, session.startW + deltaX);
    }
    if (edge.includes('l')) {
      const possibleW = session.startW - deltaX;
      if (possibleW >= 300) {
        newW = possibleW;
        newX = session.startPageX + deltaX;
      }
    }
    if (edge.includes('b')) {
      newH = Math.max(300, session.startH + deltaY);
    }
    if (edge.includes('t')) {
      const possibleH = session.startH - deltaY;
      if (possibleH >= 300) {
        newH = possibleH;
        newY = session.startPageY + deltaY;
      }
    }

    session.width = newW;
    session.height = newH;
    session.pageX = newX;
    session.pageY = newY;
    session.dx = newX - session.startPageX;
    session.dy = newY - session.startPageY;

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

export type DragCommit = PageDragCommit | BlockDragCommit | ResizeCommit;

/**
 * Clear DOM transforms and return the final geometry for a single store write.
 * Returns null if there was no session or movement was zero (still clears DOM).
 */
export function commitDragSession(): DragCommit | null {
  if (!session) return null;

  const current = session;
  session = null;

  if (current.kind === 'page') {
    clearTransform(current.el);
    const commit: PageDragCommit = {
      kind: 'page',
      pageId: current.pageId,
      x: current.originX + current.dx,
      y: current.originY + current.dy,
    };
    notify();
    return commit;
  }

  if (current.kind === 'block') {
    for (const t of current.targets) clearTransform(t.el);
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

  // resize
  clearTransform(current.el);
  current.el.style.width = '';
  current.el.style.minHeight = '';
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
    clearTransform(current.el);
    current.el.style.width = '';
    current.el.style.minHeight = '';
    current.el.style.willChange = '';
  }
  notify();
}
