import { describe, expect, it } from 'vitest';
import {
  buildMonthCells,
  eventsOnDay,
  toDateKey,
  weekStartsOn,
} from './calendarUtils';
import type { CalendarEvent } from './types';

describe('calendarUtils', () => {
  it('uses Monday as week start for Turkish locale', () => {
    expect(weekStartsOn('tr')).toBe(1);
    expect(weekStartsOn('en')).toBe(0);
  });

  it('builds a 6x7 month grid covering the first of the month', () => {
    const cells = buildMonthCells(2026, 7, 1);
    expect(cells).toHaveLength(42);
    expect(cells.some((c) => c.key === '2026-08-01' && c.inMonth)).toBe(true);
    expect(cells[0].date.getDay()).toBe(1);
  });

  it('sorts all-day events before timed events on a day', () => {
    const events: CalendarEvent[] = [
      {
        id: '2',
        title: 'Standup',
        date: '2026-08-14',
        allDay: false,
        startTime: '09:00',
        color: 'zinc',
      },
      {
        id: '1',
        title: 'Holiday',
        date: '2026-08-14',
        allDay: true,
        color: 'red',
      },
    ];
    const day = eventsOnDay(events, '2026-08-14');
    expect(day.map((e) => e.id)).toEqual(['1', '2']);
    expect(toDateKey(new Date(2026, 7, 14))).toBe('2026-08-14');
  });
});
