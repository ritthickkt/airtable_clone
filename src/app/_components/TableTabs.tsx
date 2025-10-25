'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DownArrow from '../assets/down-arrow.svg';
import type { Base } from '../../types';
import ViewDeleteConfirm from './ViewDeleteConfirm';

interface TableTabsProps {
  base: Base;
  currentTableIndex: number;
  setCurrentTableIndex: (index: number) => void;
  handleCreateTable: () => void;
  createTableMutation?: any;
}

export default function TableTabs({ 
  base, 
  currentTableIndex,
  setCurrentTableIndex, 
  handleCreateTable, 
  createTableMutation = { isPending: false }
}: TableTabsProps) {
  // ✅ Local state for instant UI updates (no flicker)
  const [activeIndex, setActiveIndex] = useState(currentTableIndex);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tableName, setTableName] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Only sync from URL changes (browser back/forward)
  useEffect(() => {
    const urlTableIndex = parseInt(searchParams.get('tableIndex') ?? '0', 10);
    setActiveIndex(urlTableIndex);
  }, [searchParams]);

  const handleTableChange = (index: number) => {
    // ✅ Update local state FIRST for instant visual feedback
    setActiveIndex(index);
    
    // ✅ Then update parent (triggers data loading)
    setCurrentTableIndex(index);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('tableIndex', index.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleAddOrImportClick = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
      setShowMenu(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setShowNameDialog(false);
      }
    };

    if (showMenu || showNameDialog) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showNameDialog]);

  const handleBuildFromScratch = () => {
    setShowMenu(false);
    setTableName(`Table ${(base.tables?.length ?? 0) + 1}`);
    setShowNameDialog(true);
  };

  const handleSaveTable = () => {
    handleCreateTable();
    setShowNameDialog(false);
    setTableName('');
  };

  const handleCancel = () => {
    setShowNameDialog(false);
    setTableName('');
  };

  function lighterShadeofBaseColor(hex: string, percent = 0.5) {
    hex = hex.replace(/^#/, '');
    let r = parseInt(hex.substring(0,2),16);
    let g = parseInt(hex.substring(2,4),16);
    let b = parseInt(hex.substring(4,6),16);

    r = Math.round(r + (255 - r) * percent);
    g = Math.round(g + (255 - g) * percent);
    b = Math.round(b + (255 - b) * percent);

    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  return (
    <>
      <div className="tabs-header" style={{ background: lighterShadeofBaseColor(base.color ?? 'black')}}>
        <div className="tabs-list">
          {base.tables?.map((table, index) => (
            <span
              key={table.id}
              className={`tab ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleTableChange(index)}
            >
              {table.name}
              {/* ✅ Use activeIndex instead of currentTableIndex - no flicker! */}
              {index === activeIndex && (
                <Image src={DownArrow} alt='' width={15} height={15}/>
              )}
            </span>
          ))}
          <Image src={DownArrow} alt='' width={15} height={15} className='table-menu'/>
          <button 
            ref={addButtonRef}
            className="add-tab-btn" 
            onClick={handleAddOrImportClick}
            disabled={createTableMutation.isPending}
          >
            + Add or Import
          </button>
          <div className='tools-button'>
            Tools
            <Image src={DownArrow} alt='' width={15} height={15}/>
          </div>
        </div>
      </div>

      {showMenu && menuPosition && (
        <div 
          ref={menuRef} 
          className="add-table-menu" 
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 10000,
          }}
        >
          <div className='blanktableconfig-title'>Add a blank table</div>
          <div className='blanktableconfig-add-table-button' onClick={handleBuildFromScratch}>
            <div className='blanktableconfig-add-table-button-word'>Start from scratch</div>
          </div>
        </div>
      )}

      {showNameDialog && menuPosition && (
        <div 
          ref={dialogRef} 
          className="table-name-dialog" 
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 10000,
          }}
        >
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Table name"
            autoFocus
            className="table-name-input"
          />
          <div className="dialog-actions">
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleSaveTable} className="save-btn">
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
}