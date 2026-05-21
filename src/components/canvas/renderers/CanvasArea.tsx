"use client";
import React, {
  useRef,
  useState,
  useEffect,
  DragEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useCanvasStore, PageWithSettings } from "@/store/useCanvasStore";
import { BlockContent, BlockType, PageContent } from "@/types/record";
import { ConnectionLayer } from "./ConnectionLayer";
import { LassoLayer } from "./LassoLayer";

import TextBlock from "./TextBlock";
import FormBlock from "./FormBlock";
import DateBlock from "./DateBlock";
import DropdownBlock from "./DropdownBlock";
import ToggleSwitchBlock from "./ToggleSwitchBlock";
import BadgeSelectorBlock from "./BadgeSelectorBlock";
import AssetStreamBlock from "./AssetStreamBlock";
import BlockResizer from "./BlockResizer";

export default function CanvasArea() {
  const store = useCanvasStore();
  const pages = (store.pages as PageWithSettings[]) ?? [];
  const connections = store.connections ?? [];
  const activePageId = store.activePageId ?? null;
  const activeBlockId = store.activeBlockId ?? null;
  const selectedBlocks = store.selectedBlocks ?? [];

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
    setSelectedBlocks,
    removeSelectedBlocks,
    removePage,
    removeBlockFromPage,
    setZoom,
    setPan,
    updatePagePosition,
    updateBlockPosition,
    updatePageDimensions,
    updatePageTitle,
    updatePageSettings,
    addConnection,
    removeConnection,
    undo,
    redo,
    saveHistory,
  } = store;

  const containerRef = useRef<HTMLDivElement>(null);

  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{
    pageId: string;
    blockId: string;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [resizingPageId, setResizingPageId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  const [connectingFrom, setConnectingFrom] = useState<{
    pageId: string;
    blockId: string;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(
    null,
  );

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [spacePanStart, setSpacePanStart] = useState({ x: 0, y: 0 });
  const activePointers = useRef<
    Map<number, { clientX: number; clientY: number }>
  >(new Map());
  const prevTouchDistance = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInputActive =
        activeElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);

      if (!isInputActive) {
        if (e.code === "Space" && !e.repeat) {
          e.preventDefault();
          setIsSpacePressed(true);
        }

        if (e.ctrlKey || e.metaKey) {
          if (e.key.toLowerCase() === "z") {
            e.preventDefault();
            e.shiftKey ? redo() : undo();
          } else if (e.key.toLowerCase() === "y") {
            e.preventDefault();
            redo();
          }
        }

        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          const currentState = useCanvasStore.getState();

          if (currentState.selectedBlocks?.length > 0) {
            removeSelectedBlocks();
          } else {
            const pId = currentState.activePageId;
            const bId = currentState.activeBlockId;
            if (pId && bId) removeBlockFromPage(pId, bId);
            else if (pId && !bId) removePage(pId);
          }
        }

        if (e.key === "Escape") setConnectingFrom(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsSpacePanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [undo, redo, removePage, removeBlockFromPage, removeSelectedBlocks]);

  useEffect(() => {
    const handleGlobalPointerMove = (e: globalThis.PointerEvent) => {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, {
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }

      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dx = pts[0].clientX - pts[1].clientX;
        const dy = pts[0].clientY - pts[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (prevTouchDistance.current !== null) {
          const delta = distance - prevTouchDistance.current;
          if (Math.abs(delta) > 2) {
            const currentStore = useCanvasStore.getState();
            const nextZoom = (currentStore.zoom ?? 100) + (delta > 0 ? 4 : -4);
            setZoom(nextZoom);
          }
        }
        prevTouchDistance.current = distance;
        return;
      }

      const state = useCanvasStore.getState();
      const currentZoom = (state.zoom ?? 100) / 100;

      const container = containerRef.current;
      const rect = container
        ? container.getBoundingClientRect()
        : { left: 0, top: 0 };

      const mouseCanvasX =
        (e.clientX - rect.left - (state.panX ?? 0)) / currentZoom;
      const mouseCanvasY =
        (e.clientY - rect.top - (state.panY ?? 0)) / currentZoom;

      if (connectingFrom) {
        setMousePos({ x: mouseCanvasX, y: mouseCanvasY });
      }

      if (isSpacePanning) {
        const dx = e.clientX - spacePanStart.x;
        const dy = e.clientY - spacePanStart.y;
        useCanvasStore.setState((prev) => ({
          panX: prev.panX + dx,
          panY: prev.panY + dy,
        }));
        setSpacePanStart({ x: e.clientX, y: e.clientY });
      } else if (lassoStart) {
        setLassoEnd({ x: mouseCanvasX, y: mouseCanvasY });

        const minX = Math.min(lassoStart.x, mouseCanvasX);
        const maxX = Math.max(lassoStart.x, mouseCanvasX);
        const minY = Math.min(lassoStart.y, mouseCanvasY);
        const maxY = Math.max(lassoStart.y, mouseCanvasY);

        const newSelected: string[] = [];
        pages.forEach((page) => {
          page.blocks.forEach((block) => {
            const bx = page.x + block.x;
            const by = page.y + block.y;
            if (bx < maxX && bx + 320 > minX && by < maxY && by + 150 > minY) {
              newSelected.push(block.id);
            }
          });
        });
        setSelectedBlocks(newSelected);
      } else if (draggedPageId) {
        updatePagePosition(
          draggedPageId,
          mouseCanvasX - dragOffset.x,
          mouseCanvasY - dragOffset.y,
        );
      } else if (draggedBlockInfo) {
        const targetPage = state.pages.find(
          (p) => p.id === draggedBlockInfo.pageId,
        );
        if (targetPage) {
          updateBlockPosition(
            draggedBlockInfo.pageId,
            draggedBlockInfo.blockId,
            mouseCanvasX - targetPage.x - dragOffset.x,
            mouseCanvasY - targetPage.y - dragOffset.y,
          );
        }
      } else if (resizingPageId) {
        updatePageDimensions(
          resizingPageId,
          Math.max(
            300,
            resizeStart.width + (e.clientX - resizeStart.x) / currentZoom,
          ),
          Math.max(
            300,
            resizeStart.height + (e.clientY - resizeStart.y) / currentZoom,
          ),
        );
      }
    };

    const handleGlobalPointerUp = (e: globalThis.PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) {
        prevTouchDistance.current = null;
      }

      if (draggedPageId || draggedBlockInfo || resizingPageId) saveHistory();
      setDraggedPageId(null);
      setDraggedBlockInfo(null);
      setResizingPageId(null);
      setLassoStart(null);
      setLassoEnd(null);
      setIsSpacePanning(false);
    };

    const handleGlobalPointerCancel = (e: globalThis.PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      prevTouchDistance.current = null;
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerCancel);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerCancel);
    };
  }, [
    draggedPageId,
    draggedBlockInfo,
    resizingPageId,
    connectingFrom,
    lassoStart,
    dragOffset,
    resizeStart,
    updatePagePosition,
    updateBlockPosition,
    updatePageDimensions,
    saveHistory,
    pages,
    setSelectedBlocks,
    isSpacePanning,
    spacePanStart,
  ]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const currentStore = useCanvasStore.getState();
    if (e.ctrlKey) {
      const nextZoom = (currentStore.zoom ?? 100) - e.deltaY * 0.5;
      setZoom(nextZoom);
    } else {
      const nextZoom = (currentStore.zoom ?? 100) - e.deltaY * 0.1;
      setZoom(nextZoom);
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    );
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    activePointers.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    const target = e.target as HTMLElement;
    const isTouch = e.pointerType === "touch";
    const activeEl = document.activeElement as HTMLElement;
    if (
      activeEl &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName)
    ) {
      if (!activeEl.contains(target)) {
        activeEl.blur();
      }
    }

    if (activePointers.current.size === 2) {
      setLassoStart(null);
      setIsSpacePanning(false);
      return;
    }

    if (
      isSpacePressed ||
      target === containerRef.current ||
      target.classList.contains("infinite-grid-layer") ||
      target.classList.contains("canvas-bg")
    ) {
      if (e.button === 1 || (e.button === 0 && isSpacePressed) || isTouch) {
        e.preventDefault();
        setIsSpacePanning(true);
        setSpacePanStart({ x: e.clientX, y: e.clientY });

        setActivePage(null);
        setActiveBlock(null);
        setSelectedBlocks([]);
        setConnectingFrom(null);
      } else if (e.button === 0 && !isSpacePressed && !isTouch) {
        const currentZoom = zoom / 100;
        const rect = containerRef.current?.getBoundingClientRect() || {
          left: 0,
          top: 0,
        };
        const mouseCanvasX = (e.clientX - rect.left - panX) / currentZoom;
        const mouseCanvasY = (e.clientY - rect.top - panY) / currentZoom;

        setLassoStart({ x: mouseCanvasX, y: mouseCanvasY });
        setLassoEnd({ x: mouseCanvasX, y: mouseCanvasY });

        setActivePage(null);
        setActiveBlock(null);
        setSelectedBlocks([]);
        setConnectingFrom(null);
      }
    }
  };

  const startPageDrag = (
    e: ReactPointerEvent,
    pageId: string,
    currentX: number,
    currentY: number,
  ) => {
    if (isSpacePressed || activePointers.current.size > 1) return;
    e.stopPropagation();
    e.preventDefault();
    setActivePage(pageId);
    const currentZoom = zoom / 100;
    const rect = containerRef.current?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };
    setDraggedPageId(pageId);
    setDragOffset({
      x: (e.clientX - rect.left - panX) / currentZoom - currentX,
      y: (e.clientY - rect.top - panY) / currentZoom - currentY,
    });
  };

  const startBlockDrag = (
    e: ReactPointerEvent,
    pageId: string,
    blockId: string,
    pageX: number,
    pageY: number,
    blockX: number,
    blockY: number,
  ) => {
    if (isSpacePressed || activePointers.current.size > 1) return;
    e.stopPropagation();
    e.preventDefault();
    setActivePage(pageId);
    setActiveBlock(blockId);
    const currentZoom = zoom / 100;
    const rect = containerRef.current?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };
    setDraggedBlockInfo({ pageId, blockId });
    setDragOffset({
      x: (e.clientX - rect.left - panX) / currentZoom - pageX - blockX,
      y: (e.clientY - rect.top - panY) / currentZoom - pageY - blockY,
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
    if (!type || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentZoom = zoom / 100;
    addBlockToPage(
      page.id,
      type,
      (e.clientX - rect.left - panX) / currentZoom - page.x,
      (e.clientY - rect.top - panY) / currentZoom - page.y,
    );
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
        <div className="w-full h-auto min-h-[40px] overflow-visible relative">
          {block.type === "text" && (
            <TextBlock
              block={block}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(s: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, s)
              }
            />
          )}
          {block.type === "form" && (
            <FormBlock
              block={block}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(s: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, s)
              }
              isActive={isActive}
            />
          )}
          {block.type === "date" && (
            <DateBlock
              block={block}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(s: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, s)
              }
              isActive={isActive}
            />
          )}
          {block.type === "dropdown" && (
            <DropdownBlock
              block={block}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(s: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, s)
              }
              isActive={isActive}
            />
          )}
          {block.type === "checkbox" && (
            <ToggleSwitchBlock
              block={block}
              onUpdate={(val: boolean) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(s: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, s)
              }
              isActive={isActive}
            />
          )}
          {block.type === "badge_selector" && (
            <BadgeSelectorBlock
              block={block}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(s: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, s)
              }
              isActive={isActive}
            />
          )}
          {block.type === "asset_stream" && (
            <AssetStreamBlock
              block={block}
              onUpdate={(val: string) =>
                updateBlockValue(pageId, block.id, val)
              }
              onSettingsChange={(s: Record<string, unknown>) =>
                updateBlockSettings(pageId, block.id, s)
              }
              isActive={isActive}
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

  let cursorStyle = "cursor-default";
  if (isSpacePressed || isSpacePanning) {
    cursorStyle = "cursor-grab active:cursor-grabbing";
  } else if (connectingFrom || lassoStart) {
    cursorStyle = "cursor-crosshair";
  }

  return (
    <div
      ref={containerRef}
      className={`canvas-bg absolute inset-0 overflow-hidden select-none touch-none bg-[#F9F9FB] ${cursorStyle}`}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
    >
      <div
        className="canvas-bg absolute inset-0 infinite-grid-layer pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ECECEF 1px, transparent 1px), linear-gradient(to bottom, #ECECEF 1px, transparent 1px)`,
          backgroundSize: `${40 * (zoom / 100)}px ${40 * (zoom / 100)}px`,
          backgroundPosition: `${panX}px ${panY}px`,
        }}
      />

      <div className="absolute top-4 left-4 z-50 bg-zinc-900/95 text-white backdrop-blur px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-mono shadow-md pointer-events-none flex items-center gap-3 hidden sm:flex">
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
        <ConnectionLayer
          connections={connections}
          pages={pages}
          connectingFrom={connectingFrom}
          mousePos={mousePos}
          onRemoveConnection={removeConnection}
        />

        <LassoLayer lassoStart={lassoStart} lassoEnd={lassoEnd} />

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
                if (
                  !isSpacePressed &&
                  !isSpacePanning &&
                  activePointers.current.size < 2
                ) {
                  e.stopPropagation();
                  setActivePage(page.id);
                  if (connectingFrom) setConnectingFrom(null);
                }
              }}
              onDragEnter={handleDragOverPage}
              onDragOver={handleDragOverPage}
              onDrop={(e) => handleDropOnPage(e, page)}
              className={`canvas-bg absolute shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-md pointer-events-auto transition-shadow focus:outline-none ${
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
                    className="bg-zinc-800 text-white text-[11px] font-bold px-2 py-1 rounded outline-none w-32 sm:w-40 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <div className="w-px h-4 bg-zinc-700 mx-1" />
                  <div className="relative flex items-center justify-center p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer overflow-hidden w-6 h-6">
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
                  onPointerDown={(e) => startPageDrag(e, page.id, px, py)}
                  className="absolute -top-8 left-0 flex items-center gap-2 text-zinc-500 font-bold text-[11px] uppercase tracking-wider cursor-move px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                >
                  <span># {page.title}</span>
                </div>
              )}

              {isPageActive && (
                <>
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
                  <div
                    className="absolute bottom-0 right-0 w-8 h-8 sm:w-4 sm:h-4 bg-blue-500 cursor-nwse-resize rounded-br-md rounded-tl-md z-50 flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setResizingPageId(page.id);
                      setResizeStart({
                        width: page.width,
                        height: page.height,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <path d="M21 15v6h-6M21 21l-7-7M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7M3 9V3h6M3 3l7 7" />
                    </svg>
                  </div>
                </>
              )}

              <div className="canvas-bg relative w-full h-full p-4 overflow-visible">
                {page.blocks.map((block) => {
                  const isBlockActive =
                    activeBlockId === block.id ||
                    selectedBlocks.includes(block.id);
                  const bx = block.x ?? 20;
                  const by = block.y ?? 20;

                  const bw = block.width ?? 320;
                  const bh = block.height ?? 120;

                  return (
                    <div
                      key={block.id}
                      onClick={(e) => {
                        if (
                          !isSpacePressed &&
                          !isSpacePanning &&
                          activePointers.current.size < 2
                        ) {
                          e.stopPropagation();
                          setActivePage(page.id);
                          setActiveBlock(block.id);
                          if (
                            connectingFrom &&
                            connectingFrom.blockId !== block.id
                          ) {
                            addConnection({
                              id: crypto.randomUUID(),
                              fromPage: connectingFrom.pageId,
                              fromBlock: connectingFrom.blockId,
                              toPage: page.id,
                              toBlock: block.id,
                            });
                            setConnectingFrom(null);
                          }
                        }
                      }}
                      onPointerUp={(e) => {
                        if (
                          connectingFrom &&
                          connectingFrom.blockId !== block.id
                        ) {
                          e.stopPropagation();
                          addConnection({
                            id: crypto.randomUUID(),
                            fromPage: connectingFrom.pageId,
                            fromBlock: connectingFrom.blockId,
                            toPage: page.id,
                            toBlock: block.id,
                          });
                          setConnectingFrom(null);
                        }
                      }}
                      className={`absolute bg-white border border-zinc-200/80 rounded-2xl p-5 pt-7 cursor-default select-text group transition-shadow ${
                        isBlockActive
                          ? "ring-2 ring-blue-500 shadow-xl z-20"
                          : "shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md z-10"
                      } ${connectingFrom && connectingFrom.blockId !== block.id ? "hover:ring-2 hover:ring-blue-400" : ""}`}
                      style={{
                        left: `${bx}px`,
                        top: `${by}px`,
                        width: `${bw}px`,
                        minHeight: `${bh}px`,
                      }}
                    >
                      {isBlockActive && (
                        <BlockResizer
                          pageId={page.id}
                          blockId={block.id}
                          x={bx}
                          y={by}
                          width={bw}
                          height={bh}
                        />
                      )}
                      <div
                        onPointerDown={(e) => {
                          if (!connectingFrom)
                            startBlockDrag(
                              e,
                              page.id,
                              block.id,
                              px,
                              py,
                              bx,
                              by,
                            );
                        }}
                        className="absolute top-0 left-0 right-0 h-10 sm:h-6 bg-zinc-50/50 hover:bg-zinc-100/80 border-b border-zinc-100/50 rounded-t-2xl flex items-center justify-center cursor-move transition-colors select-none"
                      >
                        <div className="flex gap-1 pointer-events-none">
                          <span className="w-1 h-1 bg-zinc-400 sm:bg-zinc-300 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-400 sm:bg-zinc-300 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-400 sm:bg-zinc-300 rounded-full" />
                          <span className="w-1 h-1 bg-zinc-400 sm:bg-zinc-300 rounded-full" />
                        </div>
                      </div>

                      {activeBlockId === block.id && (
                        <div className="absolute -top-4 -right-4 sm:-top-3 sm:-right-3 flex gap-1.5 sm:gap-1 z-30">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (connectingFrom?.blockId === block.id)
                                setConnectingFrom(null);
                              else
                                setConnectingFrom({
                                  pageId: page.id,
                                  blockId: block.id,
                                });
                            }}
                            className={`w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center bg-white border rounded-full shadow-sm transition-colors cursor-pointer select-none ${connectingFrom?.blockId === block.id ? "border-blue-500 text-blue-500 bg-blue-50" : "border-zinc-200 text-zinc-500 hover:text-blue-500"}`}
                          >
                            <svg
                              className="w-5 h-5 sm:w-3 sm:h-3"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlockFromPage(page.id, block.id);
                            }}
                            className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center bg-white border border-zinc-200 rounded-full text-zinc-400 hover:text-red-600 shadow-sm transition-colors cursor-pointer select-none"
                          >
                            <svg
                              className="w-5 h-5 sm:w-3 sm:h-3"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div onPointerDown={(e) => e.stopPropagation()}>
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

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={undo}
          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-sm transition-all"
        >
          <svg
            width="16"
            height="16"
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
          onClick={redo}
          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-sm transition-all"
        >
          <svg
            width="16"
            height="16"
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

      <div className="absolute bottom-6 right-6 sm:bottom-6 sm:right-6 left-6 sm:left-auto z-50 flex items-center justify-center gap-2 sm:gap-1.5 bg-white/95 backdrop-blur-md border border-zinc-200/80 rounded-2xl sm:rounded-xl p-2 sm:p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] pointer-events-auto">
        <button
          onClick={() => setZoom(zoom - 10)}
          className="flex-1 sm:flex-none w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-lg text-lg sm:text-xs font-black transition-all"
        >
          —
        </button>
        <span className="text-xs sm:text-[11px] font-extrabold text-zinc-600 min-w-[40px] sm:min-w-[36px] text-center tracking-tight">
          {zoom}%
        </span>
        <button
          onClick={() => setZoom(zoom + 10)}
          className="flex-1 sm:flex-none w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-lg text-lg sm:text-xs font-black transition-all"
        >
          +
        </button>
        <div className="w-px h-6 sm:h-4 bg-zinc-200 mx-1 sm:mx-0.5" />
        <button
          onClick={() => setPan(0, 0)}
          className="px-4 sm:px-2 h-10 sm:h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-lg text-xs sm:text-[10px] font-bold transition-all"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
