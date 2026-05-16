"use client";
import React from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockType } from "@/types/record";

interface SidebarItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export default function ItemSidebar() {
  const { addBlock } = useCanvasStore();

  const menuItems: SidebarItem[] = [
    {
      type: "text",
      label: "Text Block",
      description: "Plain text for notes or descriptions",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="4 7 4 4 20 4 20 7"></polyline>
          <line x1="9" y1="20" x2="15" y2="20"></line>
          <line x1="12" y1="4" x2="12" y2="20"></line>
        </svg>
      ),
    },
    {
      type: "form",
      label: "Form Field (Input)",
      description: "Dynamic database-mapped data input",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
        </svg>
      ),
    },
    {
      type: "date",
      label: "Date Picker",
      description: "Select target or operational dates",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
    {
      type: "dropdown",
      label: "Dropdown Menu",
      description: "Pre-defined selectable option list",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <path d="M8 10l4 4 4-4"></path>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-12 flex items-center px-4 border-b border-zinc-100 shrink-0">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          Building Blocks
        </span>
      </div>

      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.type}
            onClick={() => addBlock(item.type)}
            className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all group shrink-0"
          >
            <div className="p-2 bg-zinc-50 rounded-md text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
              {item.icon}
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-semibold text-zinc-800 truncate">
                {item.label}
              </p>
              <p className="text-[10px] text-zinc-400 leading-tight line-clamp-2">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}