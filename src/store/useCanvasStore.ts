import { create } from "zustand";
import { BlockContent, BlockType } from "@/types/record";

interface CanvasState {
  blocks: BlockContent[];
  activeBlockId: string | null;
  title: string;
  description: string;
  date: string;

  isSaving: boolean;
  showSaved: boolean;
  isLoading: boolean;

  addBlock: (type: BlockType) => void;
  removeBlock: (id: string) => void;
  setActiveBlock: (id: string | null) => void;
  updateBlockValue: (id: string, value: unknown) => void;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  setDate: (date: string) => void;
  updateBlockSettings: (id: string, settings: Record<string, unknown>) => void;

  clearCanvas: () => void;

  saveProject: (tenantId: string, moduleName: string) => Promise<void>;
  loadProject: (tenantId: string, moduleName: string) => Promise<void>;
}

let saveTimeout: NodeJS.Timeout;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  blocks: [],
  activeBlockId: null,
  title: "",
  description: "",
  date: "",
  isSaving: false,
  showSaved: false,
  isLoading: false,

  addBlock: (type) =>
    set((state) => ({
      blocks: [
        ...state.blocks,
        {
          id: crypto.randomUUID(),
          type,
          value: type === "text" ? "New text block" : "",
          settings: {},
        },
      ],
    })),

  removeBlock: (id) =>
    set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) })),
  setActiveBlock: (id) => set({ activeBlockId: id }),
  updateBlockValue: (id, value) =>
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, value } : b)),
    })),
  updateBlockSettings: (id, settings) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, settings: { ...b.settings, ...settings } } : b,
      ),
    })),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setDate: (date) => set({ date }),

  clearCanvas: () => set({ blocks: [], title: "", description: "", date: "" }),

  saveProject: async (tenantId, moduleName) => {
    const state = get();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    set({ isSaving: true, showSaved: false });

    const payload = {
      tenant_id: tenantId,
      module_name: moduleName,
      record_data: {
        title: state.title,
        description: state.description,
        date: state.date,
        blocks: state.blocks,
      },
    };

    try {
      await fetch(`${apiUrl}/api/records/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      set({ showSaved: true });
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => set({ showSaved: false }), 2500);
    } catch (error) {
      console.error("Auto-Save Error:", error);
    } finally {
      set({ isSaving: false });
    }
  },

  loadProject: async (tenantId, moduleName) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    set({ isLoading: true });

    try {
      const response = await fetch(
        `${apiUrl}/api/records/?tenant_id=${tenantId}&module_name=${moduleName}`,
      );
      if (!response.ok) throw new Error("Fetching error");

      const data = await response.json();
      if (data && data.length > 0) {
        const latestRecord = data[data.length - 1].record_data;
        set({
          title: latestRecord.title || "",
          description: latestRecord.description || "",
          date: latestRecord.date || "",
          blocks: latestRecord.blocks || [],
        });
      } else {
        get().clearCanvas();
      }
    } catch (error) {
      console.error("Loading data error:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
