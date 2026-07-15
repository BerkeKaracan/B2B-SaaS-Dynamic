import { beforeEach, describe, expect, it } from 'vitest';
import { useLayoutStore } from '@/store/useLayoutStore';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      isPrimarySidebarOpen: false,
      isSecondarySidebarOpen: false,
      showEngineToolkit: false,
    });
  });

  it('toggles the primary sidebar', () => {
    expect(useLayoutStore.getState().isPrimarySidebarOpen).toBe(false);
    useLayoutStore.getState().togglePrimarySidebar();
    expect(useLayoutStore.getState().isPrimarySidebarOpen).toBe(true);
    useLayoutStore.getState().togglePrimarySidebar();
    expect(useLayoutStore.getState().isPrimarySidebarOpen).toBe(false);
  });

  it('toggles the secondary sidebar', () => {
    useLayoutStore.getState().toggleSecondarySidebar();
    expect(useLayoutStore.getState().isSecondarySidebarOpen).toBe(true);
  });

  it('sets engine toolkit visibility', () => {
    useLayoutStore.getState().setShowEngineToolkit(true);
    expect(useLayoutStore.getState().showEngineToolkit).toBe(true);
    useLayoutStore.getState().setShowEngineToolkit(false);
    expect(useLayoutStore.getState().showEngineToolkit).toBe(false);
  });
});
