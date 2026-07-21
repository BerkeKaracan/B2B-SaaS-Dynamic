export type PropertyType = 'text' | 'number' | 'select' | 'date' | 'checkbox';
export type CellValue = string | number | boolean;

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
}

export interface RowRecord {
  id: string;
  [propertyId: string]: CellValue;
}

export interface DatabaseSavedView {
  id: string;
  name: string;
  filterQuery: string;
  sortConfig: { propId: string; dir: 'asc' | 'desc' } | null;
}

export type SortConfig = { propId: string; dir: 'asc' | 'desc' } | null;

export const DEFAULT_PROPERTIES: Property[] = [
  { id: 'prop-title', name: 'Name', type: 'text' },
];

export const DEFAULT_ROWS: RowRecord[] = [
  { id: 'row-1', 'prop-title': '' },
  { id: 'row-2', 'prop-title': '' },
  { id: 'row-3', 'prop-title': '' },
];

export const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
