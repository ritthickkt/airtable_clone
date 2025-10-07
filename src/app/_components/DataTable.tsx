'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import SideBar from './sidebar';
import { api } from "../../trpc/react"; // Add this import
import TextIcon from './columnIcons/text';
// import StatusIcon from './columnIcons/status';
// import AttachmentIcon from './columnIcons/attachment';
import type { TableRow, Table } from '../../types';
import ColumnConfiguration from '../_components/ColumnConfiguration';
import React from 'react';

const columnHelper = createColumnHelper<TableRow>();

interface DataTableProps {
  currentTable: Table | null;
}

export default function DataTable({ currentTable }: DataTableProps) {
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [tablesData, setTablesData] = useState<Record<string, TableRow[]>>({});



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
      // case 'status': return <StatusIcon/>;
      // case 'attachment': return <AttachmentIcon/>;
      default: return '📝';
    }
  }, []);

  const createRecordMutation = api.base.createRecord.useMutation();
  const createColumnMutation = api.base.createColumn.useMutation();
  const updateCellMutation = api.base.updateCell.useMutation();

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

  /*
  Behavior for what happens when a user starts typing into a cell
  */
  const defaultColumn = useMemo(
    () => ({
      cell: ({ getValue, row: { index }, column: { id }, table }: any) => {
        const initialValue = getValue();
        const [value, setValue] = React.useState(initialValue);

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
          <input
            value={value as string || ''}
            onChange={onChange}
            onBlur={onBlur}
            className="cell-input"
            style={{ 
              width: '100%', 
              border: 'none', 
              background: 'transparent', 
              padding: '8px' 
            }}
          />
        );
      },
    }),
    []
  );

  const handleCreateColumn = useCallback((name: string, type: 'text' | 'number') => {
    if (!currentTable) return;
    
    createColumnMutation.mutate({
      tableId: currentTable.id,
      name: name,
      type: type,
      position: currentTable.columns?.length ?? 0,
    }, {
      onSuccess: () => {
        setIsColumnModalOpen(false);
        window.location.reload();
      }
    });
  }, [currentTable, createColumnMutation]);

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
    
    // ✅ Add to current table's data
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
      .map((col) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');

        return columnHelper.accessor(fieldKey, {
          header: () => (
            <div className="column-header-content">
              {getColumnIcon(col.type)}
              {col.name}
            </div>
          ),
          // ✅ Only override cell for special column types, otherwise use defaultColumn
          ...(col.type !== 'text' && {
            cell: ({ getValue, row: { index }, column: { id }, table }) => {
              const value = getValue() as string || '';

              switch (col.type) {
                case 'number':
                  const [numValue, setNumValue] = React.useState(value);
                  
                  React.useEffect(() => {
                    setNumValue(value);
                  }, [value]);

                  return (
                    <input
                      type="number"
                      value={numValue}
                      onChange={(e) => setNumValue(e.target.value)}
                      onBlur={() => (table.options.meta as any)?.updateData(index, id, numValue)}
                      style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px' }}
                    />
                  );
                  
                default:
                  return null; // Will use defaultColumn
              }
            }
          })
        });
      });
  }, [currentTable?.columns, getColumnIcon]);

  const table = useReactTable({
    data: tableData,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData, // Pass the update function to table meta
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
      </div>
      <ColumnConfiguration
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onCreateColumn={handleCreateColumn}
      />
    </div>
  );
}