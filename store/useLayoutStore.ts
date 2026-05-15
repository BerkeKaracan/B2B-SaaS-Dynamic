import { create } from "zustand";

/**
 * Global layout state management store.
 * Handles the visibility toggles for the primary sidebar and the top information area.
 * Designed to avoid prop-drilling across disconnected layout components.
 */
interface LayoutState {
  isPrimarySidebarOpen: boolean;
  isInfoAreaOpen: boolean;
  togglePrimarySidebar: () => void;
  toggleInfoArea: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isPrimarySidebarOpen: true,
  isInfoAreaOpen: true,
  togglePrimarySidebar: () =>
    set((state) => ({ isPrimarySidebarOpen: !state.isPrimarySidebarOpen })),
  toggleInfoArea: () =>
    set((state) => ({ isInfoAreaOpen: !state.isInfoAreaOpen })),
}));
