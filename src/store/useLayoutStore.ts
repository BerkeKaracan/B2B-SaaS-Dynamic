import { create } from 'zustand';

interface LayoutState {
  isPrimarySidebarOpen: boolean;
  showEngineToolkit: boolean;
  togglePrimarySidebar: () => void;
  setShowEngineToolkit: (show: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isPrimarySidebarOpen: false,
  showEngineToolkit: false,

  togglePrimarySidebar: () =>
    set((state) => ({ isPrimarySidebarOpen: !state.isPrimarySidebarOpen })),

  setShowEngineToolkit: (show) => set({ showEngineToolkit: show }),
}));
