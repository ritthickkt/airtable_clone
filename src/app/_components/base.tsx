"use client";
import '../../styles/homepage.css';
import { useState, useRef, useEffect } from 'react';
import { api } from "../../trpc/react";


interface BaseProps {
  id: string;
  name: string;
  description: string;
  color: string;
  onBaseDeleted?: () => void;
}

export default function Base({ id, name, description, color, onBaseDeleted }: BaseProps) {
  const [hovering, setHover] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  const deleteBaseMutation = api.base.deleteBase.useMutation({
    onMutate: async ({ baseId }) => {
      // Cancel outgoing refetches
      await utils.base.getAll.cancel();

      // Snapshot the previous value
      const previousBases = utils.base.getAll.getData();

      // Optimistically update to remove the base
      utils.base.getAll.setData(undefined, (old) => 
        old?.filter((base) => base.id !== baseId)
      );

      // Call the callback immediately
      onBaseDeleted?.();

      // Return context with snapshotted value
      return { previousBases };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBases) {
        utils.base.getAll.setData(undefined, context.previousBases);
      }
      console.error('Failed to delete base:', err);
    },
    onSettled: () => {
      // Refetch after mutation settles
      void utils.base.getAll.invalidate();
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleDeleteBase = async () => {
    try {
      await deleteBaseMutation.mutateAsync({
        baseId: id,
      });
    } catch (error) {
      // Error already handled in onError callback
    }
  };


  const handleMenuItemClick = (action: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setShowDropdown(false);
    
    switch(action) {
      case 'delete':
        handleDeleteBase();
        break;
    }
    console.log(`Action: ${action}`);
  };

  return (
    <>
    <div className="base-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => {setHover(false); setShowDropdown(false)}}>
      <div className="base-icon" style={{ backgroundColor: color || '#DC3545'}}>
        {name ? name.slice(0, 2).toUpperCase() : "??"}
      </div>
      <div className="base-info">
        <div className='base-name-with-options'>
          <div className='just-the-name'>
            <h4>{name}</h4>
          </div>
          {hovering && (
            <div className='more-options-container' ref={dropdownRef}>
              <div 
                className='more-options-base-card'
                onClick={handleOptionsClick}
              >
                ⋯
              </div>
              {showDropdown && (
                <div className='dropdown-menu'>
                  <div className='dropdown-item' onClick={() => handleMenuItemClick('rename')}>
                    <span className='dropdown-icon'></span>
                    <span>Rename</span>
                  </div>
                  <div className='dropdown-item' onClick={() => handleMenuItemClick('duplicate')}>
                    <span className='dropdown-icon'></span>
                    <span>Duplicate</span>
                  </div>
                  <div className='dropdown-item' onClick={() => handleMenuItemClick('move')}>
                    <span className='dropdown-icon'></span>
                    <span>Move</span>
                  </div>
                  <div className='dropdown-item' onClick={() => handleMenuItemClick('workspace')}>
                    <span className='dropdown-icon'></span>
                    <span>Go to workspace</span>
                  </div>
                  <div className='dropdown-item' onClick={() => handleMenuItemClick('customize')}>
                    <span className='dropdown-icon'></span>
                    <span>Customize appearance</span>
                  </div>
                  <div className='dropdown-separator'></div>
                  <div className='dropdown-item danger' onClick={(e) => handleMenuItemClick('delete', e)}>
                    <span className='dropdown-icon'></span>
                    <span>Delete</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {hovering ? (
          <>
            <div className='base-description-style'>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
              </svg>
              <span>Open Data</span>
            </div>
          </>
        ) : (
          <span>Opened {description}</span>
        )}
      </div>
    </div>
    </>
  );
}
