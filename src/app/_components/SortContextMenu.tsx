'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Search from '../assets/search.svg';
import CustomDropdown from './CustomDropdown';
import '../../styles/sortcontextmenu.css';
import HelpIcon from '../assets/help-icon-grey.png';

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
  onApplySort: (sortConfig: Array<{ columnId: string; direction: 'asc' | 'desc' }>) => void;
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
  onCancel,
  onApplySort
}: SortDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSort, setPendingSort] = useState<Array<{ columnId: string; direction: 'asc' | 'desc' }>>(currentSort);
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [fieldDropdownPosition, setFieldDropdownPosition] = useState<{ left: number, top: number }>({ left: 0, top: 0 });
  const fieldDropdownRef = useRef<HTMLDivElement>(null);

  const addSortBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visible) {
      setShowFieldDropdown(false);
    }
  }, [visible]);

  useEffect(() => {
    setPendingSort(currentSort);
  }, [currentSort]);

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

  const handleAddSort = (columnId: string) => {
    setPendingSort(prev => [...prev, { columnId, direction: 'asc' }]);
    setShowFieldDropdown(false);
  };

  const handleUpdateSort = (columnId: string, direction: 'asc' | 'desc') => {
    setPendingSort(prev => 
      prev.map(s => s.columnId === columnId ? { ...s, direction } : s)
    );
  };

  const handleChangeColumn = (oldColumnId: string, newColumnId: string) => {
    setPendingSort(prev => 
      prev.map(s => s.columnId === oldColumnId ? { columnId: newColumnId, direction: s.direction } : s)
    );
  };

  const handleRemoveSort = (columnId: string) => {
    setPendingSort(prev => prev.filter(s => s.columnId !== columnId));
  };

  const handleApplySort = () => {
    onApplySort(pendingSort);
    onCancel();
  };

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
        {pendingSort.length === 0 ? (
          <>
            <div className="sort-dropdown-header">
              <h3>
                <span>Sort by</span>
                <Image src={HelpIcon} alt='' width={20} height={15}/>
              </h3>
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
              {filteredColumns.map((column) => (
                <div 
                  key={column.id} 
                  className="sort-field-item" 
                  onClick={() => handleAddSort(column.id)}
                >
                  <div className="sort-field-header">
                    <span className="sort-field-icon">{getColumnIcon(column.type)}</span>
                    <span className="sort-field-name">{column.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="sort-dropdown-header-secondary">
              <h3>Sort by</h3>
            </div>
            {pendingSort.map((sort) => {
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
                  <CustomDropdown
                    value={sort.columnId}
                    options={columnOptions}
                    onChange={value => handleChangeColumn(sort.columnId, value)}
                    className="sort-column-dropdown"
                  />
                  <CustomDropdown
                    value={sort.direction}
                    options={sortOptions}
                    onChange={value => handleUpdateSort(sort.columnId, value as 'asc' | 'desc')}
                    className="sort-direction-dropdown"
                  />
                  <button
                    className="sort-remove-btn"
                    onClick={() => handleRemoveSort(sort.columnId)}
                    title="Remove this sort"
                  >✕</button>
                </div>
              );
            })}
            
            <button
              ref={addSortBtnRef}
              className="sort-add-another-btn"
              onClick={handleAddSortClick}
            >
              + <div></div>Add another sort
            </button>

            {/* Sort Button */}
            <button
              className="sort-apply-btn"
              onClick={handleApplySort}
            >
              Sort
            </button>
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
            .filter(col => !pendingSort.some(s => s.columnId === col.id))
            .map(col => (
              <div
                key={col.id}
                className="custom-field-dropdown-item"
                onClick={() => handleAddSort(col.id)}
              >
                {col.name}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}