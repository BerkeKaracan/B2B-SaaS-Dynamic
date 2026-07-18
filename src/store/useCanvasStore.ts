import { create } from 'zustand';
import { BlockContent, BlockType, PageContent } from '@/types/record';
import { WORKSPACE_MODULE } from '@/lib/workspace';
import { fetchAPI } from '@/services/api';
import {
  BLOCK_STACK_GAP,
  BLOCK_STACK_ORIGIN_X,
  BLOCK_STACK_ORIGIN_Y,
  BLOCK_STACK_PAGE_PAD,
  getBlockDefaultWidth,
  resolveBlockHeight,
} from '@/lib/blockConfig';

export type PageWithSettings = PageContent & {
  settings?: Record<string, unknown>;
};

export interface Connection {
  id: string;
  fromPage: string;
  fromBlock: string;
  toPage: string;
  toBlock: string;
}

const getEstimatedHeight = (type: string, height?: number | null) =>
  resolveBlockHeight(type, height);

/** Board templates that render via dedicated components, not freeform blocks. */
const TEMPLATE_PAGE_TYPES = new Set<PageContent['type']>([
  'kanban',
  'notes',
  'document',
  'timeline',
  'database',
  'whiteboard',
  'mindmap',
  'retrospective',
]);

const normalizeGeneratedPageType = (
  raw: unknown
): PageContent['type'] => {
  const value = String(raw || 'empty').toLowerCase().trim();
  if (value === 'empty') return 'empty';
  if (TEMPLATE_PAGE_TYPES.has(value as PageContent['type'])) {
    return value as PageContent['type'];
  }
  // Common model aliases
  if (value === 'note' || value === 'notepad') return 'notes';
  if (value === 'board' || value === 'kanban_board') return 'kanban';
  if (value === 'table' || value === 'db') return 'database';
  if (value === 'retro') return 'retrospective';
  if (value === 'flow' || value === 'flowchart') return 'mindmap';
  return 'empty';
};

/** Pack AI blocks into a tight vertical stack; ignore AI x/y/height noise. */
const layoutBlocksVertically = (
  blocks: Partial<BlockContent>[],
  startY: number
): { positioned: BlockContent[]; nextY: number } => {
  let currentY = startY;
  const positioned = blocks.map((b) => {
    const type = (b.type || 'form') as BlockType;
    const height = getEstimatedHeight(type, b.height);
    const width = b.width && b.width > 0 ? b.width : getBlockDefaultWidth(type);
    const positionedBlock = {
      ...b,
      id: crypto.randomUUID(),
      type,
      value: b.value ?? '',
      settings: b.settings || {},
      x: BLOCK_STACK_ORIGIN_X,
      y: currentY,
      width,
      height,
    } as BlockContent;
    currentY += height + BLOCK_STACK_GAP;
    return positionedBlock;
  });
  return { positioned, nextY: currentY };
};

interface CanvasState {
  recordId: string | null;
  pages: PageWithSettings[];
  past: PageWithSettings[][];
  future: PageWithSettings[][];
  connections: Connection[];
  selectedBlocks: string[];
  activePageId: string | null;
  activeBlockId: string | null;
  title: string;
  description: string;
  date: string;
  zoom: number;
  panX: number;
  panY: number;
  isSaving: boolean;
  showSaved: boolean;
  isLoading: boolean;
  metadata: Record<string, unknown>;

