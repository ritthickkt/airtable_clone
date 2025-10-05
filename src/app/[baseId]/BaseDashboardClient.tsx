'use client';

import { useState, useMemo, useEffect, useRef, useCallback} from 'react';
import type { Session } from "next-auth";
import Image from "next/image";
import { api } from "ritthickclone/trpc/react";
import colorlogo from "../assets/airtable-color.png";
import logo from "../assets/airtable.svg";
import backButton from "../assets/backButton.svg";
import TextIcon from '../_components/columnIcons/text';
import StatusIcon from '../_components/columnIcons/status';
import AttachmentIcon from '../_components/columnIcons/attachment';
import SideBar from '../_components/sidebar';
import { getColumnOptions } from '../../types/index';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
} from '@tanstack/react-table';
import '../../styles/basedashboard.css';

import type {
  BaseDashboardClientProps,
  TableRow,
  Column,
  Base,
  Table
} from '../../types';

const columnHelper = createColumnHelper<TableRow>();

export default function BaseDashboardClient({ session, base}: BaseDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('Data');
  const [baseName, setBaseName] = useState(base.name);
  const [isEditing, setIsEditing] = useState(false);
  const [isBaseNameEditing, setIsBaseNameEditing] = useState(false);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [addTable, setAddTable] = useState(false);
  const [backButtonPressed, setBackButtonPressed] = useState(false);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [logoShrunk, setLogoShrunk] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10); 
  const [totalPages, setTotalPages] = useState(0);

  const handleMouseEnter = () => {
    setBackButtonPressed(true);
    setLogoShrunk(true);
  };

  const handleMouseLeave = () => {
    setBackButtonPressed(false);
    setLogoShrunk(false);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setIsBaseNameEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    if (addTable) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const currentTable = base.tables?.[currentTableIndex] ?? base.tables?.[0] ?? null;

  const [tableData, setTableData] = useState<TableRow[]>(() => {
    if (currentTable?.records && currentTable.records.length > 0) {
      return currentTable.records.map((record) => {
        const data = record.data as Record<string, unknown> || {};
        return {
          id: record.id,
          ...data, // Spread all data properties
        } as TableRow;
      });
    }
    
    // Create default rows with empty values for each column
    const defaultRows: TableRow[] = [];
    for (let i = 1; i <= 3; i++) {
      const row: TableRow = { id: i.toString() };
      
      // Add empty values for each column
      currentTable?.columns?.forEach(col => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');
        row[fieldKey] = '';
      });
      
      defaultRows.push(row);
    }
    
    return defaultRows;
  });

  const getColumnIcon = useCallback((type: string) => {
    switch (type) {
      case 'text': return <TextIcon/>;
      case 'status': return <StatusIcon/>;
      case 'attachment': return <AttachmentIcon/>;
      default: return '📝';
    }
  }, []);

  useEffect(() => {
    setTotalPages(Math.ceil(tableData.length / pageSize));
  }, [tableData.length, pageSize]);

  const getCurrentPageData = () => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return tableData.slice(startIndex, endIndex);
  };

  const goToFirstPage = () => setCurrentPage(0);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(0, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages - 1);
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setBaseName(base.name);
      setIsEditing(false);
    }
    // Add table navigation
    else if (e.key === 'ArrowLeft' && e.ctrlKey) {
      goToPreviousPage();
    } else if (e.key === 'ArrowRight' && e.ctrlKey) {
      goToNextPage();
    }
  };

  const deleteRow = (rowId: string) => {
    setTableData(prev => prev.filter(row => row.id !== rowId));
  };

  const updateCell = useCallback((rowId: string, fieldKey: string, value: string) => {
    setTableData(prev => 
      prev.map(row => 
        row.id === rowId ? { ...row, [fieldKey]: value } : row
      )
    );
  }, []);

  const updateBaseName = api.base.updateName.useMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      console.error('Failed to update base name:', error);
      setBaseName(base.name); // Revert on error
    },
  });

  const handleNameSave = () => {
    if (baseName.trim() && baseName !== base.name) {
      updateBaseName.mutate({
        id: base.id,
        name: baseName.trim(),
      });
    } else {
      setIsEditing(false);
    }
  };

  const addRow = () => {
    const newRow: TableRow = {
      id: Date.now().toString(), // Use timestamp for unique ID
    };
    setTableData(prev => [...prev, newRow]);
  };

  const handleFileUpload = useCallback((rowId: string, fieldKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      updateCell(rowId, fieldKey, `${files.length} file(s)`);
    }
  }, [updateCell]);

  const logoBackgroundColor = base.color ?? '#3b82f6';

  const renderCell = useCallback((info: CellContext<TableRow, unknown>, column: Column) => {
      const value = info.getValue() as string || '';
      const rowId = info.row.original.id;
      const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
      const columnOptions = getColumnOptions(column.options); // Parse options safely

      switch (column.type) {
        case 'select':
        case 'status':
          return (
            <select
              name={`${fieldKey}-${rowId}`} // Add name attribute
              value={value}
              onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
              className="cell-select"
            >
              <option value="">Select {column.name.toLowerCase()}</option>
              {columnOptions?.choices?.map((choice) => ( // Use parsed options
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
                name={`${fieldKey}-${rowId}`} // Add name attribute
                style={{ display: 'none' }}
                multiple
                onChange={(e) => handleFileUpload(rowId, fieldKey, e)}
              />
              <button
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
            
        default: // text type
          return (
            <input
              type="text"
              name={`${fieldKey}-${rowId}`} // Add name attribute
              value={value}
              onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
              className="cell-input"
            />
          );
      }
   }, [updateCell, handleFileUpload]); // Empty dependencies since it doesn't depend on external values


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

  return (
    <div className="base-dashboard">
      {/* Header */}
      <div className='left-most-bar'>
        <div 
          className="logo-container"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Image 
            className={`airtable-logo-bases-dashboard ${logoShrunk ? 'shrinking' : 'normal'}`}
            src={logo} 
            width={25} 
            height={25} 
            alt='' 
          />  
          <button
            className={`back-button ${backButtonPressed ? 'show' : ''}`}
            onClick={() => window.location.href = '/home'}
          >
            <Image src={backButton} alt='Back'/>
          </button>
        </div>
        <div className='left-most-bar-bottom'>
          <div className='help-icon' title='help'></div>
          <div className='bell-icon'></div>
          <div className="user-avatar">
            {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
        </div>
      </div>
      <div className="base-dashboard-main-content">
        <div className="base-header">
          <div className="base-header-left">
            <div className="base-icon-header">
              <div className='base-icon-wrapper' style={{ backgroundColor: logoBackgroundColor }}>
                <div className='base-icon'><Image src={logo} width={25} height={25} alt=''/></div>
              </div>
              <div className='base-name-and-dropdown-clicker' onClick={() => setIsEditing(true)}>
                <span 
                  className="base-name-display"
                >
                  {baseName} 
                </span>
                  <div className='dropdown-icon'></div>
              </div>
            </div>
          </div>

          <div className="base-header-center">
            <div className="nav-tabs">
              <button 
                className={`nav-tab ${activeTab === 'Data' ? 'active' : ''}`}
                onClick={() => setActiveTab('Data')}
                style={activeTab === 'Data' ? {
                  borderBottomColor: base.color ?? '#3b82f6'
                } : {}}
              >
                Data
              </button>
              <button 
                className={`nav-tab ${activeTab === 'Automations' ? 'active' : ''}`}
                onClick={() => setActiveTab('Automations')}
                style={activeTab === 'Automations' ? {
                  borderBottomColor: base.color ?? '#3b82f6'
                } : {}}
              >
                Automations
              </button>
              <button 
                className={`nav-tab ${activeTab === 'Interfaces' ? 'active' : ''}`}
                onClick={() => setActiveTab('Interfaces')}
                style={activeTab === 'Interfaces' ? {
                  borderBottomColor: base.color ?? '#3b82f6'
                } : {}}
              >
                Interfaces
              </button>
              <button 
                className={`nav-tab ${activeTab === 'Forms' ? 'active' : ''}`}
                onClick={() => setActiveTab('Forms')}
                style={activeTab === 'Forms' ? {
                  borderBottomColor: base.color ?? '#3b82f6'
                } : {}}
              >
                Forms
              </button>
            </div>
          </div>

          <div className="base-header-right">
            <button className="launch-button">🚀 Launch</button>
            <button className="share-button">Share</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="base-content">
          <div className="tabs-header">
            <div className="tab-background"></div>
            <div className="tabs-list">
              {base.tables?.map((table, index) => (
                <span
                  key={table.id}
                  className={`tab ${index === currentTableIndex ? 'active' : ''}`}
                  onClick={() => setCurrentTableIndex(index)}
                >
                  {table.name}
                </span>
              ))}
              <button className="add-tab-btn" onClick={() => setAddTable(true)}>
                + Add or Import
              </button>
              {addTable && (
                <div ref={popupRef} className="addTableConfig">
                  <div className='baseEditBlock'><button>+</button> Appearance</div>
                  <div className='baseEditBlock'><button>+</button> Base guide</div>
                </div>
              )}
            </div>
          </div> 
          {/* Table Area */}
          <div className="table-container">
            {/* Table Controls */}
            <div className="table-controls">
              <div className="table-controls-left">
                <button className="control-btn">⊞ Grid view </button>
              </div>
              <div className="table-controls-right">
                <button className="control-btn">👁 Hide fields</button>
                <button className="control-btn">🔍 Filter</button>
                <button className="control-btn">📊 Group</button>
                <button className="control-btn">↕ Sort</button>
                <button className="control-btn">🎨 Color</button>
                <button className="control-btn">📋 Share and sync</button>
                <button className="control-btn">🔍</button>
              </div>
            </div>  
            

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
            </div>
          </div>
        </div>
        </div>
        {isEditing && (
          <div ref={popupRef} className="baseConfigurationChangePopUp">
            {isBaseNameEditing ? (
              <input
                type="text"
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                onBlur={() => {
                  setIsBaseNameEditing(false);
                  handleNameSave();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsBaseNameEditing(false);
                    handleNameSave();
                  } else if (e.key === 'Escape') {
                    setBaseName(base.name);
                    setIsBaseNameEditing(false);
                  }
                }}
                className='baseNameEdit editing'
                autoFocus
              />
            ) : (
              <div className='baseNameEdit' onClick={() => setIsBaseNameEditing(true)}>{baseName}</div>
            )}
            <div className='baseEditBlock'><button>+</button> Appearance</div>
            <div className='baseEditBlock'><button>+</button> Base guide</div>
          </div>
        )}
      </div>
  );
}