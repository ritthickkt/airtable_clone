'use client';

import { useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel, // Add this import
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
import type { StringLiteral } from 'typescript';

const columnHelper = createColumnHelper<TableRow>();

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
    onSort
  }: DataTableProps) {
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [tablesData, setTablesData] = useState<Record<string, TableRow[]>>({});
  const [currentCell, setCurrentCell] = useState<{rowIndex: number; columnIndex: number} | null>(null);
  const [colConfigPosition, setColConfigPosition] = useState<{ top: number; left: number } | null>(null);
  const colConfigRef = React.useRef<HTMLDivElement>(null);
  const addColBtnRef = React.useRef<HTMLButtonElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevSortRef = React.useRef(currentSort);
  const [rowAnimationData, setRowAnimationData] = useState<Map<string, {
    fromIndex: number;
    toIndex: number;
  }>>(new Map());
  const [pendingBulkRecords, setPendingBulkRecords] = useState<Record<string, TableRow[]>>({});
  const [columnContextMenu, setColumnContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    columnId: string;
    columnName: string;
    columnType: string;
  } | null>(null);

  const handleHideColumn = useCallback((columnId: string) => {
    onHideColumn(columnId);
    setColumnContextMenu(null);
  }, [onHideColumn]);

  const handleSortColumn = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    onSort(columnId, direction);
    setColumnContextMenu(null);
  }, [onSort]);

  const createRecordMutation = api.base.createRecord.useMutation();
  const createColumnMutation = api.base.createColumn.useMutation();
  const updateCellMutation = api.base.updateCell.useMutation();
  const deleteRecordMutation = api.base.deleteRecord.useMutation();
  const deleteColumnMutation = api.base.deleteColumn.useMutation();
  const createBulkRecordsMutation = api.base.createBulkRecords.useMutation();
  
  const parentRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setColumnContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    rowIndex: number;
    x: number;
    y: number;
  } | null>(null);

  const tableData = useMemo(() => {
    if (!currentTable?.id) return [];
    return tablesData[currentTable.id] ?? [];
  }, [tablesData, currentTable?.id]);

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

  // Convert currentSort to TanStack format
  const tanStackSorting = useMemo(() => {
    return currentSort.map(sort => {
      const column = currentTable?.columns?.find(col => col.id === sort.columnId);
      if (!column) return null;
      
      const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
      return {
        id: fieldKey, // Use fieldKey as the column id for sorting
        desc: sort.direction === 'desc'
      };
    }).filter(Boolean);
  }, [currentSort, currentTable?.columns]);

  const [bulkProgress, setBulkProgress] = useState<{
    isAdding: boolean;
    added: number;
    total: number;
  } | null>(null);
  
  const add100kRows = useCallback(async () => {
    if (!currentTable || isCreatingRecord) return;
    
    setIsCreatingRecord(true);
    setBulkProgress({ isAdding: true, added: 0, total: 100000 });
    
    try {
      const emptyData: Record<string, string> = {};
      currentTable.columns?.forEach(col => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');
        emptyData[fieldKey] = '';
      });

      const uiChunkSize = 100;
      const dbBatchSize = 500;
      const totalRecords = 100000;
      
      const addUIChunks = async () => {
        const totalUIChunks = Math.ceil(totalRecords / uiChunkSize);
        const baseTimestamp = Date.now();
        
        for (let chunkIndex = 0; chunkIndex < totalUIChunks; chunkIndex++) {
          const startIndex = chunkIndex * uiChunkSize;
          const endIndex = Math.min(startIndex + uiChunkSize, totalRecords);
          const currentChunkSize = endIndex - startIndex;
          
          const chunkRecords: TableRow[] = [];
          
          for (let i = 0; i < currentChunkSize; i++) {
            chunkRecords.push({
              id: `temp-bulk-${baseTimestamp}-${startIndex + i}`,
              ...emptyData,
            } as TableRow);
          }

          setTablesData(prev => ({
            ...prev,
            [currentTable.id]: [...(prev[currentTable.id] ?? []), ...chunkRecords]
          }));

          setBulkProgress(prev => prev ? {
            ...prev,
            added: endIndex
          } : null);

          await new Promise(resolve => setTimeout(resolve, 10));
        }
      };

      const syncToDatabase = async () => {
        const totalDBBatches = Math.ceil(totalRecords / dbBatchSize);
        let dbRecordsCreated = 0;
        
        for (let batchIndex = 0; batchIndex < totalDBBatches; batchIndex++) {
          try {
            const batchData = Array(dbBatchSize).fill(emptyData);
            
            const batchResult = await createBulkRecordsMutation.mutateAsync({
              tableId: currentTable.id,
              records: batchData,
            });

            dbRecordsCreated += batchResult.count;

            console.log(`📊 Database batch ${batchIndex + 1}/${totalDBBatches} completed (${dbRecordsCreated}/${totalRecords})`);
            
          } catch (error) {
            console.error(`❌ Database batch ${batchIndex} failed:`, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log('✅ Database sync completed!');
      };

      await Promise.all([
        addUIChunks(),
        new Promise(resolve => {
          setTimeout(() => {
            syncToDatabase().then(resolve);
          }, 1000);
        })
      ]);

      console.log('✅ All operations completed successfully');
        
    } catch (error) {
      console.error('Failed to add 100k rows:', error);
      setTablesData(prev => ({
        ...prev,
        [currentTable.id]: prev[currentTable.id]?.slice(0, -(bulkProgress?.added ?? 0)) ?? []
      }));
    } finally {
      setIsCreatingRecord(false);
      set100kRowsPressed(false);
      
      setTimeout(() => {
        setBulkProgress(null);
      }, 2000);
    }
  }, [currentTable, isCreatingRecord, set100kRowsPressed, createBulkRecordsMutation]);

  React.useEffect(() => {
    if (add100kRowsPressed) {
      add100kRows();
    }
  }, [add100kRowsPressed, add100kRows]);

  const getColumnIcon = useCallback((type: string) => {
    switch (type) {
      case 'text': return <TextIcon/>;
      case 'number': return <div>#</div>;
      default: return '📝';
    }
  }, []);

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [])

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

    // Use the appropriate row model based on current sort state
    const rows = currentSort.length === 0 
      ? table.getCoreRowModel().rows 
      : table.getSortedRowModel().rows;
      
    const rowToDelete = rows[contextMenu.rowIndex]?.original;
    if (!rowToDelete) return;

    setTablesData(prev => ({
      ...prev,
      [currentTable.id]: prev[currentTable.id]?.filter(row => row.id !== rowToDelete.id) ?? []
    }));

    deleteRecordMutation.mutate({
      recordId: rowToDelete.id, 
    }, {
      onError: () => {
        setTablesData(prev => ({
          ...prev,
          [currentTable.id]: [...(prev[currentTable.id] ?? []), rowToDelete]
        }));
      }
    });

    setContextMenu(null);
  }, [contextMenu, currentTable?.id, deleteRecordMutation, currentSort.length]);

  const updateData = useCallback((rowIndex: number, fieldKey: string, value: unknown) => {
    if (!currentTable?.id) return;

    setTablesData(prev => {
      const currentData = prev[currentTable.id] ?? [];
      
      // Use the appropriate row model based on current sort state
      const rows = currentSort.length === 0 
        ? table.getCoreRowModel().rows 
        : table.getSortedRowModel().rows;
        
      const actualRow = rows[rowIndex]?.original;
      if (!actualRow) return prev;
      
      const updatedData = currentData.map((row) => {
        if (row.id === actualRow.id) {
          const updatedRow = { ...row, [fieldKey]: value };
          
          if (!row.id.startsWith('temp-bulk-') && !row.id.startsWith('temp-')) {
            updateCellMutation.mutate({
              recordId: row.id,
              fieldKey: fieldKey,
              value: value as string,
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
  }, [updateCellMutation, currentTable?.id, currentSort.length]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, rowIndex: number, columnIndex: number) => {
    // Use the appropriate row model based on current sort state
    const rows = currentSort.length === 0 
      ? table.getCoreRowModel().rows 
      : table.getSortedRowModel().rows;
      
    const maxRows = rows.length;
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
        newRowIndex = Math.min(maxRows - 1, rowIndex + 1);
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
  }, [currentTable?.columns?.length, currentSort.length]);

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
              value={value as string || ''}
              onChange={onChange}
              onBlur={onBlur}
              onKeyDown={e => handleKeyDown(e, index, columnIndex)}
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
      },
    }), [handleCellRightClick, handleKeyDown, currentCell]
  );

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
      },
      onError: () => {
        setTablesData(prev => ({
          ...prev,
          [currentTable.id]: (prev[currentTable.id] ?? []).filter(row => row.id !== optimisticRecord.id)
        }));
      },
      onSettled: () => setIsCreatingRecord(false),
    });
  }, [currentTable, createRecordMutation, isCreatingRecord]);

  const columns = useMemo(() => {
    if (!currentTable?.columns) return [];

    return currentTable.columns
      .sort((a, b) => a.position - b.position)
      .filter(col => !hiddenColumns.has(col.id))
      .map((col, columnIndex) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');

        return columnHelper.accessor(fieldKey, {
          id: fieldKey, // Use fieldKey as both id and accessor for TanStack sorting
          header: () => (
            <div className="column-header-content" onContextMenu={(e) => handleColumnRightClick(e, col.id, col.name, col.type )}>
              <span className="column-icon">{getColumnIcon(col.type)}</span>
              <span title={col.name}>{col.name}</span>
            </div>
          ),
          // Add sorting configuration for number columns
          sortingFn: col.type === 'number' ? 'basic' : 'alphanumeric',
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

                  const isCurrentCell = currentCell?.rowIndex === index && currentCell?.columnIndex === columnIndex;

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
  }, [currentTable?.columns, getColumnIcon, handleColumnRightClick, hiddenColumns]);

  const visibleColumns = currentTable?.columns?.filter(col => !hiddenColumns.has(col.id)) ?? [];
  const totalTableWidth = 40 + (visibleColumns.length * 200);

  const table = useReactTable({
    data: tableData, // Use unsorted data, let TanStack handle sorting
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // Add sorted row model
    state: {
      sorting: tanStackSorting, // Pass the converted sorting state
    },
    onSortingChange: () => {}, // We handle sorting through our context menu
    enableSorting: true,
    meta: {
      updateData,
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: table.getSortedRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 5,
  });

  React.useEffect(() => {
    // Track the previous sort state to detect when sorting changes (including clearing) 
    
    // Check if sort has changed (either applied or cleared)
    const sortChanged = JSON.stringify(prevSortRef.current) !== JSON.stringify(currentSort);
    
    if (sortChanged) {
      // Capture positions before sort change
      const beforeSort = new Map<string, number>();
      
      // If we're clearing sort, use the current sorted positions as "before"
      // If we're applying sort, use the core (unsorted) positions as "before"
      const sourceRows = currentSort.length === 0 
        ? table.getSortedRowModel().rows  // Use current sorted positions when clearing
        : table.getCoreRowModel().rows;   // Use unsorted positions when applying sort
        
      sourceRows.forEach((row, index) => {
        beforeSort.set(row.id, index);
      });

      // Small delay to let TanStack update, then capture after positions
      setTimeout(() => {
        const afterSort = new Map<string, number>();
        
        // Target positions after the sort change
        const targetRows = currentSort.length === 0 
          ? table.getCoreRowModel().rows    // Back to original order when clearing
          : table.getSortedRowModel().rows; // New sorted order when applying
          
        targetRows.forEach((row, index) => {
          afterSort.set(row.id, index);
        });

        // Calculate animation data
        const animationData = new Map<string, { fromIndex: number; toIndex: number }>();
        beforeSort.forEach((fromIndex, rowId) => {
          const toIndex = afterSort.get(rowId);
          if (toIndex !== undefined && fromIndex !== toIndex) {
            animationData.set(rowId, { fromIndex, toIndex });
          }
        });

        // Only animate if there are actual position changes
        if (animationData.size > 0) {
          setRowAnimationData(animationData);
          setIsAnimating(true);

          // End animation
          const timer = setTimeout(() => {
            setIsAnimating(false);
            setRowAnimationData(new Map());
          }, 350);

          return () => clearTimeout(timer);
        }
      }, 10);
    }
    
    // Update the previous sort reference
    prevSortRef.current = currentSort;
  }, [currentSort]); // Remove table dependency to avoid issues

  return (
    <div className='table-main-content'>
      <SideBar />
      <div className='table-wrapper'>
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
                        // Use the appropriate row model based on whether we're sorted or not
                        const rows = currentSort.length === 0 
                          ? table.getCoreRowModel().rows 
                          : table.getSortedRowModel().rows;
                          
                        const row = rows[virtualRow.index];
                        if (!row) return null;

                        // Get animation data for this row
                        const animData = rowAnimationData.get(row.id);
                        let initialOffset = 0;
                        
                        if (isAnimating && animData) {
                          // Calculate how far this row needs to move
                          initialOffset = (animData.fromIndex - animData.toIndex) * 30; // 30px per row
                        }

                        return (
                          <div
                            key={row.id}
                            className={`virtual-row ${isAnimating ? 'sorting-animation' : ''}`}
                            style={{
                              position: 'absolute',
                              top: `${virtualRow.start}px`,
                              left: 0,
                              width: '100%',
                              height: `${virtualRow.size}px`,
                              // Don't set transform here - let the ref handle it
                              zIndex: isAnimating ? 10 : 1,
                            }}
                            ref={(el) => {
                              if (el && isAnimating && animData) {
                                // Set initial position immediately
                                el.style.transform = `translateY(${initialOffset}px)`;
                                el.style.transition = 'none';
                                
                                // Force a reflow to ensure the initial position is applied
                                el.offsetHeight;
                                
                                // Then start the animation to final position
                                requestAnimationFrame(() => {
                                  el.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                                  el.style.transform = 'translateY(0px)';
                                });
                              } else if (el && !isAnimating) {
                                // Reset when not animating
                                el.style.transform = 'translateY(0px)';
                                el.style.transition = 'none';
                              }
                            }}
                            onTransitionEnd={() => {
                              // Clean up individual row when its animation completes
                              if (isAnimating) {
                                setRowAnimationData(prev => {
                                  const newMap = new Map(prev);
                                  newMap.delete(row.id);
                                  return newMap;
                                });
                              }
                            }}
                          >
                            <div className="row-number">
                              {virtualRow.index + 1}
                            </div>
                            {row.getVisibleCells().map((cell, cellIndex) => (
                              <div 
                                key={cell.id} 
                                className={`record ${cellIndex === 0 ? 'first-column' : ''}`}
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
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '14px',
          color: '#666',
        }}>
          {tableData.length.toLocaleString()} rows
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
            // colConfigPosition={colConfigPosition}
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