  addConnection: (conn: Connection) => void;
  removeConnection: (connId: string) => void;
  setSelectedBlocks: (blockIds: string[]) => void;
  removeSelectedBlocks: () => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  addPage: (type: PageContent['type'], x: number, y: number) => void;
  removePage: (pageId: string) => void;
  updatePageTitle: (pageId: string, title: string) => void;
  updatePageSettings: (
    pageId: string,
    settings: Record<string, unknown>
  ) => void;
  addBlockToPage: (
    pageId: string,
    type: BlockType,
    x: number,
    y: number
  ) => void;
  removeBlockFromPage: (pageId: string, blockId: string) => void;
  setActivePage: (id: string | null) => void;
  setActiveBlock: (id: string | null) => void;
  updateBlockValue: (pageId: string, blockId: string, value: unknown) => void;
  updateBlockSettings: (
    pageId: string,
    blockId: string,
    settings: Record<string, unknown>
  ) => void;
  updatePagePosition: (pageId: string, x: number, y: number) => void;
  updateBlockPosition: (
    pageId: string,
    blockId: string,
    x: number,
    y: number
  ) => void;
  updatePageDimensions: (pageId: string, width: number, height: number) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setDate: (date: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  clearCanvas: () => void;
  loadProjectById: (tenantId: string, recordId: string) => Promise<void>;
  loadPublicProjectById: (recordId: string) => Promise<void>;
  createProject: (
    tenantId: string,
    name?: string,
    moduleName?: string
  ) => Promise<string | null>;
  saveProject: (tenantId: string) => Promise<void>;
  updateBlockDimensions: (
    pageId: string,
    blockId: string,
    width: number,
    height: number
  ) => void;
  duplicateBlock: (
    pageId: string,
    blockId: string,
    offsetX?: number,
    offsetY?: number
  ) => void;
  transferBlockToPage: (
    blockId: string,
    sourcePageId: string,
    targetPageId: string,
    newX: number,
    newY: number
  ) => void;
  updateMetadata: (newData: Record<string, unknown>) => void;
  appendKanbanTask: (task: Record<string, unknown>) => void;
  appendMindmapNode: (node: Record<string, unknown>) => void;
  applyNotepadUpdate: (data: {
    content?: string;
    title?: string;
    mode?: string;
    moduleId?: string;
  }) => void;
  appendWhiteboardNote: (note: Record<string, unknown>, moduleId?: string) => void;

  addGeneratedBlocks: (
    pageId: string,
    newBlocks: Omit<BlockContent, 'id'>[]
  ) => void;
  addGeneratedPage: (
    pageData: Omit<PageContent, 'id' | 'blocks'> & {
      blocks?: Omit<BlockContent, 'id'>[];
      metadata?: Record<string, unknown>;
    }
  ) => void;
  mode: 'design' | 'readonly';
  setMode: (mode: 'design' | 'readonly') => void;
}

let saveTimeout: NodeJS.Timeout;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  recordId: null,
  pages: [],
  past: [],
  future: [],
  connections: [],
  selectedBlocks: [],
  activePageId: null,
  activeBlockId: null,
  title: '',
  description: '',
  date: '',
  zoom: 100,
  panX: 0,
  panY: 0,
  isSaving: false,
  showSaved: false,
  isLoading: false,
  metadata: {},

  updateMetadata: (newData) =>
    set((state) => ({ metadata: { ...state.metadata, ...newData } })),

  appendKanbanTask: (task) =>
    set((state) => {
      const existing = (
        (state.metadata.tasks as Record<string, unknown>[] | undefined) ||
        (state.metadata.kanbanTasks as Record<string, unknown>[] | undefined) ||
        []
      ).slice();
      const alreadyExists = existing.some(
        (item) => item && item.id && item.id === task.id
      );
      if (alreadyExists) {
        return state;
      }
      const nextTasks = [...existing, task];

      const boardId =
        (task.board_id as string | undefined) ||
        (task.page_id as string | undefined);
      const pages = state.pages.map((p) => {
        const isTarget =
          (boardId && p.id === boardId) ||
          (!boardId && p.type === 'kanban');
        if (!isTarget) return p;
        const settings = { ...(p.settings || {}) } as Record<string, unknown>;
        const pageTasks = (
          (settings.tasks as Record<string, unknown>[] | undefined) ||
          (settings.kanbanTasks as Record<string, unknown>[] | undefined) ||
          []
        ).slice();
        if (!pageTasks.some((t) => t?.id === task.id)) pageTasks.push(task);
        settings.tasks = pageTasks;
        settings.kanbanTasks = pageTasks;
        return { ...p, settings };
      });

      return {
        pages,
        metadata: {
          ...state.metadata,
          tasks: nextTasks,
          kanbanTasks: nextTasks,
        },
      };
    }),

