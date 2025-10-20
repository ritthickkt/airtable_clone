'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Search from '../assets/search.svg';
import CustomDropdown from './CustomDropdown';
import '../../styles/sortcontextmenu.css';

interface SortDropdownProps {
  visible: boolean;
  x: number;
  y: number;
  allColumns: Array<{ id: string; name: string; type: string }>;
  currentSort: Array<{ columnId: string; direction: 'asc' | 'desc' }>;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  onClearSort: () => void;
  onRemoveSort: (columnId: string) => void;
  onCancel: () => void;
}

export default function SortDropdown({
  visible,
  x,
  y,
  allColumns,
  currentSort,
  onSort,
  onClearSort,
  onRemoveSort,
  onCancel
}: SortDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [addingSort, setAddingSort] = useState(false);
  const [newSortColumnId, setNewSortColumnId] = useState<string | null>(null);
  const [newSortDirection, setNewSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [fieldDropdownPosition, setFieldDropdownPosition] = useState<{ left: number, top: number }>({ left: 0, top: 0 });
  const fieldDropdownRef = useRef<HTMLDivElement>(null);
  const [autoSort, setAutoSort] = useState(true);

  const addSortBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedColumnId(null);
      setAddingSort(false);
      setNewSortColumnId(null);
      setNewSortDirection('asc');
      setShowFieldDropdown(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!showFieldDropdown) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        fieldDropdownRef.current &&
        !fieldDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFieldDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFieldDropdown]);

  const handleAddSortClick = () => {
    if (addSortBtnRef.current) {
      const rect = addSortBtnRef.current.getBoundingClientRect();
      setFieldDropdownPosition({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY,
      });
      setShowFieldDropdown(true);
    }
  };

  if (!visible) return null;

  const filteredColumns = allColumns.filter(column =>
    column.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedColumn = allColumns.find(col => col.id === selectedColumnId);

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
        {currentSort.length === 0 ? (
          <>
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
                  <div key={column.id} className="sort-field-item" onClick={() => {setSelectedColumnId(column.id); onSort(column.id, 'asc');}}>
                    <div className="sort-field-header">
                      <span className="sort-field-icon">{getColumnIcon(column.type)}</span>
                      <span className="sort-field-name">{column.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="sort-dropdown-overlay" onClick={onCancel}>
              <div
                className="sort-dropdown"
                style={{ left: x, top: y }}
                onClick={e => e.stopPropagation()}
              >
                <div className="sort-dropdown-header">
                  <h3>Sort by</h3>
                </div>
                {currentSort.map((sort, idx) => {
                  const col = allColumns.find(c => c.id === sort.columnId);
                  const sortOptions = getSortOptions(col?.type ?? 'text').map(opt => ({
                    value: opt.direction,
                    label: opt.label
                  }));
                  const columnOptions = allColumns.map(column => ({
                    value: column.id,
                    label: column.name,
                    icon: getColumnIcon(column.type)
                  }));
                  
                  return (
                    <div key={sort.columnId} className="sort-row">
                      {/* Column dropdown */}
                      <CustomDropdown
                        value={sort.columnId}
                        options={columnOptions}
                        onChange={value => {
                          // Ensure we have a valid direction before calling onSort
                          const direction = sort.direction || 'asc';
                          if (value !== sort.columnId) {
                            onRemoveSort(sort.columnId);
                            onSort(value, direction);
                          }
                        }}
                        className="sort-column-dropdown"
                      />
                      {/* Direction dropdown */}
                      <CustomDropdown
                        value={sort.direction}
                        options={sortOptions}
                        onChange={value => {
                          // Ensure value is valid before calling onSort
                          const direction = (value as 'asc' | 'desc') || 'asc';
                          onSort(sort.columnId, direction);
                        }}
                        className="sort-direction-dropdown"
                      />
                      {/* Remove button */}
                      <button
                        className="sort-remove-btn"
                        onClick={() => {onRemoveSort(sort.columnId); onCancel();}}
                        title="Remove sort"
                      >✕</button>
                    </div>
                  );
                })}
                {/* Add another sort */}
                {addingSort ? (
                  <div className="sort-row">
                    <select
                      value={newSortColumnId ?? ''}
                      onChange={e => setNewSortColumnId(e.target.value)}
                      className="sort-column-select"
                    >
                      <option value="" disabled>Select field</option>
                      {allColumns
                        .filter(col => !currentSort.some(s => s.columnId === col.id))
                        .map(col => (
                          <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                    </select>
                    <select
                      value={newSortDirection}
                      onChange={e => setNewSortDirection(e.target.value as 'asc' | 'desc')}
                      className="sort-direction-select"
                    >
                      <option value="asc">A → Z</option>
                      <option value="desc">Z → A</option>
                    </select>
                    <button
                      className="sort-add-btn"
                      onClick={() => {
                        if (newSortColumnId) {
                          onSort(newSortColumnId, newSortDirection);
                          setAddingSort(false);
                          setNewSortColumnId(null);
                          setNewSortDirection('asc');
                        }
                      }}
                    >Add</button>
                  </div>
                ) : (
                  <>
                  <button
                    ref={addSortBtnRef}
                    className="sort-add-another-btn"
                    onClick={handleAddSortClick}
                  >+ <div></div>Add another sort</button>
                </>
              )}
              </div>
            </div>
          </>
        )}
      </div>
      {showFieldDropdown && (
        <div 
          ref={fieldDropdownRef}
          className="custom-field-dropdown" 
          style={{
            position: 'fixed',
            left: fieldDropdownPosition.left,
            top: fieldDropdownPosition.top,
            zIndex: 1100,
          }}
        >
          {allColumns
            .filter(col => !currentSort.some(s => s.columnId === col.id))
            .map(col => (
              <div
                key={col.id}
                className="custom-field-dropdown-item"
                onClick={() => {
                  onSort(col.id, 'asc');
                  setShowFieldDropdown(false);
                }}
              >
                {col.name}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}