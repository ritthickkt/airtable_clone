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
  const [addTable, setAddTable] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setAddTable(false);
      }
    };

    if (addTable) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [addTable]);

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
        <button className="add-tab-btn" onClick={handleCreateTable} disabled={createTableMutation.isPending}>
          + Add or Import
        </button>
        {addTable && (
          <div ref={popupRef} className="addTableConfig">
            <div className='baseEditBlock'><button type="button">+</button> Appearance</div>
            <div className='baseEditBlock'><button type="button">+</button> Base guide</div>
          </div>
        )}
      </div>
    </div>
  );
}