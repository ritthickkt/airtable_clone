'use client';

import { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import type { Base } from '../../types';
import DownArrow from '../assets/down-arrow.svg';

const COLORS = [
  '#FFD4E0', '#DC043B', '#994559', '#FF30CC', '#D54402', '#944D37',
  '#FFEAB6', '#FFBE06', '#A26810', '#CFF5D1', '#058A0D', '#407C4A',
  '#C1F5F0', '#04DDD5', '#0C7F78', '#C4ECFF', '#39CAFF', '#107DA3',
  '#D0E2FF', '#156EE1', '#3B66A3', '#FAD2FC', '#DD04A8', '#8C3F78',
  '#E0DAFD', '#7C37EF', '#63498D', '#E5E9F1', '#616670', '#535965'
];

interface BaseConfigModalProps {
  base: Base;
  baseName: string;
  setBaseName: (name: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleNameSave: (name: string) => void;
}

export default function BaseConfigModal({ 
  base, 
  baseName, 
  setBaseName, 
  isEditing, 
  setIsEditing, 
  handleNameSave,
}: BaseConfigModalProps) {
  const [isBaseNameEditing, setIsBaseNameEditing] = useState(false);
  const [isTempBaseName, setIsTempBaseName] = useState(baseName);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [colorTab, setColorTab] = useState<'Color' | 'Icon'>('Color');
  const [selectedColor, setSelectedColor] = useState(base.color ?? COLORS[0]);
  const popupRef = useRef<HTMLDivElement>(null);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setIsBaseNameEditing(false);
        if (isBaseNameEditing && isTempBaseName !== baseName) {
          setBaseName(isTempBaseName);
          handleNameSave(isTempBaseName);
        }
      }
    };
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, isBaseNameEditing, isTempBaseName, baseName, setBaseName, handleNameSave]);

  if (!isEditing) return null;

  return (
    <div 
      ref={popupRef} 
      className="baseConfigurationChangePopUp" 
    >
      {/* Title */}
      <div className='baseEditBlock'>
        {isBaseNameEditing ? (
         <input
            type="text"
            value={isTempBaseName}
            onChange={(e) => setIsTempBaseName(e.target.value)}
            onBlur={() => {
              setIsBaseNameEditing(false);
              if (isTempBaseName !== baseName) {
                setBaseName(isTempBaseName);
                handleNameSave(isTempBaseName); // Pass the new name directly
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsBaseNameEditing(false);
                setBaseName(isTempBaseName);
                handleNameSave(isTempBaseName); // Pass the new name directly
              }
            }}
            autoFocus
            className='baseNameEdit'
          />
        ) : (
          <div
            className='baseNameEdit'
            onClick={() => setIsBaseNameEditing(true)}
          >
            {isTempBaseName}
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div>
        <div
          className="baseEditBlock"
          onClick={() => setAppearanceOpen((v) => !v)}
        >
          <Image 
            src={DownArrow} alt=''
            width={15}
            height={15}
            style={{
              marginRight: 8,
              transition: "transform 0.2s",
              transform: appearanceOpen ? "rotate(360deg)" : "rotate(270deg)"
            }}
          />
          Appearance
        </div>
        {appearanceOpen && (
          <div style={{ padding: "16px 32px 24px 32px", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", gap: 32 }}>
              <div>
                <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
                  <div
                    style={{
                      fontWeight: colorTab === "Color" ? 600 : 400,
                      borderBottom: colorTab === "Color" ? "2px solid #2563eb" : "none",
                      cursor: "pointer",
                      paddingBottom: 4
                    }}
                    onClick={() => setColorTab("Color")}
                  >Color</div>
                  <div
                    style={{
                      fontWeight: colorTab === "Icon" ? 600 : 400,
                      borderBottom: colorTab === "Icon" ? "2px solid #2563eb" : "none",
                      cursor: "pointer",
                      paddingBottom: 4
                    }}
                    onClick={() => setColorTab("Icon")}
                  >Icon</div>
                </div>
                {colorTab === "Color" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                    {COLORS.map((color) => (
                      <div
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: color,
                          border: selectedColor === color ? "2px solid #444" : "2px solid #fff",
                          boxShadow: selectedColor === color ? "0 0 0 2px #2563eb" : "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {selectedColor === color && (
                          <span style={{
                            fontSize: 18,
                            color: "#222"
                          }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {colorTab === "Icon" && (
                  <div style={{ marginTop: 16, color: "#888" }}>
                    {/* Placeholder for icon picker */}
                    <span>Icon picker coming soon...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Base Guide Section */}
      <div>
        <div
          className="baseEditBlock"
          onClick={() => setGuideOpen((v) => !v)}
        >
          <Image 
            src={DownArrow} alt=''
            width={15}
            height={15}
            style={{
              marginRight: 8,
              transition: "transform 0.2s",
              transform: guideOpen ? "rotate(360deg)" : "rotate(270deg)"
            }}
          />
          Base guide
        </div>
        {guideOpen && (
          <div style={{ padding: "16px 32px 24px 32px", color: "#555", fontSize: 15, lineHeight: 1.7 }}>
            <div>
              Use this space to share the goals and details of your base with your team.<br /><br />
              Start by outlining your goal.<br /><br />
              Next, share details about key information in your base:<br /><br />
              This table contains...<br />
              This view shows...<br />
              This link contains...<br /><br />
              Teammates will see this guide when they first open the base and can find it anytime by clicking the down arrow on the top of their screen.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}