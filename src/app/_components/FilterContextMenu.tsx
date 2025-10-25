'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Ribeye } from 'next/font/google';
import '../../styles/filtercontextmenu.css' 
import Drag from '../assets/dragicon.png';
import Trash from '../assets/trash-icon.png';
import Help from '../assets/help-icon-grey.png';

interface FilterCondition {
  id: string;
  columnId: string;
  columnName: string;
  columnType: string;
  operator: string;
  value: string;
}

interface FilterContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  allColumns: Array<{ id: string; name: string; type: string }>;
  currentFilters: FilterCondition[];
  onAddFilter: (filter: FilterCondition) => void;
  onUpdateFilter: (filterId: string, updates: Partial<FilterCondition>) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAllFilters: () => void;
  onCancel: () => void;
}

const getOperatorOptions = (columnType: string) => {
  if (columnType === 'number') {
    return [
      { value: 'gt', label: 'greater than' },
      { value: 'lt', label: 'less than' },
      { value: 'eq', label: 'equal to' },
      { value: 'gte', label: 'greater than or equal to' },
      { value: 'lte', label: 'less than or equal to' },
    ];
  } else {
    return [
      { value: 'contains', label: 'contains' },
      { value: 'not_contains', label: 'does not contain' },
      { value: 'eq', label: 'equal to' },
      { value: 'not_eq', label: 'not equal to' },
      { value: 'is_empty', label: 'is empty' },
      { value: 'is_not_empty', label: 'is not empty' },
    ];
  }
};

