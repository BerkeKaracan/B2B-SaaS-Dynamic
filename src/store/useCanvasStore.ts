import { create } from "zustand";
import { BlockContent, BlockType, PageContent } from "@/types/record";
import { WORKSPACE_MODULE } from "@/lib/workspace";
import { fetchAPI } from "@/services/api";

interface CanvasState {
  recordId: string | null;
  pages: PageContent[];
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
  addPage: (type: PageContent["type"], x: number, y: number) => void;
  removePage: (pageId: string) => void;
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
  setDescription: (desc: string) => void;
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

  addPage: (type, x, y) =>
    set((state) => {
      const newPage: PageContent = {
        id: crypto.randomUUID(),
        type,
        title: "Untitled Frame",
        x,
        y,
        width: 800,
        height: 1131,
        blocks: [],
      };
      return { pages: [...state.pages, newPage], activePageId: newPage.id };
    }),

  removePage: (pageId) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== pageId),
      activePageId: state.activePageId === pageId ? null : state.activePageId,
    })),

  addBlockToPage: (pageId, type, x, y) =>
    set((state) => ({
      pages: state.pages.map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          blocks: [
            ...p.blocks,
            {
              id: crypto.randomUUID(),
              type,
              value:
                type === "text"
                  ? "New block"
                  : type === "checkbox"
                    ? false
                    : "",
              x,
              y,
              settings: {},
            } as BlockContent,
          ],
        };
      }),
    })),

  removeBlockFromPage: (pageId, blockId) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }
          : p,
      ),
    })),

  setActivePage: (id) => set({ activePageId: id, activeBlockId: null }),
  setActiveBlock: (id) => set({ activeBlockId: id }),

  updateBlockValue: (pageId, blockId, value) =>
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
    })),

  updateBlockSettings: (pageId, blockId, settings) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === blockId
                  ? { ...b, settings: { ...b.settings, ...settings } }
                  : b,
              ),
            }
          : p,
      ),
    })),

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

  updatePageDimensions: (pageId, width, height) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, width, height } : p,
      ),
    })),

  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setDate: (date) => set({ date }),
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 10), 400) }),
  setPan: (panX, panY) => set({ panX, panY }),

  clearCanvas: () =>
    set({
      recordId: null,
      pages: [],
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
      if (!response.ok) throw new Error("Fetching error");

      const data = await response.json();
      const record = data.find((r: { id: string }) => r.id === recordId);

      if (record?.record_data) {
        const rd = record.record_data;
        let loadedPages = (rd.pages as PageContent[]) || [];

        if (
          loadedPages.length === 0 &&
          rd.blocks &&
          (rd.blocks as BlockContent[]).length > 0
        ) {
          loadedPages = [
            {
              id: crypto.randomUUID(),
              type: "empty",
              title: "Recovered Workspace",
              x: 100,
              y: 100,
              width: 800,
              height: 1131,
              blocks: rd.blocks as BlockContent[],
            },
          ];
        }

        set({
          recordId: record.id,
          title: (rd.title as string) || (rd.name as string) || "",
          description: (rd.description as string) || "",
          date: (rd.date as string) || "",
          pages: loadedPages,
        });
      } else {
        get().clearCanvas();
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (tenantId, name = "New Project") => {
    const payload = {
      tenant_id: tenantId,
      module_name: WORKSPACE_MODULE,
      record_data: {
        name,
        title: name,
        description: "",
        date: "",
        pages: [],
      },
    };

    try {
      const response = await fetchAPI(`/api/records/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Create failed");

      const data = await response.json();
      return data.id as string;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  saveProject: async (tenantId) => {
    const state = get();
    if (!state.recordId) return;

    set({ isSaving: true, showSaved: false });

    const recordData = {
      name: state.title || "Untitled Project",
      title: state.title,
      description: state.description,
      date: state.date,
      pages: state.pages,
    };

    try {
      const response = await fetchAPI(`/api/records/${state.recordId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: recordData }),
      });
      if (!response.ok) throw new Error("Save failed");

      set({ showSaved: true });
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => set({ showSaved: false }), 2500);
    } catch (error) {
      console.error(error);
    } finally {
      set({ isSaving: false });
    }
  },
}));
