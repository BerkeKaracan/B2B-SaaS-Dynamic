import { create } from 'zustand';
import { BlockContent, BlockType } from '@/types/record';

interface CanvasState {
  blocks: BlockContent[];
  activeBlockId: string | null;
  addBlock: (type: BlockType) => void;
  removeBlock: (id: string) => void;
  setActiveBlock: (id: string | null) => void;
  updateBlockValue: (id: string, value: unknown) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  blocks: [],
  activeBlockId: null,

  addBlock: (type) => set((state) => ({
    blocks: [
      ...state.blocks,
      {
        id: crypto.randomUUID(),
        type,
        value: type === 'text' ? 'New text block' : '',
        settings: {}
      }
    ]
  })),

  removeBlock: (id) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== id)
  })),

  setActiveBlock: (id) => set({ activeBlockId: id }),

  updateBlockValue: (id, value) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, value } : b)
  })),
}));