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
  addConnection: (conn: Connection) => void;
  removeConnection: (connId: string) => void;

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
}

let saveTimeout: NodeJS.Timeout;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  recordId: null,
  pages: [],
  past: [],
  future: [],
  connections: [],
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
      };
    }),

  addPage: (type, x, y) => {
    get().saveHistory();
    set((state) => {
      const pageId = crypto.randomUUID();
      const newPage: PageWithSettings = {
        id: pageId,
        type,
        title: "New Frame",
        x,
        y,
        width: 800,
        height: 1131,
        blocks: [],
        settings: { backgroundColor: "#ffffff" },
      };
      return { pages: [...state.pages, newPage], activePageId: pageId };
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
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === blockId ? { ...b, x, y } : b,
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
      saveTimeout = setTimeout(() => set({ showSaved: false }), 1600);
    } catch (e) {
      console.error(e);
    } finally {
      set({ isSaving: false });
    }
  },
}));
