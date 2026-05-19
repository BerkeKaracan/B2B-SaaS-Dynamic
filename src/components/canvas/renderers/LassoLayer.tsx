import React from "react";

interface LassoLayerProps {
  lassoStart: { x: number; y: number } | null;
  lassoEnd: { x: number; y: number } | null;
}

export const LassoLayer = ({ lassoStart, lassoEnd }: LassoLayerProps) => {
  if (!lassoStart || !lassoEnd) return null;

  const left = Math.min(lassoStart.x, lassoEnd.x);
  const top = Math.min(lassoStart.y, lassoEnd.y);
  const width = Math.abs(lassoEnd.x - lassoStart.x);
  const height = Math.abs(lassoEnd.y - lassoStart.y);

  return (
    <div
      className="absolute bg-blue-500/10 border border-blue-500/40 rounded-[2px] pointer-events-none z-[100]"
      style={{ left, top, width, height }}
    />
  );
};
