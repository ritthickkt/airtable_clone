'use client';

export default function TableControls() {
  return (
    <div className="table-controls">
      <div className="table-controls-left">
        <button type="button" className="control-btn">⊞ Grid view </button>
      </div>
      <div className="table-controls-right">
        <button type="button" className="control-btn">👁 Hide fields</button>
        <button type="button" className="control-btn">🔍 Filter</button>
        <button type="button" className="control-btn">📊 Group</button>
        <button type="button" className="control-btn">↕ Sort</button>
        <button type="button" className="control-btn">🎨 Color</button>
        <button type="button" className="control-btn">📋 Share and sync</button>
        <button type="button" className="control-btn">🔍</button>
      </div>
    </div>
  );
}