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
import ColumnConfiguration from '../_components/ColumnConfiguration';
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
  
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

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

  const createColumnMutation = api.base.createColumn.useMutation({
    onSuccess: (newColumn) => {
      console.log('Column created successfully:', newColumn);
      // You can either reload the page or update the state
      window.location.reload(); // Simple approach for now
    },
    onError: (error) => {
      console.error('Failed to create column:', error);
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

  const handleCreateColumn = useCallback((name: string, type: 'text' | 'number') => {
    if (!currentTable) return;
    
    createColumnMutation.mutate({
      tableId: currentTable.id,
      name: name,
      type: type,
      position: currentTable.columns?.length || 0,
    });
  }, [currentTable, createColumnMutation]);

  const addNewCol = useCallback(() => {
    setIsColumnModalOpen(true);
  }, []);

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

  const updateData = useCallback((rowIndex: number, columnId: string, value: unknown) => {
    setTableData(prev =>
      prev.map((row, index) => {
        if (index === rowIndex) {
          const updatedRow = { ...row, [columnId]: value };
          
          // Debounced API call
          const timeoutId = setTimeout(() => {
            updateCellMutation.mutate({
              recordId: row.id,
              fieldKey: columnId,
              value: value as string,
            });
          }, 1000);

          return updatedRow;
        }
        return row;
      })
    );
  }, [updateCellMutation]);

  const handleFileUpload = useCallback((rowIndex: number, columnId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      updateData(rowIndex, columnId, `${files.length} file(s)`);
    }
  }, [updateData]);

  const defaultColumn = useMemo(
    () => ({
      cell: ({ getValue, row: { index }, column: { id }, table }: any) => {
        const initialValue = getValue();
        const [value, setValue] = React.useState(initialValue);

        // When the input is blurred, update the data
        const onBlur = () => {
          table.options.meta?.updateData(index, id, value);
        };

        // Update local state when the input changes
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
        };

        // Sync with external data changes
        React.useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);

        return (
          <input
            value={value as string}
            onChange={onChange}
            onBlur={onBlur}
            className="cell-input"
            style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px' }}
          />
        );
      },
    }),
    []
  );

  // const renderCell = useCallback((info: CellContext<TableRow, unknown>, column: Column) => {
  //   const value = info.getValue() as string || '';
  //   const rowId = info.row.original.id;
  //   const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
  //   const columnOptions = getColumnOptions(column.options);

  //   switch (column.type) {
  //     case 'select':
  //     case 'status':
  //       return (
  //         <select
  //           name={`${fieldKey}-${rowId}`}
  //           value={value}
  //           onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
  //           className="cell-select"
  //         >
  //           <option value="">Select {column.name.toLowerCase()}</option>
  //           {columnOptions?.choices?.map((choice) => (
  //             <option key={choice.name} value={choice.name}>
  //               {choice.name}
  //             </option>
  //           ))}
  //         </select>
  //       );
        
  //     case 'attachment':
  //       return (
  //         <div className="attachment-cell">
  //           <input
  //             type="file"
  //             id={`file-${rowId}-${fieldKey}`}
  //             name={`${fieldKey}-${rowId}`}
  //             style={{ display: 'none' }}
  //             multiple
  //             onChange={(e) => handleFileUpload(rowId, fieldKey, e)}
  //           />
  //           <button
  //             type="button"
  //             onClick={() => document.getElementById(`file-${rowId}-${fieldKey}`)?.click()}
  //             className="attachment-button"
  //           >
  //             Add file
  //           </button>
  //           {value && (
  //             <span className="attachment-count">{value}</span>
  //           )}
  //         </div>
  //       );
        
  //     default:
  //       return (
  //         <input
  //           type="text"
  //           name={`${fieldKey}-${rowId}`}
  //           value={value}
  //           onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
  //           className="cell-input"
  //           onFocus={(e) => e.target.select()} // Select all text when focused
  //           onClick={(e) => e.stopPropagation()}
  //         />
  //       );
  //   }
  // }, [updateCell, handleFileUpload]);

  const columns = useMemo(() => {
    if (!currentTable?.columns) return [];

    return currentTable.columns
      .sort((a, b) => a.position - b.position)
      .map((col) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');
        const columnOptions = getColumnOptions(col.options);

        return columnHelper.accessor(fieldKey, {
          header: () => (
            <div className="column-header-content">
              {getColumnIcon(col.type)}
              {col.name}
            </div>
          ),
          cell: ({ getValue, row: { index }, column: { id }, table }) => {
            const initialValue = getValue();
            const [value, setValue] = React.useState(initialValue);

            const onBlur = () => {
              (table.options.meta as any)?.updateData(index, id, value);
            };

            const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
              setValue(e.target.value);
            };

            React.useEffect(() => {
              setValue(initialValue);
            }, [initialValue]);

            switch (col.type) {
              case 'select':
              case 'status':
                return (
                  <select
                    value={value as string}
                    onChange={onChange}
                    onBlur={onBlur}
                    className="cell-select"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px' }}
                  >
                    <option value="">Select {col.name.toLowerCase()}</option>
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
                      id={`file-${index}-${id}`}
                      style={{ display: 'none' }}
                      multiple
                      onChange={(e) => handleFileUpload(index, id, e)}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`file-${index}-${id}`)?.click()}
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
                    value={value as string}
                    onChange={onChange}
                    onBlur={onBlur}
                    className="cell-input"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px' }}
                  />
                );
            }
          },
        });
      });
  }, [currentTable?.columns, getColumnIcon, handleFileUpload]);

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
            disabled={createColumnMutation.isPending}
            className="add-col-button"
          >
          +
          </button>
        </div>
        <button 
          onClick={addNewRow}
          disabled={createRecordMutation.isPending}
          className="add-row-button"
        >
        +
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