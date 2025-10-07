import type { Session } from "next-auth";
import type { JsonValue } from "next-auth/adapters";

// Base interfaces
export interface Base {
  id: string;
  name: string;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  tables?: Table[];
}

export interface Table {
  id: string;
  name: string;
  columns?: Column[];
  records?: Record[];
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
  createdAt: Date;      // Add missing fields from database
  updatedAt: Date;      // Add missing fields from database
  tableId: string;      // Add missing fields from database
  data: JsonValue;      // Change from 'any' to match database
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

// Common types
export type BaseType = Base;
export type TableType = Table;
export type ColumnType = Column;
export type RecordType = Record;