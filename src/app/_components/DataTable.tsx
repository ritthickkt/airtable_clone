'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
} from '@tanstack/react-table';
import SideBar from './sidebar';
import { api } from "../../trpc/react"; // Add this import
import TextIcon from './columnIcons/text';
import StatusIcon from './columnIcons/status';
import AttachmentIcon from './columnIcons/attachment';
import { getColumnOptions } from '../../types';
import type { TableRow, Column, Table } from '../../types';
import React from 'react';

const columnHelper = createColumnHelper<TableRow>();

interface DataTableProps {
  currentTable: Table | null;
}

export default function DataTable({ currentTable }: DataTableProps) {
  const [tableData, setTableData] = useState<TableRow[]>(() => {
    if (currentTable?.records && currentTable.records.length > 0) {
      return currentTable.records.map((record) => {
        const data = record.data as Record<string, unknown> || {};
        return {
          id: record.id,
          ...data,
        } as TableRow;
      });
    }
    
    return [];
  });

  const getColumnIcon = useCallback((type: string) => {
    switch (type) {
      case 'text': return <TextIcon/>;
      case 'status': return <StatusIcon/>;
      case 'attachment': return <AttachmentIcon/>;
      default: return '📝';
    }
  }, []);

  const createRecordMutation = api.base.createRecord.useMutation({
    onSuccess: (newRecord) => {
      setTableData(prev => [...prev, {
        id: newRecord.id,
        ...(newRecord.data as Record<string, unknown>)
      } as TableRow]);
    },
    onError: (error) => {
      console.error('Failed to create record:', error);
    },
  });

  const updateCellMutation = api.base.updateCell.useMutation({
    onSuccess: () => {
      console.log('Cell updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update cell:', error);
    },
  });

  const addNewRow = useCallback(() => {
    if (!currentTable) return;
    
    // Create empty data object with all column fields
    const emptyData: Record<string, string> = {};
    currentTable.columns?.forEach(col => {
      const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');
      emptyData[fieldKey] = '';
    });
    
    createRecordMutation.mutate({
      tableId: currentTable.id,
      data: emptyData,
    });
  }, [currentTable, createRecordMutation]);

  const updateCell = useCallback((rowId: string, fieldKey: string, value: string) => {
    setTableData(prev => 
      prev.map(row => 
        row.id === rowId ? { ...row, [fieldKey]: value } : row
      )
    );

    updateCellMutation.mutate({
      recordId: rowId,
      fieldKey: fieldKey,
      value: value,
    });
  }, [updateCellMutation]);

  // const updateCell = useCallback((rowId: string, fieldKey: string, value: string) => {
  //   // 1. Update local state immediately for smooth typing
  //   setTableData(prev => 
  //     prev.map(row => 
  //       row.id === rowId ? { ...row, [fieldKey]: value } : row
  //     )
  //   );

  //   // 2. Debounce the API call
  //   const cellKey = `${rowId}-${fieldKey}`;
    
  //   // Clear any existing timeout for this cell
  //   const existingTimeout = pendingUpdatesRef.current.get(cellKey);
  //   if (existingTimeout) {
  //     clearTimeout(existingTimeout);
  //   }

  //   // Set a new timeout to call API after user stops typing
  //   const newTimeout = setTimeout(() => {
  //     updateCellMutation.mutate({
  //       recordId: rowId,
  //       fieldKey: fieldKey,
  //       value: value,
  //     });
  //     pendingUpdatesRef.current.delete(cellKey);
  //   }, 1000); // Wait 1 second after user stops typing

  //   pendingUpdatesRef.current.set(cellKey, newTimeout);
  // }, [updateCellMutation]);

  const handleFileUpload = useCallback((rowId: string, fieldKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      updateCell(rowId, fieldKey, `${files.length} file(s)`);
    }
  }, [updateCell]);

  const renderCell = useCallback((info: CellContext<TableRow, unknown>, column: Column) => {
    const value = info.getValue() as string || '';
    const rowId = info.row.original.id;
    const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
    const columnOptions = getColumnOptions(column.options);

    switch (column.type) {
      case 'select':
      case 'status':
        return (
          <select
            name={`${fieldKey}-${rowId}`}
            value={value}
            onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
            className="cell-select"
          >
            <option value="">Select {column.name.toLowerCase()}</option>
            {columnOptions?.choices?.map((choice) => (
              <option key={choice.name} value={choice.name}>
                {choice.name}
              </option>
            ))}
          </select>
        );
        
      case 'attachment':
        return (
          <div className="attachment-cell">
            <input
              type="file"
              id={`file-${rowId}-${fieldKey}`}
              name={`${fieldKey}-${rowId}`}
              style={{ display: 'none' }}
              multiple
              onChange={(e) => handleFileUpload(rowId, fieldKey, e)}
            />
            <button
              type="button"
              onClick={() => document.getElementById(`file-${rowId}-${fieldKey}`)?.click()}
              className="attachment-button"
            >
              Add file
            </button>
            {value && (
              <span className="attachment-count">{value}</span>
            )}
          </div>
        );
        
      default:
        return (
          <input
            type="text"
            name={`${fieldKey}-${rowId}`}
            value={value}
            onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
            className="cell-input"
            onFocus={(e) => e.target.select()} // Select all text when focused
            onClick={(e) => e.stopPropagation()}
          />
        );
    }
  }, [updateCell, handleFileUpload]);

  const columns = useMemo(() => {
    if (!currentTable?.columns) return [];

    return currentTable.columns
      .sort((a, b) => a.position - b.position)
      .map((col) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');

        return columnHelper.accessor(fieldKey, {
          header: () => (
            <div className="column-header-content">
              {getColumnIcon(col.type)}
              {col.name}
            </div>
          ),
          cell: (info) => renderCell(info, col),
        });
      });
  }, [currentTable?.columns, renderCell, getColumnIcon]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  React.useEffect(() => {
    return () => {
      pendingUpdatesRef.current.forEach(timeout => clearTimeout(timeout));
      pendingUpdatesRef.current.clear();
    };
  }, []);

  return (
    <div className='table-main-content'>
      <SideBar />
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
        onClick={addNewRow}
        disabled={createRecordMutation.isPending}
        className="add-row-button"
      >
      + Add Row
      </button>
    </div>
  );
}