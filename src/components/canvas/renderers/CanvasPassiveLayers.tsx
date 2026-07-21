'use client';

import React, { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  getConnectionMidpoint,
  subscribeConnectionMidpoints,
} from './connectionMidpoints';
import { getLiveOffsets, subscribeDragSession } from './dragSession';

/**
 * Passive paint layers: the infinite grid and the connection curves drawn on
 * screen-space <canvas> elements outside React's render loop. Pan/zoom and
 * store changes trigger a redraw via store subscription — zero component
 * re-renders per frame.
 *
 * Two canvases because of stacking: the grid sits under the world transform,
 * the connection curves paint above it (z-45, like the old SVG layer).
 * Interaction (hover highlight, midpoint drag handle, delete button) stays
 * in the thin SVG layer inside the world transform (ConnectionLayer).
 */

const GRID_CELL = 40;
const GRID_LIGHT = 'rgba(228, 228, 231, 1)';
const GRID_DARK = 'rgba(228, 228, 231, 0.2)';
const CONNECTION_COLOR = '#818CF8';

type CanvasPages = ReturnType<typeof useCanvasStore.getState>['pages'];

function blockCenterWorld(
  pages: CanvasPages,
  pageId: string,
  blockId: string
): { x: number; y: number } | null {
  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;
  const block = page.blocks.find((b) => b.id === blockId);
  if (!block) return null;

  // During store-free drag, liveOffsets carry the visual translate3d delta
  // so connection curves follow the GPU-moved element without a store write.
  const offsets = getLiveOffsets();
  const pageOff = offsets.get(pageId) || { dx: 0, dy: 0 };
  const blockOff = offsets.get(blockId) || { dx: 0, dy: 0 };

  return {
    x:
      (page.x ?? 150) +
      pageOff.dx +
      (block.x ?? 20) +
      blockOff.dx +
      (block.width ?? 320) / 2,
    y:
      (page.y ?? 150) +
      pageOff.dy +
      (block.y ?? 20) +
      blockOff.dy +
      (block.height ?? 120) / 2,
  };
}

