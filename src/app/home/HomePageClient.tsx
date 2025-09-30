'use client';

import { useState } from 'react';
import { Session } from "next-auth";
import Image from "next/image";
import colorlogo from "../assets/airtable-color.png";
import '../../styles/homepage.css';

export default function HomePageClient({ session }: { session: Session | null }) {
  const [activeTab, setActiveTab] = useState('Home');

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
                {/* <div className="card-icon omni-icon">🔮</div> */}
                <h3>Start with Omni</h3>
                <p>Use AI to build a custom app tailored to your workflow</p>
              </div>
              <div className="action-card">
                {/* <div className="card-icon templates-icon">📋</div> */}
                <h3>Start with templates</h3>
                <p>Select a template to get started and customize as you go.</p>
              </div>
              <div className="action-card">
                {/* <div className="card-icon upload-icon">⬆️</div> */}
                <h3>Quickly upload</h3>
                <p>Easily migrate your existing projects in just a few minutes.</p>
              </div>
              <div className="action-card">
                {/* <div className="card-icon build-icon">🔧</div> */}
                <h3>Build an app on your own</h3>
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
                <div className="base-card">
                  <div className="base-icon">Un</div>
                  <div className="base-info">
                    <h4>Untitled Base</h4>
                    <span>Opened yesterday</span>
                  </div>
                </div>
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
            <span className="search-icon">🔍</span>
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
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      <div className="home-layout">
        <div className="home-left-bar">
          <button 
            className={`sidebar-button ${activeTab === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveTab('Home')}
          >
            Home
          </button>
          <button 
            className={`sidebar-button ${activeTab === 'Starred' ? 'active' : ''}`}
            onClick={() => setActiveTab('Starred')}
          >
            Starred
          </button>
          <button 
            className={`sidebar-button ${activeTab === 'Shared' ? 'active' : ''}`}
            onClick={() => setActiveTab('Shared')}
          >
            Shared
          </button>
          <button 
            className={`sidebar-button ${activeTab === 'Workspaces' ? 'active' : ''}`}
            onClick={() => setActiveTab('Workspaces')}
          >
            Workspaces
          </button>

          {/* Bottom Section */}
          <div className="bottom-section">
            <button className="bottom-item">Templates and apps</button>
            <button className="bottom-item">Marketplace</button>
            <button className="bottom-item">Import</button>
            <button className="create-button">+ Create</button>
          </div>
        </div>

        <div className="main-content">
          {renderContent()}
        </div>
      </div>
    </>
  );
}