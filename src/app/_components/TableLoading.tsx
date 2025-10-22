import React from 'react';
import '../../styles/TableLoading.css';

export default function TableLoading({ message }: { message?: string }) {
  return (
    <div className="table-loading-box">
      <svg
        className="table-spinner"
        width="38"
        height="38"
        viewBox="0 0 38 38"
        style={{ display: 'block' }}
      >
        <g>
          {/* Segment 1 */}
          <path
            d="M19 5
              A14 14 0 0 1 32.124 13.5"
            stroke="#bdbdbd"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Segment 2 */}
          <path
            d="M32.124 24.5
              A14 14 0 0 1 19 33"
            stroke="#bdbdbd"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Segment 3 */}
          <path
            d="M5.876 24.5
              A14 14 0 0 1 5.876 13.5"
            stroke="#bdbdbd"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="table-loading-title">Loading this view...</div>
      <div className="table-loading-desc">
        {message ?? "This view may be loading slowly due to a large number of records or fields"}
      </div>
    </div>
  );
}