'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import '../../styles/columnconfigmodal.css'
import Search from '../assets/search.svg';
import Image from 'next/image';
import Help from '../assets/help-icon-grey.png';

interface ColumnConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColumn: (name: string, type: 'text' | 'number') => void;
  isColumnModalOpen: boolean;
}

export default function ColumnConfiguration({ isOpen, onClose, onCreateColumn }: ColumnConfigurationProps) {
  const [step, setStep] = useState<'select-type' | 'configure-field'>('select-type');
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState<'text' | 'number'>('text');
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
        setStep('select-type');
        setColName('');
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  const handleCreateColumn = () => {
    if (colName.trim()) {
      onCreateColumn(colName.trim(), colType);
      onClose();
      setStep('select-type');
      setColName('');
      setSearchTerm('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateColumn();
    } else if (e.key === 'Escape') {
      onClose();
      setStep('select-type');
    }
  };

  const handleTypeSelect = (type: 'text' | 'number') => {
    setColType(type);
    setStep('configure-field');
  };

  if (!isOpen) return null;

  const fieldTypes = [
    { icon: '≋', label: 'Single line text', type: 'text' as const },
    { icon: '≡', label: 'Long text', type: 'text' as const },
    { icon: '#', label: 'Number', type: 'number' as const },
    { icon: '☑', label: 'Checkbox', type: 'text' as const },
    { icon: '▼', label: 'Single select', type: 'text' as const },
    { icon: '☰', label: 'Multiple select', type: 'text' as const },
    { icon: '📎', label: 'Attachment', type: 'text' as const },
    { icon: '🔗', label: 'Link to another record', type: 'text' as const },
  ];

  const filteredFieldTypes = fieldTypes.filter(field => 
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      ref={modalRef}
      className="context-menu-overlay"
      style={{
        backgroundColor: 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
        zIndex: 1000,
        minWidth: step === 'select-type' ? '400px' : '500px',
        maxWidth: step === 'select-type' ? '400px' : '500px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {step === 'select-type' ? (
        <>
          {/* Search bar */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Find a field type"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="column-config-search-input"
              style={{
                width: '90%',
                padding: '6px 6px 6px 40px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
              <Image className='search-button-column-config' alt='' src={Search} width={15} height={15}/>
              <Image className='help-icon-for-column-config' src={Help} width={15} height={15} alt=''/>
          </div>

          {/* Standard fields section */}
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#6c757d',
              marginLeft: '10px',
            }}>
              Standard fields
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredFieldTypes.map((field, index) => (
                <button
                  key={index}
                  onClick={() => handleTypeSelect(field.type)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '5px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ 
                    fontSize: '16px',
                    width: '24px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                    {field.icon}
                  </span>
                  <span>{field.label}</span>
                  {field.label === 'Link to another record' && (
                    <span style={{ marginLeft: 'auto', color: '#6c757d' }}>›</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Configure field step */}
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Field name (optional)"
              autoFocus
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '2px solid #2d7ff9',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Field type selector */}
          <div style={{ 
            marginBottom: '12px',
            padding: '6px 8px',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px' }}>
                {colType === 'text' ? '≋' : '#'}
              </span>
              <span style={{ fontSize: '14px' }}>
                {colType === 'text' ? 'Single line text' : 'Number'}
              </span>
            </div>
            <span style={{ color: '#6c757d' }}>⌄</span>
          </div>

          {/* Description */}
          <p style={{ 
            fontSize: '13px', 
            color: '#6c757d', 
            marginBottom: '20px',
            lineHeight: '1.5',
          }}>
            Enter text, or prefill each new cell with a default value.
          </p>

          {/* Default value section */}
          <div>
            <label style={{ 
              fontSize: '11px', 
              color: '#56575C',
              display: 'block',
              marginBottom: '10px',
            }}>
              Default
            </label>
            <input
              type="text"
              placeholder="Enter default value (optional)"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div className='bottom-config-column-config'>
            <button
              style={{
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#333',
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              <span>Add description</span>
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setStep('select-type');
                  setColName('');
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: '#333',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateColumn}
                style={{
                  padding: '0px 14px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#2d7ff9',
                  color: 'white',
                }}
              >
                Create field
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}