'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import SideBar from './sidebar';
import { api } from "../../trpc/react";
import TextIcon from './columnIcons/text';
import ContextMenuRecord from './ContextMenuRecord';
import type { TableRow, Table } from '../../types';
import ColumnConfiguration from '../_components/ColumnConfiguration';
import ColumnContextMenu from './ColumnContextMenu';
import { faker } from '@faker-js/faker';
import TableLoading from './TableLoading';
import React from 'react';
import { isInstanceOfRegisteredClass } from 'node_modules/superjson/dist/transformer';

const columnHelper = createColumnHelper<TableRow>();

interface FilterCondition {
  id: string;
  columnId: string;
  columnName: string;
  columnType: string;
  operator: string;
  value: string;
}

interface SearchResult {
  rowId: string;
  rowIndex: number;
  columnId: string;
  columnName: string;
  value: string;
  isColumnHeader?: boolean;
}

interface DataTableProps {
  currentTable: Table | null;
  onColumnUpdate: (tableId: string, newColumn: any) => void;
  onColumnRemove: (tableId: string, columnId: string) => void;
  add100kRowsPressed: boolean;
  set100kRowsPressed: (editing: boolean) => void;
  hiddenColumns: Set<string>;
  onHideColumn: (columnId: string) => void;
  currentSort: Array<{ columnId: string; direction: 'asc' | 'desc' }>;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  currentFilters: FilterCondition[];
  onAddFilter: (filter: FilterCondition) => void;
  onUpdateFilter: (filterId: string, updates: Partial<FilterCondition>) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAllFilters: () => void;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  views?: Array<{ id: string; name: string; type: string }>;
  currentViewId?: string | null;
  onViewSelect?: (viewId: string | null) => void;
  onCreateView?: () => void;
  onDeleteView?: (viewId: string) => void;
  paginatedData?: {
    pages: Array<{
      records: Array<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: any;
        tableId: string;
      }>;
      nextCursor?: string | null;
      hasNextPage: boolean;
    }>;
    pageParams: (string | undefined)[];
  };
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  isLoadingRecords: boolean;
  isFetchingRecords: boolean;
  refetch: () => Promise<any>;
  totalCount?: number;
  tablesData: Record<string, TableRow[]>;
  onTablesDataChange: (data: Record<string, TableRow[]> | ((prev: Record<string, TableRow[]>) => Record<string, TableRow[]>)) => void; 
}

