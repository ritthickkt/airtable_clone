'use client';

import { useState, useRef } from 'react';
import Image from "next/image";
import HideFields from '../assets/hide-fields.svg';
import Filter from '../assets/filter.svg';
import Sort from '../assets/sort.svg';
import Color from '../assets/color-bucket.png';
import ShareAndSync from '../assets/share.png';
import Group from '../assets/bullet-list.png';
import Search from '../assets/search.svg';
import RowHeight from '../assets/row-height.png';
import HiddenFieldsDropdown from '../_components/HiddenFields';
import SortDropdown from './SortContextMenu';
import FilterContextMenu from './FilterContextMenu';
import SearchOverlay from './SearchField';

interface FilterCondition {
  id: string;
  columnId: string;
  columnName: string;
  columnType: string;
  operator: string;
  value: string;
}

interface SearchResult {
  rowId: string;
  rowIndex: number;
  columnId: string;
  columnName: string;
  value: string;
  isColumnHeader?: boolean;
}

interface TableControlsProps {
  set100kRowsPressed: (editing: boolean) => void;
  hiddenColumns: string[];
  allColumns: Array<{ id: string; name: string; type: string }>;
  onShowColumn: (columnId: string) => void;
  onHideColumn: (columnId: string) => void;
  onHideAllColumns: () => void;
  onShowAllColumns: () => void;
  currentSort: Array<{ columnId: string; direction: 'asc' | 'desc' }>;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  onClearSort: () => void;
  onRemoveColumnSort: (columnId: string) => void;
  currentFilters: FilterCondition[];
  onAddFilter: (filter: FilterCondition) => void;
  onUpdateFilter: (filterId: string, updates: Partial<FilterCondition>) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAllFilters: () => void;
  baseColor?: string; // Add this
  sortingLoading?: boolean; // Add this
  filteringLoading?: boolean; // Add this
  onSearch?: (term: string) => void;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  onSearchNavigate?: (direction: 'next' | 'prev') => void;
  onSearchSelect?: (index: number) => void;
}

