'use client';
import '../../styles/customdropdown.css'
import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 4,
      });
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`custom-dropdown-button ${className}`}
        onClick={handleButtonClick}
        type="button"
      >
        <span className="custom-dropdown-value">
          {selectedOption?.icon && <span className="custom-dropdown-icon">{selectedOption.icon}</span>}
          {selectedOption?.label || placeholder}
        </span>
        <span className="custom-dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="custom-dropdown-menu"
          style={{
            position: 'fixed',
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            zIndex: 1100,
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-dropdown-option ${option.value === value ? 'active' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.icon && <span className="custom-dropdown-option-icon">{option.icon}</span>}
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}