export default function DataTable({ 
    currentTable, 
    onColumnUpdate,
    onColumnRemove,
    add100kRowsPressed, 
    set100kRowsPressed,
    hiddenColumns,
    onHideColumn,
    currentSort,
    onSort,
    currentFilters,
    onAddFilter,
    onUpdateFilter,
    onRemoveFilter,
    onClearAllFilters,
    searchTerm = '',
    searchResults = [],
    currentSearchIndex = 0,
    views = [],
    currentViewId = null,
    onViewSelect,
    onCreateView,
    onDeleteView,
    paginatedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingRecords,
    isFetchingRecords,
    refetch,
    totalCount,
    tablesData,
    onTablesDataChange,
  }: DataTableProps) {
  
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [currentCell, setCurrentCell] = useState<{rowIndex: number; columnIndex: number} | null>(null);
  const [colConfigPosition, setColConfigPosition] = useState<{ top: number; left: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    rowIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [columnContextMenu, setColumnContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    columnId: string;
    columnName: string;
    columnType: string;
  } | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{
    isAdding: boolean;
    added: number;
    total: number;
  } | null>(null);
  const [previousTableId, setPreviousTableId] = useState<string | null>(null);

  // All useRef hooks
  const colConfigRef = React.useRef<HTMLDivElement>(null);
  const addColBtnRef = React.useRef<HTMLButtonElement>(null);
  const parentRef = React.useRef<HTMLDivElement>(null);

  // All API hooks
  const createRecordMutation = api.base.createRecord.useMutation();
  const createColumnMutation = api.base.createColumn.useMutation();
  const updateCellMutation = api.base.updateCell.useMutation();
  const deleteRecordMutation = api.base.deleteRecord.useMutation();
  const deleteColumnMutation = api.base.deleteColumn.useMutation();
  const createBulkRecordsMutation = api.base.createBulkRecords.useMutation();

  const [pendingRecords, setPendingRecords] = useState<Set<string>>(new Set());
  const [virtualRecordCount, setVirtualRecordCount] = useState(0);

  const isTableSwitching = currentTable?.id !== previousTableId;
  
  const shouldShowLoading = (isLoadingRecords ?? (isTableSwitching && !isFetchingRecords)) && 
                            !isCreatingRecord &&
                            !isCreatingColumn;

  const isTableLoading = isLoadingRecords || isFetchingRecords || shouldShowLoading;

  React.useEffect(() => {
    if (currentTable?.id && currentTable.id !== previousTableId) {
      setPreviousTableId(currentTable.id);
    }
  }, [currentTable?.id, previousTableId]);

  // All useCallback hooks
  const highlightSearchTerm = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.toString().split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="search-highlight">{part}</span>
      ) : part
    );
  }, []);

  const tableData = useMemo(() => {
  console.log('🔄 tableData recalculating:', {
    hasFilters: currentFilters.length > 0,
    hasSort: currentSort.length > 0,
    paginatedPagesCount: paginatedData?.pages.length,
  });

  // ✅ When filters or sorting are active, use paginatedData BUT overlay local edits
  if (currentFilters.length > 0 || currentSort.length > 0) {
    const localData = tablesData[currentTable?.id ?? ''] ?? [];
    
    const paginatedRecords = paginatedData?.pages.flatMap(page => 
      page.records.map((record) => {
        const data = record.data as Record<string, unknown> || {};
        const serverRecord = {
          id: record.id,
          ...data,
        } as TableRow;
        
        // ✅ Check if there's a local version with unsaved edits
        const localVersion = localData.find(r => r.id === record.id);
        
        // ✅ Use local version if it exists (has unsaved typing)
        return localVersion || serverRecord;
      })
    ) ?? [];
    
    console.log('✅ Using filtered data:', paginatedRecords.length, 'records');
    
    // ✅ Apply search filter if needed
    if (searchTerm.trim() && searchResults.length > 0) {
      const rowResults = searchResults.filter(result => !result.isColumnHeader);
      
      if (rowResults.length > 0) {
        const recordIdsWithMatches = new Set(
          rowResults.map(result => result.rowId)
        );
        
        return paginatedRecords.filter(row => recordIdsWithMatches.has(row.id));
      }
    }
    
    return paginatedRecords;
  }
  
  // ✅ No filters/sort - use server data as source of truth but overlay local edits
  const paginatedRecords = paginatedData?.pages.flatMap(page => 
    page.records.map((record) => {
      const data = record.data as Record<string, unknown> || {};
      return {
        id: record.id,
        ...data,
      } as TableRow;
    })
  ) ?? [];

  console.log('✅ Using unfiltered data:', paginatedRecords.length, 'records from server');

  const localData = tablesData[currentTable?.id ?? ''] ?? [];
  
  // ✅ Create a map of server records by ID for quick lookup
  const serverRecordsMap = new Map(
    paginatedRecords.map(record => [record.id, record])
  );
  
  // ✅ Merge: Use server record order, but overlay local edits
  const mergedRecords = paginatedRecords.map(serverRecord => {
    const localVersion = localData.find(r => r.id === serverRecord.id);
    // If there's a local version, use it (has unsaved edits)
    // Otherwise use the server version
    return localVersion || serverRecord;
  });
  
  // ✅ Add any local-only records (optimistic creates) at the end
  const localOnlyRecords = localData.filter(row => 
    !serverRecordsMap.has(row.id)
  );
  
  const allRecords = [...mergedRecords, ...localOnlyRecords];
  
  console.log('📊 Final merged records:', allRecords.length);
  
  // Apply search filter if needed
  if (searchTerm.trim() && searchResults.length > 0) {
    const rowResults = searchResults.filter(result => !result.isColumnHeader);
    
    if (rowResults.length > 0) {
      const recordIdsWithMatches = new Set(
        rowResults.map(result => result.rowId)
      );
      
      return allRecords.filter(row => recordIdsWithMatches.has(row.id));
    }
  }
  
  return allRecords;
}, [paginatedData, tablesData, currentTable?.id, searchTerm, searchResults, currentFilters, currentSort]);

  const adjustedSearchResults = useMemo(() => {
    if (!searchTerm.trim() || searchResults.length === 0) {
      return searchResults;
    }

    // Create a map of rowId to new index in filtered tableData
  const rowIdToNewIndex = new Map<string, number>();
    tableData.forEach((row, index) => {
      rowIdToNewIndex.set(row.id, index);
    });

    // Update search results with new indices
    return searchResults.map(result => {
      if (result.isColumnHeader) {
        return result;
      }
      
      const newIndex = rowIdToNewIndex.get(result.rowId);
      return {
        ...result,
        rowIndex: newIndex ?? result.rowIndex
      };
    }).filter(result => {
      // Remove results for rows that are no longer visible
      if (result.isColumnHeader) return true;
      return rowIdToNewIndex.has(result.rowId);
    });
  }, [searchResults, searchTerm, tableData]);

  const isRowHighlighted = useCallback((rowIndex: number) => {
    if (!searchTerm || adjustedSearchResults.length === 0) return false;
    return adjustedSearchResults.some(result => result.rowIndex === rowIndex && !result.isColumnHeader);
  }, [searchTerm, adjustedSearchResults]);

  const isColumnHighlighted = useCallback((columnId: string) => {
    if (!searchTerm || adjustedSearchResults.length === 0) return false;
    return adjustedSearchResults.some(result => result.columnId === columnId && result.isColumnHeader);
  }, [searchTerm, adjustedSearchResults]);

  const isCurrentRowHighlighted = useCallback((rowIndex: number) => {
    if (!searchTerm || adjustedSearchResults.length === 0) return false;
    const currentResult = adjustedSearchResults[currentSearchIndex];
    return currentResult && currentResult.rowIndex === rowIndex && !currentResult.isColumnHeader;
  }, [searchTerm, adjustedSearchResults, currentSearchIndex]);

  const isCurrentColumnHighlighted = useCallback((columnId: string) => {
    if (!searchTerm || adjustedSearchResults.length === 0) return false;
    const currentResult = adjustedSearchResults[currentSearchIndex];
    return currentResult && currentResult.columnId === columnId && currentResult.isColumnHeader;
  }, [searchTerm, adjustedSearchResults, currentSearchIndex]);

  const highlightSearchTermWithCurrent = useCallback((text: string, searchTerm: string, columnId: string, rowIndex: number) => {
    if (!searchTerm.trim()) return text;
    
    const currentResult = adjustedSearchResults[currentSearchIndex];
    const isCurrentMatch = currentResult && 
      currentResult.columnId === columnId && 
      currentResult.rowIndex === rowIndex;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.toString().split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span 
          key={index} 
          className={`search-highlight ${isCurrentMatch ? 'search-highlight-current' : ''}`}
        >
          {part}
        </span>
      ) : part
    );
  }, [adjustedSearchResults, currentSearchIndex]);

  const handleHideColumn = useCallback((columnId: string) => {
    onHideColumn(columnId);
    setColumnContextMenu(null);
  }, [onHideColumn]);

  const handleSortColumn = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    onSort(columnId, direction);
    setColumnContextMenu(null);
  }, [onSort]);

  const handleColumnRightClick = useCallback((e: React.MouseEvent, columnId: string, columnName: string, columnType: string) => {
    e.preventDefault();
    e.stopPropagation();

    const menuHeight = 600;
    const menuWidth = 220;

    let x = e.clientX;
    let y = e.clientY;

    if (y + menuHeight > window.innerHeight) {
      y = e.clientY - menuHeight;
    }

    if (x + menuWidth > window.innerWidth) {
      x = e.clientX - menuWidth;
    }

    setColumnContextMenu({
      visible: true,
      x,
      y,
      columnId,
      columnName,
      columnType,
    });
  }, []);

  const handleDeleteColumn = useCallback(() => {
    if (!columnContextMenu || !currentTable?.id) return;

    const columnToDelete = currentTable.columns?.find(col => col.id === columnContextMenu.columnId);
    if (!columnToDelete) return;

    onColumnRemove(currentTable.id, columnContextMenu.columnId);

    const fieldKey = columnToDelete.name.toLowerCase().replace(/\s+/g, '');
    onTablesDataChange(prev => ({
      ...prev,
      [currentTable.id]: (prev[currentTable.id] ?? []).map(row => {
        const { [fieldKey]: removedField, ...restRow } = row;
        return restRow as TableRow;
      })
    }));

    deleteColumnMutation.mutate({
      columnId: columnContextMenu.columnId,
    }, {
      onSuccess: () => {
        console.log('Column deleted successfully');
      },
      onError: (error) => {
        console.error('Failed to delete column:', error);
        onColumnUpdate(currentTable.id, columnToDelete);
        window.location.reload();
      }
    });

    setColumnContextMenu(null);
  }, [columnContextMenu, deleteColumnMutation, currentTable?.id, currentTable?.columns, onColumnRemove, onColumnUpdate]);

  const handleCellRightClick = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();

    const menuHeight = 400;
    const menuWidth = 220;

    let x = e.clientX;
    let y = e.clientY;

    if (y + menuHeight > window.innerHeight) {
      y = e.clientY - menuHeight;
    }

    if (x + menuWidth > window.innerWidth) {
      x = e.clientX - menuWidth;
    }

    setContextMenu({
      visible: true,
      rowIndex,
      x,
      y,
    });
  }, []);

  const handleDeleteRow = useCallback(() => {
    if (!contextMenu || !currentTable?.id) return;

    const rowToDelete = tableData[contextMenu.rowIndex];
    if (!rowToDelete) return;

    onTablesDataChange(prev => ({
      ...prev,
      [currentTable.id]: prev[currentTable.id]?.filter(row => row.id !== rowToDelete.id) ?? []
    }));

    deleteRecordMutation.mutate({
      recordId: rowToDelete.id, 
    }, {
      onSuccess: () => {
        if (currentSort.length > 0 || currentFilters.length > 0) {
          refetch();
        }
      },
      onError: () => {
        onTablesDataChange(prev => ({
          ...prev,
          [currentTable.id]: [...(prev[currentTable.id] ?? []), rowToDelete]
        }));
      }
    });

    setContextMenu(null);
  }, [contextMenu, currentTable?.id, deleteRecordMutation, currentSort, currentFilters, refetch, tableData]);

  const updateData = useCallback((rowIndex: number, fieldKey: string, value: unknown) => {
  if (!currentTable?.id) return;

  const actualRow = tableData[rowIndex];
  if (!actualRow) return;

  // ✅ Don't update temp/bulk records OR if switching tables
  if (actualRow.id.startsWith('temp-bulk-') || 
      actualRow.id.startsWith('temp-') ||
      isTableSwitching) {
    return;
  }

  // ✅ Check if value actually changed
  const currentValue = actualRow[fieldKey as keyof TableRow];
  if (currentValue === value) {
    return; // No change, skip update
  }

  console.log('💾 Updating local state for record:', actualRow.id, 'field:', fieldKey, 'value:', value);

  // ✅ IMMEDIATELY update the tableData to show the change
  onTablesDataChange(prev => {
    const currentData = prev[currentTable.id] ?? [];
    
    const existingIndex = currentData.findIndex(r => r.id === actualRow.id);
    
    if (existingIndex >= 0) {
      // Update existing local record
      const updatedData = [...currentData];
      updatedData[existingIndex] = { 
        ...updatedData[existingIndex], 
        [fieldKey]: value 
      } as TableRow;
      return {
        ...prev,
        [currentTable.id]: updatedData
      };
    } else {
      // Create new local record with the update
      return {
        ...prev,
        [currentTable.id]: [...currentData, { ...actualRow, [fieldKey]: value }]
      };
    }
  });

  const updateKey = `${actualRow.id}-${fieldKey}`;
  
  if ((window as any)[`updateTimeout_${updateKey}`]) {
    clearTimeout((window as any)[`updateTimeout_${updateKey}`]);
  }

  // Debounce the server update
  (window as any)[`updateTimeout_${updateKey}`] = setTimeout(() => {
    console.log('🌐 Sending to server:', actualRow.id, fieldKey, value);
    
    updateCellMutation.mutate({
      recordId: actualRow.id,
      fieldKey: fieldKey,
      value: value as string,
    }, {
      onSuccess: () => {
        console.log('✅ Cell updated on server successfully');
        // ✅ After successful save, we can optionally clear the local state
        // But keeping it doesn't hurt - next refetch will sync it
      },
      onError: (error) => {
        console.error('❌ Failed to update cell:', error);
        // Revert on error
        onTablesDataChange(prev => {
          const currentData = prev[currentTable.id] ?? [];
          const existingIndex = currentData.findIndex(r => r.id === actualRow.id);
          
          if (existingIndex >= 0) {
            const updatedData = [...currentData];
            updatedData[existingIndex] = actualRow; // Revert to original
            return {
              ...prev,
              [currentTable.id]: updatedData
            };
          }
          return prev;
        });
      }
    });
  }, 1000); // 1 second debounce

}, [updateCellMutation, currentTable?.id, tableData, onTablesDataChange, isTableSwitching]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, rowIndex: number, columnIndex: number) => {
    const maxRows = tableData.length;
    const maxCols = currentTable?.columns?.length ?? 0;

    let newRowIndex = rowIndex;
    let newColumnIndex = columnIndex;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newRowIndex = Math.min(rowIndex + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newColumnIndex = Math.max(0, columnIndex - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newColumnIndex = Math.min(maxCols - 1, columnIndex + 1);
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          newColumnIndex = columnIndex - 1;
          if (newColumnIndex < 0) {
            newColumnIndex = maxCols - 1;
            newRowIndex = Math.max(0, rowIndex - 1);
          }
        } else {
          newColumnIndex = columnIndex + 1;
          if (newColumnIndex >= maxCols) {
            newColumnIndex = 0;
            newRowIndex = Math.min(maxRows - 1, rowIndex + 1);
          }
        }
        break;
      case 'Enter':
        event.preventDefault();
        newRowIndex = Math.min(maxRows - 1, rowIndex + 1);
        break;
      default:
        return;
    }

    setCurrentCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
    
    setTimeout(() => {
      const cell = document.querySelector(
        `[data-row-index="${newRowIndex}"][data-column-index="${newColumnIndex}"] input`
      );
      if (cell instanceof HTMLInputElement) {
        cell.focus();
        cell.select();
      }
    }, 0);
  }, [currentTable?.columns?.length, tableData.length]);

  const getColumnIcon = useCallback((type: string) => {
    switch (type) {
      case 'text': return <TextIcon/>;
      case 'number': return <div>#</div>;
      default: return '📝';
    }
  }, []);

  const handleCreateColumn = useCallback((name: string, type: 'text' | 'number') => {
    if (!currentTable) return;
    
    // ✅ Save current active element before mutation
    const activeElement = document.activeElement as HTMLInputElement;
    const wasEditing = activeElement && activeElement.tagName === 'INPUT';
    const editingValue = wasEditing ? activeElement.value : null;
    const editingRowIndex = wasEditing ? activeElement.closest('[data-row-index]')?.getAttribute('data-row-index') : null;
    const editingColIndex = wasEditing ? activeElement.closest('[data-column-index]')?.getAttribute('data-column-index') : null;
    
    const tempId = `temp-col-${Date.now()}`;
    const optimisticColumn = {
      id: tempId,
      name: name,
      type: type,
      position: currentTable.columns?.length ?? 0,
      tableId: currentTable.id,
      options: {},
    };

    onColumnUpdate(currentTable.id, optimisticColumn);
    
    createColumnMutation.mutate({
      tableId: currentTable.id,
      name: name,
      type: type,
      position: currentTable.columns?.length ?? 0,
    }, {
      onSuccess: (realColumn) => {
        setIsColumnModalOpen(false);
        const updatedColumn = {
          id: realColumn.id,
          name: realColumn.name,
          type: realColumn.type,
          position: realColumn.position,
          tableId: realColumn.tableId,
          options: realColumn.options,
          createdAt: realColumn.createdAt,
          updatedAt: realColumn.updatedAt,
        };
        onColumnUpdate(currentTable.id, updatedColumn);
        
        // ✅ Restore focus after column is added
        if (wasEditing && editingRowIndex && editingColIndex) {
          setTimeout(() => {
            const cell = document.querySelector(
              `[data-row-index="${editingRowIndex}"][data-column-index="${editingColIndex}"] input`
            ) as HTMLInputElement;
            if (cell) {
              cell.focus();
              if (editingValue !== null) {
                cell.value = editingValue;
              }
              cell.setSelectionRange(cell.value.length, cell.value.length);
            }
          }, 50);
        }
        
        console.log('Column created:', realColumn);
      },
      onError: () => {
        console.error('Failed to create column');
        setIsColumnModalOpen(false);
        window.location.reload();
      }
    });
    
    setIsColumnModalOpen(false);
  }, [currentTable, createColumnMutation, onColumnUpdate]);

  const addNewCol = useCallback(() => {
    if (addColBtnRef.current) {
      const rect = addColBtnRef.current.getBoundingClientRect();
      const popupWidth = 300;
      const popupHeight = 200;

      let top = rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;

      if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 16;
      }
      if (top + popupHeight > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - popupHeight;
        if (top < 0) top = 16;
      }

      setColConfigPosition({ top, left });
    }
    setIsColumnModalOpen(true);
  }, []);

  const addNewRow = useCallback(() => {
    if (!currentTable || isCreatingRecord) return;
    
    setIsCreatingRecord(true);
    
    const emptyData: Record<string, string> = {};
    currentTable.columns?.forEach(col => {
      const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');
      emptyData[fieldKey] = '';
    });
    
    const optimisticRecord = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...emptyData,
    } as TableRow;
    
    // Add to local state
    onTablesDataChange(prev => ({
      ...prev,
      [currentTable.id]: [...(prev[currentTable.id] ?? []), optimisticRecord]
    }));
    
    createRecordMutation.mutate({
      tableId: currentTable.id,
      data: emptyData,
    }, {
      onSuccess: (realRecord) => {
        onTablesDataChange(prev => ({
          ...prev,
          [currentTable.id]: (prev[currentTable.id] ?? []).map(row => 
            row.id === optimisticRecord.id 
              ? { id: realRecord.id, ...(realRecord.data as Record<string, unknown>) } as TableRow
              : row
          )
        }));
      
      },
      onError: () => {
        onTablesDataChange(prev => ({
          ...prev,
          [currentTable.id]: (prev[currentTable.id] ?? []).filter(row => row.id !== optimisticRecord.id)
        }));
      },
      onSettled: () => setIsCreatingRecord(false),
    });
  }, [currentTable, createRecordMutation, isCreatingRecord]);

  const add100kRows = useCallback(async () => {
    if (!currentTable || isCreatingRecord) return;

    setIsCreatingRecord(true);
    const totalRecords = 100000;
    setBulkProgress({ isAdding: true, added: 0, total: totalRecords });

    try {
      const columns = currentTable.columns ?? [];
      const colDefs = columns.map(col => ({
        key: col.name.toLowerCase().replace(/\s+/g, ''),
        type: col.type,
      }));

      const dbBatchSize = 2000;
      const concurrency = 4;

      let nextStart = 0;
      let createdSoFar = 0;
      let lastProgressUpdate = 0;

      const yieldNow = () => new Promise(res => setTimeout(res, 0));

      function fakerValue(type: string) {
        switch (type) {
          case 'text': return faker.person.fullName();
          case 'number': return faker.number.int({ min: 1, max: 10000 }).toString();
          default: return faker.lorem.words(3);
        }
      }

      const worker = async () => {
        while (true) {
          const start = nextStart;
          nextStart += dbBatchSize;
          if (start >= totalRecords) break;

          const size = Math.min(dbBatchSize, totalRecords - start);

          const batchPayload = Array.from({ length: size }, () => {
            const row: Record<string, string> = {};
            colDefs.forEach(col => {
              row[col.key] = fakerValue(col.type);
            });
            return row;
          });

          const result = await createBulkRecordsMutation.mutateAsync({
            tableId: currentTable.id,
            records: batchPayload,
          });

          createdSoFar += (result?.count ?? size);
          
          // Only update progress every 5000 records to reduce re-renders
          if (createdSoFar - lastProgressUpdate >= 5000 || createdSoFar === totalRecords) {
            setBulkProgress(prev => prev ? { ...prev, added: createdSoFar } : prev);
            lastProgressUpdate = createdSoFar;
          }
          
          await yieldNow();
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));
      
      // Final progress update
      setBulkProgress(prev => prev ? { ...prev, added: totalRecords } : prev);
      
      await refetch();
      console.log('✅ All 100k rows created');
      fetchNextPage();
    } catch (error) {
      console.error('Failed to add 100k rows:', error);
    } finally {
      setIsCreatingRecord(false);
      set100kRowsPressed(false);
      setTimeout(() => setBulkProgress(null), 1500);
    }
  }, [currentTable, isCreatingRecord, set100kRowsPressed, createBulkRecordsMutation, refetch, fetchNextPage]);

  // All useMemo hooks

  const CellInput = React.memo(({ 
    value: initialValue, 
    index, 
    columnId,
    columnIndex,
    onUpdate,
    onKeyDown,
    onContextMenu,
    searchTerm,
    highlightFunction,
    isCurrentCellHighlighted,
    isCellHighlighted,
    rowId
  }: any) => {
    const [value, setValue] = React.useState(initialValue);
    const [isDirty, setIsDirty] = React.useState(false);
    const prevValueRef = React.useRef(initialValue);
    const prevRowIdRef = React.useRef(rowId);
    const isMountedRef = React.useRef(false);

    const onBlur = () => {
      setIsDirty(false);
      if (value !== prevValueRef.current) {
        onUpdate(index, columnId, value);
        prevValueRef.current = value;
      }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      setIsDirty(true);
    };

    // ✅ Fixed: Properly handle initial mount and row changes
    React.useEffect(() => {
      // On initial mount, just set the refs
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        prevRowIdRef.current = rowId;
        prevValueRef.current = initialValue;
        setValue(initialValue);
        return;
      }

      // Row changed (table switch or data reload)
      if (prevRowIdRef.current !== rowId) {
        setValue(initialValue);
        setIsDirty(false);
        prevValueRef.current = initialValue;
        prevRowIdRef.current = rowId;
        return;
      }

      // Same row, not editing - update from props (e.g., server response)
      if (!isDirty && initialValue !== prevValueRef.current) {
        setValue(initialValue);
        prevValueRef.current = initialValue;
      }
    }, [initialValue, rowId, isDirty]);

    return (
      <div
        data-row-index={index}
        data-column-index={columnIndex}
        className={
          isCurrentCellHighlighted
            ? 'search-row-highlight-current'
            : isCellHighlighted
            ? 'search-row-highlight'
            : ''
        }
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <input
          value={value as string || ''}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={e => onKeyDown(e, index, columnIndex)}
          onContextMenu={e => onContextMenu(e, index)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: isCurrentCellHighlighted ? '#FFE4A3' : isCellHighlighted ? '#FFF4CC' : 'transparent',
            padding: '0 12px',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    );
  }, (prevProps, nextProps) => {
    // ✅ More strict memo comparison
    return (
      prevProps.value === nextProps.value &&
      prevProps.rowId === nextProps.rowId &&
      prevProps.index === nextProps.index &&
      prevProps.columnId === nextProps.columnId &&
      prevProps.isCurrentCellHighlighted === nextProps.isCurrentCellHighlighted &&
      prevProps.isCellHighlighted === nextProps.isCellHighlighted &&
      prevProps.searchTerm === nextProps.searchTerm
    );
  });

  CellInput.displayName = 'CellInput';

