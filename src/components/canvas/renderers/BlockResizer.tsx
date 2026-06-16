"use client";
import React, { useRef } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";

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
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

const Handle = ({
  dir,
  cursor,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: HandleProps) => (
  <div
    onPointerDown={(e) => onPointerDown(e, dir)}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
    className="absolute w-[10px] h-[10px] bg-white border-[1.5px] border-indigo-500 rounded-sm pointer-events-auto shadow-sm hover:bg-indigo-50 hover:scale-[1.6] transition-transform z-50"
    style={{ ...style, cursor }}
  />
);

export default function BlockResizer({
  pageId,
  blockId,
  x,
  y,
  width,
  height,
}: BlockResizerProps) {
  const updateBlockDimensions = useCanvasStore((s) => s.updateBlockDimensions);
  const updateBlockPosition = useCanvasStore((s) => s.updateBlockPosition);
  const saveHistory = useCanvasStore((s) => s.saveHistory);
  const zoom = useCanvasStore((s) => s.zoom) || 100;

  const isResizing = useRef(false);
  const resizeData = useRef({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    startBlockX: 0,
    startBlockY: 0,
    direction: "",
  });

  const handlePointerDown = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    isResizing.current = true;
    resizeData.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: width,
      startH: height,
      startBlockX: x,
      startBlockY: y,
      direction: dir,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isResizing.current) return;
    e.stopPropagation();

    const {
      startX,
      startY,
      startW,
      startH,
      startBlockX,
      startBlockY,
      direction,
    } = resizeData.current;

    const scale = zoom / 100;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;

    let newW = startW;
    let newH = startH;
    let newX = startBlockX;
    let newY = startBlockY;

    if (direction.includes("e")) {
      newW = Math.max(120, startW + dx);
    } else if (direction.includes("w")) {
      newW = Math.max(120, startW - dx);
      if (newW > 120) newX = startBlockX + dx;
    }

    if (direction.includes("s")) {
      newH = Math.max(60, startH + dy);
    } else if (direction.includes("n")) {
      newH = Math.max(60, startH - dy);
      if (newH > 60) newY = startBlockY + dy;
    }

    if (updateBlockDimensions)
      updateBlockDimensions(pageId, blockId, newW, newH);
    if (updateBlockPosition && (newX !== startBlockX || newY !== startBlockY)) {
      updateBlockPosition(pageId, blockId, newX, newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isResizing.current) return;
    isResizing.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (saveHistory) saveHistory();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 border-[1.5px] border-indigo-500/80 rounded-2xl pointer-events-none" />

      <Handle
        dir="nw"
        cursor="nwse-resize"
        style={{ top: -5, left: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <Handle
        dir="ne"
        cursor="nesw-resize"
        style={{ top: -5, right: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <Handle
        dir="sw"
        cursor="nesw-resize"
        style={{ bottom: -5, left: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <Handle
        dir="se"
        cursor="nwse-resize"
        style={{ bottom: -5, right: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      <Handle
        dir="n"
        cursor="ns-resize"
        style={{ top: -5, left: "50%", marginLeft: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <Handle
        dir="s"
        cursor="ns-resize"
        style={{ bottom: -5, left: "50%", marginLeft: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <Handle
        dir="e"
        cursor="ew-resize"
        style={{ top: "50%", right: -5, marginTop: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <Handle
        dir="w"
        cursor="ew-resize"
        style={{ top: "50%", left: -5, marginTop: -5 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
