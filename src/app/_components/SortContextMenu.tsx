'use client';

import { useState } from 'react';
import Image from 'next/image';
import Search from '../assets/search.svg';
import '../../styles/sortcontextmenu.css';

interface SortDropdownProps {
  visible: boolean;
  x: number;
  y: number;
  allColumns: Array<{ id: string; name: string; type: string }>;
  currentSort: Array<{ columnId: string; direction: 'asc' | 'desc' }>;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  onCancel: () => void;
}

export default function SortDropdown({
  visible,
  x,
  y,
  allColumns,
  currentSort,
  onSort,
  onCancel
}: SortDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!visible) return null;

  const filteredColumns = allColumns.filter(column =>
    column.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'text': return 'A';
      case 'number': return '#';
      default: return '📝';
    }
  };

  const getSortOptions = (type: string) => {
    if (type === 'number') {
      return [
        { label: 'Sort increasing', direction: 'asc' as const },
        { label: 'Sort decreasing', direction: 'desc' as const }
      ];
    } else {
      return [
        { label: 'Sort A → Z', direction: 'asc' as const },
        { label: 'Sort Z → A', direction: 'desc' as const }
      ];
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="sort-dropdown-overlay" onClick={onCancel}>
      <div
        className="sort-dropdown"
        style={{ left: x, top: y }}
        onClick={handleMenuClick}
      >
        <div className="sort-dropdown-header">
          <h3>Sort by</h3>
        </div>

        <div className="sort-search-container">
          <Image src={Search} alt="Search" className="sort-search-icon" />
          <input
            type="text"
            placeholder="Find a field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sort-search-input"
          />
        </div>

        <div className="sort-fields-list">
          {filteredColumns.map((column) => {
            const sortOptions = getSortOptions(column.type);
            const currentColumnSort = currentSort.find(s => s.columnId === column.id);

            return (
              <div key={column.id} className="sort-field-item">
                <div className="sort-field-header">
                  <span className="sort-field-icon">{getColumnIcon(column.type)}</span>
                  <span className="sort-field-name">{column.name}</span>
                </div>
                <div className="sort-options">
                  {sortOptions.map((option) => (
                    <button
                      key={option.direction}
                      className={`sort-option ${
                        currentColumnSort?.direction === option.direction ? 'active' : ''
                      }`}
                      onClick={() => onSort(column.id, option.direction)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}