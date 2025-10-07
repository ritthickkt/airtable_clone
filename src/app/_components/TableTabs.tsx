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

  return (
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