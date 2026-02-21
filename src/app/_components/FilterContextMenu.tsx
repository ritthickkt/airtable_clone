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
  logicalOperator?: 'AND' | 'OR';
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

  const handleColumnChange = (columnId: string) => {
    const column = allColumns.find(col => col.id === columnId);
    const operators = column ? getOperatorOptions(column.type) : [];
    const newOperator = operators.length > 0 && operators[0] ? operators[0].value : '';
    
    setNewFilter({
      columnId,
      operator: newOperator,
      value: '',
    });
    
    if (column && newOperator) {
      const filter: FilterCondition = {
        id: `filter-${Date.now()}`,
        columnId,
        columnName: column.name,
        columnType: column.type,
        operator: newOperator,
        value: '',
        logicalOperator: currentFilters.length > 0 ? 'AND' : undefined, // Default to AND for subsequent filters
      };
      onAddFilter(filter);
      setNewFilter({ columnId: '', operator: '', value: '' });
    }
  };

  const handleLogicalOperatorChange = (filterId: string, logicalOperator: 'AND' | 'OR') => {
    onUpdateFilter(filterId, { logicalOperator });
  };

  return (
    <div
      ref={menuRef}
      className="filter-context-menu"
      style={{
        position: 'fixed',
        top: y,
        right: (window.innerWidth - x) - 150,
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

      {currentFilters.length === 0 && !showAddFilterRow && (
        <div className='no-filters-applied-and-help'>
          <div style={{ 
            textAlign: 'center', 
            color: '#666',
            fontSize: '13px'
          }}>
            No filters are applied 
          </div>
          <Image src={Help} width={15} height={15} alt=''/>
        </div>
      )}

      {currentFilters.map((filter, index) => (
        <div key={filter.id} className="filter-condition" style={{
          marginTop: index === 0 ? '0' : '16px',
          display: 'flex',
          flexDirection: 'row',
        }}>
          {index > 0 && (
            <div style={{ display: 'flex', alignItems: 'center'}}>
              <select
                value={filter.logicalOperator ?? 'AND'}
                onChange={(e) => handleLogicalOperatorChange(filter.id, e.target.value as 'AND' | 'OR')}
                style={{
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginRight: '10px',
                  maxWidth: '70px',
                }}
              >
                <option value="AND">And</option>
                <option value="OR">Or</option>
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {index === 0 && <span style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginRight: '11px'}}>Where</span>}
            
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
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
        </div>
      ))}

      {(showAddFilterRow || currentFilters.length > 0) && (
        <div className="add-filter-section" style={{
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'row',
        }}>
          {currentFilters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center'}}>
              <div style={{
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'center',
                marginRight: '7px',
                minWidth: '70xp',
                maxWidth: '70px',
              }}>
                And
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                {currentFilters.length === 0 ? 'Where' : ''}
              </span>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
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
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '16px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => {
              setShowAddFilterRow(true);
              setHeaderTrue(true);
              if (allColumns.length > 0 && currentFilters.length === 0) {
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
                    logicalOperator: undefined, 
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
            onClick={() => {/* Add condition group */}}
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