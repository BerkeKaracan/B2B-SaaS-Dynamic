"use client";
import React from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";

export default function ProjectInfoSidebar() {
  const { toggleSecondarySidebar } = useLayoutStore();

  const {
    title,
    description,
    date,
    setTitle,
    setDescription,
    setDate,
    saveProject,
    isSaving,
  } = useCanvasStore();

  const handleSave = () => {
    const testUUID = "550e8400-e29b-41d4-a716-446655440000";
    saveProject(testUUID);
  };

  return (
    <div className="flex flex-col h-full bg-white w-full">
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-100 shrink-0">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          Project Info
        </span>
        <button
          onClick={toggleSecondarySidebar}
          className="p-1 hover:bg-zinc-100 rounded text-zinc-400 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">
            Project Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Project"
            className="w-full bg-transparent text-sm font-semibold text-zinc-800 outline-none border-b border-zinc-100 pb-2 focus:border-zinc-900 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a brief description..."
            className="w-full bg-transparent text-sm text-zinc-500 outline-none h-24 resize-none border border-zinc-100 p-2 rounded focus:border-zinc-900 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">
            Target Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-zinc-50 text-xs font-medium text-zinc-600 p-2 border border-zinc-100 rounded outline-none"
          />
        </div>
      </div>

      <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-md hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors shadow-sm"
        >
          {isSaving ? "SAVING TO BACKEND..." : "SAVE PROJECT"}
        </button>
      </div>
    </div>
  );
}
