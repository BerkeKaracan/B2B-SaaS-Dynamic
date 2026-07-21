'use client';
import React, { useState, useRef, useMemo } from 'react';
import { PageWithSettings, useCanvasStore } from '@/store/useCanvasStore';
import { X } from 'lucide-react';
import {
  getConnectionMidpoint,
  setConnectionMidpoint,
} from './connectionMidpoints';

interface ConnectionType {
  id: string;
  fromPage: string;
  fromBlock: string;
  toPage: string;
  toBlock: string;
}

interface ConnectionLayerProps {
  connections: ConnectionType[];
  pages: PageWithSettings[];
  onRemoveConnection: (id: string) => void;
}

function DraggableConnection({
  conn,
  from,
  to,
  onRemove,
}: {
  conn: ConnectionType;
  from: { x: number; y: number };
  to: { x: number; y: number };
  onRemove: (id: string) => void;
}) {
  const isDragging = useRef(false);

  const [midPoint, setMidPoint] = useState<{ x: number; y: number } | null>(
    () => getConnectionMidpoint(conn.id) || null
  );

  const dragMidPointRef = useRef<{ x: number; y: number } | null>(null);

  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const btnRef = useRef<SVGForeignObjectElement>(null);

  const targetX = midPoint ? midPoint.x : (from.x + to.x) / 2;
  const targetY = midPoint ? midPoint.y : (from.y + to.y) / 2;
  const cx = 2 * targetX - 0.5 * from.x - 0.5 * to.x;
  const cy = 2 * targetY - 0.5 * from.y - 0.5 * to.y;
  const initialPath = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;

    dragMidPointRef.current = midPoint
      ? { ...midPoint }
      : { x: targetX, y: targetY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !dragMidPointRef.current) return;
    e.stopPropagation();

    const scale = (useCanvasStore.getState().zoom || 100) / 100;

    dragMidPointRef.current.x += e.movementX / scale;
    dragMidPointRef.current.y += e.movementY / scale;

    const newX = dragMidPointRef.current.x;
    const newY = dragMidPointRef.current.y;

    const ncx = 2 * newX - 0.5 * from.x - 0.5 * to.x;
    const ncy = 2 * newY - 0.5 * from.y - 0.5 * to.y;
    const newPath = `M ${from.x} ${from.y} Q ${ncx} ${ncy} ${to.x} ${to.y}`;

    if (path1Ref.current) path1Ref.current.setAttribute('d', newPath);
    if (path2Ref.current) path2Ref.current.setAttribute('d', newPath);
    if (circleRef.current) {
      circleRef.current.setAttribute('cx', newX.toString());
      circleRef.current.setAttribute('cy', newY.toString());
    }
    if (btnRef.current) {
      btnRef.current.setAttribute('x', (newX - 12).toString());
      btnRef.current.setAttribute('y', (newY - 32).toString());
    }
    // Keep the painted curve (canvas passive layer) in sync with the handle.
    setConnectionMidpoint(conn.id, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current && dragMidPointRef.current) {
      setMidPoint({ ...dragMidPointRef.current });
    }

    isDragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <g className="group pointer-events-auto">
      <path
        ref={path1Ref}
        d={initialPath}
        stroke="transparent"
        strokeWidth="24"
        fill="none"
        className="cursor-pointer"
      />

      {/* Base curve is painted by CanvasPassiveLayers; this is hover highlight only. */}
      <path
        ref={path2Ref}
        d={initialPath}
        stroke="transparent"
        strokeWidth="3"
        fill="none"
        className="group-hover:stroke-[#4F46E5]"
      />

      <circle
        ref={circleRef}
        cx={targetX}
        cy={targetY}
        r="6"
        fill="#fff"
        stroke="#6366F1"
        strokeWidth="2"
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-50"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <foreignObject
        ref={btnRef}
        x={targetX - 12}
        y={targetY - 32}
        width="24"
        height="24"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(conn.id);
          }}
          className="w-6 h-6 flex items-center justify-center bg-white/90 backdrop-blur-sm border border-indigo-200 rounded-full text-indigo-500 hover:text-white hover:bg-red-500 hover:border-red-500 shadow-md transition-all"
          title="Remove Connection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </foreignObject>
    </g>
  );
}

function blockCenter(page: PageWithSettings, blockId: string) {
  const b = page.blocks.find((blk) => blk.id === blockId);
  if (!b) return null;
  return {
    x: (page.x ?? 150) + (b.x ?? 20) + (b.width ?? 320) / 2,
    y: (page.y ?? 150) + (b.y ?? 20) + (b.height ?? 120) / 2,
  };
}

/**
 * Dashed "connection being drawn" preview. Kept outside the memoized
 * CanvasWorld: mousePos updates per frame and must not re-reconcile the
 * static connection layer or the pages.
 */
export function ConnectionPreviewLayer({
  pages,
  connectingFrom,
  mousePos,
}: {
  pages: PageWithSettings[];
  connectingFrom: { pageId: string; blockId: string } | null;
  mousePos: { x: number; y: number };
}) {
  if (!connectingFrom) return null;
  const page = pages.find((p) => p.id === connectingFrom.pageId);
  const from = page ? blockCenter(page, connectingFrom.blockId) : null;
  if (!from) return null;

  const cx = (from.x + mousePos.x) / 2;
  const cy = (from.y + mousePos.y) / 2;
  const pathData = `M ${from.x} ${from.y} Q ${cx} ${cy} ${mousePos.x} ${mousePos.y}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none w-full h-full"
      style={{ zIndex: 46, overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead-preview"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 8 4, 0 8" fill="#4F46E5" />
        </marker>
      </defs>
      <path
        d={pathData}
        stroke="#6366F1"
        strokeWidth="2.5"
        strokeDasharray="6, 6"
        fill="none"
        className="opacity-70 animate-[dash_1s_linear_infinite]"
        markerEnd="url(#arrowhead-preview)"
      />
    </svg>
  );
}

export function ConnectionLayer({
  connections,
  pages,
  onRemoveConnection,
}: ConnectionLayerProps) {
  const blockPositions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    pages.forEach((p) => {
      p.blocks.forEach((b) => {
        const absX = (p.x ?? 150) + (b.x ?? 20) + (b.width ?? 320) / 2;
        const absY = (p.y ?? 150) + (b.y ?? 20) + (b.height ?? 120) / 2;
        pos.set(`${p.id}_${b.id}`, { x: absX, y: absY });
      });
    });
    return pos;
  }, [pages]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none w-full h-full"
      style={{ zIndex: 45, overflow: 'visible' }}
    >
      {connections.map((conn) => {
        const from = blockPositions.get(`${conn.fromPage}_${conn.fromBlock}`);
        const to = blockPositions.get(`${conn.toPage}_${conn.toBlock}`);
        if (!from || !to) return null;

        return (
          <DraggableConnection
            key={conn.id}
            conn={conn}
            from={from}
            to={to}
            onRemove={onRemoveConnection}
          />
        );
      })}
    </svg>
  );
}
