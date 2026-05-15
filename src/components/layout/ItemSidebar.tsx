"use client";
import React from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockType } from "@/types/record";

const ITEMS: { id: BlockType; label: string; icon: React.ReactNode }[] = [
  {
    id: "text" as BlockType,
    label: "Text Block",
    icon: <path d="M4 7V4h16v3M9 20h6M12 4v16" />,
  },
  {
    id: "form" as BlockType,
    label: "Data Form",
    icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
  },
  {
    id: "date" as BlockType,
    label: "Timeline",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
];

export default function ItemSidebar() {
  const addBlock = useCanvasStore((state) => state.addBlock);

  return (
    <aside className="w-[220px] border-r border-zinc-200/80 h-full flex flex-col bg-white shrink-0">
      <div className="h-12 flex items-center px-4 border-b border-zinc-100">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Components
        </span>
      </div>

      <div className="p-2 space-y-0.5">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => addBlock(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 transition-colors text-sm font-medium"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70"
            >
              {item.icon}
            </svg>
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
