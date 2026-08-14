'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import EventEditor from './EventEditor';
import { EVENT_UI, SURFACE } from './calendarStyles';
import {
  buildMonthCells,
  dayTitle,
  eventsOnDay,
  formatEventTime,
  monthTitle,
  todayKey,
  weekStartsOn,
  weekdayLabels,
} from './calendarUtils';
import { emptyEvent, type CalendarEvent } from './types';

function CalendarBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('CalendarBoard');
  const locale = useLocale();
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  const { isReadonly, dataSource, persist, migrateLegacyKeys } =
    useBoardPersistence(projectId);

  const events = useMemo(
    () => (dataSource.calendarEvents as CalendarEvent[] | undefined) || [],
    [dataSource.calendarEvents]
  );

  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    migrateLegacyKeys(['calendarEvents']);
  }, [migrateLegacyKeys]);

  const weekStart = weekStartsOn(locale);
  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month, weekStart),
    [cursor.year, cursor.month, weekStart]
  );
  const weekdays = useMemo(
    () => weekdayLabels(dateLocale, weekStart),
    [dateLocale, weekStart]
  );
  const selectedEvents = useMemo(
    () => eventsOnDay(events, selectedKey),
    [events, selectedKey]
  );

  const saveEvents = useCallback(
    (next: CalendarEvent[]) => {
      if (isReadonly) return;
      persist({ calendarEvents: next });
    },
    [isReadonly, persist]
  );

  const openCreate = useCallback(
    (dateKey: string) => {
      if (isReadonly) return;
      setSelectedKey(dateKey);
      setIsNew(true);
      setDraft(emptyEvent(dateKey));
    },
    [isReadonly]
  );

  const openEdit = useCallback((event: CalendarEvent) => {
    setSelectedKey(event.date);
    setIsNew(false);
    setDraft({ ...event });
  }, []);

  const goToday = useCallback(() => {
    const today = new Date();
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedKey(todayKey());
  }, []);

  const shiftMonth = useCallback((delta: number) => {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!draft || !draft.title.trim()) return;
    const nextEvent = { ...draft, title: draft.title.trim() };
    const exists = events.some((event) => event.id === nextEvent.id);
    saveEvents(
      exists
        ? events.map((event) => (event.id === nextEvent.id ? nextEvent : event))
        : [...events, nextEvent]
    );
    setSelectedKey(nextEvent.date);
    setDraft(null);
  }, [draft, events, saveEvents]);

  const handleDelete = useCallback(() => {
    if (!draft) return;
    saveEvents(events.filter((event) => event.id !== draft.id));
    setDraft(null);
  }, [draft, events, saveEvents]);

  const hasToolbarSlot = useHasProjectToolbarSlot();
  const eventCountChip =
    events.length > 0 ? (
      <span className={SURFACE.toolbarChip}>
        {t('eventCount', { count: events.length })}
      </span>
    ) : null;

  const navButtons = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => shiftMonth(-1)}
        className={`p-1.5 rounded-lg ${SURFACE.ghost}`}
        aria-label={t('prevMonth')}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="min-w-38 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
        {monthTitle(cursor.year, cursor.month, dateLocale)}
      </span>
      <button
        type="button"
        onClick={() => shiftMonth(1)}
        className={`p-1.5 rounded-lg ${SURFACE.ghost}`}
        aria-label={t('nextMonth')}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={goToday}
        className="ml-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {t('today')}
      </button>
      {!isReadonly && (
        <button
          type="button"
          onClick={() => openCreate(selectedKey)}
          className={`ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${SURFACE.primary}`}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('addEvent')}
        </button>
      )}
      {eventCountChip}
    </div>
  );

  const portaledToolbar = useProjectToolbarPortal(navButtons);

  return (
    <div
      className={`absolute inset-0 flex flex-col h-full min-h-0 overflow-hidden ${SURFACE.stage}`}
    >
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div
          className={`h-14 px-4 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-10 ${SURFACE.chrome}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-900/50">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t('title')}
              </h1>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {t('subtitle')}
              </p>
            </div>
          </div>
          {navButtons}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0">
        <div className="flex-1 min-h-0 min-w-0 p-3 sm:p-4 flex flex-col">
          <div className="grid grid-cols-7 mb-1">
            {weekdays.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 py-1.5"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-6 gap-px rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800">
            {cells.map((cell) => {
              const dayEvents = eventsOnDay(events, cell.key);
              const visible = dayEvents.slice(0, 3);
              const extra = dayEvents.length - visible.length;
              const selected = cell.key === selectedKey;
              return (
                <div
                  key={cell.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedKey(cell.key)}
                  onDoubleClick={() => openCreate(cell.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedKey(cell.key);
                    }
                  }}
                  className={`min-h-0 text-left p-1 sm:p-1.5 flex flex-col gap-0.5 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer ${
                    cell.inMonth ? '' : 'bg-zinc-50/80 dark:bg-zinc-950/60'
                  } ${selected ? 'ring-2 ring-inset ring-red-400/80' : ''}`}
                >
                  <span
                    className={`self-end sm:self-start inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold tabular-nums ${
                      cell.isToday
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : cell.inMonth
                          ? 'text-zinc-700 dark:text-zinc-200'
                          : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  <div className="flex-1 min-h-0 space-y-0.5 overflow-hidden">
                    {visible.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(event);
                        }}
                        className={`block w-full truncate rounded px-1 py-0.5 text-[10px] font-semibold leading-tight text-left ${EVENT_UI[event.color].chip}`}
                      >
                        {event.allDay
                          ? event.title
                          : `${event.startTime || ''} ${event.title}`}
                      </button>
                    ))}
                    {extra > 0 && (
                      <span className="block text-[10px] font-semibold text-zinc-400 px-1">
                        {t('more', { count: extra })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/50 flex flex-col min-h-48 lg:min-h-0">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {t('agenda')}
              </p>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                {dayTitle(selectedKey, dateLocale)}
              </h2>
            </div>
            {!isReadonly && (
              <button
                type="button"
                onClick={() => openCreate(selectedKey)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label={t('addEvent')}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-zinc-400 px-1 py-6 text-center">
                {t('emptyDay')}
              </p>
            ) : (
              selectedEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEdit(event)}
                  className="w-full text-left rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${EVENT_UI[event.color].dot}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {formatEventTime(event, t('allDay'))}
                      </p>
                      {event.notes ? (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                          {event.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>

      {draft && (
        <EventEditor
          event={draft}
          isNew={isNew}
          isReadonly={isReadonly}
          labels={{
            add: t('modalAdd'),
            edit: t('modalEdit'),
            title: t('modalTitle'),
            titlePlaceholder: t('titlePlaceholder'),
            date: t('date'),
            allDay: t('allDay'),
            start: t('start'),
            end: t('end'),
            notes: t('notes'),
            notesPlaceholder: t('notesPlaceholder'),
            color: t('color'),
            save: t('save'),
            cancel: t('cancel'),
            delete: t('delete'),
          }}
          onChange={setDraft}
          onSave={handleSave}
          onCancel={() => setDraft(null)}
          onDelete={isNew ? undefined : handleDelete}
        />
      )}
    </div>
  );
}

export default React.memo(CalendarBoard);
