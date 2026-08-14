'use client';

import React, { type CSSProperties } from 'react';
import { Clock } from 'lucide-react';
import type { CalendarEvent } from './types';
import { eventPalette } from './calendarStyles';
import { formatEventTime } from './calendarUtils';

type EventChipProps = {
  event: CalendarEvent;
  allDayLabel: string;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
};

export function EventChip({
  event,
  allDayLabel,
  onClick,
  compact = true,
}: EventChipProps) {
  const palette = eventPalette(event.color);
  const time = formatEventTime(event, allDayLabel);
  const tone = {
    '--ev-bar': palette.bar,
    '--ev-fill': palette.fill,
    '--ev-text': palette.text,
    '--ev-fill-dark': palette.darkFill,
    '--ev-text-dark': palette.darkText,
  } as CSSProperties;

  return (
    <button
      type="button"
      title={`${event.title} · ${time}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`group/chip w-full text-left rounded-md overflow-hidden transition-transform hover:-translate-y-px bg-[var(--ev-fill)] text-[var(--ev-text)] dark:bg-[var(--ev-fill-dark)] dark:text-[var(--ev-text-dark)] shadow-[inset_3px_0_0_var(--ev-bar)] ${
        compact ? 'px-1.5 py-0.5' : 'px-2.5 py-2'
      }`}
      style={tone}
    >
      {compact ? (
        <span className="flex items-center gap-1 min-w-0">
          {!event.allDay && event.startTime ? (
            <span className="shrink-0 text-[9px] font-bold tabular-nums opacity-80">
              {event.startTime}
            </span>
          ) : null}
          <span className="truncate text-[10px] font-semibold leading-tight">
            {event.title}
          </span>
        </span>
      ) : (
        <span className="flex items-start gap-2 min-w-0">
          <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-[var(--ev-bar)]" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold truncate">
              {event.title}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium opacity-80">
              <Clock className="w-3 h-3" />
              {time}
            </span>
            {event.notes ? (
              <span className="mt-1 block text-[11px] opacity-70 line-clamp-2">
                {event.notes}
              </span>
            ) : null}
          </span>
        </span>
      )}
    </button>
  );
}
