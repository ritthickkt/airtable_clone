'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import '../../styles/columnconfigmodal.css'

interface ColumnConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColumn: (name: string, type: 'text' | 'number') => void;
  isColumnModalOpen: boolean;
  colConfigPosition: { top: number; left: number } | null;
}

export default function ColumnConfiguration({ isOpen, onClose, onCreateColumn, colConfigPosition }: ColumnConfigurationProps) {
  if (!isOpen || !colConfigPosition) return null;
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState<'text' | 'number'>('text');
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Reset form when modal opens
      setColName('');
      setColType('text');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  const handleCreateColumn = () => {
    if (colName.trim()) {
      onCreateColumn(colName.trim(), colType);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateColumn();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const menuItems = [
    { 
      icon: 'A', 
      label: 'Add Text Column', 
      action: () => {
        setColType('text');
        handleCreateColumn();
      } 
    },
    { 
      icon: '#', 
      label: 'Add Number Column', 
      action: () => {
        setColType('number');
        handleCreateColumn();
      } 
    },
  ];

  return (
    <>    
        <div
          className="context-menu-overlay"
          style={{
            position: 'fixed',
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '8px 0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
            zIndex: 1000,
            minWidth: '220px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="form-group">
            <label htmlFor="column-name">Column Name</label>
            <input
              id="column-name"
              type="text"
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter column name"
              className="column-name-input"
              autoFocus
            />
          </div>
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              {/* Add separator before "Add comment" */}
              {index === 5 && (
                <div 
                  style={{
                    height: '1px',
                    backgroundColor: '#e1e5e9',
                    margin: '4px 0',
                  }}
                />
              )}
              
              {/* Add separator before "Delete record" */}
              {index === 8 && (
                <div 
                  style={{
                    height: '1px',
                    backgroundColor: '#e1e5e9',
                    margin: '4px 0',
                  }}
                />
              )}
              
              <button
                onClick={item.action}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: '10px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  textAlign: 'left' as const,
                  fontWeight: '400',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span 
                  style={{ 
                    fontSize: '16px',
                    width: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
    </>
  );
}