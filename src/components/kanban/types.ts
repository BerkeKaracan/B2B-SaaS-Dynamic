export type TaskStatus = string;
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NO PRIORITY';

export interface Task {
  id: string;
  title: string;
  description: string;
  commitCode?: string;
  assignee: string;
  createdBy: string;
  updatedBy: string;
  startDate?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  date: string;
}

export interface SavedView {
  id: string;
  name: string;
  filterQuery: string;
  filterPriority: TaskPriority | 'ALL';
  sortBy: 'manual' | 'priority' | 'deadline';
}
