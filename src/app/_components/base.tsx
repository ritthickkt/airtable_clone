"use client";
import '../../styles/homepage.css';

import { useState } from 'react';

interface BaseProps {
  name: string;
  description: string;
  color: string;
}

export default function Base({ name, description, color }: BaseProps) {
  const [hovering, setHover] = useState(false);

  return (
    <div className="base-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="base-icon" style={{ backgroundColor: color || '#DC3545'}}>
        {name ? name.slice(0, 2).toUpperCase() : "??"}
      </div>
      <div className="base-info">
        <h4>{name}</h4>
        {hovering ? (
          <div className='base-description-style'>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
              <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
            </svg>
            <span>Open Data</span>
          </div>
        ) : (
          <span>Opened {description}</span>
        )}
      </div>
    </div>
  );
}
