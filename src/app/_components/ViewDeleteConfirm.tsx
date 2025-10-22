import React from 'react';

interface ViewDeleteConfirmProps {
  isOpen: boolean;
  viewName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ViewDeleteConfirm({
  isOpen,
  viewName,
  onConfirm,
  onCancel,
}: ViewDeleteConfirmProps) {
  if (!isOpen) return null;
  return (
    <div className="view-delete-confirm-overlay">
      <div className="view-delete-confirm-modal">
        <p>
          Are you sure you want to delete <b>{viewName ?? "this view"}</b>?
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="confirm-btn" onClick={onConfirm}>Delete</button>
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
      <style jsx>{`
        .view-delete-confirm-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .view-delete-confirm-modal {
          background: #fff;
          padding: 24px 32px;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.13);
          min-width: 260px;
        }
        .confirm-btn {
          background: #ef4444;
          color: #fff;
          border: none;
          padding: 6px 18px;
          border-radius: 4px;
          cursor: pointer;
        }
        .cancel-btn {
          background: #f3f4f6;
          color: #333;
          border: none;
          padding: 6px 18px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}