'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  x: number;
  y: number;
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
    x,
    y,
  }: DataTableProps) {
  
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [tablesData, setTablesData] = useState<Record<string, TableRow[]>>({});
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

  const { 
    data: paginatedData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isLoadingRecords,
    isFetching: isFetchingRecords, 
    refetch
  } = api.base.getTableRecords.useInfiniteQuery(
    {
      tableId: currentTable?.id ?? '',
      sortConfig: currentSort,
      filterConfig: currentFilters,
      limit: 100,
    },
    { 
      enabled: !!currentTable?.id,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    }
  );

  const { data: totalCount } = api.base.getTableRecordCount.useQuery(
    { tableId: currentTable?.id ?? '' },
    { enabled: !!currentTable?.id }
  );

  const isTableSwitching = currentTable?.id !== previousTableId;
  
  const shouldShowLoading = (isLoadingRecords ?? (isTableSwitching && !isFetchingRecords)) && 
                            !isCreatingRecord &&
                            !isCreatingColumn;

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

  const isRowHighlighted = useCallback((rowIndex: number) => {
    if (!searchTerm || searchResults.length === 0) return false;
    return searchResults.some(result => result.rowIndex === rowIndex && !result.isColumnHeader);
  }, [searchTerm, searchResults]);

  const isColumnHighlighted = useCallback((columnId: string) => {
    if (!searchTerm || searchResults.length === 0) return false;
    return searchResults.some(result => result.columnId === columnId && result.isColumnHeader);
  }, [searchTerm, searchResults]);

  const isCurrentRowHighlighted = useCallback((rowIndex: number) => {
    if (!searchTerm || searchResults.length === 0) return false;
    const currentResult = searchResults[currentSearchIndex];
    return currentResult && currentResult.rowIndex === rowIndex && !currentResult.isColumnHeader;
  }, [searchTerm, searchResults, currentSearchIndex]);

  const isCurrentColumnHighlighted = useCallback((columnId: string) => {
    if (!searchTerm || searchResults.length === 0) return false;
    const currentResult = searchResults[currentSearchIndex];
    return currentResult && currentResult.columnId === columnId && currentResult.isColumnHeader;
  }, [searchTerm, searchResults, currentSearchIndex]);

  const highlightSearchTermWithCurrent = useCallback((text: string, searchTerm: string, columnId: string, rowIndex: number) => {
    if (!searchTerm.trim()) return text;
    
    const currentResult = searchResults[currentSearchIndex];
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
  }, [searchResults, currentSearchIndex]);

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
    setTablesData(prev => ({
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

  const tableData = useMemo(() => {
    const localData = tablesData[currentTable?.id ?? ''] ?? [];
    
    const paginatedRecords = paginatedData?.pages.flatMap(page => 
      page.records.map((record) => {
        const data = record.data as Record<string, unknown> || {};
        return {
          id: record.id,
          ...data,
        } as TableRow;
      })
    ) ?? [];
    
    // include all local rows that are not present in the server pages yet
    const localOnlyRecords = localData.filter(row => 
      !paginatedRecords.some(dbRow => dbRow.id === row.id)
    );
    
    return [...paginatedRecords, ...localOnlyRecords];
  }, [paginatedData, tablesData, currentTable?.id]);

  const handleDeleteRow = useCallback(() => {
    if (!contextMenu || !currentTable?.id) return;

    const rowToDelete = tableData[contextMenu.rowIndex];
    if (!rowToDelete) return;

    setTablesData(prev => ({
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
        setTablesData(prev => ({
          ...prev,
          [currentTable.id]: [...(prev[currentTable.id] ?? []), rowToDelete]
        }));
      }
    });

    setContextMenu(null);
  }, [contextMenu, currentTable?.id, deleteRecordMutation, currentSort, currentFilters, refetch, tableData]);

  const updateData = useCallback((rowIndex: number, fieldKey: string, value: unknown) => {
    if (!currentTable?.id) return;

    setTablesData(prev => {
      const currentData = prev[currentTable.id] ?? [];
      const actualRow = currentData[rowIndex];
      if (!actualRow) return prev;
      
      const updatedData = currentData.map((row) => {
        if (row.id === actualRow.id) {
          const updatedRow = { ...row, [fieldKey]: value };
          
          if (!row.id.startsWith('temp-bulk-') && !row.id.startsWith('temp-')) {
            updateCellMutation.mutate({
              recordId: row.id,
              fieldKey: fieldKey,
              value: value as string,
            }, {
              onSuccess: () => {
                const affectedBySort = currentSort.some(sort => {
                  const column = currentTable.columns?.find(col => col.id === sort.columnId);
                  return column && column.name.toLowerCase().replace(/\s+/g, '') === fieldKey;
                });
                
                const affectedByFilter = currentFilters.some(filter => {
                  const column = currentTable.columns?.find(col => col.id === filter.columnId);
                  return column && column.name.toLowerCase().replace(/\s+/g, '') === fieldKey;
                });
                
                if (affectedBySort || affectedByFilter) {
                  refetch();
                }
              }
            });
          }

          return updatedRow;
        }
        return row;
      });

      return {
        ...prev,
        [currentTable.id]: updatedData
      };
    });
  }, [updateCellMutation, currentTable?.id, currentSort, currentFilters, refetch]);

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
    
    setTablesData(prev => ({
      ...prev,
      [currentTable.id]: [...(prev[currentTable.id] ?? []), optimisticRecord]
    }));
    
    createRecordMutation.mutate({
      tableId: currentTable.id,
      data: emptyData,
    }, {
      onSuccess: (realRecord) => {
        setTablesData(prev => ({
          ...prev,
          [currentTable.id]: (prev[currentTable.id] ?? []).map(row => 
            row.id === optimisticRecord.id 
              ? { id: realRecord.id, ...(realRecord.data as Record<string, unknown>) } as TableRow
              : row
          )
        }));
        
        if (currentSort.length > 0 || currentFilters.length > 0) {
          refetch();
        }
      },
      onError: () => {
        setTablesData(prev => ({
          ...prev,
          [currentTable.id]: (prev[currentTable.id] ?? []).filter(row => row.id !== optimisticRecord.id)
        }));
      },
      onSettled: () => setIsCreatingRecord(false),
    });
  }, [currentTable, createRecordMutation, isCreatingRecord, currentSort, currentFilters, refetch]);

   const add100kRows = useCallback(async () => {
    if (!currentTable || isCreatingRecord) return;

    setIsCreatingRecord(true);
    const totalRecords = 100000;
    setBulkProgress({ isAdding: true, added: 0, total: totalRecords });

    try {
      // prepare empty template for each record (will be shallow-copied per item)
      const emptyDataTemplate: Record<string, string> = {};
      currentTable.columns?.forEach(col => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');
        emptyDataTemplate[fieldKey] = '';
      });

      // CONFIG: tune these to your backend capacity
      const dbBatchSize = 2000;   // size per request (reduce if server times out)
      const concurrency = 4;      // number of parallel requests

      let nextStart = 0;
      let createdSoFar = 0;

      // small helper to yield to the event loop to keep UI responsive
      const yieldNow = () => new Promise(res => setTimeout(res, 0));

      const worker = async () => {
        while (true) {
          const start = nextStart;
          nextStart += dbBatchSize;
          if (start >= totalRecords) break;

          const size = Math.min(dbBatchSize, totalRecords - start);

          // build payload for this batch without creating the entire 100k array at once
          const batchPayload = Array.from({ length: size }, () => ({ ...emptyDataTemplate }));

          // send batch (mutateAsync returns once the request finishes)
          const result = await createBulkRecordsMutation.mutateAsync({
            tableId: currentTable.id,
            records: batchPayload,
          });

          createdSoFar += (result?.count ?? size);

          // update progress once per completed batch
          setBulkProgress(prev => prev ? { ...prev, added: createdSoFar } : prev);

          // yield briefly so the UI thread can update and avoid long blocking runs
          await yieldNow();
        }
      };

      // start workers in parallel (limited concurrency)
      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      // finished uploading: refresh server state once
      await refetch();

      // don't add/remove 100k placeholders in tablesData — server results are authoritative
      console.log('✅ All 100k rows created');

      // ✅ After all batches finish:
      await refetch();         // refresh first page
      fetchNextPage();         // start fetching more pages if available
    } catch (error) {
      console.error('Failed to add 100k rows:', error);
    } finally {
      setIsCreatingRecord(false);
      set100kRowsPressed(false);
      setTimeout(() => setBulkProgress(null), 1500);
    }
  }, [currentTable, isCreatingRecord, set100kRowsPressed, createBulkRecordsMutation, refetch]);

  // All useMemo hooks

  const defaultColumn = useMemo(
    () => ({
      cell: ({ getValue, row: { index }, column, table }: any) => {
        const initialValue = getValue();
        const [value, setValue] = React.useState(initialValue);

        const columnIndex = table.getAllColumns()
          .filter((col: any) => col.getIsVisible())
          .findIndex((col: any) => col.id === column.id);

        const onBlur = () => {
          table.options.meta?.updateData(index, column.columnDef.accessorKey, value);
        };

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
        };

        React.useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);

        const columnData = currentTable?.columns?.find(col => 
          col.name.toLowerCase().replace(/\s+/g, '') === column.columnDef.accessorKey
        );

        const shouldHighlight = searchTerm && value && 
          value.toString().toLowerCase().includes(searchTerm.toLowerCase());

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
              position: 'relative',
            }}
          >
            {shouldHighlight ? (
              <div
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
                  display: 'flex',
                  alignItems: 'center',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                {highlightSearchTermWithCurrent(
                  value.toString(), 
                  searchTerm, 
                  columnData?.id ?? '', 
                  index
                )}
              </div>
            ) : null}
            <input
              value={value as string || ''}
              onChange={onChange}
              onBlur={onBlur}
              onKeyDown={e => handleKeyDown(e, index, columnIndex)}
              onContextMenu={(e) => handleCellRightClick(e, index)}
              style={{ 
                width: '100%', 
                height: '100%',
                border: 'none',
                background: shouldHighlight ? 'transparent' : 'transparent', 
                padding: '0 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                margin: 0,
                borderRadius: 3,
                color: shouldHighlight ? 'transparent' : 'inherit',
                position: 'relative',
                zIndex: 0,
              }}
            />
          </div>
        );
      },
    }), [handleCellRightClick, handleKeyDown, searchTerm, currentTable?.columns, highlightSearchTermWithCurrent]
  );

  const columns = useMemo(() => {
    if (!currentTable?.columns) return [];

    return currentTable.columns
      .sort((a, b) => a.position - b.position)
      .filter(col => !hiddenColumns.has(col.id))
      .map((col, columnIndex) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');

        return columnHelper.accessor(fieldKey, {
          id: col.id,
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
              <span title={col.name}>
                {highlightSearchTermWithCurrent(col.name, searchTerm, col.id, -1)}
              </span>
            </div>
          ),
          ...(col.type !== 'text' && {
            cell: ({ getValue, row: { index }, column, table }) => {
              const value = getValue() as string || '';

              switch (col.type) {
                case 'number':
                  const [numValue, setNumValue] = React.useState(value);
                  
                  React.useEffect(() => {
                    setNumValue(value);
                  }, [value]);

                  const onFocus = () => {
                    setCurrentCell({ rowIndex: index, columnIndex });
                  };

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
                        onChange={(e) => setNumValue(e.target.value)}
                        onBlur={() => (table.options.meta as any)?.updateData(index, fieldKey, numValue)}
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
  }, [currentTable?.columns, getColumnIcon, handleColumnRightClick, hiddenColumns, searchTerm, isColumnHighlighted, isCurrentColumnHighlighted, highlightSearchTermWithCurrent, handleCellRightClick]);

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
    40 + (visibleColumns.length * 200)
  , [visibleColumns.length]);

  const rowVirtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 5,
  });

  // ✅ Auto-load more rows when scrolling near the bottom
  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (!virtualItems.length) return;

    const lastItem1 = virtualItems[virtualItems.length - 1];
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

  // All useEffect hooks at the end
  React.useEffect(() => {
    if (currentTable?.id && (currentSort.length > 0 || currentFilters.length > 0)) {
      refetch();
    }
  }, [currentSort, currentFilters, currentTable?.id, refetch]);

  React.useEffect(() => {
    if (currentTable?.id && !tablesData[currentTable.id]) {
      const initialData = currentTable.records?.map((record) => {
        const data = record.data as Record<string, unknown> || {};
        return {
          id: record.id,
          ...data,
        } as TableRow;
      }) ?? [];

      setTablesData(prev => ({
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

  return (
    <div className='table-main-content'>
      <SideBar
        views={views}
        currentViewId={currentViewId}
        onViewSelect={onViewSelect}
        onCreateView={onCreateView}
        onDeleteView={onDeleteView}
        x={x}
        y={y}
      />
      <div className='table-wrapper'>
        {shouldShowLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <p style={{
                color: '#666',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                Loading table...
              </p>
            </div>
          </div>
        ) : (
        <>
          <div className='table-scroll-container'>
              <table>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    <th className="row-number-header">#</th>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className='column-names'>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                    <th className='add-col-header'>
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
              <tbody>
                <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                  <td>
                    <div ref={parentRef} style={{ height: '100%', position: 'relative' }}>
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const rows = table.getCoreRowModel().rows;
                        const row = rows[virtualRow.index];
                        if (!row) return null;

                        const isHighlighted = isRowHighlighted(virtualRow.index);

                        return (
                          <div
                            key={row.id}
                            className={`virtual-row ${isHighlighted ? 'search-row-highlight' : ''}`}
                            style={{
                              position: 'absolute',
                              top: `${virtualRow.start}px`,
                              left: 0,
                              width: '100%',
                              height: `${virtualRow.size}px`,
                            }}
                          >
                            <div className={`row-number ${isHighlighted ? 'search-row-highlight' : ''}`}>
                              {virtualRow.index + 1}
                            </div>
                            {row.getVisibleCells().map((cell, cellIndex) => (
                              <div 
                                key={cell.id} 
                                className={`record ${cellIndex === 0 ? 'first-column' : ''} ${isHighlighted ? 'search-row-highlight' : ''}`}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            ))}
                          </div>
                        );
                      })}  
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div onClick={addNewRow} className='add-row-button' style={{ width: `${totalTableWidth}px`}}>
              +
            </div>
          </div>
          <div className='number-of-rows'>
            {tableData.length.toLocaleString()} Records
            {hasNextPage && " (scroll to load more)"} 
          </div>
        </>
        )}
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
      </div>
      {isColumnModalOpen && colConfigPosition && (
        <div
          ref={colConfigRef}
          style={{
            position: 'absolute',
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
  );
}