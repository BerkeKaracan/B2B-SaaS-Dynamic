"use client";
import React from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockContent } from "@/types/record";
import TextBlock from "./TextBlock";
import FormBlock from "./FormBlock";
import DateBlock from "./DateBlock";
import DropdownBlock from "./DropdownBlock";

export default function CanvasArea() {
  const {
    blocks,
    updateBlockValue,
    updateBlockSettings,
    setActiveBlock,
    activeBlockId,
    removeBlock,
  } = useCanvasStore();

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[35vh] border border-dashed border-zinc-200 rounded-2xl text-zinc-400 bg-zinc-50/30 my-8 px-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mb-2 opacity-50 text-zinc-400"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <p className="text-xs font-semibold text-zinc-500 tracking-tight">
          Select an element from the library to add content
        </p>
      </div>
    );
  }

  const renderBlock = (block: BlockContent, isActive: boolean) => {
    switch (block.type) {
      case "text":
        return (
          <TextBlock
            block={block}
            onUpdate={(val: string) => updateBlockValue(block.id, val)}
          />
        );
      case "form":
        return (
          <FormBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(block.id, settings)
            }
          />
        );
      case "date":
        return (
          <DateBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(block.id, settings)
            }
          />
        );
      case "dropdown":
        return (
          <DropdownBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(block.id, val)}
            onSettingsChange={(settings: Record<string, unknown>) =>
              updateBlockSettings(block.id, settings)
            }
          />
        );
      default:
        return (
          <div className="text-red-500 text-xs font-mono">
            Unknown layout element: {block.type}
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-1">
      {blocks.map((block) => {
        const isActive = activeBlockId === block.id;
        return (
          <div
            key={block.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveBlock(block.id);
            }}
            className={`group relative pl-6 pr-12 py-3 transition-all duration-150 border-l-2 rounded-r-md ${
              isActive
                ? "border-zinc-900 bg-zinc-50/40"
                : "border-transparent hover:border-zinc-200 hover:bg-zinc-50/20"
            }`}
          >
            {isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBlock(block.id);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50/50 transition-colors z-20"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
            <div className="w-full">{renderBlock(block, isActive)}</div>
          </div>
        );
      })}
    </div>
  );
}
