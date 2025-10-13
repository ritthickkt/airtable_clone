'use client';

import React from 'react';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  rowIndex: number;
  onDelete: () => void;
  onCancel: () => void;
}

export default function ContextMenuRecord({ 
  visible, 
  x, 
  y, 
  rowIndex, 
  onDelete, 
  onCancel,
}: ContextMenuProps) {
  if (!visible) return null;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to overlay
  };

  const menuItems = [
    { icon: '↑', label: 'Insert record above', action: () => { /* Does nothing */} },
    { icon: '↓', label: 'Insert record below', action: () => { /* Does nothing */} },
    { icon: '⧉', label: 'Duplicate record', action: () => {/* Does nothing */} },
    { icon: '🏷️', label: 'Apply template', action: () => {/* Does nothing */} },
    { icon: '↗', label: 'Expand record', action: () => {/* Does nothing */} },
    { icon: '💬', label: 'Add comment', action: () => {/* Does nothing */} },
    { icon: '🔗', label: 'Copy cell URL', action: () => {/* Does nothing */} },
    { icon: '📤', label: 'Send record', action: () => {/* Does nothing */} },
    { icon: '🗑️', label: 'Delete record', action: onDelete, isDelete: true },
  ];

  return (
    <div
      className="context-menu-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          position: 'absolute',
          top: y,
          left: x,
          backgroundColor: 'white',
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
          minWidth: '220px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
                color: item.isDelete ? '#e53e3e' : '#374151',
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
                  color: item.isDelete ? '#e53e3e' : '#6b7280',
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}