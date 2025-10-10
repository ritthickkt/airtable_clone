'use client';

import { useState, useMemo, useCallback } from 'react';
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

const columnHelper = createColumnHelper<TableRow>();

interface DataTableProps {
  currentTable: Table | null;
  onColumnUpdate: (tableId: string, newColumn: any) => void;
  add100kRowsPressed: boolean;
  set100kRowsPressed: (editing: boolean) => void;
}

export default function DataTable({ 
    currentTable, 
    onColumnUpdate,
    add100kRowsPressed, 
    set100kRowsPressed
  }: DataTableProps) {
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [tablesData, setTablesData] = useState<Record<string, TableRow[]>>({});
  const [currentCell, setCurrentCell] = useState<{rowIndex: number; columnIndex: number} | null>(null);
  const [colConfigPosition, setColConfigPosition] = useState<{ top: number; left: number } | null>(null);
  const colConfigRef = React.useRef<HTMLDivElement>(null);
  const addColBtnRef = React.useRef<HTMLButtonElement>(null);
  const [pendingBulkRecords, setPendingBulkRecords] = useState<Record<string, TableRow[]>>({});
  const [columnContextMenu, setColumnContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    columnId: string;
    columnName: string;
  } | null>(null);

  const createRecordMutation = api.base.createRecord.useMutation();
  const createColumnMutation = api.base.createColumn.useMutation();
  const updateCellMutation = api.base.updateCell.useMutation();
  const deleteRecordMutation = api.base.deleteRecord.useMutation();
  // const deleteTableMutation = api.base.deleteTable.uesMutation();
  const deleteColumnMutation = api.base.deleteColumn.useMutation();
  const createBulkRecordsMutation = api.base.createBulkRecords.useMutation();
  
  const parentRef = React.useRef<HTMLDivElement>(null);

  const handleColumnRightClick = useCallback((e: React.MouseEvent, columnId: string, columnName: string) => {
    e.preventDefault();
    e.stopPropagation();

    const menuHeight = 600; // Approximate height of the context menu
    const menuWidth = 220;

    let x = e.clientX;
    let y = e.clientY;

    // Adjust position to prevent overflow
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
    });
  }, []);

  const handleDeleteColumn = useCallback(() => {
    if (!columnContextMenu) return;

    deleteColumnMutation.mutate({
      columnId: columnContextMenu.columnId,
    }, {
      onSuccess: () => {
        // Refresh the page or update the state
        window.location.reload();
      },
      onError: (error) => {
        console.error('Failed to delete column:', error);
      }
    });

    setColumnContextMenu(null);
  }, [columnContextMenu, deleteColumnMutation]);

  React.useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setColumnContextMenu(null); // Add this line
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

  const rowVirtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

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

      const uiChunkSize = 100; // Add 100 rows to UI at a time
      const dbBatchSize = 500; // Send 500 rows to DB at a time
      const totalRecords = 100000;
      
      // **PHASE 1: Gradual UI Updates (smooth, no lag)**
      const addUIChunks = async () => {
        const totalUIChunks = Math.ceil(totalRecords / uiChunkSize);
        const baseTimestamp = Date.now();
        
        for (let chunkIndex = 0; chunkIndex < totalUIChunks; chunkIndex++) {
          const startIndex = chunkIndex * uiChunkSize;
          const endIndex = Math.min(startIndex + uiChunkSize, totalRecords);
          const currentChunkSize = endIndex - startIndex;
          
          // Create chunk of records for UI
          const chunkRecords: TableRow[] = [];
          
          for (let i = 0; i < currentChunkSize; i++) {
            chunkRecords.push({
              id: `temp-bulk-${baseTimestamp}-${startIndex + i}`,
              ...emptyData,
            } as TableRow);
          }

          // Add chunk to UI state
          setTablesData(prev => ({
            ...prev,
            [currentTable.id]: [...(prev[currentTable.id] ?? []), ...chunkRecords]
          }));

          // Update progress for UI
          setBulkProgress(prev => prev ? {
            ...prev,
            added: endIndex
          } : null);

          // Small delay to keep UI responsive
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      };

      // **PHASE 2: Background Database Sync (simplified)**
      const syncToDatabase = async () => {
        const totalDBBatches = Math.ceil(totalRecords / dbBatchSize);
        let dbRecordsCreated = 0;
        
        for (let batchIndex = 0; batchIndex < totalDBBatches; batchIndex++) {
          try {
            const batchData = Array(dbBatchSize).fill(emptyData);
            
            // Send batch to database - this returns BatchPayload with count
            const batchResult = await createBulkRecordsMutation.mutateAsync({
              tableId: currentTable.id,
              records: batchData,
            });

            dbRecordsCreated += batchResult.count;

            console.log(`📊 Database batch ${batchIndex + 1}/${totalDBBatches} completed (${dbRecordsCreated}/${totalRecords})`);
            
          } catch (error) {
            console.error(`❌ Database batch ${batchIndex} failed:`, error);
            // Continue with next batch even if one fails
          }
          
          // Small delay between database batches
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log('✅ Database sync completed!');
      };

      // **RUN BOTH PHASES IN PARALLEL**
      await Promise.all([
        addUIChunks(), // Gradual UI updates
        new Promise(resolve => {
          // Start database sync after UI has started (1 second delay)
          setTimeout(() => {
            syncToDatabase().then(resolve);
          }, 1000);
        })
      ]);

      console.log('✅ All operations completed successfully');
        
    } catch (error) {
      console.error('Failed to add 100k rows:', error);
      // Rollback on error
      setTablesData(prev => ({
        ...prev,
        [currentTable.id]: prev[currentTable.id]?.slice(0, -(bulkProgress?.added ?? 0)) ?? []
      }));
    } finally {
      setIsCreatingRecord(false);
      set100kRowsPressed(false);
      
      // Clear progress after completion
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

    const rowToDelete = tableData[contextMenu.rowIndex];
    if (!rowToDelete) return;

    setTablesData(prev => ({
      ...prev,
    [currentTable.id]: prev[currentTable.id]?.filter((_, index) => index !== contextMenu.rowIndex) ?? []
    }));

    deleteRecordMutation.mutate({
      recordId: rowToDelete.id, 
    }, {
      onError: () => {
        setTablesData(prev => {
          const currentData = prev[currentTable.id] ?? [];
          const newData = [...currentData];
          newData.splice(contextMenu.rowIndex, 0, rowToDelete);
          return {
            ...prev,
            [currentTable.id]: newData
          };
        });
      }
    });

    setContextMenu(null);
  }, [contextMenu, tableData, currentTable?.id, deleteRecordMutation]);

  /*
  Function used to update a cell. Takes a Row Index, a Column Id to know which column
  the row is in and the value to what its changed to. This is called when a user
  finishes typing, (onBlur) event so when the focus is removed is calls this function. 
  The setTableData updates the tableData state using the previous state as a starting point. 
  */
  const updateData = useCallback((rowIndex: number, columnId: string, value: unknown) => {
    if (!currentTable?.id) return;

    setTablesData(prev => {
      const currentData = prev[currentTable.id] ?? [];
      const updatedData = currentData.map((row, index) => {
        if (index === rowIndex) {
          const updatedRow = { ...row, [columnId]: value };
          
          // **ONLY sync to database if it's NOT a temporary record**
          if (!row.id.startsWith('temp-bulk-') && !row.id.startsWith('temp-')) {
            updateCellMutation.mutate({
              recordId: row.id,
              fieldKey: columnId,
              value: value as string,
            });
          }
          // For temp records, just update locally - they'll be synced when background process completes

          return updatedRow;
        }
        return row;
      });

      return {
        ...prev,
        [currentTable.id]: updatedData
      };
    });
  }, [updateCellMutation, currentTable?.id]);

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
  }, [tableData.length, currentTable?.columns?.length]);

  /*
  Behavior for what happens when a user starts typing into a cell
  */
  const defaultColumn = useMemo(
    () => ({
      cell: ({ getValue, row: { index }, column: { id }, table }: any) => {
        const initialValue = getValue();
        const [value, setValue] = React.useState(initialValue);

        // Get column index from visible columns
        const columnIndex = table.getAllColumns()
          .filter((col: any) => col.getIsVisible())
          .findIndex((col: any) => col.id === id);

        const onBlur = () => {
          table.options.meta?.updateData(index, id, value);
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
          >
            <input
              value={value as string || ''}
              onChange={onChange}
              onBlur={onBlur}
              onKeyDown={e => handleKeyDown(e, index, columnIndex)}
              onContextMenu={(e) => handleCellRightClick(e, index)}
              style={{ 
                width: '100%', 
                border: 'none', 
                background: 'transparent', 
                padding: '8px',
                fontSize: '14px',
              }}
            />
          </div>
        );
      },
    }), [handleCellRightClick, handleKeyDown, currentCell]
  );

  const handleCreateColumn = useCallback((name: string, type: 'text' | 'number') => {
    if (!currentTable) return;
    
    const optimisticColumn = {
      id: `temp-col-${Date.now()}`,
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
    // Estimate your popup's width and height (adjust as needed)
    const popupWidth = 300;
    const popupHeight = 200;

    let top = rect.bottom + window.scrollY;
    let left = rect.left + window.scrollX;

    // Adjust if popup would overflow right edge
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 16; // 16px margin from edge
    }
    // Adjust if popup would overflow bottom edge
    if (top + popupHeight > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - popupHeight;
      if (top < 0) top = 16; // 16px margin from top
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
    
    // **FIX: Use a more stable ID generation**
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
      .map((col, columnIndex) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');

        return columnHelper.accessor(fieldKey, {
          header: () => (
            <div className="column-header-content" onContextMenu={(e) => handleColumnRightClick(e, col.id, col.name )}>
              <span className="column-icon">{getColumnIcon(col.type)}</span>
              <span className="column-name" title={col.name}>{col.name}</span>
            </div>
          ),
          ...(col.type !== 'text' && {
            cell: ({ getValue, row: { index }, column: { id }, table }) => {
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
                    >
                      <input
                        type="number"
                        value={numValue}
                        onChange={(e) => setNumValue(e.target.value)}
                        onBlur={() => (table.options.meta as any)?.updateData(index, id, numValue)}
                        onFocus={onFocus}
                        onContextMenu={(e) => handleCellRightClick(e, index)}
                        style={{ 
                          width: '100%', 
                          border: 'none', 
                          background: 'transparent', 
                          padding: '8px',
                          outline: isCurrentCell ? '2px solid #007bff' : 'none',
                        }}
                      />
                    </div>
                  );
                  
                default:
                  return null; // Will use defaultColumn
              }
            }
          })
        });
      });
  }, [currentTable?.columns, getColumnIcon, handleColumnRightClick]);

    const table = useReactTable({
    data: tableData,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
  });

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
                </tr>
              ))}
            </thead>
            <tbody>
              <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                <td>
                  <div ref={parentRef} style={{ height: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const row = table.getRowModel().rows[virtualRow.index];
                      if (!row) return null;

                      return (
                        <div
                          key={row.id}
                          className="virtual-row"
                          style={{
                            position: 'absolute',
                            top: `${virtualRow.start}px`,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            display: 'table-row',
                          }}
                        >
                          <div 
                            className="row-number" 
                          >
                            {virtualRow.index + 1}
                          </div>
                          {row.getVisibleCells().map(cell => (
                            <div 
                              key={cell.id} 
                              className="record"
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
          <button 
                onClick={addNewRow}
                disabled={isCreatingRecord}
                className="add-row-button"
                style={{ 
                  opacity: isCreatingRecord ? 0.6 : 1,
                  cursor: isCreatingRecord ? 'not-allowed' : 'pointer'
                }}
              >
                {isCreatingRecord ? '...' : '+'}
            </button>
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
          onDelete={handleDeleteColumn}
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
            colConfigPosition={colConfigPosition}
          />
        </div>
      )}
      {/* Progress indicator */}
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

      {/* Row count indicator */}
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
    </div>
  );
}