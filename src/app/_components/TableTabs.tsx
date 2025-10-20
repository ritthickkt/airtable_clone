'use client';

import { useState, useRef, useEffect } from 'react';
import type { Base } from '../../types';

interface TableTabsProps {
  base: Base;
  currentTableIndex: number;
  setCurrentTableIndex: (index: number) => void;
  handleCreateTable: () => void;
  createTableMutation?: any;
}

export default function TableTabs({ 
  base, 
  currentTableIndex, 
  setCurrentTableIndex, 
  handleCreateTable, 
  createTableMutation = { isPending: false }
}: TableTabsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tableName, setTableName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setShowNameDialog(false);
      }
    };

    if (showMenu || showNameDialog) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showNameDialog]);

  const handleBuildFromScratch = () => {
    setShowMenu(false);
    setTableName(`Table ${(base.tables?.length || 0) + 1}`);
    setShowNameDialog(true);
  };

  const handleSaveTable = () => {
    // Call your create table mutation with the table name
    handleCreateTable();
    setShowNameDialog(false);
    setTableName('');
  };

  const handleCancel = () => {
    setShowNameDialog(false);
    setTableName('');
  };

  // Returns a lighter shade of the base color (expects hex format)
  function lighterShadeofBaseColor(hex: string, percent = 0.5) {
    // Remove '#' if present
    hex = hex.replace(/^#/, '');
    // Parse r, g, b
    let r = parseInt(hex.substring(0,2),16);
    let g = parseInt(hex.substring(2,4),16);
    let b = parseInt(hex.substring(4,6),16);

    // Increase each by percent toward 255
    r = Math.round(r + (255 - r) * percent);
    g = Math.round(g + (255 - g) * percent);
    b = Math.round(b + (255 - b) * percent);

    // Return as hex
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  return (
    <div className="tabs-header" style={{ background: lighterShadeofBaseColor(base.color ?? 'black')}}>
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
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button 
            className="add-tab-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }} 
            disabled={createTableMutation.isPending}
          >
            + Add or Import
          </button>
          {showMenu && (
            <div ref={menuRef} className="add-table-menu">
              <div className='blanktableconfig-title'>Add a blank table</div>
              <div className='blanktableconfig-add-table-button' onClick={handleBuildFromScratch}>
                <div className='blanktableconfig-add-table-button-word'>Start from scratch</div>
              </div>
            </div>
          )}
          {showNameDialog && (
            <div ref={dialogRef} className="table-name-dialog">
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Table name"
                autoFocus
                className="table-name-input"
              />
              <div className="dialog-actions">
                <button onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleSaveTable} className="save-btn">
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}