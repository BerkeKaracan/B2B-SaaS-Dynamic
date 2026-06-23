"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockType, PageContent } from "@/types/record";
import { fetchAPI } from "@/services/api";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
  const t = useTranslations("EngineToolkit");
  const {
    addPage,
    addBlockToPage,
    setActivePage,
    activePageId,
    addGeneratedPage,
  } = useCanvasStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isBlocksOpen, setIsBlocksOpen] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [activeDrag, setActiveDrag] = useState<{
    itemType: string;
    isBlock: boolean;
    label: string;
    icon: React.ReactNode;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsAiModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);

    const state = useCanvasStore.getState();

    const canvasContainer = document.querySelector(".canvas-bg");
    const rect = canvasContainer
      ? canvasContainer.getBoundingClientRect()
      : { width: 1000, height: 800, left: 0, top: 0 };

    const currentZoom = (state.zoom ?? 100) / 100;

    const cx = (rect.width / 2 - (state.panX ?? 0)) / currentZoom - 500;
    const cy = (rect.height / 2 - (state.panY ?? 0)) / currentZoom - 400;

    try {
      const res = await fetchAPI("/api/ai/generate-canvas", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt, x: cx, y: cy }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("🚀 AI Output:", data);

        const finalData = data.page || data;

        if (finalData && finalData.type) {
          const store = useCanvasStore.getState();
          if (store.addGeneratedPage) {
            store.addGeneratedPage({
              ...finalData,
              x: cx,
              y: cy,
            });

            setTimeout(() => {
              const ns = useCanvasStore.getState();
              if (ns.pages.length > 0) {
                ns.setActivePage(ns.pages[ns.pages.length - 1].id);
              }
            }, 50);

            setIsAiModalOpen(false);
            setAiPrompt("");
          }
        } else {
          alert(
            "The AI ​​was unable to generate a valid template. Please rephrase your request using different words.",
          );
        }
      }
    } catch (e: unknown) {
      console.error("AI Canvas Generation Error:", e);
      alert(
        "Communication with the AI ​engine could not be established. Check the backend logs in the terminal.",
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  const menuItems: SidebarItem[] = [
    {
      type: "text",
      label: t("blocks.text.label"),
      description: t("blocks.text.desc"),
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
      label: t("blocks.form.label"),
      description: t("blocks.form.desc"),
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
      label: t("blocks.date.label"),
      description: t("blocks.date.desc"),
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
      label: t("blocks.dropdown.label"),
      description: t("blocks.dropdown.desc"),
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
      label: t("blocks.toggle.label"),
      description: t("blocks.toggle.desc"),
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
      label: t("blocks.badge.label"),
      description: t("blocks.badge.desc"),
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
      label: t("blocks.asset.label"),
      description: t("blocks.asset.desc"),
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
      label: t("frames.empty.label"),
      description: t("frames.empty.desc"),
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
      label: t("frames.kanban.label"),
      description: t("frames.kanban.desc"),
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
      label: t("frames.notes.label"),
      description: t("frames.notes.desc"),
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
      label: t("frames.agenda.label"),
      description: t("frames.agenda.desc"),
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
      label: t("frames.database.label"),
      description: t("frames.database.desc"),
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
    {
      type: "whiteboard" as PageContent["type"],
      label: t("frames.whiteboard.label"),
      description: t("frames.whiteboard.desc"),
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
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      type: "mindmap" as PageContent["type"],
      label: t("frames.mindmap.label"),
      description: t("frames.mindmap.desc"),
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
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M6.5 10v4" />
          <path d="M17.5 10v4" />
          <path d="M10 6.5h4" />
          <path d="M10 17.5h4" />
        </svg>
      ),
    },
    {
      type: "retrospective" as PageContent["type"],
      label: t("frames.retrospective.label"),
      description: t("frames.retrospective.desc"),
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  const handleTapToAddBlock = (type: BlockType) => {
    const state = useCanvasStore.getState();
    const targetPageId = state.activePageId || state.pages[0]?.id;

    if (!targetPageId) {
      const canvasContainer = document.querySelector(".canvas-bg");
      const rect = canvasContainer
        ? canvasContainer.getBoundingClientRect()
        : {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
      const currentZoom = (state.zoom ?? 100) / 100;
      const cx = (-(state.panX ?? 0) + rect.width / 2 - 200) / currentZoom;
      const cy = (-(state.panY ?? 0) + rect.height / 2 - 200) / currentZoom;

      addPage("empty", cx, cy);
      setTimeout(() => {
        const newState = useCanvasStore.getState();
        if (newState.activePageId) {
          newState.addBlockToPage(newState.activePageId, type, 40, 40);
          setActivePage(newState.activePageId);
        }
      }, 50);
      return;
    }

    const targetPage = state.pages.find((p) => p.id === targetPageId);
    const offsetY = targetPage ? targetPage.blocks.length * 110 + 40 : 40;
    addBlockToPage(targetPageId, type, 40, offsetY);
    setActivePage(targetPageId);
  };

  const handleTapToAddPage = (type: PageContent["type"]) => {
    const state = useCanvasStore.getState();
    const canvasContainer = document.querySelector(".canvas-bg");
    const rect = canvasContainer
      ? canvasContainer.getBoundingClientRect()
      : {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
    const currentZoom = (state.zoom ?? 100) / 100;
    const cx = (-(state.panX ?? 0) + rect.width / 2 - 400) / currentZoom;
    const cy = (-(state.panY ?? 0) + rect.height / 2 - 400) / currentZoom;

    addPage(type, cx, cy);
    setTimeout(() => {
      const newState = useCanvasStore.getState();
      if (newState.activePageId) setActivePage(newState.activePageId);
    }, 50);
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

      setActiveDrag(null);
      setTimeout(() => {
        if (isDragging) {
          processDrop(item.type, isBlock, upEvent.clientX, upEvent.clientY);
        } else {
          if (isBlock) handleTapToAddBlock(item.type as BlockType);
          else handleTapToAddPage(item.type as PageContent["type"]);
        }
      }, 0);
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
    )
      return;

    const canvasContainer = document.querySelector(".canvas-bg");
    const rect = canvasContainer
      ? canvasContainer.getBoundingClientRect()
      : { left: 0, top: 0 };

    const currentZoom = (state.zoom ?? 100) / 100;
    const dropCanvasX = (clientX - rect.left - (state.panX ?? 0)) / currentZoom;
    const dropCanvasY = (clientY - rect.top - (state.panY ?? 0)) / currentZoom;

    if (!isBlock) {
      state.addPage(type as PageContent["type"], dropCanvasX, dropCanvasY);
      setTimeout(() => {
        const ns = useCanvasStore.getState();
        if (ns.activePageId) setActivePage(ns.activePageId);
      }, 50);
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
        setActivePage(targetPage.id);
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
            setActivePage(newState.activePageId);
          }
        }, 50);
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
        className={`h-[calc(100vh-5.5rem)] m-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden shrink-0 z-20 transition-all duration-300 ease-in-out ${isCollapsed ? "w-16" : "w-72"}`}
      >
        <div
          className={`p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-2 shrink-0 ${isCollapsed ? "items-center px-2" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            {!isCollapsed && (
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap overflow-hidden">
                {t("title")}
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
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
              <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-xs font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 select-none shrink-0 custom-scrollbar touch-pan-y">
          {/* AI Generator */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsAiOpen(!isAiOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg text-left transition-colors whitespace-nowrap overflow-hidden"
              >
                <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> {t("intelligence")}
                </span>
                {isAiOpen ? (
                  <ChevronUp className="w-3 h-3 text-indigo-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-indigo-400 shrink-0" />
                )}
              </button>
            ) : (
              <div className="h-px bg-zinc-200/50 dark:bg-zinc-800 w-6 mx-auto my-2" />
            )}

            {(isAiOpen || isCollapsed) && (
              <div className="space-y-0.5">
                <div
                  onClick={() => setIsAiModalOpen(true)}
                  className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "justify-start gap-3 p-2"} rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-900/30 transition-all group shrink-0 cursor-pointer`}
                >
                  <div className="p-1.5 bg-indigo-100/50 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-600 dark:group-hover:border-indigo-500 transition-all shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="space-y-0.5 min-w-0 pointer-events-none whitespace-nowrap animate-in fade-in duration-200 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-bold text-indigo-700 dark:text-indigo-300 tracking-tight group-hover:text-indigo-900 dark:group-hover:text-indigo-100">
                          {t("aiGenerator")}
                        </p>
                        <span className="text-[9px] font-mono font-bold text-indigo-400/70 dark:text-indigo-500/70 bg-indigo-100/50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                          ⌘J
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 leading-tight truncate">
                        {t("generatePrompt")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="h-px bg-zinc-100/80 dark:bg-zinc-800/80 my-1 mx-2" />
          )}

          {/* Building Blocks */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsBlocksOpen(!isBlocksOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg text-left transition-colors whitespace-nowrap overflow-hidden"
              >
                <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t("buildingBlocks")} ({filteredBlocks.length})
                </span>
                {isBlocksOpen ? (
                  <ChevronUp className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                )}
              </button>
            ) : (
              <div className="h-px bg-zinc-200/50 dark:bg-zinc-800 w-6 mx-auto my-2" />
            )}

            {(isBlocksOpen || isCollapsed) && (
              <div className="space-y-0.5">
                {filteredBlocks.map((item) => (
                  <div
                    key={item.type}
                    onPointerDown={(e) => handlePointerDown(e, item, true)}
                    className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "justify-start gap-3 p-2"} rounded-xl text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border border-transparent transition-all group shrink-0 cursor-grab active:cursor-grabbing`}
                  >
                    <div className="p-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-950 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-950 transition-all shrink-0 pointer-events-none">
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="space-y-0.5 min-w-0 pointer-events-none whitespace-nowrap animate-in fade-in duration-200">
                        <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight group-hover:text-zinc-950 dark:group-hover:text-white">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight truncate">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="h-px bg-zinc-100/80 dark:bg-zinc-800/80 my-1 mx-2" />
          )}

          {/* Page Frames */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg text-left transition-colors whitespace-nowrap overflow-hidden"
              >
                <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t("pageFrames")} ({filteredTemplates.length})
                </span>
                {isTemplatesOpen ? (
                  <ChevronUp className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                )}
              </button>
            ) : (
              <div className="h-px bg-zinc-200/50 dark:bg-zinc-800 w-6 mx-auto my-3" />
            )}

            {(isTemplatesOpen || isCollapsed) && (
              <div className="space-y-0.5">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.type}
                    onPointerDown={(e) => handlePointerDown(e, template, false)}
                    className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "justify-start gap-3 p-2"} rounded-xl text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border border-transparent transition-all group shrink-0 cursor-grab active:cursor-grabbing`}
                  >
                    <div className="p-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-950 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-950 transition-all shrink-0 pointer-events-none">
                      {template.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="space-y-0.5 min-w-0 pointer-events-none whitespace-nowrap animate-in fade-in duration-200">
                        <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight group-hover:text-zinc-950 dark:group-hover:text-white">
                          {template.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight truncate">
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

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 w-96 animate-in zoom-in-95 fade-in">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider px-1">
              <Sparkles className="w-4 h-4" /> {t("aiGenerator")}
            </div>
            <textarea
              autoFocus
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                t("aiPlaceholder") || "Describe what you want to build..."
              }
              className="w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-indigo-500/50 shadow-inner"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAiGenerate();
                }
                if (e.key === "Escape") setIsAiModalOpen(false);
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono pl-1">
                {t("pressEnter") || "Press Enter to generate"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-2 rounded-lg transition-colors"
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all shadow-lg flex items-center gap-2"
                >
                  {isAiGenerating
                    ? t("building") || "Building..."
                    : t("generate") || "Generate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag Indicator */}
      {activeDrag && (
        <div
          className="fixed z-[99999] pointer-events-none flex items-center gap-3 p-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-2 border-blue-500 dark:border-blue-400 rounded-xl shadow-2xl scale-105 transition-colors"
          style={{ left: activeDrag.x + 15, top: activeDrag.y + 15 }}
        >
          <div className="p-1.5 bg-zinc-950 dark:bg-white rounded-lg text-white dark:text-zinc-950">
            {activeDrag.icon}
          </div>
          <div className="space-y-0.5 whitespace-nowrap pr-2">
            <p className="text-[12px] font-bold text-zinc-950 dark:text-white">
              {activeDrag.label}
            </p>
            <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              {t("dropToCanvas")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
