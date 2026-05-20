"use client";
import React, { useState } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockType, PageContent } from "@/types/record";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [activeDrag, setActiveDrag] = useState<{
    itemType: string;
    isBlock: boolean;
    label: string;
    icon: React.ReactNode;
    x: number;
    y: number;
  } | null>(null);

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
  ];

  const handleTapToAddBlock = (type: BlockType) => {
    const state = useCanvasStore.getState();
    const targetPageId = state.activePageId || state.pages[0]?.id;

    if (!targetPageId) {
      const currentZoom = (state.zoom ?? 100) / 100;
      const cx =
        (-(state.panX ?? 0) + window.innerWidth / 2 - 400) / currentZoom;
      const cy =
        (-(state.panY ?? 0) + window.innerHeight / 2 - 500) / currentZoom;
      addPage("empty", cx, cy);
      setTimeout(() => {
        const newState = useCanvasStore.getState();
        if (newState.activePageId)
          newState.addBlockToPage(newState.activePageId, type, 40, 40);
      }, 0);
      return;
    }

    const targetPage = state.pages.find((p) => p.id === targetPageId);
    const offsetY = targetPage ? targetPage.blocks.length * 110 + 40 : 40;
    addBlockToPage(targetPageId, type, 40, offsetY);
  };

  const handleTapToAddPage = (type: PageContent["type"]) => {
    const state = useCanvasStore.getState();
    const currentZoom = (state.zoom ?? 100) / 100;
    const cx = (-(state.panX ?? 0) + window.innerWidth / 2 - 400) / currentZoom;
    const cy =
      (-(state.panY ?? 0) + window.innerHeight / 2 - 400) / currentZoom;
    addPage(type, cx, cy);
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    item: SidebarItem | TemplateItem, 
    isBlock: boolean,
  ) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true;
      }

      if (isDragging) {
        setActiveDrag({
          itemType: item.type,
          isBlock,
          label: item.label,
          icon: item.icon,
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      setActiveDrag((currentDrag) => {
        if (currentDrag) {
          processDrop(
            currentDrag.itemType,
            currentDrag.isBlock,
            upEvent.clientX,
            upEvent.clientY,
          );
        } else {
          if (isBlock) {
            handleTapToAddBlock(item.type as BlockType);
          } else {
            addPage(item.type as PageContent["type"], 100, 100);
          }
        }
        return null;
      });
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const processDrop = (
    type: string,
    isBlock: boolean,
    clientX: number,
    clientY: number,
  ) => {
    const state = useCanvasStore.getState();
    const sidebarRect = document
      .getElementById("item-sidebar")
      ?.getBoundingClientRect();

    if (
      sidebarRect &&
      clientX >= sidebarRect.left &&
      clientX <= sidebarRect.right &&
      clientY >= sidebarRect.top &&
      clientY <= sidebarRect.bottom
    ) {
      return;
    }

    const currentZoom = (state.zoom ?? 100) / 100;
    const dropCanvasX = (clientX - (state.panX ?? 0)) / currentZoom;
    const dropCanvasY = (clientY - (state.panY ?? 0)) / currentZoom;

    if (!isBlock) {
      state.addPage(type as PageContent["type"], dropCanvasX, dropCanvasY);
    } else {
      const pages = state.pages;
      let targetPage = null;

      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        if (
          dropCanvasX >= p.x &&
          dropCanvasX <= p.x + p.width &&
          dropCanvasY >= p.y &&
          dropCanvasY <= p.y + p.height
        ) {
          targetPage = p;
          break;
        }
      }

      if (targetPage) {
        state.addBlockToPage(
          targetPage.id,
          type as BlockType,
          dropCanvasX - targetPage.x - 50,
          dropCanvasY - targetPage.y - 20,
        );
        state.setActivePage(targetPage.id);
      } else {
        state.addPage("empty", dropCanvasX - 200, dropCanvasY - 50);
        setTimeout(() => {
          const newState = useCanvasStore.getState();
          if (newState.activePageId) {
            newState.addBlockToPage(
              newState.activePageId,
              type as BlockType,
              20,
              20,
            );
          }
        }, 0);
      }
    }
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
    <>
      <div
        id="item-sidebar"
        className={`h-[calc(100vh-5.5rem)] m-4 bg-white/80 backdrop-blur-xl border border-zinc-200/60 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden shrink-0 z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-72"
        }`}
      >
        <div
          className={`p-4 border-b border-zinc-100 flex flex-col gap-2 shrink-0 ${isCollapsed ? "items-center px-2" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            {!isCollapsed && (
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap overflow-hidden">
                Engine Toolkit
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-800 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
              title={isCollapsed ? "Expand Toolkit" : "Collapse Toolkit"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isCollapsed && (
            <div className="relative flex items-center animate-in fade-in zoom-in duration-200">
              <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blocks or frames..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 select-none shrink-0 custom-scrollbar touch-pan-y">
          <div className="space-y-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsBlocksOpen(!isBlocksOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 rounded-lg text-left transition-colors whitespace-nowrap overflow-hidden"
              >
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  Building Blocks ({filteredBlocks.length})
                </span>
                {isBlocksOpen ? (
                  <ChevronUp className="w-3 h-3 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                )}
              </button>
            ) : (
              <div className="h-px bg-zinc-200/50 w-6 mx-auto my-2" />
            )}

            {(isBlocksOpen || isCollapsed) && (
              <div className="space-y-0.5">
                {filteredBlocks.map((item) => (
                  <div
                    key={item.type}
                    title={isCollapsed ? item.label : undefined}
                    onPointerDown={(e) => handlePointerDown(e, item, true)}
                    className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "justify-start gap-3 p-2"} rounded-xl text-left hover:bg-zinc-50 border border-transparent transition-all group shrink-0 cursor-grab active:cursor-grabbing`}
                  >
                    <div className="p-1.5 bg-zinc-50 border border-zinc-100 rounded-lg text-zinc-500 group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shrink-0 pointer-events-none">
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="space-y-0.5 min-w-0 pointer-events-none whitespace-nowrap animate-in fade-in duration-200">
                        <p className="text-[12px] font-bold text-zinc-800 tracking-tight group-hover:text-zinc-950">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-tight truncate">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isCollapsed && <div className="h-px bg-zinc-100/80 my-1 mx-2" />}

          <div className="space-y-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 rounded-lg text-left transition-colors whitespace-nowrap overflow-hidden"
              >
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  Page Frames ({filteredTemplates.length})
                </span>
                {isTemplatesOpen ? (
                  <ChevronUp className="w-3 h-3 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                )}
              </button>
            ) : (
              <div className="h-px bg-zinc-200/50 w-6 mx-auto my-3" />
            )}

            {(isTemplatesOpen || isCollapsed) && (
              <div className="space-y-0.5">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.type}
                    title={isCollapsed ? template.label : undefined}
                    onPointerDown={(e) => handlePointerDown(e, template, false)}
                    className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "justify-start gap-3 p-2"} rounded-xl text-left hover:bg-zinc-50 border border-transparent transition-all group shrink-0 cursor-grab active:cursor-grabbing`}
                  >
                    <div className="p-1.5 bg-zinc-50 border border-zinc-100 rounded-lg text-zinc-500 group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shrink-0 pointer-events-none">
                      {template.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="space-y-0.5 min-w-0 pointer-events-none whitespace-nowrap animate-in fade-in duration-200">
                        <p className="text-[12px] font-bold text-zinc-800 tracking-tight group-hover:text-zinc-950">
                          {template.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-tight truncate">
                          {template.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeDrag && (
        <div
          className="fixed z-[99999] pointer-events-none flex items-center gap-3 p-2.5 bg-white/90 backdrop-blur-md border-2 border-blue-500 rounded-xl shadow-2xl scale-105 transition-transform"
          style={{ left: activeDrag.x + 15, top: activeDrag.y + 15 }}
        >
          <div className="p-1.5 bg-zinc-950 rounded-lg text-white">
            {activeDrag.icon}
          </div>
          <div className="space-y-0.5 whitespace-nowrap pr-2">
            <p className="text-[12px] font-bold text-zinc-950">
              {activeDrag.label}
            </p>
            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-widest">
              Drop to Canvas
            </p>
          </div>
        </div>
      )}
    </>
  );
}
