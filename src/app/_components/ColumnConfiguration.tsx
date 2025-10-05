import { useState, useRef, useEffect } from 'react';
import '../../styles/columnconfigmodal.css'

interface ColumnConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColumn: (name: string, type: 'text' | 'number') => void;
}

export default function ColumnConfiguration({ isOpen, onClose, onCreateColumn }: ColumnConfigurationProps) {
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState<'text' | 'number'>('text');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Reset form when modal opens
      setColName('');
      setColType('text');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCreateColumn = () => {
    if (colName.trim()) {
      onCreateColumn(colName.trim(), colType);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateColumn();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="column-configuration-modal">
        <div className="modal-header">
          <h3>Add New Column</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="column-name">Column Name</label>
            <input
              id="column-name"
              type="text"
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter column name"
              className="column-name-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Column Type</label>
            <div className="column-type-options">
              <div 
                className={`type-option ${colType === 'text' ? 'selected' : ''}`}
                onClick={() => setColType('text')}
              >
                <div className="type-icon">📝</div>
                <div className="type-info">
                  <div className="type-name">Text</div>
                  <div className="type-description">Single line of text</div>
                </div>
              </div>

              <div 
                className={`type-option ${colType === 'number' ? 'selected' : ''}`}
                onClick={() => setColType('number')}
              >
                <div className="type-icon">🔢</div>
                <div className="type-info">
                  <div className="type-name">Number</div>
                  <div className="type-description">Numeric values</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="create-button" 
            onClick={handleCreateColumn}
            disabled={!colName.trim()}
          >
            Create Column
          </button>
        </div>
      </div>
    </div>
  );
}