  appendMindmapNode: (node) =>
    set((state) => {
      const existing = (
        (state.metadata.mindmapNodes as Record<string, unknown>[] | undefined) ||
        []
      ).slice();
      if (existing.some((n) => n?.id === node.id)) return state;
      const nextNodes = [...existing, node];
      const pageId = node.page_id as string | undefined;
      const pages = state.pages.map((p) => {
        const isTarget =
          (pageId && p.id === pageId) || (!pageId && p.type === 'mindmap');
        if (!isTarget) return p;
        const settings = { ...(p.settings || {}) } as Record<string, unknown>;
        const pageNodes = (
          (settings.mindmapNodes as Record<string, unknown>[] | undefined) ||
          []
        ).slice();
        if (!pageNodes.some((n) => n?.id === node.id)) pageNodes.push(node);
        settings.mindmapNodes = pageNodes;
        return { ...p, settings };
      });
      return {
        pages,
        metadata: {
          ...state.metadata,
          mindmapNodes: nextNodes,
        },
      };
    }),

  applyNotepadUpdate: ({ content, title, mode, moduleId }) =>
    set((state) => {
      const targetId = moduleId || state.activePageId || state.recordId;
      let matched = false;
      const pages = state.pages.map((p) => {
        const isExact = targetId ? p.id === targetId : false;
        const isTypeMatch =
          !matched &&
          !state.pages.some((x) => x.id === targetId) &&
          (p.type === 'notes' || p.type === 'document');
        const isFallback =
          !matched &&
          !state.pages.some((x) => x.id === targetId) &&
          !state.pages.some((x) =>
            ['notes', 'document'].includes(x.type)
          ) &&
          p === state.pages[0];

        if (!(isExact || isTypeMatch || isFallback)) return p;
        matched = true;
        const settings = { ...(p.settings || {}) } as Record<string, unknown>;
        const existing = String(
          settings.notepadContent || settings.documentContent || ''
        );
        if (content != null) {
          settings.notepadContent =
            mode === 'append'
              ? `${existing.trim()}\n\n${content}`.trim()
              : content;
        }
        if (title) settings.notepadTitle = title;
        return {
          ...p,
          title: title || p.title,
          settings,
        };
      });

      const metadata = { ...state.metadata };
      if (content != null) {
        const existing = String(metadata.notepadContent || '');
        metadata.notepadContent =
          mode === 'append'
            ? `${existing.trim()}\n\n${content}`.trim()
            : content;
      }
      if (title) metadata.notepadTitle = title;

      return { pages, metadata };
    }),

  appendWhiteboardNote: (note, moduleId) =>
    set((state) => {
      const targetId = moduleId || state.activePageId || state.recordId;
      const hasExactPage = state.pages.some((x) => x.id === targetId);
      const normalized: Record<string, unknown> = {
        ...note,
        content:
          (note.content as string | undefined) ||
          (note.text as string | undefined) ||
          '',
        text:
          (note.text as string | undefined) ||
          (note.content as string | undefined) ||
          '',
      };

      const pages = state.pages.map((p) => {
        const isExact = hasExactPage && p.id === targetId;
        const isTypeMatch = !hasExactPage && p.type === 'whiteboard';
        const isFallback =
          !hasExactPage &&
          !state.pages.some((x) => x.type === 'whiteboard') &&
          p === state.pages[0];
        if (!(isExact || isTypeMatch || isFallback)) return p;

        const settings = { ...(p.settings || {}) } as Record<string, unknown>;
        const texts = [
          ...((settings.whiteboardTexts as Record<string, unknown>[]) || []),
        ];
        if (!texts.some((t) => t?.id === normalized.id)) texts.push(normalized);
        settings.whiteboardTexts = texts;
        return { ...p, settings };
      });

      const metadata = { ...state.metadata };
      const metaTexts = [
        ...((metadata.whiteboardTexts as Record<string, unknown>[]) || []),
      ];
      if (!metaTexts.some((t) => t?.id === normalized.id))
        metaTexts.push(normalized);
      metadata.whiteboardTexts = metaTexts;

      return { pages, metadata };
    }),

