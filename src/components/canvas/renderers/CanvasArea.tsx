"use client";
import { useCanvasStore } from "@/store/useCanvasStore";
import TextBlock from "@/components/canvas/renderers/TextBlock";

export default function CanvasArea() {
  const { blocks, updateBlockValue, setActiveBlock, activeBlockId } =
    useCanvasStore();

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
        <p className="text-sm">
          Select a block from the left to start building
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <div
          key={block.id}
          onClick={() => setActiveBlock(block.id)}
          className={`group relative p-4 rounded-lg transition-all border ${
            activeBlockId === block.id
              ? "border-blue-500 bg-blue-50/10 shadow-sm"
              : "border-transparent hover:bg-slate-50"
          }`}
        >
          <span className="absolute -left-3 top-2 text-[10px] font-bold uppercase bg-slate-200 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {block.type}
          </span>

          {block.type === "text" && (
            <TextBlock
              block={block}
              onUpdate={(val) => updateBlockValue(block.id, val)}
            />
          )}

          {block.type !== "text" && (
            <div className="text-slate-400 italic text-sm">
              Renderer for {block.type} is coming soon...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
