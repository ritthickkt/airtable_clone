'use client';

import { useState, useMemo } from 'react';
import type { Session } from "next-auth";
import Image from "next/image";
import { api } from "ritthickclone/trpc/react";
import colorlogo from "../assets/airtable-color.png";
import logo from "../assets/airtable.svg";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import '../../styles/basedashboard.css';

interface TableRow {
  id: number;
  name: string;
  notes: string;
  assignee: string;
  status: string;
  attachments: string;
}

interface Base {
  id: string;
  name: string
  createdAt: Date;
  updatedAt: Date;
}

interface BaseDashboardClientProps {
  session: Session | null;
  base: Base;
}

const columnHelper = createColumnHelper<TableRow>();

export default function BaseDashboardClient({ session, base}: BaseDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('Data');
  const [baseName, setBaseName] = useState(base.name);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

  const currentTable = base.tables[currentTableIndex] || base.tables[0];

  const [tableData, setTableData] = useState<TableRow[]>(() => {
    if (currentTable?.records && currentTable.records.length > 0) {
      return currentTable.records.map((record) => ({
        id: record.id,
        ...record.data,
      }));
    }
    return [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ];
  });

  const columns = useMemo(() => {
    if (!currentTable?.columns) return [];

    return currentTable.columns
      .sort((a, b) => a.position - b.position)
      .map((col) => {
        const fieldKey = col.name.toLowerCase().replace(/\s+/g, '');

        return columnHelper.accessor(fieldKey, {
          header: () => {
            <div className="column-header-content">
              <span className="column-icon">
                {getColumnIcon(col.type)}
              </span>
              {col.name}
            </div>
          },
          cell: (info) => renderCell(info, col),
        });
      });
  }, [currentTable?.columns]);

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'select': return '📋';
      case 'attachment': return '📎';
      default: return '📝';
    }
  };

  const renderCell = (info: any, column: Column) => {
    const value = info.getValue() || '';
    const rowId = info.row.original.id;
    const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');

    switch (column.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
            className="cell-select"
          >
            <option value="">Select {column.name.toLowerCase()}</option>
            {column.options?.choices?.map((choice) => (
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
              style={{ display: 'none' }}
              multiple
              onChange={(e) => handleFileUpload(rowId, fieldKey, e)}
            />
            <button
              onClick={() => document.getElementById(`file-${rowId}-${fieldKey}`)?.click()}
              className="attachment-button"
            >
              📎 Add file
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
            value={value}
            onChange={(e) => updateCell(rowId, fieldKey, e.target.value)}
            className="cell-input"
            placeholder={`Enter ${column.name.toLowerCase()}...`}
          />
        );
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const deleteRow = (rowId: string) => {
    setTableData(prev => prev.filter(row => row.id !== rowId));
  };

  const updateCell = (rowId: string, fieldKey: string, value: string) => {
    setTableData(prev => 
      prev.map(row => 
        row.id === rowId ? { ...row, [fieldKey]: value } : row
      )
    );
  };

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setBaseName(base.name);
      setIsEditing(false);
    }
  };

  const addRow = () => {
    const newRow: TableRow = {
      id: Date.now().toString(), // Use timestamp for unique ID
    };
    setTableData(prev => [...prev, newRow]);
  };

  const handleFileUpload = (rowId: string, fieldKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      updateCell(rowId, fieldKey, `${files.length} file(s)`);
    }
  };

  const handleBaseConfigurationModification = () => {
    return (
      <div className="baseConfigurationChangePopUp">
        <div><input/></div>
        <div><button>+</button>Appearance</div>
        <div><button>+</button>Base guide</div>
      </div>
    )
  }

  return (
    <div className="base-dashboard">
      {/* Header */}
      <div className='left-most-bar'>
        <div><Image className="airtable-logo-bases-dashboard" src={logo} width={23} height={23} alt=''/></div>
      </div>
      <div className="base-dashboard-main-content">
        <div className="base-header">
          <div className="base-header-left">
            <div className="base-icon-header">
              <div className='base-icon'><Image src={logo} width={25} height={25}/></div>
              {isEditing ? (
                <input
                  className="base-name-input editing"
                  type="text"
                  value={baseName}
                  onChange={e => setBaseName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleKeyPress}
                  autoFocus
                />
              ) : (
                <span 
                  className="base-name-display"
                  onClick={() => setIsEditing(true)}
                >
                  {baseName}
                </span>
              )}
              <div className='dropdown-icon'></div>
            </div>
          </div>

          <div className="base-header-center">
            <div className="nav-tabs">
              <button className={`nav-tab ${activeTab === 'Data' ? 'active' : ''}`}>
                Data
              </button>
              <button className="nav-tab">Automations</button>
              <button className="nav-tab">Interfaces</button>
              <button className="nav-tab">Forms</button>
            </div>
          </div>

          <div className="base-header-right">
            <button className="launch-button">🚀 Launch</button>
            <button className="share-button">Share</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="base-content">
          {/* Sidebar */}
          <div className="base-sidebar">
            <div className="sidebar-section">
              <div className="table-header">
                <span className="table-icon">📊</span>
                <span>Table 1</span>
                <span className="dropdown-icon"></span>
              </div>
              <button className="add-import-btn">+ Add or import</button>
            </div>

            <div className="views-section">
              <div className="views-header">
                <span className="grid-icon">⊞</span>
                <span>Grid view</span>
                <span className="dropdown-icon"></span>
              </div>
              
              <div className="view-options">
                <button className="create-view-btn">+ Create new...</button>
                <div className="find-view">
                  <input type="text" placeholder="Find a view" className="find-view-input" />
                  <span className="settings-icon">⚙️</span>
                </div>
                <div className="view-item active">
                  <span className="view-icon">⊞</span>
                  <span>Grid view</span>
                </div>
              </div>
            </div>

            <div className="tools-section">
              <span>Tools</span>
              <span className="dropdown-icon"></span>
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

            {/* Table */}
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th className="row-number-header"></th>
                    <th className="column-header">
                      <span className="column-icon">📝</span>
                      Name
                    </th>
                    <th className="column-header">
                      <span className="column-icon">📋</span>
                      Notes
                    </th>
                    <th className="column-header">
                      <span className="column-icon">👤</span>
                      Assignee
                    </th>
                    <th className="column-header">
                      <span className="column-icon">⭕</span>
                      Status
                    </th>
                    <th className="column-header">
                      <span className="column-icon">📎</span>
                      Attachments
                    </th>
                    <th className="column-header">
                      <span className="column-icon">🏷</span>
                      A
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id} className="table-row">
                      <td className="row-number">{row.id}</td>
                      <td className="table-cell">
                        <input 
                          type="text" 
                          value={row.name}
                          onChange={(e) => {
                            const newData = tableData.map(r => 
                              r.id === row.id ? { ...r, name: e.target.value } : r
                            );
                            setTableData(newData);
                          }}
                          className="cell-input"
                        />
                      </td>
                      <td className="table-cell">
                        <input 
                          type="text" 
                          value={row.notes}
                          onChange={(e) => {
                            const newData = tableData.map(r => 
                              r.id === row.id ? { ...r, notes: e.target.value } : r
                            );
                            setTableData(newData);
                          }}
                          className="cell-input"
                        />
                      </td>
                      <td className="table-cell">
                        <input 
                          type="text" 
                          value={row.assignee}
                          onChange={(e) => {
                            const newData = tableData.map(r => 
                              r.id === row.id ? { ...r, assignee: e.target.value } : r
                            );
                            setTableData(newData);
                          }}
                          className="cell-input"
                        />
                      </td>
                      <td className="table-cell">
                        <input 
                          type="text" 
                          value={row.status}
                          onChange={(e) => {
                            const newData = tableData.map(r => 
                              r.id === row.id ? { ...r, status: e.target.value } : r
                            );
                            setTableData(newData);
                          }}
                          className="cell-input"
                        />
                      </td>
                      <td className="table-cell">
                        <input 
                          type="text" 
                          value={row.attachments}
                          onChange={(e) => {
                            const newData = tableData.map(r => 
                              r.id === row.id ? { ...r, attachments: e.target.value } : r
                            );
                            setTableData(newData);
                          }}
                          className="cell-input"
                        />
                      </td>
                      <td className="table-cell">
                        <span className="cell-content">Req</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="add-row">
                    <td className="add-row-btn" onClick={addRow}>+</td>
                    <td colSpan={6}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="table-footer">
              <button className="add-field-btn">+ Add...</button>
              <span className="record-count">{tableData.length} records</span>
            </div>
          </div>
        </div>
        </div>
      </div>
  );
}