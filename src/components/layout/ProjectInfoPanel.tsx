"use client";
import React, { useState } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export default function ProjectInfoPanel() {
  const { isSecondarySidebarOpen, toggleSecondarySidebar } = useLayoutStore();
  const {
    title,
    description,
    date,
    setTitle,
    setDescription,
    setDate,
    recordId,
    isSaving,
    showSaved,
  } = useCanvasStore();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  if (!isSecondarySidebarOpen) {
    return null;
  }

  const dateValue = date ? new Date(date) : undefined;

  return (
    <aside className="w-[280px] h-full flex flex-col border-l border-zinc-200/80 bg-[#FAFAFA] shrink-0 z-30">
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-200/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Project Settings
          </span>
          {isSaving && (
            <span className="text-[10px] font-medium text-blue-500 animate-pulse">
              Saving...
            </span>
          )}
          {showSaved && !isSaving && (
            <span className="text-[10px] font-medium text-emerald-500">
              Saved
            </span>
          )}
        </div>
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
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {recordId && (
          <>
            <Field label="Project Name">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium text-zinc-800"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium text-zinc-800"
              />
            </Field>

            <Field label="Target Date">
              <Popover.Root
                open={isCalendarOpen}
                onOpenChange={setIsCalendarOpen}
              >
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-left hover:bg-zinc-50 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span
                      className={
                        !date
                          ? "text-zinc-400 font-normal"
                          : "text-zinc-800 font-medium"
                      }
                    >
                      {dateValue
                        ? format(dateValue, "MMMM d, yyyy")
                        : "Select a deadline..."}
                    </span>
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    align="start"
                    sideOffset={4}
                    className="z-50 bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-3 animate-in fade-in zoom-in-95"
                  >
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(selectedDate: Date | undefined) => {
                        if (selectedDate) {
                          const localDate = new Date(
                            selectedDate.getTime() -
                              selectedDate.getTimezoneOffset() * 60000,
                          )
                            .toISOString()
                            .split("T")[0];

                          setDate(localDate);
                          setIsCalendarOpen(false); 
                        }
                      }}
                    />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider select-none">
        {label}
      </label>
      {children}
    </div>
  );
}
