import { create } from "zustand";

interface LayoutState {
  isPrimarySidebarOpen: boolean;
  isSecondarySidebarOpen: boolean;
  togglePrimarySidebar: () => void;
  toggleSecondarySidebar: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isPrimarySidebarOpen: true,
  isSecondarySidebarOpen: false,
  togglePrimarySidebar: () =>
    set((state) => ({ isPrimarySidebarOpen: !state.isPrimarySidebarOpen })),

  toggleSecondarySidebar: () =>
    set((state) => ({ isSecondarySidebarOpen: !state.isSecondarySidebarOpen })),
}));
