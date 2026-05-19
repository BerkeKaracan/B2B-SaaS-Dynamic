"use client";

import React, {
  useRef,
  useState,
  useEffect,
  MouseEvent,
  DragEvent,
} from "react";
import { useCanvasStore, PageWithSettings } from "@/store/useCanvasStore";
import { BlockContent, BlockType, PageContent } from "@/types/record";
import { useCanvasNavigation } from "@/hooks/useCanvasNavigation";

import TextBlock from "./TextBlock";
import FormBlock from "./FormBlock";
import DateBlock from "./DateBlock";
import DropdownBlock from "./DropdownBlock";
import ToggleSwitchBlock from "./ToggleSwitchBlock";
import BadgeSelectorBlock from "./BadgeSelectorBlock";
import AssetStreamBlock from "./AssetStreamBlock";

export default function CanvasArea() {
  const store = useCanvasStore();
  const pages = (store.pages as PageWithSettings[]) ?? [];
  const activePageId = store.activePageId ?? null;
  const activeBlockId = store.activeBlockId ?? null;
  const zoom = store.zoom ?? 100;
  const panX = store.panX ?? 0;
  const panY = store.panY ?? 0;
  const isLoading = store.isLoading ?? false;

  const {
    addBlockToPage,
    updateBlockValue,
    updateBlockSettings,
    setActivePage,
    setActiveBlock,
    removePage,
    removeBlockFromPage,
    setZoom,
    setPan,
    updatePagePosition,
    updateBlockPosition,
    updatePageTitle,
    updatePageSettings,
    undo,
    redo,
    saveHistory,
  } = store;

  const containerRef = useRef<HTMLDivElement>(null);

  // Native Zoom ve Pan Motorunu (Hook) Bağlıyoruz
  const { startPan } = useCanvasNavigation(containerRef);

  // Sürükle-Bırak State'leri
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{
    pageId: string;
    blockId: string;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 1. Zaman Makinesi Kısayolları (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInputActive =
        activeElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);

      if (!isInputActive && (e.ctrlKey || e.metaKey)) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // 2. Blok ve Sayfa Sürükleme (Drag & Drop) Motoru
  useEffect(() => {
    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      if (draggedPageId) {
        const state = useCanvasStore.getState();
        const currentZoom = (state.zoom ?? 100) / 100;
        const currentPanX = state.panX ?? 0;
        const currentPanY = state.panY ?? 0;

        const newX = (e.clientX - currentPanX) / currentZoom - dragOffset.x;
        const newY = (e.clientY - currentPanY) / currentZoom - dragOffset.y;
        updatePagePosition(draggedPageId, newX, newY);
      } else if (draggedBlockInfo) {
        const state = useCanvasStore.getState();
        const currentZoom = (state.zoom ?? 100) / 100;
        const currentPanX = state.panX ?? 0;
        const currentPanY = state.panY ?? 0;
        const targetPage = state.pages.find(
          (p) => p.id === draggedBlockInfo.pageId,
        );

        if (targetPage) {
          const mouseCanvasX = (e.clientX - currentPanX) / currentZoom;
          const mouseCanvasY = (e.clientY - currentPanY) / currentZoom;
          const newX = mouseCanvasX - targetPage.x - dragOffset.x;
          const newY = mouseCanvasY - targetPage.y - dragOffset.y;
          updateBlockPosition(
            draggedBlockInfo.pageId,
            draggedBlockInfo.blockId,
            newX,
            newY,
          );
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedPageId || draggedBlockInfo) {
        saveHistory();
      }
      setDraggedPageId(null);
      setDraggedBlockInfo(null);
    };

    if (draggedPageId || draggedBlockInfo) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    draggedPageId,
    draggedBlockInfo,
    dragOffset,
    updatePagePosition,
    updateBlockPosition,
    saveHistory,
  ]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    );
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Orta fare tuşu veya boşluğa tıklama ile Pan'ı tetikle
    if (
      e.button === 1 ||
      e.target === containerRef.current ||
      (e.target as HTMLElement).classList.contains("infinite-grid-layer")
    ) {
      if (e.button === 1) e.preventDefault();
      startPan(e.clientX, e.clientY);
      setActivePage(null);
    }
  };

  const startPageDrag = (
    e: MouseEvent,
    pageId: string,
    currentX: number,
    currentY: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePage(pageId);

    const currentZoom = zoom / 100;
    const mouseInCanvasX = (e.clientX - panX) / currentZoom;
    const mouseInCanvasY = (e.clientY - panY) / currentZoom;

    setDraggedPageId(pageId);
    setDragOffset({
      x: mouseInCanvasX - currentX,
      y: mouseInCanvasY - currentY,
    });
  };

  const startBlockDrag = (
    e: MouseEvent,
    pageId: string,
    blockId: string,
    pageX: number,
    pageY: number,
    blockX: number,
    blockY: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePage(pageId);
    setActiveBlock(blockId);

    const currentZoom = zoom / 100;
    const mouseInCanvasX = (e.clientX - panX) / currentZoom;
    const mouseInCanvasY = (e.clientY - panY) / currentZoom;

    setDraggedBlockInfo({ pageId, blockId });
    setDragOffset({
      x: mouseInCanvasX - pageX - blockX,
      y: mouseInCanvasY - pageY - blockY,
    });
  };

  const handleDragOverPage = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropOnPage = (e: DragEvent<HTMLElement>, page: PageContent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData("text/plain") as BlockType;
    if (!type) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentZoom = zoom / 100;

    const mouseCanvasX = (e.clientX - rect.left - panX) / currentZoom;
    const mouseCanvasY = (e.clientY - rect.top - panY) / currentZoom;

    const blockX = mouseCanvasX - page.x;
    const blockY = mouseCanvasY - page.y;

    addBlockToPage(page.id, type, blockX, blockY);
    setActivePage(page.id);
  };

  const renderBlock = (
    pageId: string,
    block: BlockContent,
    isActive: boolean,
  ) => {
    const hasOptions =
      block.type === "dropdown" || block.type === "badge_selector";
    const currentOptions =
      (block.settings?.options as string) ?? "Option 1, Option 2, Option 3";

    return (
      <div className="flex flex-col gap-3">
        <div>
          {block.type === "text" && (
            <TextBlock
              block={block}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(settings: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, settings)
              }
            />
          )}
          {block.type === "form" && (
            <FormBlock
              block={block}
              isActive={isActive}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(settings: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, settings)
              }
            />
          )}
          {block.type === "date" && (
            <DateBlock
              block={block}
              isActive={isActive}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(settings: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, settings)
              }
            />
          )}
          {block.type === "dropdown" && (
            <DropdownBlock
              block={block}
              isActive={isActive}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(settings: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, settings)
              }
            />
          )}
          {block.type === "checkbox" && (
            <ToggleSwitchBlock
              block={block}
              isActive={isActive}
              onUpdate={(val: boolean) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(settings: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, settings)
              }
            />
          )}
          {block.type === "badge_selector" && (
            <BadgeSelectorBlock
              block={block}
              isActive={isActive}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(settings: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, settings)
              }
            />
          )}
          {block.type === "asset_stream" && (
            <AssetStreamBlock
              block={block}
              isActive={isActive}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(settings: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, settings)
              }
            />
          )}
        </div>

        {isActive && hasOptions && (
          <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-col gap-1.5 animate-in fade-in duration-100">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Manage Choices (Comma Separated):
            </label>
            <input
              type="text"
              value={currentOptions}
              onChange={(e) =>
                updateBlockSettings(pageId, block.id, {
                  options: e.target.value,
                })
              }
              placeholder="e.g. Critical, High, Normal"
              className="text-[11px] font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 w-full text-zinc-800 focus:outline-none focus:border-zinc-950 focus:bg-white transition-all"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#F9F9FB]"
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute inset-0 infinite-grid-layer pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ECECEF 1px, transparent 1px),
            linear-gradient(to bottom, #ECECEF 1px, transparent 1px)
          `,
          backgroundSize: `${40 * (zoom / 100)}px ${40 * (zoom / 100)}px`,
          backgroundPosition: `${panX}px ${panY}px`,
        }}
      />

      <div className="absolute top-4 left-4 z-50 bg-zinc-900/95 text-white backdrop-blur px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-mono shadow-md pointer-events-none flex items-center gap-3">
        <span className="text-zinc-500 font-bold uppercase tracking-wider">
          Radar:
        </span>
        <span>X: {Math.round(panX)}</span>
        <span>Y: {Math.round(panY)}</span>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
          transformOrigin: "0 0",
        }}
      >
        {pages.map((page: PageWithSettings) => {
          const isPageActive = activePageId === page.id;
          const px = page.x ?? 150;
          const py = page.y ?? 150;
          const pageBgColor =
            (page.settings?.backgroundColor as string) || "#ffffff";

          return (
            <section
              key={page.id}
              role="region"
              aria-label={`Frame: ${page.title}`}
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setActivePage(page.id);
              }}
              onDragEnter={handleDragOverPage}
              onDragOver={handleDragOverPage}
              onDrop={(e) => handleDropOnPage(e, page)}
              className={`absolute shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-md pointer-events-auto transition-shadow focus:outline-none ${
                isPageActive
                  ? "ring-2 ring-blue-500 shadow-2xl z-10"
                  : "ring-1 ring-zinc-200/80 hover:shadow-xl z-0"
              }`}
              style={{
                left: `${px}px`,
                top: `${py}px`,
                width: `${page.width}px`,
                minHeight: `${page.height}px`,
                backgroundColor: pageBgColor,
              }}
            >
              {isPageActive && !activeBlockId ? (
                <div className="absolute -top-12 left-0 flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => updatePageTitle(page.id, e.target.value)}
                    className="bg-zinc-800 text-white text-[11px] font-bold px-2 py-1 rounded outline-none w-40 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <div className="w-px h-4 bg-zinc-700 mx-1" />
                  <div
                    className="relative flex items-center justify-center p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer overflow-hidden w-6 h-6"
                    title="Background Color"
                  >
                    <input
                      type="color"
                      value={pageBgColor}
                      onChange={(e) =>
                        updatePageSettings(page.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>
              ) : (
                <div
                  onMouseDown={(e) => startPageDrag(e, page.id, px, py)}
                  className="absolute -top-8 left-0 flex items-center gap-2 text-zinc-500 font-bold text-[11px] uppercase tracking-wider cursor-move px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                >
                  <span># {page.title}</span>
                </div>
              )}

              {isPageActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePage(page.id);
                  }}
                  className="absolute -top-8 right-0 text-zinc-400 hover:text-red-500 text-[11px] font-bold px-2 py-1 uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Delete Frame
                </button>
              )}

              <div className="relative w-full h-full p-4 overflow-visible">
                {page.blocks.map((block) => {
                  const isBlockActive = activeBlockId === block.id;
                  const bx = block.x ?? 20;
                  const by = block.y ?? 20;

                  return (
                    <div
                      key={block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePage(page.id);
                        setActiveBlock(block.id);
                      }}
                      className={`absolute bg-white border border-zinc-200/80 rounded-2xl p-5 pt-7 min-w-[320px] cursor-default select-text group transition-shadow ${
                        isBlockActive
                          ? "ring-2 ring-zinc-950 shadow-xl z-20"
                          : "shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md z-10"
                      }`}
                      style={{
                        left: `${bx}px`,
                        top: `${by}px`,
                      }}
                    >
                      <div
                        onMouseDown={(e) =>
                          startBlockDrag(e, page.id, block.id, px, py, bx, by)
                        }
                        className="absolute top-0 left-0 right-0 h-6 bg-zinc-50/50 hover:bg-zinc-100/80 border-b border-zinc-100/50 rounded-t-2xl flex items-center justify-center cursor-move transition-colors select-none"
                      >
                        <div className="flex gap-0.5 pointer-events-none">
                          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                        </div>
                      </div>

                      {isBlockActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlockFromPage(page.id, block.id);
                          }}
                          className="absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center bg-white border border-zinc-200 rounded-full text-zinc-400 hover:text-red-600 shadow-sm transition-colors z-30 cursor-pointer select-none"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}

                      <div onMouseDown={(e) => e.stopPropagation()}>
                        {renderBlock(page.id, block, isBlockActive)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Kontroller ve Undo/Redo Menüsü */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={undo}
          className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-sm transition-all"
          title="Undo (Ctrl+Z)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          type="button"
          onClick={redo}
          className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-sm transition-all"
          title="Redo (Ctrl+Y)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>
      </div>

      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-zinc-200/80 rounded-xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none pointer-events-auto">
        <button
          type="button"
          onClick={() => setZoom(zoom - 10)}
          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg text-xs font-black transition-all"
        >
          —
        </button>
        <span className="text-[11px] font-extrabold text-zinc-600 min-w-[36px] text-center tracking-tight">
          {zoom}%
        </span>
        <button
          type="button"
          onClick={() => setZoom(zoom + 10)}
          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg text-xs font-black transition-all"
        >
          +
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-0.5" />
        <button
          type="button"
          onClick={() => setPan(0, 0)}
          className="px-2 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg text-[10px] font-bold transition-all"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
