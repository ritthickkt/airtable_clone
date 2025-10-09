'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import Image from "next/image";
import HideFields from '../assets/hide-fields.svg'
import Filter from '../assets/filter.svg'
import Sort from '../assets/sort.svg'
import Color from '../assets/color-bucket.png'
import ShareAndSync from '../assets/share.png'
import Group from '../assets/bullet-list.png'
import Search from '../assets/search.svg'
import RowHeight from '../assets/row-height.png'


export default function TableControls({ set100kRowsPressed }: { set100kRowsPressed: (editing: boolean) => void }) {

  const handle100kRowsPressed = () => {
    set100kRowsPressed(true);
  };

  return (
    <div className="table-controls">
      <div className="table-controls-left">
        <button type="button" className="control-btn">⊞ Grid view </button>
      </div>
      <div className="table-controls-right">
        <button type="button" className="control-btn" onClick={handle100kRowsPressed}>Add 100k rows</button>
        <button type="button" className="control-btn"><Image className='table-control-icons' src={HideFields} alt='HideFields'/> Hide fields</button>
        <button type="button" className="control-btn"><Image className='table-control-icons' src={Filter} alt='Filter'/> Filter</button>
        <button type="button" className="control-btn"><Image className='table-control-icons' src={Group} alt='Group'/> Group</button>
        <button type="button" className="control-btn"><Image className='table-control-icons' src={Sort} alt='Sort'/> Sort</button>
        <button type="button" className="control-btn"><Image className='table-control-icons' src={Color} alt='Color'/> Color</button>
        <button type="button" className="control-btn"><Image className='table-control-icons' src={RowHeight} alt='RowHeight'/></button>
        <button type="button" className="control-btn"><Image className='table-control-icons' src={ShareAndSync} alt='Share and Sync'/> Share and sync</button>
        <button type="button" className="control-btn"><Image className='table-control-icons-search' src={Search} alt='Search'/></button>
      </div>
    </div>
  );
}