'use client';

import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { EVENT_COLORS, type CalendarEvent, type CalendarEventColor } from './types';
import { EVENT_UI, SURFACE } from './calendarStyles';
import { parseDateKey, toDateKey } from './calendarUtils';

type EventEditorProps = {
  event: CalendarEvent;
  isNew: boolean;
  isReadonly: boolean;
  labels: {
    add: string;
    edit: string;
    title: string;
    titlePlaceholder: string;
    date: string;
    allDay: string;
    start: string;
    end: string;
    notes: string;
    notesPlaceholder: string;
    color: string;
    save: string;
    cancel: string;
    delete: string;
  };
  onChange: (next: CalendarEvent) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
};

export default function EventEditor({
  event,
  isNew,
  isReadonly,
  labels,
  onChange,
  onSave,
  onCancel,
  onDelete,
}: EventEditorProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const selected = parseDateKey(event.date);

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-zinc-950/35 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isNew ? labels.add : labels.edit}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={labels.cancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {labels.title}
            </span>
            <input
              autoFocus
              disabled={isReadonly}
              value={event.title}
              onChange={(e) => onChange({ ...event, title: e.target.value })}
              placeholder={labels.titlePlaceholder}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400/60 disabled:opacity-60"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {labels.date}
            </span>
            <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  disabled={isReadonly}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-left flex items-center gap-2 disabled:opacity-60"
                >
                  <CalendarIcon className="w-4 h-4 text-zinc-500" />
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    {event.date}
                  </span>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="start"
                  sideOffset={6}
                  className="z-90 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg"
                >
                  <DatePicker
                    mode="single"
                    selected={selected}
                    onSelect={(date: Date | undefined) => {
                      if (!date) return;
                      onChange({ ...event, date: toDateKey(date) });
                      setDateOpen(false);
                    }}
                  />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              disabled={isReadonly}
              checked={event.allDay}
              onChange={(e) =>
                onChange({
                  ...event,
                  allDay: e.target.checked,
                  startTime: e.target.checked ? undefined : event.startTime || '09:00',
                  endTime: e.target.checked ? undefined : event.endTime || '10:00',
                })
              }
              className="rounded border-zinc-300"
            />
            {labels.allDay}
          </label>

          {!event.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {labels.start}
                </span>
                <input
                  type="time"
                  disabled={isReadonly}
                  value={event.startTime || '09:00'}
                  onChange={(e) =>
                    onChange({ ...event, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {labels.end}
                </span>
                <input
                  type="time"
                  disabled={isReadonly}
                  value={event.endTime || '10:00'}
                  onChange={(e) =>
                    onChange({ ...event, endTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {labels.color}
            </span>
            <div className="flex items-center gap-2">
              {EVENT_COLORS.map((color: CalendarEventColor) => (
                <button
                  key={color}
                  type="button"
                  disabled={isReadonly}
                  onClick={() => onChange({ ...event, color })}
                  className={`w-6 h-6 rounded-full ${EVENT_UI[color].dot} ${
                    event.color === color
                      ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {labels.notes}
            </span>
            <textarea
              disabled={isReadonly}
              value={event.notes || ''}
              onChange={(e) => onChange({ ...event, notes: e.target.value })}
              placeholder={labels.notesPlaceholder}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-red-500/10"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
          {!isNew && onDelete && !isReadonly ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              {labels.delete}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold ${SURFACE.ghost}`}
            >
              {labels.cancel}
            </button>
            {!isReadonly && (
              <button
                type="button"
                onClick={onSave}
                disabled={!event.title.trim()}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 ${SURFACE.primary}`}
              >
                {labels.save}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
