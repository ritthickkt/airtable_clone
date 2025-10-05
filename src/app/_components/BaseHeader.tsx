'use client';

import Image from 'next/image';
import type { Session } from "next-auth";
import logo from "../assets/airtable.svg";
import type { Base } from '../../types';

interface BaseHeaderProps {
  session: Session | null;
  base: Base;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  baseName: string;
  setBaseName: (name: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleNameSave: () => void;
}

export default function BaseHeader({ 
  base, 
  activeTab, 
  setActiveTab, 
  baseName, 
  setIsEditing, 
}: BaseHeaderProps) {
  const logoBackgroundColor = base.color ?? '#3b82f6';

  return (
    <>
      {/* Main header */}
      <div className="base-header">
        <div className="base-header-left">
          <div className="base-icon-header">
            <div className='base-icon-wrapper' style={{ backgroundColor: logoBackgroundColor }}>
              <div className='base-icon'><Image src={logo} width={25} height={25} alt=''/></div>
            </div>
            <div className='base-name-and-dropdown-clicker' onClick={() => setIsEditing(true)}>
              <span className="base-name-display">
                {baseName} 
              </span>
              <div className='dropdown-icon'></div>
            </div>
          </div>
        </div>

        <div className="base-header-center">
          <div className="nav-tabs">
            {['Data', 'Automations', 'Interfaces', 'Forms'].map((tab) => (
              <button 
                key={tab}
                className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={activeTab === tab ? {
                  borderBottomColor: base.color ?? '#3b82f6'
                } : {}}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="base-header-right">
          <button className="launch-button">🚀 Launch</button>
          <button className="share-button">Share</button>
        </div>
      </div>
    </>
  );
}