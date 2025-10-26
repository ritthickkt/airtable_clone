'use client';

import { useState } from 'react';
import type { Session } from "next-auth";
import { api } from "ritthickclone/trpc/react";
import Image from "next/image";
import colorlogo from "../assets/airtable-color.png";
import '../../styles/homepage.css';
import Base from '../_components/Base';
import WhiteBase from '../_components/white-base';
import Home from '../assets/home_icon.svg';
import Starred from '../assets/starred.png';
import Shared from '../assets/shared.svg';
import Workspaces from '../assets/Workspaces.png';
import Import from '../assets/import.svg';
import Search from '../assets/search.svg';
import Templates from '../assets/book.svg';
import Marketplace from '../assets/marketplace.svg';
import upArrow from '../assets/up-arrow.svg';
import buildAnApp from '../assets/something.svg';
import Grid from '../assets/grid.svg';
import cancel from '../assets/cancel.svg';
import buildWithOmni from '../assets/buildwithOmni.png';
import buildFromScratch from '../assets/buildWithScratch.png';

import type {
  CreateBaseResponse
} from '../../types/index'

export default function HomePageClient({ session }: { session: Session | null }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBaseName, setNewBaseName] = useState('Untitled Base');
  const [isCreating, setIsCreating] = useState(false);

  const {
    data: bases,
    isLoading,
    refetch: refetchBases
  } = api.base.getAll.useQuery(
    undefined,
    { enabled: !!session?.user }
  )

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return diffInSeconds <= 5 ? 'Now' : `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const handleCreateDatabase = async () => {
    if (!newBaseName.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/bases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBaseName,
          userId: session?.user?.id,
        }),
    });

    if (response.ok) {
        const newBase = await response.json() as CreateBaseResponse;
        console.log('Database created: ', newBase);
        setNewBaseName('Untitled Base');
        setShowCreateModal(false);
        window.location.href = `/${newBase.id}`;
        refetchBases().catch(console.error);
      }
    } catch (error) {
      console.error("Error creating database:", error);
      setIsCreating(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'Home':
        return (
          <div className="main-home-content">
            <div className='main-title'>
              Home
            </div>
            {/* Action Cards */}
            <div className="action-cards">
              <div className="action-card">
                <div className='sub-action-card'>
                  <span>Start with Omni</span>
                </div>
                <p>Use AI to build a custom app tailored to your workflow</p>
              </div>
              <div className="action-card">
                <div className='sub-action-card'>
                  <Image src={Grid} width={25} height={25} alt=''/>
                  <span>Start with templates</span>
                </div>
                <p>Select a template to get started and customize as you go.</p>
              </div>
              <div className="action-card">
                <div className='sub-action-card'>
                  <Image src={upArrow} width={25} height={25} alt=''/>
                  <span>Quickly upload</span>
                </div>
                <p>Easily migrate your existing projects in just a few minutes.</p>
              </div>
              <div className="action-card">
                <div className='sub-action-card'>
                  <Image src={buildAnApp} width={25} height={25} alt=''/>
                  <span>Build an app on your own</span>
                </div>
                <p>Start with a blank app and build your ideal workflow.</p>
              </div>
            </div>

            {/* Recent Bases */}
            <div className="recent-section">
              <div className="section-header">  
                <span>Opened anytime</span>
                <div className="view-options">
                  <button className="view-button">☰</button>
                  <button className="view-button active">⊞</button>
                </div>
              </div>
             <div className="recent-bases">
                {isLoading ? (
                  <>
                    <WhiteBase/>
                    <WhiteBase/>
                    <WhiteBase/>
                    <WhiteBase/>
                    <WhiteBase/>
                    <WhiteBase/>
                    <WhiteBase/>
                    <WhiteBase/>
                  </>
                ) : bases && bases.length > 0 ? (
                  bases.map((base) => (
                    <div key={base.id} onClick={() => window.location.href = `/${base.id}`}>
                      <Base
                        id={base.id} 
                        name={base.name} 
                        description={formatTimeAgo(new Date(base.updatedAt))}
                        color={base.color ?? 'black'} 
                      />
                    </div>
                  ))
                ) : (
                  <div className="no-bases-message">
                    <p className='no-bases-header'>You haven&apos;t opened anything recently</p>
                    <p className='no-bases-subtitle'>Apps that you have recently opened will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'Starred':
        return <div className="main-content-empty">No starred items yet</div>;
      case 'Shared':
        return <div className="main-content-empty">No shared items yet</div>;
      case 'Workspaces':
        return <div className="main-content-empty">No workspaces yet</div>;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <>
      <div className="landing-page-header-home">
        <div className="header-left">
          <button className="hamburger-menu">☰</button>
          <div className="logo-name">
            <Image src={colorlogo} alt="Airtable Logo" width={90} height={30} />
          </div>
        </div>
        
        <div className="search-container">
          <div className="search-box">
            <Image src={Search} alt='' width={15} height={15}/>
            <input 
              type="text" 
              placeholder="Search..." 
              className="search-input"
            />
            <span className="search-shortcut">⌘ K</span>
          </div>
        </div>

        <div className="header-right">
          <button className="help-button">?</button>
          {/* <button className="notifications-button">🔔</button> */}
          <div className="user-avatar">
            {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
        </div>
      </div>

      <div className="home-layout">
        <div className="home-left-bar">
          <button 
            className={`sidebar-button ${activeTab === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveTab('Home')}
          >
            <Image src={Home} alt='' width={23} height={23}/>
            Home
          </button>
          <button 
            className={`sidebar-button ${activeTab === 'Starred' ? 'active' : ''}`}
            onClick={() => setActiveTab('Starred')}
          >
            <Image src={Starred} alt='' width={23} height={23}/>
            Starred
          </button>
          <button 
            className={`sidebar-button ${activeTab === 'Shared' ? 'active' : ''}`}
            onClick={() => setActiveTab('Shared')}
          >
            <Image src={Shared} alt='' width={23} height={23}/>
            Shared
          </button>
          <button 
            className={`sidebar-button ${activeTab === 'Workspaces' ? 'active' : ''}`}
            onClick={() => setActiveTab('Workspaces')}
          >
            <Image src={Workspaces} alt='' width={23} height={23}/>
            Workspaces
          </button>

          {/* Bottom Section */}
          <div className="bottom-section">
            <button className="bottom-item"><Image src={Templates} alt='' width={20} height={20}/>Templates and apps</button>
            <button className="bottom-item"><Image src={Marketplace} alt='' width={20} height={20}/>Marketplace</button>
            <button className="bottom-item-import"><Image className='import-button' src={Import} alt='' width={15} height={15}/>Import</button>
            <button className="create-button" onClick={() => setShowCreateModal(true)}>+ Create</button>
          </div>
        </div>

        <div className="main-content">
          {renderContent()}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>How do you want to start?</h2>
              <div className='cancel-button-wrapper' onClick={() => setShowCreateModal(false)}><Image src={cancel} className="cancel-button" alt='' width={10} height={10}/></div>
            </div>
            <div className="modal-buttons">
              <button className="create-confirm-button">
                <Image className="image" src={buildWithOmni} alt='' />
                <div className='create-confirm-button-words'>
                  <h3>Build an app with Omni</h3>
                  <p>Use AI to build a custom app tailored to your workflow</p>
                </div>
              </button>
              <button className="create-confirm-button" onClick={handleCreateDatabase} disabled={!newBaseName.trim() || isCreating}>
                <Image className="image" src={buildFromScratch} alt='' />
                <div className='create-confirm-button-words'>
                  <h3>Build an app on your own</h3>
                  <p>Start with a blank app and build ideal workflow</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}