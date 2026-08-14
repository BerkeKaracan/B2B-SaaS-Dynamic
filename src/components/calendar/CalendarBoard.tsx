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
import { EventChip } from './EventChip';
import { SURFACE } from './calendarStyles';
import PageColorPicker from '@/components/workspace/PageColorPicker';
import { themeFromPageColor } from '@/lib/pageTheme';
import {
  buildMonthCells,
  dayTitle,
  eventsOnDay,
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
  const { isReadonly, dataSource, persist, migrateLegacyKeys, isPageScoped } =
    useBoardPersistence(projectId);

  const events = useMemo(
    () => (dataSource.calendarEvents as CalendarEvent[] | undefined) || [],
    [dataSource.calendarEvents]
  );
  const pageColor = String(dataSource.backgroundColor || '#ffffff');
  const theme = useMemo(() => themeFromPageColor(pageColor), [pageColor]);

  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    migrateLegacyKeys(['calendarEvents', 'backgroundColor']);
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
    setDraft({ ...event, color: event.color || 'red' });
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
    const nextEvent: CalendarEvent = {
      ...draft,
      title: draft.title.trim(),
      color: draft.color || 'red',
    };
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
        className={`p-1.5 rounded-full ${SURFACE.ghost}`}
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
        className={`p-1.5 rounded-full ${SURFACE.ghost}`}
        aria-label={t('nextMonth')}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={goToday}
        className="ml-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
      >
        {t('today')}
      </button>
      {!isPageScoped && (
        <PageColorPicker
          value={pageColor}
          disabled={isReadonly}
          onChange={(color) => persist({ backgroundColor: color })}
        />
      )}
      {!isReadonly && (
        <button
          type="button"
          onClick={() => openCreate(selectedKey)}
          className={`ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold ${SURFACE.primary}`}
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
      style={{
        backgroundColor: theme.stage,
        ['--cal-accent' as string]: theme.accent,
      }}
    >
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div
          className={`h-14 px-4 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-10 ${SURFACE.chrome}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="p-1.5 rounded-xl border shadow-sm"
              style={{
                backgroundColor: theme.wash === 'transparent' ? '#fff' : theme.wash,
                color: theme.accent,
                borderColor: `${theme.accent}33`,
              }}
            >
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
        <div className="flex-1 min-h-0 min-w-0 p-3 sm:p-5 flex flex-col">
          <div className="grid grid-cols-7 mb-2 px-0.5">
            {weekdays.map((label, i) => (
              <div
                key={`${label}-${i}`}
                className="text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 py-1"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-2">
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
                  className={`min-h-0 rounded-2xl p-1.5 sm:p-2 flex flex-col gap-1 cursor-pointer transition-all duration-150 ${
                    selected
                      ? 'bg-white dark:bg-zinc-900'
                      : cell.isToday
                        ? 'bg-white/90 dark:bg-zinc-900/80 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/10'
                        : cell.isWeekend
                          ? 'bg-white/45 dark:bg-zinc-900/35 hover:bg-white/80 dark:hover:bg-zinc-900/70'
                          : 'bg-white/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm'
                  } ${cell.inMonth ? '' : 'opacity-40'}`}
                  style={
                    selected
                      ? {
                          boxShadow: `0 10px 28px -18px rgba(24,24,27,0.55), inset 0 0 0 2px ${theme.accent}`,
                        }
                      : undefined
                  }
                >
                  <span
                    className={`self-end sm:self-start inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-semibold tabular-nums ${
                      cell.isToday
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                        : cell.inMonth
                          ? 'text-zinc-700 dark:text-zinc-200'
                          : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  <div className="flex-1 min-h-0 space-y-1 overflow-hidden">
                    {visible.map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        allDayLabel={t('allDay')}
                        onClick={openEdit}
                      />
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

        <aside className="lg:w-80 shrink-0 lg:m-4 lg:ml-0 lg:rounded-2xl border-t lg:border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/55 backdrop-blur-md shadow-sm flex flex-col min-h-48 lg:min-h-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-zinc-100/80 dark:border-zinc-800 flex items-center justify-between gap-2">
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
                className="p-1.5 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label={t('addEvent')}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-zinc-400 px-1 py-8 text-center leading-relaxed">
                {t('emptyDay')}
                <span className="block mt-1 text-[11px]">{t('emptyHint')}</span>
              </p>
            ) : (
              selectedEvents.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  allDayLabel={t('allDay')}
                  onClick={openEdit}
                  compact={false}
                />
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
