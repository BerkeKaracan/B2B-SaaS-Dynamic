"use client";
import React from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";

export default function ProjectInfoPanel() {
  const { isSecondarySidebarOpen, toggleSecondarySidebar } = useLayoutStore();
  const { title, description, date, setTitle, setDescription, setDate, recordId } =
    useCanvasStore();

  if (!isSecondarySidebarOpen) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-3 border-l border-zinc-200/80 bg-[#FAFAFA] shrink-0">
        <button
          type="button"
          onClick={toggleSecondarySidebar}
          className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 rounded-md transition-all"
          aria-label="Open project info"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M15 18l-6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="w-[280px] h-full flex flex-col border-l border-zinc-200/80 bg-[#FAFAFA] shrink-0">
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-200/50 shrink-0">
        <button
          type="button"
          onClick={toggleSecondarySidebar}
          className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 rounded-md transition-all"
          aria-label="Close project info"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Project Info
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {!recordId ? (
          <p className="text-sm text-zinc-500">
            Open a project to edit its details.
          </p>
        ) : (
          <>
            <Field label="Project name">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </Field>
          </>
        )}
      </div>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  );
}
