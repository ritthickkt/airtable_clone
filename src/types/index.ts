import type { Session } from "next-auth";

// Base interfaces
export interface Base {
  id: string;
  name: string;
  color?: string;
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
  options?: {
    choices?: { name: string; color: string }[];
  };
}

export interface Record {
  id: string;
  data: any;
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