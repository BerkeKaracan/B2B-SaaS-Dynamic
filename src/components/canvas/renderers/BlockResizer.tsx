"use client";
import React from "react";
import { useCanvasStore } from "@/store/useCanvasStore";

interface BlockResizerProps {
  pageId: string;
  blockId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function BlockResizer({
  pageId,
  blockId,
  x,
  y,
  width,
  height,
}: BlockResizerProps) {
  const { updateBlockPosition, updateBlockDimensions, zoom, saveHistory } =
    useCanvasStore();

  const handlePointerDown = (e: React.PointerEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;
    const startBlockX = x;
    const startBlockY = y;
    const currentZoom = (zoom ?? 100) / 100;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / currentZoom;
      const dy = (moveEvent.clientY - startY) / currentZoom;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startBlockX;
      let newY = startBlockY;

      if (corner.includes("e")) newWidth = startWidth + dx;
      if (corner.includes("s")) newHeight = startHeight + dy;
      if (corner.includes("w")) {
        newWidth = startWidth - dx;
        newX = startBlockX + dx;
      }
      if (corner.includes("n")) {
        newHeight = startHeight - dy;
        newY = startBlockY + dy;
      }

      const MIN_WIDTH = 240;
      const MIN_HEIGHT = 80;

      if (newWidth < MIN_WIDTH) {
        if (corner.includes("w")) newX = startBlockX + (startWidth - MIN_WIDTH);
        newWidth = MIN_WIDTH;
      }
      if (newHeight < MIN_HEIGHT) {
        if (corner.includes("n"))
          newY = startBlockY + (startHeight - MIN_HEIGHT);
        newHeight = MIN_HEIGHT;
      }

      updateBlockDimensions(pageId, blockId, newWidth, newHeight);
      if (corner.includes("w") || corner.includes("n")) {
        updateBlockPosition(pageId, blockId, newX, newY);
      }
    };

    const onPointerUp = () => {
      saveHistory();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleClasses =
    "absolute w-3 h-3 bg-white border-[2.5px] border-blue-500 rounded-sm z-[100] hover:bg-blue-100 hover:scale-125 transition-transform shadow-sm";

  return (
    <>
      <div
        className={`${handleClasses} -top-1.5 -left-1.5 cursor-nwse-resize`}
        onPointerDown={(e) => handlePointerDown(e, "nw")}
      />
      <div
        className={`${handleClasses} -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize`}
        onPointerDown={(e) => handlePointerDown(e, "n")}
      />
      <div
        className={`${handleClasses} -top-1.5 -right-1.5 cursor-nesw-resize`}
        onPointerDown={(e) => handlePointerDown(e, "ne")}
      />
      <div
        className={`${handleClasses} top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize`}
        onPointerDown={(e) => handlePointerDown(e, "e")}
      />
      <div
        className={`${handleClasses} -bottom-1.5 -right-1.5 cursor-nwse-resize`}
        onPointerDown={(e) => handlePointerDown(e, "se")}
      />
      <div
        className={`${handleClasses} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize`}
        onPointerDown={(e) => handlePointerDown(e, "s")}
      />
      <div
        className={`${handleClasses} -bottom-1.5 -left-1.5 cursor-nesw-resize`}
        onPointerDown={(e) => handlePointerDown(e, "sw")}
      />
      <div
        className={`${handleClasses} top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize`}
        onPointerDown={(e) => handlePointerDown(e, "w")}
      />
    </>
  );
}
