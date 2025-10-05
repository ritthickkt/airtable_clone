'use client';

import { useState, useRef, useEffect } from 'react';
import type { Base } from '../../types';

interface BaseConfigModalProps {
  base: Base;
  baseName: string;
  setBaseName: (name: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleNameSave: () => void;
}

export default function BaseConfigModal({ 
  base, 
  baseName, 
  setBaseName, 
  isEditing, 
  setIsEditing, 
  handleNameSave 
}: BaseConfigModalProps) {
  const [isBaseNameEditing, setIsBaseNameEditing] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setIsBaseNameEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, setIsEditing]);

  if (!isEditing) return null;

  return (
    <div ref={popupRef} className="baseConfigurationChangePopUp">
      {isBaseNameEditing ? (
        <input
          type="text"
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
          onBlur={() => {
            setIsBaseNameEditing(false);
            handleNameSave();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsBaseNameEditing(false);
              handleNameSave();
            } else if (e.key === 'Escape') {
              setBaseName(base.name ?? 'Untitled Base');
              setIsBaseNameEditing(false);
            }
          }}
          className='baseNameEdit editing'
          autoFocus
        />
      ) : (
        <div className='baseNameEdit' onClick={() => setIsBaseNameEditing(true)}>
          {baseName}
        </div>
      )}
      <div className='baseEditBlock'>
        <button type="button">+</button> Appearance
      </div>
      <div className='baseEditBlock'>
        <button type="button">+</button> Base guide
      </div>
    </div>
  );
}