export default function TableControls({ 
  set100kRowsPressed, 
  hiddenColumns, 
  allColumns, 
  onShowColumn, 
  onHideColumn,
  onHideAllColumns,
  onShowAllColumns,
  currentSort,
  onSort,
  onClearSort,
  onRemoveColumnSort,
  currentFilters = [],
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onClearAllFilters,
  baseColor,
  sortingLoading = false,
  filteringLoading = false,
  onSearch,
  searchTerm = '',
  searchResults = [],
  currentSearchIndex = 0,
  onSearchNavigate,
  onSearchSelect,
}: TableControlsProps) {
  const [showHiddenFieldsDropdown, setShowHiddenFieldsDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [sortDropdownPosition, setSortDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filterDropdownPosition, setFilterDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const hideFieldsBtnRef = useRef<HTMLButtonElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchPosition, setSearchPosition] = useState({ left: 0, top: 0 });
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  const handle100kRowsPressed = () => {
    set100kRowsPressed(true);
  };

  const handleSearchClick = () => {
    if (searchBtnRef.current) {
      const rect = searchBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 400;
      
      const top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;
      
      // Adjust if dropdown would go off-screen
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      
      setSearchPosition({ top, left });
    }
    setShowSearchOverlay(true);
  };

  const handleSearchChange = (term: string) => {
    onSearch?.(term);
  };

  const handleSearchNavigate = (direction: 'next' | 'prev') => {
    onSearchNavigate?.(direction);
  };

  const handleSearchSelect = (index: number) => {
    onSearchSelect?.(index);
  };

  const handleHideFieldsClick = () => {
    if (hideFieldsBtnRef.current) {
      const rect = hideFieldsBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 300;
      const dropdownHeight = 400;

      let top = rect.bottom + window.scrollY + 4;
      let left = rect.left + window.scrollX;

      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      if (top + dropdownHeight > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - dropdownHeight - 4;
      }

      setDropdownPosition({ top, left });
    }
    setShowHiddenFieldsDropdown(!showHiddenFieldsDropdown);
  };

  const handleSortClick = () => {
    if (sortBtnRef.current) {
      const rect = sortBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 300;
      const dropdownHeight = 400;

      let top = rect.bottom + window.scrollY + 4;
      let left = rect.left + window.scrollX;

      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      if (top + dropdownHeight > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - dropdownHeight - 4;
      }

      setSortDropdownPosition({ top, left });
    }
    setShowSortDropdown(!showSortDropdown);
  };

  const handleFilterClick = () => {
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 300;
      const dropdownHeight = 500;

      let top = rect.bottom + window.scrollY + 4;
      let left = rect.left + window.scrollX;

      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      if (top + dropdownHeight > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - dropdownHeight - 4;
      }

      setFilterDropdownPosition({ top, left });
    }
    setShowFilterDropdown(!showFilterDropdown);
  };

  return (
    <>
      <div className="table-controls">
        <div className="table-controls-left"> 
          <button type="button" className="control-btn">⊞ Grid view</button>
        </div>
        <div className="table-controls-right">
          <button type="button" className="control-btn" onClick={handle100kRowsPressed}>
            Add 100k rows
          </button>
          <button 
            ref={hideFieldsBtnRef}
            type="button" 
            className="control-btn" 
            onClick={handleHideFieldsClick}
          >
            <Image className='table-control-icons' src={HideFields} alt='HideFields'/> 
            Hide fields
            {hiddenColumns.length > 0 && (
              <span className="hidden-count-badge">{hiddenColumns.length}</span>
            )}
          </button>
          <button 
            ref={filterBtnRef}
            type="button" 
            className="control-btn"
            onClick={handleFilterClick}
            disabled={sortingLoading || filteringLoading}
            style={{
              border: currentFilters.length > 0 ? `2px solid ${baseColor ?? '#2563eb'}` : undefined,
              backgroundColor: currentFilters.length > 0 ? `${baseColor ?? '#2563eb'}20` : undefined,
              opacity: filteringLoading ? 0.6 : 1,
              cursor: (sortingLoading || filteringLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            {filteringLoading ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #666',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '6px'
                }} />
                Filtering...
              </>
            ) : (
              <>
                <Image className='table-control-icons' src={Filter} alt='Filter'/> Filter
              </>
            )}
          </button>
          <button type="button" className="control-btn">
            <Image className='table-control-icons' src={Group} alt='Group'/> Group
          </button>
          <button 
            ref={sortBtnRef}
            type="button" 
            className="control-btn"
            onClick={handleSortClick}
            disabled={sortingLoading || filteringLoading}
            style={{
              border: currentSort.length > 0 ? `2px solid ${baseColor ?? '#2563eb'}` : undefined,
              backgroundColor: currentSort.length > 0 ? `${baseColor ?? '#2563eb'}20` : undefined,
              opacity: sortingLoading ? 0.6 : 1,
              cursor: (sortingLoading || filteringLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            {sortingLoading ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #666',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '6px'
                }} />
                Sorting...
              </>
            ) : (
              <>
                <Image className='table-control-icons' src={Sort} alt='Sort'/> 
                {currentSort.length > 0 ? `Sorted by ${currentSort.length} field${currentSort.length > 1 ? 's' : ''}` : 'Sort'}
              </>
            )}
          </button>
          <button type="button" className="control-btn">
            <Image className='table-control-icons' src={Color} alt='Color'/> Color
          </button>
          <button type="button" className="control-btn">
            <Image className='table-control-icons' src={RowHeight} alt='RowHeight'/>
          </button>
          <button type="button" className="control-btn">
            <Image className='table-control-icons' src={ShareAndSync} alt='Share and Sync'/> Share and sync
          </button>
          <button 
            ref={searchBtnRef}
            type="button" 
            className="control-btn"
            onClick={handleSearchClick}
            style={{
              border: searchTerm ? `2px solid ${baseColor ?? '#2563eb'}` : undefined,
              backgroundColor: searchTerm ? `${baseColor ?? '#2563eb'}20` : undefined,
            }}
          >
            <Image className='table-control-icons-search' src={Search} alt='Search'/>
            {searchTerm && searchResults.length > 0 && (
              <span className="search-count-badge">{searchResults.length}</span>
            )}
          </button>
        </div>
      </div>

      <HiddenFieldsDropdown
        visible={showHiddenFieldsDropdown}
        x={dropdownPosition.left}
        y={dropdownPosition.top}
        hiddenColumns={hiddenColumns}
        allColumns={allColumns}
        onShowColumn={onShowColumn}
        onHideColumn={onHideColumn}
        onHideAll={onHideAllColumns}
        onShowAll={onShowAllColumns}
        onCancel={() => setShowHiddenFieldsDropdown(false)}
      />

      <SortDropdown
        visible={showSortDropdown}
        x={sortDropdownPosition.left}
        y={sortDropdownPosition.top}
        allColumns={allColumns}
        currentSort={currentSort}
        onSort={onSort}
        onClearSort={onClearSort}
        onRemoveSort={onRemoveColumnSort}
        onCancel={() => setShowSortDropdown(false)}
      />

      <SearchOverlay
        visible={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchResults={searchResults}
        currentResultIndex={currentSearchIndex}
        onResultSelect={handleSearchSelect}
        onNavigateNext={() => handleSearchNavigate('next')}
        onNavigatePrev={() => handleSearchNavigate('prev')}
        x={searchPosition.left}
        y={searchPosition.top}
      />

      <FilterContextMenu
        visible={showFilterDropdown}
        x={filterDropdownPosition.left}
        y={filterDropdownPosition.top}
        allColumns={allColumns}
        currentFilters={currentFilters}
        onAddFilter={onAddFilter}
        onUpdateFilter={onUpdateFilter}
        onRemoveFilter={onRemoveFilter}
        onClearAllFilters={onClearAllFilters}
        onCancel={() => setShowFilterDropdown(false)}
      />
    </>
  );
}