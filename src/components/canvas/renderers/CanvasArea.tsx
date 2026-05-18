"use client";
import React, {
  useRef,
  useState,
  MouseEvent,
  WheelEvent,
  useEffect,
  DragEvent,
} from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockContent, PageContent, BlockType } from "@/types/record";
import TextBlock from "./TextBlock";
import FormBlock from "./FormBlock";
import DateBlock from "./DateBlock";
import DropdownBlock from "./DropdownBlock";
import ToggleSwitchBlock from "./ToggleSwitchBlock";
import BadgeSelectorBlock from "./BadgeSelectorBlock";
import AssetStreamBlock from "./AssetStreamBlock";

export default function CanvasArea() {
  const store = useCanvasStore();
  const pages = store.pages ?? [];
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
  } = store;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{
    pageId: string;
    blockId: string;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      if (isPanning) {
        setPan(e.clientX - panStart.x, e.clientY - panStart.y);
      } else if (draggedPageId) {
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
      setIsPanning(false);
      setDraggedPageId(null);
      setDraggedBlockInfo(null);
    };

    if (isPanning || draggedPageId || draggedBlockInfo) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isPanning,
    draggedPageId,
    draggedBlockInfo,
    panStart,
    dragOffset,
    setPan,
    updatePagePosition,
    updateBlockPosition,
  ]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    );
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 5 : -5;
      setZoom(zoom + zoomFactor);
    } else {
      setPan(panX - e.deltaX, panY - e.deltaY);
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (
      e.target === containerRef.current ||
      (e.target as HTMLElement).classList.contains("infinite-grid-layer")
    ) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
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
    const currentZoom = (zoom ?? 100) / 100;

    const mouseCanvasX = (e.clientX - rect.left - (panX ?? 0)) / currentZoom;
    const mouseCanvasY = (e.clientY - rect.top - (panY ?? 0)) / currentZoom;

    const blockX = mouseCanvasX - (page.x ?? 0);
    const blockY = mouseCanvasY - (page.y ?? 0);

    addBlockToPage(page.id, type, blockX, blockY);
    setActivePage(page.id);
  };

  const renderBlock = (
    pageId: string,
    block: BlockContent,
    isActive: boolean,
  ) => {
    switch (block.type) {
      case "text":
        return (
          <TextBlock
            block={block}
            onUpdate={(val: string) => updateBlockValue(pageId, block.id, val)}
          />
        );
      case "form":
        return (
          <FormBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(pageId, block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(pageId, block.id, settings)
            }
          />
        );
      case "date":
        return (
          <DateBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(pageId, block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(pageId, block.id, settings)
            }
          />
        );
      case "dropdown":
        return (
          <DropdownBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(pageId, block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(pageId, block.id, settings)
            }
          />
        );
      case "checkbox":
        return (
          <ToggleSwitchBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: boolean) => updateBlockValue(pageId, block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(pageId, block.id, settings)
            }
          />
        );
      case "badge_selector":
        return (
          <BadgeSelectorBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(pageId, block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(pageId, block.id, settings)
            }
          />
        );
      case "asset_stream":
        return (
          <AssetStreamBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(pageId, block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(pageId, block.id, settings)
            }
          />
        );
      default:
        return (
          <div className="font-mono text-xs text-red-500">
            Unknown element: {block.type}
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#F9F9FB]"
      onWheel={handleWheel}
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
        {pages.map((page: PageContent) => {
          const isPageActive = activePageId === page.id;
          const px = page.x ?? 150;
          const py = page.y ?? 150;

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
              className={`absolute bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-md pointer-events-auto transition-shadow focus:outline-none ${
                isPageActive
                  ? "ring-2 ring-blue-500 shadow-2xl z-10"
                  : "ring-1 ring-zinc-200/80 hover:shadow-xl z-0"
              }`}
              style={{
                left: `${px}px`,
                top: `${py}px`,
                width: `${page.width}px`,
                minHeight: `${page.height}px`,
              }}
            >
              <div
                onMouseDown={(e) => startPageDrag(e, page.id, px, py)}
                className="absolute -top-8 left-0 flex items-center gap-2 text-zinc-500 font-bold text-[11px] uppercase tracking-wider cursor-move px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
              >
                <span># {page.title}</span>
              </div>

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
