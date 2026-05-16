"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={className}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-zinc-800",
        nav: "space-x-1 flex items-center",
        nav_button:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-zinc-400 rounded-md w-9 font-medium text-[0.8rem] uppercase",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-zinc-100 focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-medium text-zinc-700 aria-selected:opacity-100 hover:bg-zinc-100 hover:text-zinc-900 rounded-md flex items-center justify-center transition-colors",
        day_selected:
          "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white rounded-md",
        day_today: "bg-zinc-100 text-zinc-900",
        day_outside: "text-zinc-300 opacity-50",
        day_disabled: "text-zinc-300 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
