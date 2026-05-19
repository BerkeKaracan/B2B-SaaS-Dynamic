import React from "react";
import { Connection, PageWithSettings } from "@/store/useCanvasStore";

interface ConnectionLayerProps {
  connections: Connection[];
  pages: PageWithSettings[];
  connectingFrom: { pageId: string; blockId: string } | null;
  mousePos: { x: number; y: number };
  onRemoveConnection: (connId: string) => void;
}

export const ConnectionLayer = ({
  connections,
  pages,
  connectingFrom,
  mousePos,
  onRemoveConnection,
}: ConnectionLayerProps) => {
  const getBlockCenter = (pageId: string, blockId: string) => {
    const page = pages.find((p) => p.id === pageId);
    const block = page?.blocks.find((b) => b.id === blockId);

    if (!page || !block) return null;

    return {
      x: page.x + block.x + 160,
      y: page.y + block.y + 60,
    };
  };

  return (
    <svg className="absolute inset-0 pointer-events-none z-40 overflow-visible w-full h-full">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" opacity="0.4" />
        </marker>
        <marker
          id="arrowhead-hover"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />{" "}
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" opacity="0.6" />
        </marker>
      </defs>

      {connections.map((conn) => {
        const start = getBlockCenter(conn.fromPage, conn.fromBlock);
        const end = getBlockCenter(conn.toPage, conn.toBlock);

        if (!start || !end) return null;

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <g
            key={conn.id}
            className="group pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveConnection(conn.id);
            }}
          >
            <title>Click and delete connection</title>

            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="transparent"
              strokeWidth="24"
            />

            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#64748b"
              strokeWidth="3"
              markerEnd="url(#arrowhead)"
              className="transition-all duration-150 opacity-40 group-hover:stroke-red-500 group-hover:opacity-100"
              style={{ markerEnd: "url(#arrowhead)" }}
            />

            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 scale-90 group-hover:scale-100 origin-center">
              <circle cx={midX} cy={midY} r="12" fill="#ef4444" />
              <line
                x1={midX - 4}
                y1={midY - 4}
                x2={midX + 4}
                y2={midY + 4}
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1={midX + 4}
                y1={midY - 4}
                x2={midX - 4}
                y2={midY + 4}
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </g>
        );
      })}

      {connectingFrom &&
        (() => {
          const start = getBlockCenter(
            connectingFrom.pageId,
            connectingFrom.blockId,
          );
          if (!start) return null;

          return (
            <line
              x1={start.x}
              y1={start.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#3b82f6"
              strokeWidth="3"
              opacity="0.6"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-active)"
            />
          );
        })()}
    </svg>
  );
};
