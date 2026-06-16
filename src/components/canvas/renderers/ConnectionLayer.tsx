import React, { useMemo } from "react";
import { PageWithSettings } from "@/store/useCanvasStore";
import { X } from "lucide-react";

interface ConnectionLayerProps {
  connections: Array<{
    id: string;
    fromPage: string;
    fromBlock: string;
    toPage: string;
    toBlock: string;
  }>;
  pages: PageWithSettings[];
  connectingFrom: { pageId: string; blockId: string } | null;
  mousePos: { x: number; y: number };
  onRemoveConnection: (id: string) => void;
}

function createBezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);

  const curvature = Math.max(dx * 0.4, dy * 0.4, 40);

  const controlPointX1 = x1 + (x2 > x1 ? curvature : -curvature);
  const controlPointX2 = x2 - (x2 > x1 ? curvature : -curvature);

  return `M ${x1} ${y1} C ${controlPointX1} ${y1}, ${controlPointX2} ${y2}, ${x2} ${y2}`;
}

export function ConnectionLayer({
  connections,
  pages,
  connectingFrom,
  mousePos,
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
      style={{ zIndex: 30, overflow: "visible" }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 8 4, 0 8" fill="#818CF8" />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 8 4, 0 8" fill="#4F46E5" />
        </marker>
      </defs>

      {connections.map((conn) => {
        const from = blockPositions.get(`${conn.fromPage}_${conn.fromBlock}`);
        const to = blockPositions.get(`${conn.toPage}_${conn.toBlock}`);
        if (!from || !to) return null;

        const pathData = createBezierPath(from.x, from.y, to.x, to.y);
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        return (
          <g key={conn.id} className="group pointer-events-auto">
            <path
              d={pathData}
              stroke="transparent"
              strokeWidth="24"
              fill="none"
              className="cursor-pointer"
            />
            <path
              d={pathData}
              stroke="#818CF8"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="transition-all duration-300 group-hover:stroke-[#4F46E5] group-hover:stroke-[3.5px] opacity-80 group-hover:opacity-100"
            />
            <foreignObject
              x={midX - 12}
              y={midY - 12}
              width="24"
              height="24"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveConnection(conn.id);
                }}
                className="w-6 h-6 flex items-center justify-center bg-white/90 backdrop-blur-sm border border-indigo-200 rounded-full text-indigo-500 hover:text-white hover:bg-red-500 hover:border-red-500 shadow-sm transition-all"
                title="Remove Connection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </foreignObject>
          </g>
        );
      })}

      {connectingFrom &&
        (() => {
          const from = blockPositions.get(
            `${connectingFrom.pageId}_${connectingFrom.blockId}`,
          );
          if (!from) return null;
          const pathData = createBezierPath(
            from.x,
            from.y,
            mousePos.x,
            mousePos.y,
          );

          return (
            <path
              d={pathData}
              stroke="#6366F1"
              strokeWidth="2.5"
              strokeDasharray="6, 6"
              fill="none"
              className="opacity-70 animate-[dash_1s_linear_infinite]"
              markerEnd="url(#arrowhead-active)"
            />
          );
        })()}
    </svg>
  );
}
