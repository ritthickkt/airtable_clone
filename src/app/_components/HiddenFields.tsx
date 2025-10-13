'use client';

import React from 'react';
import '../../styles/hiddenfieldsdropdown.css';

interface HiddenFieldsDropdownProps {
  visible: boolean;
  x: number;
  y: number;
  hiddenColumns: string[];
  allColumns: Array<{ id: string; name: string; type: string }>;
  onShowColumn: (columnId: string) => void;
  onHideColumn: (columnId: string) => void;
  onHideAll: () => void;
  onShowAll: () => void;
  onCancel: () => void;
}

export default function HiddenFieldsDropdown({
  visible,
  x,
  y,
  hiddenColumns,
  allColumns,
  onShowColumn,
  onHideColumn,
  onHideAll,
  onShowAll,
  onCancel
}: HiddenFieldsDropdownProps) {
  if (!visible) return null;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleToggleColumn = (columnId: string) => {
    if (hiddenColumns.includes(columnId)) {
      onShowColumn(columnId);
    } else {
      onHideColumn(columnId);
    }
  };

  const visibleColumns = allColumns.filter(col => !hiddenColumns.includes(col.id));
  const hiddenColumnData = allColumns.filter(col => hiddenColumns.includes(col.id));

  return (
    <>
      <div
        className="hidden-fields-dropdown-overlay"
        onClick={onCancel}
      />
      <div
        className="hidden-fields-dropdown"
        style={{ left: x, top: y }}
        onClick={handleMenuClick}
      >
        <div className="dropdown-header">
          <input 
            type="text" 
            placeholder="Find a field" 
            className="field-search-input"
          />
        </div>
        
        <div className="fields-list">
          {allColumns.map((column) => {
            const isHidden = hiddenColumns.includes(column.id);
            
            return (
              <div 
                key={column.id} 
                className={`field-item ${isHidden ? 'hidden' : 'visible'}`}
                onClick={() => handleToggleColumn(column.id)}
              >
                <div className="field-toggle">
                  <div className={`toggle-switch ${!isHidden ? 'active' : ''}`}></div>
                </div>
                <span className="field-name">{column.name}</span>
                <span className="field-drag-handle">⋮⋮</span>
              </div>
            );
          })}
        </div>
        
        <div className="dropdown-footer">
          <button className="footer-btn" onClick={onHideAll}>
            Hide all
          </button>
          <button className="footer-btn" onClick={onShowAll}>
            Show all
          </button>
        </div>
      </div>
    </>
  );
}