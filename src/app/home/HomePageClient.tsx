'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from 'react';
import colorlogo from "../assets/airtable-color.png"
import '../../styles/landingpage.css'
import '../../styles/homepage.css'

export default function HomePageClient({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState('Home');

  const renderContent = () => {
    switch(activeTab) {
      case 'Home':
        return (
          <div className="nameoftab">
            Home
          </div>
        );
      case 'Starred':
        return (
          <div className="nameoftab">
            Starred
          </div>
        );
      case 'Shared':
        return (
          <div className="nameoftab">
            Shared
          </div>
        );
      case 'Workspaces':
        return (
          <div className="nameoftab">
            Workspaces
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <>
      <div className="landing-page-header-home">
        <div className="logo-name">
          <Image src={colorlogo} alt="Airtable Logo" width={100} height={100} />
        </div>
        <div className="users-name">
          Welcome, {session?.user?.name}!
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
          <div className="bottom-left-sidebar">
            <button className="create-button">
              + Create
            </button>
          </div>
        </div>
        <div className="main-content">
          {renderContent()}
        </div>
      </div>
    </>
  );
}