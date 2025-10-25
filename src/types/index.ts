import type { Session } from "next-auth";
import type { JsonValue } from "next-auth/adapters";
import type { StringLiteral } from "typescript";

// Base interfaces
export interface Base {
  id: string;
  name: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  tables?: Table[];
}

export type SortConfig = Array<{ columnId: string; direction: 'asc' | 'desc' }>;

export type FilterCondition = {
  id: string;
  columnId: string;
  columnName: string;
  columnType: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
};

export type FilterConfig = Array<FilterCondition>;

export interface Table {
  id: string;
  name: string | null;
  baseId: string;
  columns?: Column[];
  records?: Record[];
  views?: View[];
  createdAt: Date;
  updatedAt: Date;
  sortConfig?: SortConfig | null;
  filterConfig?: FilterConfig | null;
}

export interface Column {
  id: string;
  name: string;
  type: string; 
  position: number;
  tableId: string;
  options?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Record {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tableId: string;
  data: JsonValue;
}

export interface ColumnOptions {
  choices?: { name: string; color: string }[];
}

// Add this helper function
export function getColumnOptions(options: JsonValue): ColumnOptions | undefined {
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    return options as ColumnOptions;
  }
  return undefined;
}

export interface TableRow {
  id: string;
  name?: string;
  notes?: string;
  assignee?: string;
  status?: string;
  attachments?: string;
  [key: string]: any;
}

export interface BaseDashboardClientProps {
  session: Session | null;
  base: Base;
}

export interface HomePageClientProps {
  session: Session | null;
}

export interface BaseProps {
  name: string;
  description: string;
  color?: string;
}

// API  interfaces
export interface CreateBaseResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export interface View {
  id: string;
  name: string;
  tableId: string;
  type: 'grid';
  config: {
    hiddenColumns: string[];
    sort: Array<{ columnId: string; direction: 'asc' | 'desc' }>;
    filters: FilterConfig;
    searchTerm?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Common types
export type BaseType = Base;
export type TableType = Table;
export type ColumnType = Column;
export type RecordType = Record;

export function parseSortConfig(value: unknown): SortConfig | null {
  if (!value || typeof value !== 'object') return null;
  if (!Array.isArray(value)) return null;
  
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'columnId' in item &&
      'direction' in item &&
      typeof item.columnId === 'string' &&
      (item.direction === 'asc' || item.direction === 'desc')
  )
    ? (value as SortConfig)
    : null;
}

export function parseFilterConfig(value: unknown): FilterConfig | null {
  if (!value || typeof value !== 'object') return null;
  if (!Array.isArray(value)) return null;
  
  const isValid = value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'columnId' in item &&
      'columnName' in item &&
      'columnType' in item &&
      'operator' in item &&
      'value' in item
  );
  
  return isValid ? (value as FilterConfig) : null;
}