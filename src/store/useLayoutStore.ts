import { create } from "zustand";

interface LayoutState {
  isPrimarySidebarOpen: boolean;
  isSecondarySidebarOpen: boolean;
  showEngineToolkit: boolean;
  togglePrimarySidebar: () => void;
  toggleSecondarySidebar: () => void;
  setShowEngineToolkit: (show: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isPrimarySidebarOpen: true,
  isSecondarySidebarOpen: false,
  showEngineToolkit: true,

  togglePrimarySidebar: () =>
    set((state) => ({ isPrimarySidebarOpen: !state.isPrimarySidebarOpen })),

  toggleSecondarySidebar: () =>
    set((state) => ({ isSecondarySidebarOpen: !state.isSecondarySidebarOpen })),

  setShowEngineToolkit: (show) => set({ showEngineToolkit: show }),
}));
