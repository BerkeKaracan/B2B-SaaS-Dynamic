"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Target,
  ZoomIn,
  ZoomOut,
  Download,
  GripHorizontal,
} from "lucide-react";
import { useCanvasStore } from "@/store/useCanvasStore";

type MindNode = {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  color?: string;
};

export default function MindMapBoard({ projectId }: { projectId: string }) {
  const t = useTranslations("MindMapBoard");
  const containerRef = useRef<HTMLDivElement>(null);
  const { metadata, updateMetadata } = useCanvasStore();

  const [nodes, setNodes] = useState<MindNode[]>(
    (metadata.mindmapNodes as MindNode[]) || [
      {
        id: "root",
        text: t("centralIdea"),
        x: typeof window !== "undefined" ? window.innerWidth / 2 - 100 : 400,
        y: typeof window !== "undefined" ? window.innerHeight / 2 - 100 : 300,
        parentId: null,
        color: "bg-indigo-600",
      },
    ],
  );

  const saveNodes = (newNodes: MindNode[]) => {
    setNodes(newNodes);
    updateMetadata({ mindmapNodes: newNodes });
  };

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".mind-node")) return;
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      saveNodes(
        nodes.map((n) =>
          n.id === draggingNodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n,
        ),
      );
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDraggingCanvas) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
  };

  const addChildNode = (parentId: string, parentX: number, parentY: number) => {
    const newId = `node-${Date.now()}`;
    const siblingsCount = nodes.filter((n) => n.parentId === parentId).length;
    const angle = siblingsCount * 45 * (Math.PI / 180);
    const radius = 220;

    const newX = parentX + radius * Math.cos(angle);
    const newY = parentY + radius * Math.sin(angle);

    saveNodes([
      ...nodes,
      {
        id: newId,
        text: t("newNode"),
        x: newX,
        y: newY,
        parentId,
        color: "bg-white dark:bg-zinc-800",
      },
    ]);
    setEditingNodeId(newId);
  };

  const updateNodeText = (id: string, newText: string) => {
    saveNodes(nodes.map((n) => (n.id === id ? { ...n, text: newText } : n)));
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden transition-colors duration-300">
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            {t("title")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-12 text-center tracking-wider">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
          <button
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={t("exportMap")}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 w-full h-full relative overflow-hidden outline-none ${isDraggingCanvas ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#64748b 1.5px, transparent 1.5px)",
            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {nodes.map((node) => {
              if (!node.parentId) return null;
              const parent = nodes.find((n) => n.id === node.parentId);
              if (!parent) return null;

              const startX = parent.x + 80;
              const startY = parent.y + 24;
              const endX = node.x + 80;
              const endY = node.y + 24;

              return (
                <line
                  key={`line-${node.id}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  className="stroke-zinc-300 dark:stroke-zinc-700"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        </svg>

        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              className="mind-node absolute flex items-center justify-center group pointer-events-auto"
              style={{ left: node.x, top: node.y }}
            >
              <div
                className={`relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all w-40 flex items-center justify-center
                  ${draggingNodeId === node.id ? "scale-105 shadow-2xl z-50 ring-4 ring-indigo-500/20" : "hover:border-indigo-400"}
                  ${
                    node.parentId === null
                      ? "bg-indigo-600 border-indigo-700 text-white"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  }`}
              >
                <div
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                  className="absolute -top-3 right-2 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm text-zinc-400 hover:text-indigo-500"
                  title={t("dragNode")}
                >
                  <GripHorizontal size={12} />
                </div>

                {editingNodeId === node.id ? (
                  <input
                    autoFocus
                    value={node.text}
                    onChange={(e) => updateNodeText(node.id, e.target.value)}
                    onBlur={() => setEditingNodeId(null)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setEditingNodeId(null)
                    }
                    className="w-full bg-transparent text-center font-bold text-sm outline-none"
                    placeholder={t("typePlaceholder")}
                  />
                ) : (
                  <span
                    onClick={() => setEditingNodeId(node.id)}
                    className="font-bold text-sm text-center truncate w-full cursor-text select-none"
                  >
                    {node.text}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addChildNode(node.id, node.x, node.y);
                }}
                className="absolute -left-3 -bottom-3 bg-indigo-50 dark:bg-indigo-900/50 border-2 border-indigo-200 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-20"
                title={t("addNode")}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
