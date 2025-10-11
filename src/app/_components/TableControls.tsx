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

interface TableControlsProps {
  set100kRowsPressed: (editing: boolean) => void;
  hiddenColumns: string[];
  allColumns: Array<{ id: string; name: string; type: string }>;
  onShowColumn: (columnId: string) => void;
  onHideColumn: (columnId: string) => void;
  onHideAllColumns: () => void;
  onShowAllColumns: () => void;
}

export default function TableControls({ 
  set100kRowsPressed, 
  hiddenColumns, 
  allColumns, 
  onShowColumn, 
  onHideColumn,
  onHideAllColumns,
  onShowAllColumns 
}: TableControlsProps) {
  const [showHiddenFieldsDropdown, setShowHiddenFieldsDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const hideFieldsBtnRef = useRef<HTMLButtonElement>(null);

  const handle100kRowsPressed = () => {
    set100kRowsPressed(true);
  };

  const handleHideFieldsClick = () => {
    if (hideFieldsBtnRef.current) {
      const rect = hideFieldsBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 300;
      const dropdownHeight = 400;

      let top = rect.bottom + window.scrollY + 4;
      let left = rect.left + window.scrollX;

      // Adjust if dropdown would overflow
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
          <button type="button" className="control-btn">
            <Image className='table-control-icons' src={Filter} alt='Filter'/> Filter
          </button>
          <button type="button" className="control-btn">
            <Image className='table-control-icons' src={Group} alt='Group'/> Group
          </button>
          <button type="button" className="control-btn">
            <Image className='table-control-icons' src={Sort} alt='Sort'/> Sort
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
          <button type="button" className="control-btn">
            <Image className='table-control-icons-search' src={Search} alt='Search'/>
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
    </>
  );
}