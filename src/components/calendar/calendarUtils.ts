import type { CalendarEvent, MonthCell } from './types';

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** `0` Sunday (en), `1` Monday (tr). */
export function weekStartsOn(locale: string): 0 | 1 {
  return locale.toLowerCase().startsWith('tr') ? 1 : 0;
}

export function buildMonthCells(
  year: number,
  month: number,
  weekStart: 0 | 1
): MonthCell[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() - weekStart + 7) % 7;
  const start = new Date(year, month, 1 - offset);
  const today = todayKey();
  const cells: MonthCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + i
    );
    const key = toDateKey(date);
    cells.push({
      key,
      date,
      inMonth: date.getMonth() === month,
      isToday: key === today,
    });
  }

  return cells;
}

export function weekdayLabels(locale: string, weekStart: 0 | 1): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => {
    const day = (weekStart + i) % 7;
    return formatter.format(new Date(2024, 0, 7 + day));
  });
}

export function monthTitle(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));
}

export function dayTitle(key: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(parseDateKey(key));
}

export function eventsOnDay(
  events: CalendarEvent[],
  key: string
): CalendarEvent[] {
  return events
    .filter((event) => event.date === key)
    .sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
}

export function formatEventTime(
  event: CalendarEvent,
  allDayLabel: string
): string {
  if (event.allDay) return allDayLabel;
  if (event.startTime && event.endTime) {
    return `${event.startTime}–${event.endTime}`;
  }
  return event.startTime || allDayLabel;
}
