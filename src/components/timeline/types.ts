export type TaskPriority =
  | 'URGENT'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'NO PRIORITY';

export interface TimelineEvent {
  id: string;
  monthKey: string;
  title: string;
  description?: string;
  place?: string;
  time?: string;
  notes?: string;
  assignee?: string;
  priority: TaskPriority;
  isDetailed: boolean;
}

export interface TimelineSavedView {
  id: string;
  name: string;
  filterQuery: string;
  filterPriority: TaskPriority | 'ALL';
  sortBy: 'manual' | 'priority';
}

export interface TimelineDayColumn {
  key: string;
  year: number;
  dayNum: string;
  dayName: string;
  monthName: string;
  isToday: boolean;
  isWeekend: boolean;
}
