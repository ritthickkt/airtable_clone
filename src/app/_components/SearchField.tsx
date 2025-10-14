'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Search from '../assets/search.svg';

interface SearchResult {
  rowId: string;
  rowIndex: number;
  columnId: string;
  columnName: string;
  value: string;
  isColumnHeader?: boolean;
}

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchResults: SearchResult[];
  currentResultIndex: number;
  onResultSelect: (index: number) => void;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  x: number;
  y: number;
}

export default function SearchOverlay({
  visible,
  onClose,
  searchTerm,
  onSearchChange,
  searchResults,
  currentResultIndex,
  onResultSelect,
  onNavigateNext,
  onNavigatePrev,
  x,
  y
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          onNavigatePrev();
        } else {
          onNavigateNext();
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        onNavigateNext();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        onNavigatePrev();
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose, onNavigateNext, onNavigatePrev]);

  if (!visible) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div 
        className="search-container" 
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-input-container">
          <Image src={Search} alt="Search" className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          <div className="search-navigation">
            {searchResults.length > 0 && (
              <span className="search-count">
                {currentResultIndex + 1} of {searchResults.length}
              </span>
            )}
            <button
              className="search-nav-btn"
              onClick={onNavigatePrev}
              disabled={searchResults.length === 0}
              title="Previous (Shift+Enter)"
            >
              ↑
            </button>
            <button
              className="search-nav-btn"
              onClick={onNavigateNext}
              disabled={searchResults.length === 0}
              title="Next (Enter)"
            >
              ↓
            </button>
            <button
              className="search-close-btn"
              onClick={onClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {searchTerm && searchResults.length > 0 && (
          <div className="search-results">
            <div className="search-results-header">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {searchTerm && searchResults.length === 0 && (
          <div className="search-no-results">
            No results found for "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}