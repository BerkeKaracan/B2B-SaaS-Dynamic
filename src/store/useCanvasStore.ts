import { create } from "zustand";
import { BlockContent, BlockType } from "@/types/record";
import { WORKSPACE_MODULE } from "@/lib/workspace";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface CanvasState {
  recordId: string | null;
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
  loadProjectById: (tenantId: string, recordId: string) => Promise<void>;
  createProject: (tenantId: string, name?: string) => Promise<string | null>;
  saveProject: (tenantId: string) => Promise<void>;
}

let saveTimeout: NodeJS.Timeout;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  recordId: null,
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

  clearCanvas: () =>
    set({
      recordId: null,
      blocks: [],
      title: "",
      description: "",
      date: "",
      activeBlockId: null,
    }),

  loadProjectById: async (tenantId, recordId) => {
    const apiUrl = getApiUrl();
    set({ isLoading: true });

    try {
      const response = await fetch(
        `${apiUrl}/api/records/?tenant_id=${tenantId}&module_name=${WORKSPACE_MODULE}`,
        { headers: authHeaders() },
      );
      if (!response.ok) throw new Error("Fetching error");

      const data = await response.json();
      const record = data.find((r: { id: string }) => r.id === recordId);

      if (record?.record_data) {
        const rd = record.record_data;
        set({
          recordId: record.id,
          title: (rd.title as string) || (rd.name as string) || "",
          description: (rd.description as string) || "",
          date: (rd.date as string) || "",
          blocks: (rd.blocks as BlockContent[]) || [],
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

  createProject: async (tenantId, name = "New Project") => {
    const apiUrl = getApiUrl();

    const payload = {
      tenant_id: tenantId,
      module_name: WORKSPACE_MODULE,
      record_data: {
        name,
        title: name,
        description: "",
        date: "",
        blocks: [],
      },
    };

    try {
      const response = await fetch(`${apiUrl}/api/records/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Create failed");

      const data = await response.json();
      return data.id as string;
    } catch (error) {
      console.error("Create project error:", error);
      return null;
    }
  },

  saveProject: async (tenantId) => {
    const state = get();
    const apiUrl = getApiUrl();

    if (!state.recordId) return;

    set({ isSaving: true, showSaved: false });

    const recordData = {
      name: state.title || "Untitled Project",
      title: state.title,
      description: state.description,
      date: state.date,
      blocks: state.blocks,
    };

    try {
      const response = await fetch(`${apiUrl}/api/records/${state.recordId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ record_data: recordData }),
      });

      if (!response.ok) throw new Error("Save failed");

      set({ showSaved: true });
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => set({ showSaved: false }), 2500);
    } catch (error) {
      console.error("Auto-Save Error:", error);
    } finally {
      set({ isSaving: false });
    }
  },
}));
