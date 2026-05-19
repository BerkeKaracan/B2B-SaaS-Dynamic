"use client";
import React, { useState, DragEvent } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockType, PageContent } from "@/types/record";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface SidebarItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface TemplateItem {
  type: PageContent["type"];
  label: string;
  description: string;
  icon: React.ReactNode;
}

export default function ItemSidebar() {
  const { addPage, addBlockToPage } = useCanvasStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isBlocksOpen, setIsBlocksOpen] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);

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
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
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
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <line x1="7" y1="12" x2="11" y2="12" />
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
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
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
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      type: "checkbox",
      label: "Toggle Switch",
      description: "State handling with interactive checklist option",
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
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      type: "badge_selector",
      label: "Badge Selector",
      description: "Multiple discrete choice selection grid",
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
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      type: "asset_stream",
      label: "Asset Stream",
      description: "Upload engine for tracking cloud file assets",
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  const templateItems: TemplateItem[] = [
    {
      type: "empty",
      label: "Empty Page",
      description: "Insert a blank standard A4 frame to your workspace",
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      type: "kanban",
      label: "Kanban Board",
      description:
        "Pre-loaded landscape frame with ToDo, InProgress, Done matrix columns",
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      ),
    },
    {
      type: "notes",
      label: "Notes Workspace",
      description:
        "Pre-loaded portrait workspace with notes, summaries and priority selectors",
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
          <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
          <polyline points="14 3 14 9 20 9" />
        </svg>
      ),
    },
    {
      type: "agenda",
      label: "Agenda Timeline",
      description:
        "Pre-loaded roadmap frame mapping sprint deadlines and phase categories",
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      type: "database",
      label: "Structured Database",
      description:
        "Pre-loaded validation workspace mapping client titles, active status and prod boolean",
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
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      ),
    },
  ];

  const handleAddPage = (type: PageContent["type"]) => {
    const container = document.querySelector(".cursor-grab");
    let cx = 100,
      cy = 100;
    if (container) {
      const rect = container.getBoundingClientRect();
      const state = useCanvasStore.getState();
      const currentZoom = (state.zoom ?? 100) / 100;
      cx =
        (-(state.panX ?? 0) +
          rect.width / 2 -
          (type === "kanban" ? 550 : 400)) /
        currentZoom;
      cy = (-(state.panY ?? 0) + rect.height / 2 - 400) / currentZoom;
    }
    addPage(type, cx, cy);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, type: BlockType) => {
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddBlockToPage = (type: BlockType) => {
    const state = useCanvasStore.getState();
    const targetPageId = state.activePageId || state.pages[0]?.id;

    if (!targetPageId) {
      const container = document.querySelector(".cursor-grab");
      let cx = 100,
        cy = 100;
      if (container) {
        const rect = container.getBoundingClientRect();
        const currentZoom = (state.zoom ?? 100) / 100;
        cx = (-(state.panX ?? 0) + rect.width / 2 - 400) / currentZoom;
        cy = (-(state.panY ?? 0) + rect.height / 2 - 500) / currentZoom;
      }
      addPage("empty", cx, cy);
      setTimeout(() => {
        const newState = useCanvasStore.getState();
        const newPageId = newState.activePageId;
        if (newPageId) {
          useCanvasStore.getState().addBlockToPage(newPageId, type, 40, 40);
        }
      }, 0);
      return;
    }

    const targetPage = state.pages.find((p) => p.id === targetPageId);
    const offsetY = targetPage ? targetPage.blocks.length * 110 + 40 : 40;
    addBlockToPage(targetPageId, type, 40, offsetY);
  };

  const filteredBlocks = menuItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTemplates = templateItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-72 h-[calc(100vh-5.5rem)] m-4 bg-white/80 backdrop-blur-xl border border-zinc-200/60 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden shrink-0 z-20">
      <div className="p-4 border-b border-zinc-100 flex flex-col gap-2 shrink-0">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Engine Toolkit
        </span>
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocks or frames..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 select-none shrink-0">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsBlocksOpen(!isBlocksOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 rounded-lg text-left transition-colors"
          >
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
              Building Blocks ({filteredBlocks.length})
            </span>
            {isBlocksOpen ? (
              <ChevronUp className="w-3 h-3 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            )}
          </button>

          {isBlocksOpen && (
            <div className="space-y-0.5 animate-in fade-in duration-150">
              {filteredBlocks.map((item) => (
                <div
                  key={item.type}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  onClick={() => handleAddBlockToPage(item.type)}
                  className="w-full flex items-start gap-3 p-2 rounded-xl text-left hover:bg-zinc-50 border border-transparent transition-all group shrink-0 cursor-grab active:cursor-grabbing"
                >
                  <div className="p-1.5 bg-zinc-50 border border-zinc-100 rounded-lg text-zinc-500 group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shrink-0 pointer-events-none">
                    {item.icon}
                  </div>
                  <div className="space-y-0.5 min-w-0 pointer-events-none">
                    <p className="text-[12px] font-bold text-zinc-800 tracking-tight group-hover:text-zinc-950">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-zinc-400 leading-tight truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
              {filteredBlocks.length === 0 && (
                <p className="text-[11px] text-zinc-400 text-center py-2">
                  No blocks found
                </p>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-zinc-100/80 my-1 mx-2" />

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 rounded-lg text-left transition-colors"
          >
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
              Page Frames ({filteredTemplates.length})
            </span>
            {isTemplatesOpen ? (
              <ChevronUp className="w-3 h-3 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            )}
          </button>

          {isTemplatesOpen && (
            <div className="space-y-0.5 animate-in fade-in duration-150">
              {filteredTemplates.map((template) => (
                <button
                  key={template.type}
                  onClick={() => handleAddPage(template.type)}
                  className="w-full flex items-start gap-3 p-2 rounded-xl text-left hover:bg-zinc-50 border border-transparent transition-all group shrink-0"
                >
                  <div className="p-1.5 bg-zinc-50 border border-zinc-100 rounded-lg text-zinc-500 group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shrink-0">
                    {template.icon}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[12px] font-bold text-zinc-800 tracking-tight group-hover:text-zinc-950">
                      {template.label}
                    </p>
                    <p className="text-[10px] text-zinc-400 leading-tight truncate">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                <p className="text-[11px] text-zinc-400 text-center py-2">
                  No frames found
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
