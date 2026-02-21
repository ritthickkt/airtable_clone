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
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    const timeout = setTimeout(() => setIsTyping(false), 600);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

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
    <div className="search-overlay">
      <div 
        className="search-container" 
        style={{ top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-input-container">
          <input
            ref={inputRef}
            type="text"
            placeholder="Find in view"
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
              className="search-close-btn"
              onClick={() => { onClose(); onSearchChange(''); }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {searchTerm ? (
          searchResults.length === 0 ? (
            <div className="below-search-field">
              <div className="search-no-results">
                Found no fields and no cells
              </div>
            </div>
          ) : (
            <div className="below-search-field">
              <div className="search-results-header">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
            </div>
          )
        ) : (
          <div className='below-search-field'>
            <div>
              Use advanced search options in the
            </div>
            <div className='search-extensions'>
              search extension
            </div>          
          </div>
        )}
      </div>
    </div>
  );
}