export default function FilterContextMenu({
  visible,
  x,
  y,
  allColumns,
  currentFilters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onClearAllFilters,
  onCancel,
}: FilterContextMenuProps) {
  const [newFilter, setNewFilter] = useState({
    columnId: '',
    operator: '',
    value: '',
  });
  const [showAddFilterRow, setShowAddFilterRow] = useState(false);
  const [headerTrue, setHeaderTrue] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onCancel]);

  useEffect(() => {
    if (!visible) {
      setNewFilter({ columnId: '', operator: '', value: '' });
      setShowAddFilterRow(false);
      setHeaderTrue(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handleAddFilter = () => {
    if (!newFilter.columnId || !newFilter.operator) return;

    const column = allColumns.find(col => col.id === newFilter.columnId);
    if (!column) return;

    const filter: FilterCondition = {
      id: `filter-${Date.now()}`,
      columnId: newFilter.columnId,
      columnName: column.name,
      columnType: column.type,
      operator: newFilter.operator,
      value: newFilter.value,
    };

    onAddFilter(filter);
    setNewFilter({ columnId: '', operator: '', value: '' });
    setShowAddFilterRow(true); // Keep the add filter row visible for next filter
  };

  const handleColumnChange = (columnId: string) => {
    const column = allColumns.find(col => col.id === columnId);
    const operators = column ? getOperatorOptions(column.type) : [];
    const newOperator = operators.length > 0 && operators[0] ? operators[0].value : '';
    
    setNewFilter({
      columnId,
      operator: newOperator,
      value: '',
    });
    
    // ✅ Auto-add filter immediately when column is selected
    if (column && newOperator) {
      const filter: FilterCondition = {
        id: `filter-${Date.now()}`,
        columnId,
        columnName: column.name,
        columnType: column.type,
        operator: newOperator,
        value: '',
      };
      onAddFilter(filter);
      setNewFilter({ columnId: '', operator: '', value: '' }); // Reset for next filter
    }
  };

  const handleOperatorChange = (operator: string, filterId?: string) => {
    if (filterId) {
      onUpdateFilter(filterId, { 
        operator,
        value: ['is_empty', 'is_not_empty'].includes(operator) ? '' : currentFilters.find(f => f.id === filterId)?.value ?? ''
      });
    } else {
      setNewFilter(prev => ({ 
        ...prev, 
        operator,
        value: ['is_empty', 'is_not_empty'].includes(operator) ? '' : prev.value
      }));
    }
  };

  const handleValueChange = (value: string, filterId?: string) => {
    if (filterId) {
      // Update existing filter
      onUpdateFilter(filterId, { value });
    } else {
      // Update new filter state
      setNewFilter(prev => ({ ...prev, value }));
    }
  };

  const selectedColumn = allColumns.find(col => col.id === newFilter.columnId);
  const operatorOptions = selectedColumn ? getOperatorOptions(selectedColumn.type) : [];
  const needsValue = newFilter.operator && !['is_empty', 'is_not_empty'].includes(newFilter.operator);

  return (
    <div
      ref={menuRef}
      className="filter-context-menu"
      style={{
        position: 'fixed',
        top: y,
        left: x - 220,
        right: window.innerWidth - x,
        zIndex: 1000,
        background: 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '16px',
        minWidth: '300px',
        maxHeight: '500px',
        overflowY: 'auto',
      }}
    >
      {headerTrue && (
        <div className="filter-header">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600' }}>
            In this view, show records
          </h3>
        </div>
      )}

      {/* Empty state - show when no filters and add filter button not clicked */}
      {currentFilters.length === 0 && !showAddFilterRow && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px 0',
          color: '#666',
          fontSize: '13px'
        }}>
          No filters applied at the moment
        </div>
      )}

      {/* Current Filters */}
      {currentFilters.map((filter, index) => (
        <div key={filter.id} className="filter-condition" style={{
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'row', 
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '40px'}}>
            {index === 0 && <span style={{ fontSize: '12px', color: '#666' }}>Where</span>}
            {index > 0 && <span style={{ fontSize: '12px', color: '#666' }}>And</span>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={filter.columnId}
              onChange={(e) => {
                const column = allColumns.find(col => col.id === e.target.value);
                if (column) {
                  const operators = getOperatorOptions(column.type);
                  onUpdateFilter(filter.id, {
                    columnId: e.target.value,
                    columnName: column.name,
                    columnType: column.type,
                    operator: operators[0]?.value ?? '',
                    value: '',
                  });
                }
              }}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                minWidth: '120px',
                height: '31px',
              }}
            >
              {allColumns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) => onUpdateFilter(filter.id, { 
                operator: e.target.value,
                value: ['is_empty', 'is_not_empty'].includes(e.target.value) ? '' : filter.value
              })}
              style={{
                padding: '6px 8px',
                borderRight: '1px solid #d1d5db',
                borderTop: '1px solid #d1d5db',
                borderBottom: '1px solid #d1d5db',
                fontSize: '13px',
                minWidth: '120px',
                height: '31px',
              }}
            >
              {getOperatorOptions(filter.columnType).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
              <input
                type={filter.columnType === 'number' ? 'number' : 'text'}
                value={filter.value}
                onChange={(e) => onUpdateFilter(filter.id, { value: e.target.value })}
                placeholder="Enter a value"
                style={{
                    padding: '6px 8px',
                    borderRight: '1px solid #d1d5db',
                    borderTop: '1px solid #d1d5db',
                    borderBottom: '1px solid #d1d5db',
                    fontSize: '13px',
                    minWidth: '120px',
                    height: '31px',
                }}
              />
            )}
            <button
              onClick={() => onRemoveFilter(filter.id)}
              style={{
                padding: '6px 8px',
                background: 'transparent',
                borderRight: '1px solid #d1d5db',
                borderTop: '1px solid #d1d5db',
                borderBottom: '1px solid #d1d5db',
                height: '31px',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: '14px',
              }}
              title="Remove filter"
            >
              <Image src={Trash} alt='' width={15} height={15}/>
            </button>
            <button
              style={{
                padding: '6px 8px',
                background: 'transparent',
                borderRight: '1px solid #d1d5db',
                borderTop: '1px solid #d1d5db',
                borderBottom: '1px solid #d1d5db',
                height: '31px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="Drag"
            >
              <Image src={Drag} alt='' width={15} height={15}/>
            </button>
          </div>
        </div>
      ))}

      {/* Add New Filter row - show when "Add filter" button is clicked OR when filters exist */}
      {(showAddFilterRow || currentFilters.length > 0) && (
        <div className="add-filter-section" style={{
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'row', 
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center'}}>
            <span style={{ fontSize: '12px', color: '#666', width: '40px' }}>
              {currentFilters.length === 0 ? 'Where' : 'And'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <select
              value={newFilter.columnId}
              onChange={(e) => handleColumnChange(e.target.value)}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                minWidth: '120px',
              }}
            >
              <option value="">Select field</option>
              {allColumns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons - Always at bottom */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #e1e5e9'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => {
              setShowAddFilterRow(true);
              setHeaderTrue(true);
              // Auto-add first filter immediately
              if (allColumns.length > 0) {
                const firstColumn = allColumns[0];
                if (firstColumn) {
                  const operators = getOperatorOptions(firstColumn.type);
                  const filter: FilterCondition = {
                    id: `filter-${Date.now()}`,
                    columnId: firstColumn.id,
                    columnName: firstColumn.name,
                    columnType: firstColumn.type,
                    operator: operators[0]?.value ?? '',
                    value: '',
                  };
                  onAddFilter(filter);
                }
              }
            }}
            className='add_condition_button'
          >
            + Add filter
          </button>
          <button
            onClick={() => {/* TODO: Add condition group */}}
            className='add_condition_group_button'
          >
            + Add condition group
          </button>
          <Image src={Help} alt='' width={20} height={15}/>
        </div>
      </div>
    </div>
  );
}