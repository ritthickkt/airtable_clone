'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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
      { value: 'gt', label: 'Greater than' },
      { value: 'lt', label: 'Less than' },
      { value: 'eq', label: 'Equal to' },
      { value: 'gte', label: 'Greater than or equal to' },
      { value: 'lte', label: 'Less than or equal to' },
    ];
  } else {
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' },
      { value: 'eq', label: 'Equal to' },
      { value: 'not_eq', label: 'Not equal to' },
      { value: 'is_empty', label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' },
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
  };

  const handleColumnChange = (columnId: string) => {
    const column = allColumns.find(col => col.id === columnId);
    const operators = column ? getOperatorOptions(column.type) : [];
    
    setNewFilter({
      columnId,
      operator: operators.length > 0 ? operators[0].value : '',
      value: '',
    });
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
        left: x,
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
      <div className="filter-header">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600' }}>
          In this view, show records
        </h3>
      </div>

      {/* Current Filters */}
      {currentFilters.map((filter, index) => (
        <div key={filter.id} className="filter-condition" style={{
          marginBottom: '12px',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e1e5e9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {index === 0 && <span style={{ fontSize: '12px', color: '#666' }}>Where</span>}
            {index > 0 && <span style={{ fontSize: '12px', color: '#666' }}>And</span>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    operator: operators[0]?.value || '',
                    value: '',
                  });
                }
              }}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                minWidth: '120px',
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
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                minWidth: '140px',
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
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  minWidth: '120px',
                }}
              />
            )}

            <button
              onClick={() => onRemoveFilter(filter.id)}
              style={{
                padding: '6px 8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: '14px',
              }}
              title="Remove filter"
            >
              🗑
            </button>
          </div>
        </div>
      ))}

      {/* Add New Filter */}
      <div className="add-filter-section" style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px dashed #d1d5db'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {currentFilters.length === 0 ? 'Where' : 'And'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={newFilter.columnId}
            onChange={(e) => handleColumnChange(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
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

          {newFilter.columnId && (
            <select
              value={newFilter.operator}
              onChange={(e) => setNewFilter(prev => ({ 
                ...prev, 
                operator: e.target.value,
                value: ['is_empty', 'is_not_empty'].includes(e.target.value) ? '' : prev.value
              }))}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                minWidth: '140px',
              }}
            >
              {operatorOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {needsValue && (
            <input
              type={selectedColumn?.type === 'number' ? 'number' : 'text'}
              value={newFilter.value}
              onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Enter a value"
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                minWidth: '120px',
              }}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #e1e5e9'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddFilter}
            disabled={!newFilter.columnId || !newFilter.operator}
            style={{
              padding: '6px 12px',
              background: newFilter.columnId && newFilter.operator ? '#3b82f6' : '#e5e7eb',
              color: newFilter.columnId && newFilter.operator ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: newFilter.columnId && newFilter.operator ? 'pointer' : 'not-allowed',
            }}
          >
            + Add condition
          </button>
          
          <button
            onClick={() => {/* TODO: Add condition group */}}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            + Add condition group
          </button>
        </div>

        {currentFilters.length > 0 && (
          <button
            onClick={onClearAllFilters}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#ef4444',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}