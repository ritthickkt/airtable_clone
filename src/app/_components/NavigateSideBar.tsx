import Image from 'next/image';
import { useState } from 'react';
import type { Session } from "next-auth";
import logo from "../assets/airtable.svg";
import backButton from "../assets/backButton.svg";
import bellIcon from '../assets/bell-icon.svg';
import help from '../assets/help.svg';

interface test {
  session: Session | null;
}

export default function NavigateSidebar({
  session
}: test ){

  const [logoShrunk, setLogoShrunk] = useState(false);
  const [backButtonPressed, setBackButtonPressed] = useState(false);

  const handleMouseEnter = () => {
    setBackButtonPressed(true);
    setLogoShrunk(true);
  };

  const handleMouseLeave = () => {
    setBackButtonPressed(false);
    setLogoShrunk(false);
  };

  return (
    <div className='left-most-bar'>
        <div 
          className="logo-container"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Image 
            className={`airtable-logo-bases-dashboard ${logoShrunk ? 'shrinking' : 'normal'}`}
            src={logo} 
            width={25} 
            height={25} 
            alt='' 
          />  
          <button
            className={`back-button ${backButtonPressed ? 'show' : ''}`}
            onClick={() => window.location.href = '/home'}
          >
            <Image src={backButton} alt='Back'/>
          </button>
        </div>
        <div className='left-most-bar-bottom'>
          <Image src={help} alt='' width={15} height={15}/>
          <Image src={bellIcon} alt='' width={15} height={15}/>
          <div className="user-avatar">
            {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
        </div>
      </div>
  )
}