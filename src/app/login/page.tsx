'use client';

import { signIn } from "next-auth/react";
import type { StaticImageData } from "next/image";
import { useState } from "react";
import Image from "next/image";
import logo from "../assets/justlogo.svg";
import '../../styles/loginpage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-header">
          <Image src={logo as StaticImageData} alt="Airtable Logo" width={40} height={40} />
        </div>
        
        <div className="login-form">
          <h1>Sign in to Airtable</h1>
          
          <div className="email-section">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input"
            />
            <button className="continue-button">
              Continue
            </button>
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="sso-section">
            <p>Sign in with Single Sign On</p>
            
            <button 
              className="provider-button google-button"
              onClick={() => signIn('google', { callbackUrl: '/home' })}
            >
              <span className="google-icon">G</span>
              Continue with Google
            </button>
          </div>

          <div className="signup-link">
            New to Airtable? <a href="#">Create an account</a> instead
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="omni-card">
          <h2>Meet Omni, your AI collaborator for building custom apps.</h2>
          <button className="start-building-button">Start building</button>
          
          <div className="app-preview">
            <div className="preview-item mandalorian">
              <div className="mandalorian-helmet"></div>
            </div>
            <div className="preview-item loading">
              <div className="loading-dots"></div>
            </div>
            <div className="preview-item campaign">
              <span>Campaign concept tra...</span>
            </div>
            <div className="preview-item person">
              <div className="person-avatar"></div>
            </div>
            <div className="preview-item checklist">
              <div className="checklist-items">
                <div className="checklist-item">Setting Up Accounts</div>
                <div className="checklist-item">Setting the web...</div>
              </div>
            </div>
            <div className="preview-item game">
              <div className="game-icons"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}