export function CanvasPassiveLayers() {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const connCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const connCanvas = connCanvasRef.current;
    if (!gridCanvas || !connCanvas) return;
    const gridCtx = gridCanvas.getContext('2d');
    const connCtx = connCanvas.getContext('2d');
    if (!gridCtx || !connCtx) return;

    let raf: number | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');

    const draw = () => {
      raf = null;
      if (width <= 0 || height <= 0) return;

      const state = useCanvasStore.getState();
      const panX = state.panX ?? 0;
      const panY = state.panY ?? 0;
      const scale = (state.zoom ?? 100) / 100 || 1;

      // --- Grid ---
      gridCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gridCtx.clearRect(0, 0, width, height);
      const cell = GRID_CELL * scale;
      if (cell >= 4) {
        gridCtx.strokeStyle = isDark ? GRID_DARK : GRID_LIGHT;
        gridCtx.lineWidth = 1;
        gridCtx.beginPath();
        const startX = ((panX % cell) + cell) % cell;
        for (let x = startX; x <= width; x += cell) {
          gridCtx.moveTo(x, 0);
          gridCtx.lineTo(x, height);
        }
        const startY = ((panY % cell) + cell) % cell;
        for (let y = startY; y <= height; y += cell) {
          gridCtx.moveTo(0, y);
          gridCtx.lineTo(width, y);
        }
        gridCtx.stroke();
      }

      // --- Connection curves (world -> screen: s = w * scale + pan) ---
      connCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      connCtx.clearRect(0, 0, width, height);

      const { pages, connections } = state;
      if (connections.length === 0) return;

      connCtx.strokeStyle = CONNECTION_COLOR;
      connCtx.fillStyle = CONNECTION_COLOR;
      connCtx.lineWidth = 2.5 * scale;
      connCtx.globalAlpha = 0.8;

      connections.forEach((conn) => {
        const from = blockCenterWorld(pages, conn.fromPage, conn.fromBlock);
        const to = blockCenterWorld(pages, conn.toPage, conn.toBlock);
        if (!from || !to) return;

        const mid = getConnectionMidpoint(conn.id) || {
          x: (from.x + to.x) / 2,
          y: (from.y + to.y) / 2,
        };
        // Same control-point math as the SVG interaction layer.
        const cwx = 2 * mid.x - 0.5 * from.x - 0.5 * to.x;
        const cwy = 2 * mid.y - 0.5 * from.y - 0.5 * to.y;

        const fx = from.x * scale + panX;
        const fy = from.y * scale + panY;
        const tx = to.x * scale + panX;
        const ty = to.y * scale + panY;
        const cx = cwx * scale + panX;
        const cy = cwy * scale + panY;

        // Rough screen-space cull.
        const minX = Math.min(fx, tx, cx);
        const maxX = Math.max(fx, tx, cx);
        const minY = Math.min(fy, ty, cy);
        const maxY = Math.max(fy, ty, cy);
        if (maxX < 0 || minX > width || maxY < 0 || minY > height) return;

        connCtx.beginPath();
        connCtx.moveTo(fx, fy);
        connCtx.quadraticCurveTo(cx, cy, tx, ty);
        connCtx.stroke();

        // Arrowhead along the tangent at the end of the curve.
        const dxT = tx - cx;
        const dyT = ty - cy;
        const len = Math.hypot(dxT, dyT) || 1;
        const ux = dxT / len;
        const uy = dyT / len;
        const size = 8 * scale;
        connCtx.beginPath();
        connCtx.moveTo(tx, ty);
        connCtx.lineTo(
          tx - ux * size - uy * (size / 2),
          ty - uy * size + ux * (size / 2)
        );
        connCtx.lineTo(
          tx - ux * size + uy * (size / 2),
          ty - uy * size - ux * (size / 2)
        );
        connCtx.closePath();
        connCtx.fill();
      });

      connCtx.globalAlpha = 1;
    };

    const scheduleDraw = () => {
      if (raf == null) raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      const parent = gridCanvas.parentElement;
      if (!parent) return;
      dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      for (const canvas of [gridCanvas, connCanvas]) {
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      scheduleDraw();
    };

    const ro = new ResizeObserver(resize);
    if (gridCanvas.parentElement) ro.observe(gridCanvas.parentElement);
    resize();

    // Pan/zoom writers are already rAF-coalesced (one store write per frame),
    // so drawing synchronously here keeps grid/connections in lockstep with
    // the world transform (an extra rAF hop made them lag one frame).
    const unsubscribeStore = useCanvasStore.subscribe((state, prev) => {
      if (
        state.panX !== prev.panX ||
        state.panY !== prev.panY ||
        state.zoom !== prev.zoom ||
        state.pages !== prev.pages ||
        state.connections !== prev.connections
      ) {
        if (raf != null) {
          cancelAnimationFrame(raf);
          raf = null;
        }
        draw();
      }
    });

    const unsubscribeMidpoints = subscribeConnectionMidpoints(scheduleDraw);
    const unsubscribeDrag = subscribeDragSession(scheduleDraw);

    // Grid color follows the `dark` class on <html>.
    const mo = new MutationObserver(() => {
      const nextDark = document.documentElement.classList.contains('dark');
      if (nextDark !== isDark) {
        isDark = nextDark;
        scheduleDraw();
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      ro.disconnect();
      unsubscribeStore();
      unsubscribeMidpoints();
      unsubscribeDrag();
      mo.disconnect();
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <canvas
        ref={gridCanvasRef}
        className="canvas-bg absolute inset-0 pointer-events-none"
        aria-hidden
      />
      {/* Above the world transform, like the old in-world SVG at z-45. */}
      <canvas
        ref={connCanvasRef}
        className="absolute inset-0 pointer-events-none z-[45]"
        aria-hidden
      />
    </>
  );
}