  addGeneratedBlocks: (pageId, newBlocks) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map((p) => {
        if (p.id !== pageId) return p;

        const isAutoLayout = !['whiteboard', 'mindmap', 'kanban'].includes(
          p.type
        );

        let blocksWithIds: BlockContent[];
        let stackBottom = 0;

        if (isAutoLayout) {
          let startY = BLOCK_STACK_ORIGIN_Y;
          if (p.blocks.length > 0) {
            startY =
              Math.max(
                ...p.blocks.map(
                  (b) =>
                    (b.y || 0) + getEstimatedHeight(b.type, b.height)
                )
              ) + BLOCK_STACK_GAP;
          }
          const laidOut = layoutBlocksVertically(newBlocks, startY);
          blocksWithIds = laidOut.positioned;
          stackBottom = laidOut.nextY;
        } else {
          blocksWithIds = newBlocks.map(
            (b) =>
              ({
                ...b,
                id: crypto.randomUUID(),
              }) as BlockContent
          );
          stackBottom =
            blocksWithIds.length > 0
              ? Math.max(
                  ...blocksWithIds.map(
                    (b) =>
                      (b.y || 0) + getEstimatedHeight(b.type, b.height)
                  )
                )
              : 0;
        }

        const combinedBlocks = [...p.blocks, ...blocksWithIds];
        let newHeight = p.height || 800;

        if (isAutoLayout) {
          if (stackBottom + BLOCK_STACK_PAGE_PAD > newHeight) {
            newHeight = stackBottom + BLOCK_STACK_PAGE_PAD;
          }
        } else if (combinedBlocks.length > 0) {
          const maxBottom = Math.max(
            ...combinedBlocks.map(
              (b) => (b.y || 0) + getEstimatedHeight(b.type, b.height)
            )
          );
          if (maxBottom + BLOCK_STACK_PAGE_PAD > newHeight) {
            newHeight = maxBottom + BLOCK_STACK_PAGE_PAD;
          }
        }

        return {
          ...p,
          height: newHeight,
          blocks: combinedBlocks,
        };
      }),
    }));
  },

  addGeneratedPage: (pageData) => {
    get().saveHistory();
    set((state) => {
      const pageId = crypto.randomUUID();
      const pageType = normalizeGeneratedPageType(pageData.type);
      const isTemplate = TEMPLATE_PAGE_TYPES.has(pageType);
      // Only freeform "empty" pages use vertical block stacking.
      // Templates (kanban, database, notes, …) must keep their type + metadata.
      const isAutoLayout = !isTemplate;

      let finalHeight = pageData.height || 800;
      let processedBlocks: BlockContent[] = [];

      if (isAutoLayout && pageData.blocks && pageData.blocks.length > 0) {
        const laidOut = layoutBlocksVertically(
          pageData.blocks,
          BLOCK_STACK_ORIGIN_Y
        );
        processedBlocks = laidOut.positioned;
        // Prefer packed height — AI often returns height: 1000+ with huge empty space.
        finalHeight = Math.max(480, laidOut.nextY + BLOCK_STACK_PAGE_PAD);
      } else if (isTemplate) {
        // Board components read from settings/metadata; drop junk blocks the model often emits.
        processedBlocks = [];
        finalHeight = Math.max(pageData.height || 800, 720);
      }

      const newPage: PageWithSettings = {
        id: pageId,
        type: pageType,
        title: pageData.title || 'AI Generated Workspace',
        x: pageData.x || 100,
        y: pageData.y || 100,
        width: pageData.width || 1000,
        height: finalHeight,
        blocks: processedBlocks,
        settings: {
          backgroundColor: isAutoLayout ? '#ffffff' : '#f4f4f5',
          ...(pageData.metadata || {}),
        },
      };

      return {
        pages: [...state.pages, newPage],
        activePageId: pageId,
        selectedBlocks: [],
      };
    });
  },

  addConnection: (conn) => {
    get().saveHistory();
    set((state) => ({ connections: [...state.connections, conn] }));
  },

  removeConnection: (connId) => {
    get().saveHistory();
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connId),
    }));
  },

  setSelectedBlocks: (blockIds) => set({ selectedBlocks: blockIds }),

  removeSelectedBlocks: () => {
    get().saveHistory();
    set((state) => {
      const selected = state.selectedBlocks;
      if (!selected || selected.length === 0) return state;

      const newPages = state.pages.map((p) => ({
        ...p,
        blocks: p.blocks.filter((b) => !selected.includes(b.id)),
      }));

      const newConnections = state.connections.filter(
        (c) => !selected.includes(c.fromBlock) && !selected.includes(c.toBlock)
      );

      return {
        pages: newPages,
        connections: newConnections,
        selectedBlocks: [],
        activeBlockId: null,
      };
    });
  },

  saveHistory: () =>
    set((state) => {
      const clonedPages = structuredClone(state.pages) as PageWithSettings[];
      const newPast = [...state.past, clonedPages].slice(-50);
      return { past: newPast, future: [] };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);

      const clonedCurrent = structuredClone(state.pages) as PageWithSettings[];
      return {
        pages: previous,
        past: newPast,
        future: [clonedCurrent, ...state.future],
        selectedBlocks: [],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);

      const clonedCurrent = structuredClone(state.pages) as PageWithSettings[];
      return {
        pages: next,
        past: [...state.past, clonedCurrent],
        future: newFuture,
        selectedBlocks: [],
      };
    }),

  addPage: (type, x, y) => {
    get().saveHistory();
    set((state) => {
      const pageId = crypto.randomUUID();
      let width = 800;
      let height = 1131;
      let title = 'New Frame';
      let bgColor = '#ffffff';
      let initialBlocks: BlockContent[] = [];

      if (type === 'kanban') {
        width = 1200;
        height = 800;
        title = 'Kanban Board';
        bgColor = '#f4f4f5';
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: 'text',
            value: 'TO DO\n\n- Task 1',
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: 'text',
            value: 'IN PROGRESS\n\n- Task 2',
            x: 440,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: 'text',
            value: 'DONE\n\n- ',
            x: 840,
            y: 40,
            settings: {},
          },
        ];
      } else if (type === 'notes') {
        width = 800;
        height = 1000;
        title = 'Notes Workspace';
        bgColor = '#fffdf0';
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: 'text',
            value: '# Meeting Notes\nDate:',
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: 'checkbox',
            value: false,
            x: 40,
            y: 200,
            settings: {},
          },
        ];
      } else if (type === 'timeline') {
        width = 1000;
        height = 600;
        title = 'Timeline';
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: 'date',
            value: '',
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: 'text',
            value: 'Phase 1: Kickoff',
            x: 350,
            y: 40,
            settings: {},
          },
        ];
      } else if (type === 'database') {
        width = 1200;
        height = 800;
        title = 'Structured Database';
        bgColor = '#f8fafc';
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: 'form',
            value: '',
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: 'badge_selector',
            value: '',
            x: 350,
            y: 40,
            settings: { options: 'Active, Pending, Closed' },
          },
        ];
      }

      const newPage: PageWithSettings = {
        id: pageId,
        type,
        title,
        x,
        y,
        width,
        height,
        blocks: initialBlocks,
        settings: { backgroundColor: bgColor },
      };

      return {
        pages: [...state.pages, newPage],
        activePageId: pageId,
        selectedBlocks: [],
      };
    });
  },

  removePage: (pageId) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== pageId),
      connections: state.connections.filter(
        (c) => c.fromPage !== pageId && c.toPage !== pageId
      ),
      activePageId: state.activePageId === pageId ? null : state.activePageId,
      selectedBlocks: [],
    }));
  },

  updatePageTitle: (pageId, title) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
    })),

  updatePageSettings: (pageId, settings) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, settings: { ...(p.settings || {}), ...settings } }
          : p
      ),
    })),

  addBlockToPage: (pageId, type, x, y) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          blocks: [
            ...p.blocks,
            { id: crypto.randomUUID(), type, value: '', x, y, settings: {} },
          ],
        };
      }),
    }));
  },

  removeBlockFromPage: (pageId, blockId) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }
          : p
      ),
      connections: state.connections.filter(
        (c) => c.fromBlock !== blockId && c.toBlock !== blockId
      ),
      selectedBlocks: state.selectedBlocks.filter((id) => id !== blockId),
    }));
  },

  setActivePage: (id) => set({ activePageId: id, activeBlockId: null }),
  setActiveBlock: (id) => set({ activeBlockId: id }),

  updateBlockValue: (pageId, blockId, value) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === blockId ? { ...b, value } : b
              ),
            }
          : p
      ),
    }));
  },

  updateBlockSettings: (pageId, blockId, settings) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === blockId
                  ? { ...b, settings: { ...(b.settings || {}), ...settings } }
                  : b
              ),
            }
          : p
      ),
    }));
  },

  updatePagePosition: (pageId, x, y) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, x, y } : p)),
    })),

  updateBlockPosition: (pageId, blockId, x, y) =>
    set((state) => {
      const sourcePage = state.pages.find((p) => p.id === pageId);
      const sourceBlock = sourcePage?.blocks.find((b) => b.id === blockId);

      if (!sourcePage || !sourceBlock) return state;

      const dx = x - sourceBlock.x;
      const dy = y - sourceBlock.y;

      if (dx === 0 && dy === 0) return state;

      const isMultiDrag =
        state.selectedBlocks.includes(blockId) &&
        state.selectedBlocks.length > 1;

      return {
        pages: state.pages.map((p) => {
          const hasBlocksToMove = p.blocks.some(
            (b) =>
              (p.id === pageId && b.id === blockId) ||
              (isMultiDrag && state.selectedBlocks.includes(b.id))
          );

          if (!hasBlocksToMove) return p;

          return {
            ...p,
            blocks: p.blocks.map((b) => {
              const isTargetBlock = p.id === pageId && b.id === blockId;
              const isSelectedBlock =
                isMultiDrag && state.selectedBlocks.includes(b.id);

              if (isTargetBlock || isSelectedBlock) {
                return { ...b, x: b.x + dx, y: b.y + dy };
              }
              return b;
            }),
          };
        }),
      };
    }),

  updateBlockDimensions: (pageId, blockId, width, height) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === blockId ? { ...b, width, height } : b
              ),
            }
          : p
      ),
    })),

  updatePageDimensions: (pageId, width, height) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, width, height } : p
      ),
    }));
  },

  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setDate: (date) => set({ date }),
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 10), 400) }),
  setPan: (panX, panY) => set({ panX, panY }),

  clearCanvas: () =>
    set({
      recordId: null,
      pages: [],
      past: [],
      future: [],
      connections: [],
      selectedBlocks: [],
      title: '',
      description: '',
      date: '',
      zoom: 100,
      panX: 0,
      panY: 0,
      activePageId: null,
      activeBlockId: null,
      metadata: {},
      mode: 'design',
    }),

  loadProjectById: async (tenantId, recordId) => {
    set({ isLoading: true });
    try {
      const response = await fetchAPI(`/api/records/${recordId}`);
      if (!response.ok) throw new Error('Fetch failed');
      const record = await response.json();

      if (record?.record_data) {
        const pages = record.record_data.pages || [];
        set({
          recordId: record.id,
          title: record.record_data.title || '',
          description: record.record_data.description || '',
          date: record.record_data.date || '',
          pages,
          connections: record.record_data.connections || [],
          metadata: record.record_data,
          activePageId: pages[0]?.id || null,
        });
      }
    } catch (e) {
      console.error('Failed to load project:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadPublicProjectById: async (recordId) => {
    set({ isLoading: true });
    try {
      const response = await fetchAPI(
        `/api/public/records/${recordId}?t=${Date.now()}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        }
      );
      if (!response.ok) {
        const err = new Error(
          response.status === 403
            ? 'private'
            : response.status === 404
              ? 'not_found'
              : 'fetch_failed'
        ) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }

      const record = await response.json();
      const rootData = record.record_data || record || {};
      const pages = rootData.pages || record.pages || [];

      set({
        recordId: record.id || recordId,
        title: rootData.title || rootData.name || '',
        description: rootData.description || '',
        date: rootData.date || '',
        pages,
        connections: rootData.connections || [],
        metadata: rootData,
        activePageId: pages[0]?.id || null,
        mode: 'readonly',
        selectedBlocks: [],
        activeBlockId: null,
      });
    } catch (e) {
      console.error('Failed to load public project:', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (
    tenantId,
    name = 'New Project',
    moduleName = WORKSPACE_MODULE
  ) => {
    try {
      const response = await fetchAPI(`/api/records/`, {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          module_name: moduleName,
          record_data: {
            name,
            pages: [],
            connections: [],
            visibility: 'just_admin',
          },
        }),
      });
      const data = await response.json();
      return data.id;
    } catch {
      return null;
    }
  },

  saveProject: async (tenantId) => {
    const { recordId, title, description, date, pages, connections, metadata } =
      get();
    if (!recordId) return;

    set({ isSaving: true, showSaved: false });

    try {
      await fetchAPI(`/api/records/${recordId}`, {
        method: 'PATCH',
        ...(tenantId ? { headers: { 'x-tenant-id': tenantId } } : {}),
        body: JSON.stringify({
          record_data: {
            ...metadata,
            title,
            description,
            date,
            pages,
            connections,
          },
        }),
      });

      set({ showSaved: true });
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => set({ showSaved: false }), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      set({ isSaving: false });
    }
  },

  duplicateBlock: (pageId, blockId, offsetX = 40, offsetY = 40) => {
    get().saveHistory();
    set((state) => {
      const page = state.pages.find((p) => p.id === pageId);
      if (!page) return state;

      const blockToCopy = page.blocks.find((b) => b.id === blockId);
      if (!blockToCopy) return state;

      const newBlock: BlockContent = {
        ...JSON.parse(JSON.stringify(blockToCopy)),
        id: crypto.randomUUID(),
        x: blockToCopy.x + offsetX,
        y: blockToCopy.y + offsetY,
      };

      return {
        pages: state.pages.map((p) =>
          p.id === pageId ? { ...p, blocks: [...p.blocks, newBlock] } : p
        ),
        activeBlockId: newBlock.id,
        selectedBlocks: [newBlock.id],
      };
    });
  },

  transferBlockToPage: (blockId, sourcePageId, targetPageId, newX, newY) => {
    get().saveHistory();
    set((state) => {
      const sourcePage = state.pages.find((p) => p.id === sourcePageId);
      if (!sourcePage) return state;

      const blockToMove = sourcePage.blocks.find((b) => b.id === blockId);
      if (!blockToMove) return state;

      const updatedBlock = { ...blockToMove, x: newX, y: newY };

      return {
        pages: state.pages.map((p) => {
          if (p.id === sourcePageId) {
            return { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) };
          }
          if (p.id === targetPageId) {
            return { ...p, blocks: [...p.blocks, updatedBlock] };
          }
          return p;
        }),
        activePageId: targetPageId,
      };
    });
  },
  mode: 'design',
  setMode: (mode) => set({ mode }),
}));
