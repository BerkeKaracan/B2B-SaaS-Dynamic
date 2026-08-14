export type CalendarEventColor =
  | 'zinc'
  | 'red'
  | 'amber'
  | 'emerald'
  | 'violet'
  | 'rose';

export const EVENT_COLORS: CalendarEventColor[] = [
  'zinc',
  'red',
  'amber',
  'emerald',
  'violet',
  'rose',
];

export interface CalendarEvent {
  id: string;
  title: string;
  /** Local calendar day `YYYY-MM-DD`. */
  date: string;
  allDay: boolean;
  /** `HH:mm` when not all-day. */
  startTime?: string;
  endTime?: string;
  notes?: string;
  color: CalendarEventColor;
}

export interface MonthCell {
  key: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export function generateEventId(): string {
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyEvent(date: string): CalendarEvent {
  return {
    id: generateEventId(),
    title: '',
    date,
    allDay: true,
    color: 'red',
  };
}
