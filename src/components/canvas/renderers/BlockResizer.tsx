'use client';
import React from 'react';
import { startBlockResize } from './dragSession';

interface BlockResizerProps {
  pageId: string;
  blockId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HandleProps {
  dir: string;
  cursor: string;
  style: React.CSSProperties;
  onPointerDown: (e: React.PointerEvent, dir: string) => void;
}

const Handle = ({ dir, cursor, style, onPointerDown }: HandleProps) => (
  <div
    onPointerDown={(e) => onPointerDown(e, dir)}
    className="absolute w-[10px] h-[10px] bg-white border-[1.5px] border-indigo-500 rounded-sm pointer-events-auto shadow-sm hover:bg-indigo-50 hover:scale-[1.6] transition-transform z-50"
    style={{ ...style, cursor }}
  />
);

/**
 * Starts a store-free block-resize session. Pointermove/up are handled by
 * CanvasArea's global handlers via dragSession (same path as page resize).
 * Committing uses updateBlockGeometry so multi-select siblings do not drift.
 */
export default function BlockResizer({
  pageId,
  blockId,
  x,
  y,
  width,
  height,
}: BlockResizerProps) {
  const handlePointerDown = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();

    const el = document.querySelector(
      `[data-block-id="${blockId}"]`
    ) as HTMLElement | null;
    if (!el) return;

    startBlockResize({
      el,
      pageId,
      blockId,
      edge: dir,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startW: width,
      startH: height,
      startBlockX: x,
      startBlockY: y,
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 border-[1.5px] border-indigo-500/80 rounded-2xl pointer-events-none" />

      <Handle
        dir="nw"
        cursor="nwse-resize"
        style={{ top: -5, left: -5 }}
        onPointerDown={handlePointerDown}
      />
      <Handle
        dir="ne"
        cursor="nesw-resize"
        style={{ top: -5, right: -5 }}
        onPointerDown={handlePointerDown}
      />
      <Handle
        dir="sw"
        cursor="nesw-resize"
        style={{ bottom: -5, left: -5 }}
        onPointerDown={handlePointerDown}
      />
      <Handle
        dir="se"
        cursor="nwse-resize"
        style={{ bottom: -5, right: -5 }}
        onPointerDown={handlePointerDown}
      />

      <Handle
        dir="n"
        cursor="ns-resize"
        style={{ top: -5, left: '50%', marginLeft: -5 }}
        onPointerDown={handlePointerDown}
      />
      <Handle
        dir="s"
        cursor="ns-resize"
        style={{ bottom: -5, left: '50%', marginLeft: -5 }}
        onPointerDown={handlePointerDown}
      />
      <Handle
        dir="e"
        cursor="ew-resize"
        style={{ top: '50%', right: -5, marginTop: -5 }}
        onPointerDown={handlePointerDown}
      />
      <Handle
        dir="w"
        cursor="ew-resize"
        style={{ top: '50%', left: -5, marginTop: -5 }}
        onPointerDown={handlePointerDown}
      />
    </div>
  );
}
