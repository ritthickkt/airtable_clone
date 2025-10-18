'use client'

import { useState, useRef, useEffect } from 'react';

interface ViewCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateView: (name: string) => void;
  x: number;
  y: number;
}

export default function ViewCreationModal({
  isOpen,
  onClose,
  onCreateView,
  x,
  y,
}: ViewCreationModalProps) {
  const [viewName, setViewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewName.trim()) {
      onCreateView(viewName.trim());
      setViewName('');
    }
  };
  if (!isOpen) return null;
  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '16px',
        zIndex: 1000,
        minWidth: '300px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        Create View
      </h3>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          placeholder="Enter view name..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '13px',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!viewName.trim()}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: viewName.trim() ? '#2563eb' : '#e0e0e0',
              color: 'white',
              cursor: viewName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '13px',
            }}
          >
            Create View
          </button>
        </div>
      </form>
    </div>
  )
}