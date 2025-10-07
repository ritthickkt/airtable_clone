'use client';

import { useState, useMemo, useCallback } from 'react';
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
import React from 'react';

const columnHelper = createColumnHelper<TableRow>();

interface DataTableProps {
  currentTable: Table | null;
  onColumnUpdate: (tableId: string, newColumn: any) => void;
}

export default function DataTable({ currentTable, onColumnUpdate }: DataTableProps) {
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [tablesData, setTablesData] = useState<Record<string, TableRow[]>>({});
  const [currentCell, setCurrentCell] = useState<{rowIndex: number; columnIndex: number} | null>(null);

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

  const getColumnIcon = useCallback((type: string) => {
    switch (type) {
      case 'text': return <TextIcon/>;
      case 'number': return <div>#</div>;
      default: return '📝';
    }
  }, []);

  const createRecordMutation = api.base.createRecord.useMutation();
  const createColumnMutation = api.base.createColumn.useMutation();
  const updateCellMutation = api.base.updateCell.useMutation();
  const deleteRecordMutation = api.base.deleteRecord.useMutation();
  // const deleteTableMutation = api.base.deleteTable.uesMutation();
  // const deleteColumnMutation = api.base.deleteColumn.useMutation();

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [])

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
          
          updateCellMutation.mutate({
            recordId: row.id,
            fieldKey: columnId,
            value: value as string,
          });

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
      id: `temp-${Date.now()}`,
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
            <div className="column-header-content">
              {getColumnIcon(col.type)}
              {col.name}
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
  }, [currentTable?.columns, getColumnIcon, handleCellRightClick]);

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
                  <th className="row-number">#</th>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className='column-names'>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="row-number">{index + 1}</td>
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className='record'
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button 
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
        </div>
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
        <ContextMenuRecord
          visible={contextMenu?.visible ?? false}
          x={contextMenu?.x ?? 0}
          y={contextMenu?.y ?? 0}
          rowIndex={contextMenu?.rowIndex ?? 0}
          onDelete={handleDeleteRow}
          onCancel={() => setContextMenu(null)}
        />
      </div>
      <ColumnConfiguration
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onCreateColumn={handleCreateColumn}
      />
    </div>
  );
}