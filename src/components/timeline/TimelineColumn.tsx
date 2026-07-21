'use client';

import React from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TimelineEventCard, {
  type TimelineEventCardLabels,
} from './TimelineEventCard';
import { DAY_ACCENT, hexWithAlpha } from './timelineStyles';
import type { TimelineDayColumn, TimelineEvent } from './types';

interface TimelineColumnProps {
  column: TimelineDayColumn;
  events: TimelineEvent[];
  isReadonly: boolean;
  openEventMenu: string | null;
  labels: TimelineEventCardLabels & {
    addEvent: string;
    emptyDay: string;
    emptyDayHint: string;
    today: string;
  };
  onAddEvent: (monthKey: string) => void;
  onToggleMenu: (eventId: string) => void;
  onCloseMenu: () => void;
  onEdit: (monthKey: string, event: TimelineEvent) => void;
  onDuplicate: (event: TimelineEvent) => void;
  onDelete: (eventId: string, title: string) => void;
}

function TimelineColumn({
  column,
  events,
  isReadonly,
  openEventMenu,
  labels,
  onAddEvent,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDuplicate,
  onDelete,
}: TimelineColumnProps) {
  const accent = column.isToday
    ? DAY_ACCENT.today
    : column.isWeekend
      ? DAY_ACCENT.weekend
      : DAY_ACCENT.weekday;

  const wash = hexWithAlpha(accent, column.isToday ? 0.16 : 0.1);
  const washStrong = hexWithAlpha(accent, column.isToday ? 0.26 : 0.16);
  const washSoft = hexWithAlpha(accent, 0.06);
  const borderTint = hexWithAlpha(accent, column.isToday ? 0.45 : 0.28);
  const badgeBg = hexWithAlpha(accent, 0.18);
  const badgeBorder = hexWithAlpha(accent, 0.4);

  return (
    <div
      data-timeline-col
      className={`relative w-[85vw] sm:w-[320px] shrink-0 flex flex-col h-full max-h-full rounded-2xl border overflow-hidden transition-[box-shadow,border-color,transform] duration-300 bg-zinc-50 dark:bg-zinc-950/50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] ${
        column.isToday
          ? 'shadow-[0_8px_28px_-10px_rgba(14,165,233,0.35)] dark:shadow-[0_8px_28px_-10px_rgba(14,165,233,0.25)]'
          : ''
      }`}
      style={{ borderColor: borderTint }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-80"
        style={{
          background: `linear-gradient(180deg, ${washStrong} 0%, ${washSoft} 34%, transparent 64%)`,
        }}
        aria-hidden
      />

      {/* Accent rail — today gets a soft pulse shimmer */}
      <div className="relative h-1.5 w-full shrink-0 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${accent} 0%, ${hexWithAlpha(accent, 0.85)} 55%, ${hexWithAlpha(accent, 0.2)} 100%)`,
          }}
        />
        {column.isToday && (
          <div
            className="absolute inset-0 animate-pulse opacity-50"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${hexWithAlpha(accent, 0.9)} 50%, transparent 100%)`,
            }}
          />
        )}
      </div>

      {/* Day header */}
      <div
        className="relative px-3.5 py-3 flex items-center justify-between gap-2 shrink-0 border-b backdrop-blur-[2px]"
        style={{
          borderColor: borderTint,
          background: `linear-gradient(90deg, ${washStrong} 0%, ${hexWithAlpha(accent, 0.05)} 100%)`,
        }}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider truncate"
              style={{ color: accent }}
            >
              {column.monthName} {column.year}
            </span>
            {column.isToday && (
              <span className="px-1.5 py-0.5 bg-sky-600 text-white text-[9px] font-bold rounded-md uppercase tracking-wider shadow-sm shadow-sky-600/30 animate-in fade-in zoom-in-95 duration-300">
                {labels.today}
              </span>
            )}
          </div>
          <div className="flex items-end gap-1.5 mt-0.5">
            <span className="text-[1.65rem] font-bold leading-none tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
              {column.dayNum}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider mb-0.5 text-zinc-600 dark:text-zinc-300">
              {column.dayName}
            </span>
          </div>
        </div>

        <span
          className="min-w-7 h-7 px-1.5 inline-flex items-center justify-center rounded-lg text-[11px] font-bold tabular-nums shrink-0 border"
          style={{
            backgroundColor: badgeBg,
            borderColor: badgeBorder,
            color: accent,
          }}
        >
          {events.length}
        </span>
      </div>

      <Droppable droppableId={column.key}>
        {(provided, snapshot) => (
          <div
            className={`relative flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 custom-scrollbar transition-[background-color,box-shadow] duration-200 min-h-40 ${
              snapshot.isDraggingOver
                ? 'ring-1 ring-inset ring-sky-400/50 dark:ring-sky-600/45'
                : ''
            }`}
            style={{
              background: snapshot.isDraggingOver
                ? `linear-gradient(180deg, ${hexWithAlpha(accent, 0.16)} 0%, ${hexWithAlpha(accent, 0.05)} 100%)`
                : undefined,
            }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {events.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-10 px-4 text-center pointer-events-none min-h-32">
                <div
                  className="w-11 h-11 rounded-xl border border-dashed flex items-center justify-center"
                  style={{
                    borderColor: badgeBorder,
                    background: `linear-gradient(145deg, ${washStrong}, ${hexWithAlpha(accent, 0.04)})`,
                    boxShadow: `inset 0 0 0 1px ${hexWithAlpha(accent, 0.12)}`,
                  }}
                >
                  <CalendarDays
                    className="w-4 h-4"
                    style={{ color: accent }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: accent }}>
                    {labels.emptyDay}
                  </p>
                  <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {labels.emptyDayHint}
                  </p>
                </div>
              </div>
            )}

            {events.map((event, index) => (
              <Draggable
                key={event.id}
                draggableId={event.id}
                index={index}
                isDragDisabled={isReadonly}
              >
                {(dragProvided, dragSnapshot) => (
                  <TimelineEventCard
                    event={event}
                    provided={dragProvided}
                    snapshot={dragSnapshot}
                    isMenuOpen={openEventMenu === event.id}
                    labels={labels}
                    onOpen={() => onEdit(column.key, event)}
                    onToggleMenu={() => onToggleMenu(event.id)}
                    onEdit={() => {
                      onCloseMenu();
                      onEdit(column.key, event);
                    }}
                    onDuplicate={() => onDuplicate(event)}
                    onDelete={() => onDelete(event.id, event.title)}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {!isReadonly && (
              <button
                type="button"
                onClick={() => onAddEvent(column.key)}
                className="mt-0.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border border-dashed group/add bg-white/60 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400"
                style={{ borderColor: badgeBorder }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = wash;
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.color = accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.borderColor = badgeBorder;
                  e.currentTarget.style.color = '';
                }}
              >
                <Plus className="w-3.5 h-3.5 opacity-70 group-hover/add:opacity-100 transition-opacity" />
                {labels.addEvent.replace(/^\+\s*/, '')}
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default React.memo(TimelineColumn);
