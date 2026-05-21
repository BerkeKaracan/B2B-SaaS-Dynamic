import { create } from "zustand";
import { BlockContent, BlockType, PageContent } from "@/types/record";
import { WORKSPACE_MODULE } from "@/lib/workspace";
import { fetchAPI } from "@/services/api";

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
  addConnection: (conn: Connection) => void;
  removeConnection: (connId: string) => void;
  setSelectedBlocks: (blockIds: string[]) => void;
  removeSelectedBlocks: () => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  addPage: (type: PageContent["type"], x: number, y: number) => void;
  removePage: (pageId: string) => void;
  updatePageTitle: (pageId: string, title: string) => void;
  updatePageSettings: (
    pageId: string,
    settings: Record<string, unknown>,
  ) => void;
  addBlockToPage: (
    pageId: string,
    type: BlockType,
    x: number,
    y: number,
  ) => void;
  removeBlockFromPage: (pageId: string, blockId: string) => void;
  setActivePage: (id: string | null) => void;
  setActiveBlock: (id: string | null) => void;
  updateBlockValue: (pageId: string, blockId: string, value: unknown) => void;
  updateBlockSettings: (
    pageId: string,
    blockId: string,
    settings: Record<string, unknown>,
  ) => void;
  updatePagePosition: (pageId: string, x: number, y: number) => void;
  updateBlockPosition: (
    pageId: string,
    blockId: string,
    x: number,
    y: number,
  ) => void;
  updatePageDimensions: (pageId: string, width: number, height: number) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setDate: (date: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  clearCanvas: () => void;
  loadProjectById: (tenantId: string, recordId: string) => Promise<void>;
  createProject: (tenantId: string, name?: string) => Promise<string | null>;
  saveProject: (tenantId: string) => Promise<void>;
  updateBlockDimensions: (
    pageId: string,
    blockId: string,
    width: number,
    height: number,
  ) => void;
  duplicateBlock: (
    pageId: string,
    blockId: string,
    offsetX?: number,
    offsetY?: number,
  ) => void;
  transferBlockToPage: (
    blockId: string,
    sourcePageId: string,
    targetPageId: string,
    newX: number,
    newY: number,
  ) => void;
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
  title: "",
  description: "",
  date: "",
  zoom: 100,
  panX: 0,
  panY: 0,
  isSaving: false,
  showSaved: false,
  isLoading: false,

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
        (c) => !selected.includes(c.fromBlock) && !selected.includes(c.toBlock),
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
      const clonedPages = JSON.parse(
        JSON.stringify(state.pages),
      ) as PageWithSettings[];
      const newPast = [...state.past, clonedPages].slice(-50);
      return { past: newPast, future: [] };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      const clonedCurrent = JSON.parse(
        JSON.stringify(state.pages),
      ) as PageWithSettings[];
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
      const clonedCurrent = JSON.parse(
        JSON.stringify(state.pages),
      ) as PageWithSettings[];
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
      let title = "New Frame";
      let bgColor = "#ffffff";
      let initialBlocks: BlockContent[] = [];

      if (type === "kanban") {
        width = 1200;
        height = 800;
        title = "Kanban Board";
        bgColor = "#f4f4f5";
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: "text",
            value: "TO DO\n\n- Task 1",
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: "text",
            value: "IN PROGRESS\n\n- Task 2",
            x: 440,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: "text",
            value: "DONE\n\n- ",
            x: 840,
            y: 40,
            settings: {},
          },
        ];
      } else if (type === "notes") {
        width = 800;
        height = 1000;
        title = "Notes Workspace";
        bgColor = "#fffdf0";
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: "text",
            value: "# Meeting Notes\nDate:",
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: "checkbox",
            value: false,
            x: 40,
            y: 200,
            settings: {},
          },
        ];
      } else if (type === "agenda") {
        width = 1000;
        height = 600;
        title = "Agenda Timeline";
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: "date",
            value: "",
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: "text",
            value: "Phase 1: Kickoff",
            x: 350,
            y: 40,
            settings: {},
          },
        ];
      } else if (type === "database") {
        width = 1200;
        height = 800;
        title = "Structured Database";
        bgColor = "#f8fafc";
        initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: "form",
            value: "",
            x: 40,
            y: 40,
            settings: {},
          },
          {
            id: crypto.randomUUID(),
            type: "badge_selector",
            value: "",
            x: 350,
            y: 40,
            settings: { options: "Active, Pending, Closed" },
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
        (c) => c.fromPage !== pageId && c.toPage !== pageId,
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
          : p,
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
            { id: crypto.randomUUID(), type, value: "", x, y, settings: {} },
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
          : p,
      ),
      connections: state.connections.filter(
        (c) => c.fromBlock !== blockId && c.toBlock !== blockId,
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
                b.id === blockId ? { ...b, value } : b,
              ),
            }
          : p,
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
                  : b,
              ),
            }
          : p,
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

      const isMultiDrag =
        state.selectedBlocks.includes(blockId) &&
        state.selectedBlocks.length > 1;

      return {
        pages: state.pages.map((p) => {
          const hasBlocksToMove = p.blocks.some(
            (b) =>
              (p.id === pageId && b.id === blockId) ||
              (isMultiDrag && state.selectedBlocks.includes(b.id)),
          );

          if (!hasBlocksToMove) return p;

          return {
            ...p,
            blocks: p.blocks.map((b) => {
              const isTargetBlock = p.id === pageId && b.id === blockId;
              const isSelectedBlock =
                isMultiDrag && state.selectedBlocks.includes(b.id);

              if (isTargetBlock || isSelectedBlock) {
                return {
                  ...b,
                  x: b.x + dx,
                  y: b.y + dy,
                };
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
                b.id === blockId ? { ...b, width, height } : b,
              ),
            }
          : p,
      ),
    })),
  updatePageDimensions: (pageId, width, height) => {
    get().saveHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, width, height } : p,
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
      title: "",
      description: "",
      date: "",
      zoom: 100,
      panX: 0,
      panY: 0,
      activePageId: null,
      activeBlockId: null,
    }),

  loadProjectById: async (tenantId, recordId) => {
    set({ isLoading: true });
    try {
      const response = await fetchAPI(
        `/api/records/?tenant_id=${tenantId}&module_name=${WORKSPACE_MODULE}`,
      );
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      const record = data.find((r: { id: string }) => r.id === recordId);

      if (record?.record_data) {
        set({
          recordId: record.id,
          title: record.record_data.title || "",
          description: record.record_data.description || "",
          date: record.record_data.date || "",
          pages: record.record_data.pages || [],
          connections: record.record_data.connections || [],
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (tenantId, name = "New Project") => {
    try {
      const response = await fetchAPI(`/api/records/`, {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenantId,
          module_name: WORKSPACE_MODULE,
          record_data: { name, pages: [], connections: [] },
        }),
      });
      const data = await response.json();
      return data.id;
    } catch {
      return null;
    }
  },

  saveProject: async (tenantId) => {
    const { recordId, title, description, date, pages, connections } = get();
    if (!recordId) return;

    set({ isSaving: true, showSaved: false });

    try {
      await fetchAPI(`/api/records/${recordId}`, {
        method: "PATCH",
        body: JSON.stringify({
          record_data: { title, description, date, pages, connections },
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
          p.id === pageId ? { ...p, blocks: [...p.blocks, newBlock] } : p,
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
}));
