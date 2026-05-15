"use client";
import React from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { BlockContent } from "@/types/record";
import TextBlock from "./TextBlock";
import FormBlock from "./FormBlock";

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
      <div className="flex flex-col items-center justify-center h-[30vh] border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 bg-zinc-50/50 my-10">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mb-2 opacity-40"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p className="text-xs font-medium">
          Click a block on the left to add a new field
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
            onUpdate={(val: unknown) => updateBlockValue(block.id, val)}
          />
        );
      case "form":
        return (
          <FormBlock
            block={block}
            isActive={isActive}
            onUpdate={(val: string) => updateBlockValue(block.id, val)}
            onSettingsChange={(settings) =>
              updateBlockSettings(block.id, settings)
            }
          />
        );
      default:
        return (
          <div className="text-red-500 text-[10px]">
            Unknown block: {block.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-3 max-w-2xl mx-auto py-6">
      {blocks.map((block) => {
        const isActive = activeBlockId === block.id;
        return (
          <div
            key={block.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveBlock(block.id);
            }}
            className={`group relative p-3 py-4 rounded-lg transition-all border ${
              isActive
                ? "border-zinc-300 bg-white shadow-sm ring-1 ring-zinc-900/5"
                : "border-transparent hover:bg-zinc-50/50"
            }`}
          >
            {isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBlock(block.id);
                }}
                className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-100 transition-colors z-20"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            )}

            <div className="pr-6">{renderBlock(block, isActive)}</div>
          </div>
        );
      })}
    </div>
  );
}
