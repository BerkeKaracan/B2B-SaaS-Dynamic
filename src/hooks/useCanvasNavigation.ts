import { useEffect, useRef, RefObject, useCallback, useState } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";

const MIN_ZOOM = 10;
const MAX_ZOOM = 400;

/** Multiplicative sensitivity — trackpads feel closer to Figma/Miro. */
const ZOOM_SENSITIVITY = 0.0018;

export type CanvasNavigationOptions = {
  /** World layer that receives translate3d + scale (GPU-composited). */
  transformRef?: RefObject<HTMLDivElement | null>;
  /** Infinite-grid background layer (size/position follow pan + zoom). */
  gridRef?: RefObject<HTMLDivElement | null>;
};

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function applyDomTransform(
  transformEl: HTMLDivElement | null | undefined,
  gridEl: HTMLDivElement | null | undefined,
  panX: number,
  panY: number,
  zoom: number,
) {
  if (transformEl) {
    transformEl.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom / 100})`;
  }
  if (gridEl) {
    const cell = 40 * (zoom / 100);
    gridEl.style.backgroundSize = `${cell}px ${cell}px`;
    gridEl.style.backgroundPosition = `${panX}px ${panY}px`;
  }
}

/**
 * Cursor-centric pan/zoom with rAF coalescing.
 * Does not touch Yjs, block math, or store architecture beyond setZoom/setPan.
 */
export function useCanvasNavigation(
  containerRef: RefObject<HTMLDivElement | null>,
  options: CanvasNavigationOptions = {},
) {
  const { transformRef, gridRef } = options;
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);

  const [isPanning, setIsPanning] = useState(false);
  const panOriginRef = useRef({ x: 0, y: 0 });

  const wheelRafRef = useRef<number | null>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingWheelRef = useRef<{
    deltaX: number;
    deltaY: number;
    clientX: number;
    clientY: number;
    zooming: boolean;
  } | null>(null);
  const pendingPanClientRef = useRef<{ x: number; y: number } | null>(null);

  const syncViewport = useCallback(
    (panX: number, panY: number, zoom: number) => {
      applyDomTransform(
        transformRef?.current,
        gridRef?.current,
        panX,
        panY,
        zoom,
      );
      setPan(panX, panY);
      setZoom(zoom);
    },
    [transformRef, gridRef, setPan, setZoom],
  );

  // --- Wheel: cursor-centric zoom + trackpad pan, batched to one frame ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const flushWheel = () => {
      wheelRafRef.current = null;
      const pending = pendingWheelRef.current;
      pendingWheelRef.current = null;
      if (!pending) return;

      const state = useCanvasStore.getState();
      const oldZoom = state.zoom ?? 100;
      const oldPanX = state.panX ?? 0;
      const oldPanY = state.panY ?? 0;

      if (pending.zooming) {
        const rect = container.getBoundingClientRect();
        const cursorX = pending.clientX - rect.left;
        const cursorY = pending.clientY - rect.top;

        const zoomFactor = Math.exp(-pending.deltaY * ZOOM_SENSITIVITY);
        const newZoom = clampZoom(oldZoom * zoomFactor);
        if (newZoom === oldZoom) return;

        const scale = oldZoom / 100;
        const nextScale = newZoom / 100;

        // Keep the world point under the cursor fixed across the zoom change.
        const newPanX = cursorX - ((cursorX - oldPanX) / scale) * nextScale;
        const newPanY = cursorY - ((cursorY - oldPanY) / scale) * nextScale;

        syncViewport(newPanX, newPanY, newZoom);
      } else {
        const nextPanX = oldPanX - pending.deltaX;
        const nextPanY = oldPanY - pending.deltaY;
        applyDomTransform(
          transformRef?.current,
          gridRef?.current,
          nextPanX,
          nextPanY,
          oldZoom,
        );
        setPan(nextPanX, nextPanY);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Pinch-to-zoom on trackpads fires ctrlKey; also allow meta/cmd.
      const zooming = e.ctrlKey || e.metaKey;
      e.preventDefault();

      const existing = pendingWheelRef.current;
      if (existing && existing.zooming === zooming) {
        existing.deltaX += e.deltaX;
        existing.deltaY += e.deltaY;
        existing.clientX = e.clientX;
        existing.clientY = e.clientY;
      } else {
        pendingWheelRef.current = {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          clientX: e.clientX,
          clientY: e.clientY,
          zooming,
        };
      }

      if (wheelRafRef.current == null) {
        wheelRafRef.current = requestAnimationFrame(flushWheel);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelRafRef.current != null) {
        cancelAnimationFrame(wheelRafRef.current);
        wheelRafRef.current = null;
      }
    };
  }, [containerRef, syncViewport, transformRef, gridRef, setPan]);

  // --- Pointer pan (middle-click / startPan), rAF-coalesced ---
  useEffect(() => {
    if (!isPanning) return;

    const flushPan = () => {
      panRafRef.current = null;
      const point = pendingPanClientRef.current;
      if (!point) return;

      const nextPanX = point.x - panOriginRef.current.x;
      const nextPanY = point.y - panOriginRef.current.y;
      const zoom = useCanvasStore.getState().zoom ?? 100;

      applyDomTransform(
        transformRef?.current,
        gridRef?.current,
        nextPanX,
        nextPanY,
        zoom,
      );
      setPan(nextPanX, nextPanY);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      pendingPanClientRef.current = { x: e.clientX, y: e.clientY };
      if (panRafRef.current == null) {
        panRafRef.current = requestAnimationFrame(flushPan);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      pendingPanClientRef.current = null;
      if (panRafRef.current != null) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      if (panRafRef.current != null) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
    };
  }, [isPanning, setPan, transformRef, gridRef]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    const { panX, panY } = useCanvasStore.getState();
    panOriginRef.current = {
      x: clientX - (panX ?? 0),
      y: clientY - (panY ?? 0),
    };
    setIsPanning(true);
  }, []);

  return { startPan, isPanning, syncViewport };
}
