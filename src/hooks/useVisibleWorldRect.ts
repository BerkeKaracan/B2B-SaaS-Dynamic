import { RefObject, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';

/** Axis-aligned rect in world (canvas) coordinates. */
export type WorldRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/**
 * Quantization grid (world px). The rect only changes when the expanded
 * viewport crosses a grid line, so its reference stays stable during small
 * pans — `renderedPages` useMemo and the CanvasWorld memo are not thrashed.
 */
const QUANT = 256;

/** Overscan: render one extra viewport on each side (hysteresis for pans). */
const OVERSCAN = 1;

export function rectsIntersect(
  a: WorldRect,
  bLeft: number,
  bTop: number,
  bRight: number,
  bBottom: number
): boolean {
  return (
    bLeft < a.right && bRight > a.left && bTop < a.bottom && bBottom > a.top
  );
}

/**
 * Visible world rect for viewport culling (Figma-style: keep offscreen
 * objects in the store, skip them in the render loop).
 *
 * Subscribes to pan/zoom in useCanvasStore and to container resizes.
 * Returns null until the container is measured (callers should render
 * everything in that case).
 */
export function useVisibleWorldRect(
  containerRef: RefObject<HTMLDivElement | null>
): WorldRect | null {
  const [rect, setRect] = useState<WorldRect | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastKeyRef = useRef('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const state = useCanvasStore.getState();
      const panX = state.panX ?? 0;
      const panY = state.panY ?? 0;
      const scale = (state.zoom ?? 100) / 100 || 1;
      const { w, h } = sizeRef.current;
      if (w <= 0 || h <= 0) return;

      // Screen (0,0)-(w,h) mapped into world coordinates
      const worldLeft = -panX / scale;
      const worldTop = -panY / scale;
      const worldW = w / scale;
      const worldH = h / scale;

      const exLeft = worldLeft - worldW * OVERSCAN;
      const exTop = worldTop - worldH * OVERSCAN;
      const exRight = worldLeft + worldW * (1 + OVERSCAN);
      const exBottom = worldTop + worldH * (1 + OVERSCAN);

      // Quantize outward so the rect never shrinks below the true viewport
      const qLeft = Math.floor(exLeft / QUANT) * QUANT;
      const qTop = Math.floor(exTop / QUANT) * QUANT;
      const qRight = Math.ceil(exRight / QUANT) * QUANT;
      const qBottom = Math.ceil(exBottom / QUANT) * QUANT;

      const key = `${qLeft}|${qTop}|${qRight}|${qBottom}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;
      setRect({ left: qLeft, top: qTop, right: qRight, bottom: qBottom });
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      sizeRef.current = {
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      };
      compute();
    });
    ro.observe(el);

    const unsubscribe = useCanvasStore.subscribe((state, prev) => {
      if (
        state.panX !== prev.panX ||
        state.panY !== prev.panY ||
        state.zoom !== prev.zoom
      ) {
        compute();
      }
    });

    sizeRef.current = { w: el.clientWidth, h: el.clientHeight };
    compute();

    return () => {
      ro.disconnect();
      unsubscribe();
    };
  }, [containerRef]);

  return rect;
}