const defaultColumn = useMemo(
  () => ({
    cell: ({ getValue, row: { index, original }, column, table }: any) => {
      const initialValue = getValue();
      const columnIndex = table.getAllColumns()
        .filter((col: any) => col.getIsVisible())
        .findIndex((col: any) => col.id === column.id);

      const isCellHighlighted = adjustedSearchResults.some(
        result =>
          result.rowIndex === index &&
          result.columnId === column.id &&
          !result.isColumnHeader
      );

      const isCurrentCellHighlighted = (() => {
        const currentResult = adjustedSearchResults[currentSearchIndex];
        return (
          currentResult &&
          currentResult.rowIndex === index &&
          currentResult.columnId === column.id &&
          !currentResult.isColumnHeader
        );
      })();

      return (
        <CellInput
          value={initialValue}
          index={index}
          rowId={original.id}
          columnId={column.columnDef.accessorKey}
          columnIndex={columnIndex}
          onUpdate={table.options.meta?.updateData}
          onKeyDown={handleKeyDown}
          onContextMenu={handleCellRightClick}
          searchTerm={searchTerm}
          highlightFunction={highlightSearchTermWithCurrent}
          isCurrentCellHighlighted={isCurrentCellHighlighted}
          isCellHighlighted={isCellHighlighted}
        />
      );
    },
  }), [handleCellRightClick, handleKeyDown, searchTerm, adjustedSearchResults, currentSearchIndex]
);

  const columns = useMemo(() => {
    if (!currentTable?.columns) return [];

    return currentTable.columns
      .sort((a, b) => a.position - b.position)
      .filter(col => !hiddenColumns.has(col.id))
      .map((col, columnIndex) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');
        const isSorted = currentSort.some(s => s.columnId === col.id);

        return columnHelper.accessor(fieldKey, {
          id: col.id,
          enableResizing: false,
          header: () => (
            <div 
              className={`column-header-content ${
                isColumnHighlighted(col.id) ? 'search-column-highlight' : ''
              } ${
                isCurrentColumnHighlighted(col.id) ? 'search-column-highlight-current' : ''
              }`}
              onContextMenu={(e) => handleColumnRightClick(e, col.id, col.name, col.type)}
            >
              <span className="column-icon">{getColumnIcon(col.type)}</span>
              <span>
                {col.name}
              </span>
            </div>
          ),
          ...(col.type !== 'text' && {
            cell: ({ getValue, row: { index }, column, table }) => {
              const initialValue = getValue() as string || '';
              const [numValue, setNumValue] = React.useState(initialValue);
              const [isDirty, setIsDirty] = React.useState(false);
              const prevValueRef = React.useRef(initialValue);
              
              React.useEffect(() => {
                if (!isDirty && initialValue !== prevValueRef.current) {
                  setNumValue(initialValue);
                  prevValueRef.current = initialValue;
                }
              }, [initialValue, isDirty]);

              const onFocus = () => {
                setCurrentCell({ rowIndex: index, columnIndex });
              };

              const onBlur = () => {
                setIsDirty(false);
                if (numValue !== prevValueRef.current) {
                  (table.options.meta as any)?.updateData(index, fieldKey, numValue);
                  prevValueRef.current = numValue;
                }
              };

              switch (col.type) {
                case 'number':
                  return (
                    <div 
                      data-row-index={index} 
                      data-column-index={columnIndex}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      <input
                        type="number"
                        value={numValue}
                        onChange={(e) => {
                          setNumValue(e.target.value);
                          setIsDirty(true);
                        }}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        onContextMenu={(e) => handleCellRightClick(e, index)}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          border: 'none',
                          background: 'transparent', 
                          padding: '0 12px',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          boxSizing: 'border-box',
                          margin: 0,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  );
                  
                default:
                  return null;
              }
            }
          })
        });
      });
  }, [
    currentTable?.columns, 
    getColumnIcon, 
    handleColumnRightClick, 
    hiddenColumns, 
    searchTerm, 
    isColumnHighlighted, 
    isCurrentColumnHighlighted, 
    handleCellRightClick,
    tableData.length
  ]);


  const table = useReactTable({
    data: tableData,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    manualSorting: true, 
    manualFiltering: true, 
    meta: {
      updateData,
    },
  });

  const visibleColumns = useMemo(() => 
    currentTable?.columns?.filter(col => !hiddenColumns.has(col.id)) ?? []
  , [currentTable?.columns, hiddenColumns]);

  const totalTableWidth = useMemo(() => 
      100 + (visibleColumns.length * 200)
    , [visibleColumns.length]);

  const rowVirtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 10,
    measureElement: typeof window !== 'undefined' && !navigator.userAgent.includes('Firefox')
      ? (element) => element?.getBoundingClientRect().height
      : undefined, 
  });

  // ✅ Auto-load more rows when scrolling near the bottom
  useEffect(() => {
      const virtualItems = rowVirtualizer.getVirtualItems();
      if (!virtualItems.length) return;

      const lastItem1 = virtualItems[virtualItems.length - 1];
      if (!lastItem1) return;
      
      const nearBottom = lastItem1.index >= tableData.length - 10; // last ~10 rows

      if (nearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage(); // automatically fetch next batch
      }
    }, [
      rowVirtualizer.getVirtualItems(),
      tableData.length,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
  ]);

  React.useEffect(() => {
    return () => {
      // Clear all pending update timeouts
      Object.keys(window).forEach(key => {
        if (key.startsWith('updateTimeout_')) {
          clearTimeout((window as any)[key]);
        }
      });
    };
  }, []);

  // All useEffect hooks at the end
  // React.useEffect(() => {
  //   if (currentTable?.id && (currentSort.length > 0 || currentFilters.length > 0)) {
  //     refetch();
  //   }
  // }, [currentSort, currentFilters, currentTable?.id, refetch]);

  React.useEffect(() => {
    if (currentTable?.id && !tablesData[currentTable.id]) {
      const initialData = currentTable.records?.map((record) => {
        const data = record.data as Record<string, unknown> || {};
        return {
          id: record.id,
          ...data,
        } as TableRow;
      }) ?? [];

      onTablesDataChange(prev => ({
        ...prev,
        [currentTable.id]: initialData
      }));
    }
  }, [currentTable?.id, currentTable?.records, tablesData]);

  React.useEffect(() => {
    if (add100kRowsPressed) {
      add100kRows();
    }
  }, [add100kRowsPressed, add100kRows]);

  React.useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setColumnContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  React.useEffect(() => {
    if (!isColumnModalOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        colConfigRef.current &&
        !colConfigRef.current.contains(event.target as Node) &&
        addColBtnRef.current &&
        !addColBtnRef.current.contains(event.target as Node)
      ) {
        setIsColumnModalOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColumnModalOpen]);

  React.useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    if (!items.length) return;
    
    const lastItem = items[items.length - 1];
    const shouldLoadMore = lastItem && lastItem.index >= tableData.length - 10;
    
    if (shouldLoadMore && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), tableData.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleSelectAllRows = () => {
    const allRowIds = tableData.map(row => row.id);
    setSelectedRows(allRowIds);
  };

  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

return (
  <div style={{ minHeight: 320, background: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className='table-main-content' style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <SideBar
        views={views}
        currentViewId={currentViewId}
        onViewSelect={onViewSelect}
        onCreateView={onCreateView}
        onDeleteView={onDeleteView}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className='table-wrapper' style={{ 
          flex: 1, 
          overflow: 'hidden',
          position: 'relative' 
        }}>
          {isTableLoading ? (
            <TableLoading />
          ) : (
            <>
              <div 
                className='table-scroll-container' 
                ref={parentRef}
                style={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  height: '100%',
                  width: '100%',
                }}
              >
                {/* ✅ Removed the wrapper div, apply width directly to table */}
                <table style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: '#fff',
                  width: `${totalTableWidth}px`,
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                }}>
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        <th className="row-number-header" style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 11,
                          backgroundColor: '#fff',
                          width: '100px',
                        }}>
                          <div
                            className='all-rows-select'
                            onClick={handleSelectAllRows}
                            style={{ cursor: 'pointer' }}
                          >
                          </div>
                        </th>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className={`column-names ${
                              isColumnHighlighted(header.column.id) ? 'search-column-highlight' : ''
                            } ${
                              isCurrentColumnHighlighted(header.column.id) ? 'search-column-highlight-current' : ''
                            }`}
                            style={{ width: '200px' }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                        <th className='add-col-header' style={{ width: '100px' }}>
                          <button
                            ref={addColBtnRef}
                            onClick={addNewCol}
                            disabled={isCreatingColumn}
                            className="add-col-button"
                            style={{ 
                              opacity: isCreatingColumn ? 0.6 : 1,
                              cursor: isCreatingColumn ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isCreatingColumn ? '...' : '+'}
                          </button>  
                        </th>
                      </tr>
                    ))} 
                  </thead>
                </table>
                <div style={{ 
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: `${totalTableWidth}px`,
                  position: 'relative'
                }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rows = table.getCoreRowModel().rows;
                    const row = rows[virtualRow.index];
                    if (!row) return null;

                    const isHighlighted = isRowHighlighted(virtualRow.index);

                    return (
                      <div
                        key={row.id}
                        className={`virtual-row ${selectedRows.includes(row.id) ? 'row-selected' : ''}`}
                        style={{
                          position: 'absolute',
                          top: `${virtualRow.start}px`,
                          left: 0,
                          width: `${totalTableWidth}px`,
                          height: `${virtualRow.size}px`,
                          display: 'flex',
                        }}
                        onMouseEnter={() => setHoveredRowIndex(virtualRow.index)}
                        onMouseLeave={() => setHoveredRowIndex(null)}
                      >
                        <div 
                          className={`row-number ${isHighlighted ? 'search-row-highlight' : ''}`}
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: '#fff',
                            width: '100px',
                            flexShrink: 0,
                          }}
                        >
                          {hoveredRowIndex === virtualRow.index
                          ? <div className='all-rows-select' style={{ cursor: 'pointer' }}></div>
                          : virtualRow.index + 1}
                        </div>
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <div 
                            key={cell.id} 
                            className={`record ${cellIndex === 0 ? 'first-column' : ''}`}
                            style={{
                              width: '200px',
                              flexShrink: 0,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div onClick={addNewRow} className='add-row-button' style={{ 
                  width: `${totalTableWidth}px`,
                  display: 'flex',
                }}>
                  <span className='add-row-icon-button'>+</span>
                </div>
                </div>
              <ContextMenuRecord
                visible={contextMenu?.visible ?? false}
                x={contextMenu?.x ?? 0}
                y={contextMenu?.y ?? 0}
                rowIndex={contextMenu?.rowIndex ?? 0}
                onDelete={handleDeleteRow}
                onCancel={() => setContextMenu(null)}
              />
              <ColumnContextMenu
                visible={columnContextMenu?.visible ?? false}
                x={columnContextMenu?.x ?? 0}
                y={columnContextMenu?.y ?? 0}
                columnId={columnContextMenu?.columnId ?? ''}
                columnName={columnContextMenu?.columnName ?? ''}
                columnType={columnContextMenu?.columnType ?? 'text'}
                onEdit={() => {
                  console.log('Edit column');
                  setColumnContextMenu(null);
                }}
                onDuplicate={() => {
                  console.log('Duplicate column');
                  setColumnContextMenu(null);
                }}
                onInsertLeft={() => {
                  console.log('Insert left');
                  setColumnContextMenu(null);
                }}
                onInsertRight={() => {
                  console.log('Insert right');
                  setColumnContextMenu(null);
                }}
                onHide={() => handleHideColumn(columnContextMenu?.columnId ?? '')}
                onDelete={handleDeleteColumn}
                onSort={(direction) => handleSortColumn(columnContextMenu?.columnId ?? '', direction)}
                onCancel={() => setColumnContextMenu(null)}
              />
            </>
          )}
        </div>
        {/* ✅ MOVED OUTSIDE table-wrapper but still inside parent div */}
        {isColumnModalOpen && colConfigPosition && (
          <div
            ref={colConfigRef}
            style={{
              position: 'fixed', // Changed from 'absolute' to 'fixed'
              top: colConfigPosition.top,
              left: colConfigPosition.left,
              zIndex: 1000,
            }}
          >
            <ColumnConfiguration
              isOpen={isColumnModalOpen}
              onClose={() => setIsColumnModalOpen(false)}
              onCreateColumn={handleCreateColumn}
              isColumnModalOpen={isColumnModalOpen}
            />
          </div>
        )}
        <div style={{
          position: 'relative',
          zIndex: 5,
          backgroundColor: '#f9fafb',
          padding: '10px 16px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: 500,
          flexShrink: 0,
          display: 'block',
          minHeight: '40px',
        }}>
          {totalCount !== undefined ? totalCount.toLocaleString() : tableData.length.toLocaleString()} Records
          {hasNextPage} 
        </div>
        {bulkProgress && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}>
            <div>Adding rows: {bulkProgress.added.toLocaleString()} / {bulkProgress.total.toLocaleString()}</div>
            <div style={{ 
              width: '200px', 
              height: '4px', 
              background: '#f0f0f0', 
              borderRadius: '2px',
              marginTop: '8px'
            }}>
              <div style={{
                width: `${(bulkProgress.added / bulkProgress.total) * 100}%`,
                height: '100%',
                background: '#3b82f6',
                borderRadius: '2px',
                transition: 'width 0.1s ease-out'
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}