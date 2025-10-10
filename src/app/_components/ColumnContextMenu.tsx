'use client';

import React from 'react';
import Image from 'next/image';
import hideField from '../assets/hide-fields.svg'
import '../../styles/columncontext.css';

interface ColumnContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  columnId: string;
  columnName: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
  onHide: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function ColumnContextMenu({
  visible,
  x,
  y,
  columnId,
  columnName,
  onEdit,
  onDuplicate,
  onInsertLeft,
  onInsertRight,
  onHide,
  onDelete,
  onCancel
}: ColumnContextMenuProps) {
  if (!visible) return null;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="column-context-menu-overlay"
      onClick={onCancel}
    >
      <div
        className="column-context-menu"
        style={{ left: x, top: y }}
        onClick={handleMenuClick}
      >
        <div className="context-menu-item" onClick={onEdit}>
          <span className="context-menu-icon"></span>
          <span>Edit field</span>
        </div>
        
        <div className="context-menu-item" onClick={onDuplicate}>
          <span className="context-menu-icon"></span>
          <span>Duplicate field</span>
        </div>
        
        <div className="context-menu-separator"></div>
        
        <div className="context-menu-item" onClick={onInsertLeft}>
          <span className="context-menu-icon">←</span>
          <span>Insert left</span>
        </div>
        
        <div className="context-menu-item" onClick={onInsertRight}>
          <span className="context-menu-icon">→</span>
          <span>Insert right</span>
        </div>
        
        <div className="context-menu-separator"></div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Summarize attachment</span>
        </div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Extract title from attachment</span>
        </div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Write an outline of attachment</span>
        </div>
        
        <div className="context-menu-separator"></div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Copy field URL</span>
        </div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Edit field description</span>
        </div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Edit field permissions</span>
        </div>
        
        <div className="context-menu-separator"></div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Sort A → Z</span>
        </div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Sort Z → A</span>
        </div>
        
        <div className="context-menu-separator"></div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Filter by this field</span>
        </div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Group by this field</span>
        </div>
        
        <div className="context-menu-item">
          <span className="context-menu-icon"></span>
          <span>Show dependencies</span>
        </div>
        
        <div className="context-menu-separator"></div>
        
        <div className="context-menu-item" onClick={onHide}>
          <span className="context-menu-icon"><Image src={hideField} alt='hide-field'/></span>
          <span>Hide field</span>
        </div>
        
        <div className="context-menu-item danger" onClick={onDelete}>
          <span className="context-menu-icon">🗑️</span>
          <span>Delete field</span>
        </div>
      </div>
    </div>
  );
}