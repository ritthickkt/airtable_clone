import Image from 'next/image';
import search from '../assets/search.svg';
import { useState, useRef, useEffect } from 'react';
import '../../styles/SideBar.css'
import { cursorTo } from 'readline';
import { MdGridView, MdCalendarToday, MdViewModule, MdViewKanban, MdTimeline, MdList, MdGantt } from 'react-icons/md';

interface View {
  id: string;
  name: string;
  type: string;
}

interface SideBarProps {
  views?: View[];
  currentViewId?: string | null;
  onViewSelect?: (viewId: string | null ) => void;
  onCreateView?: () => void;
  onDeleteView?: (viewId: string) => void;
  x: number;
  y: number;
}

export default function Sidebar({
  views = [],
  currentViewId = null,
  onViewSelect,
  onCreateView,
  onDeleteView,
  x,
  y,
}: SideBarProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [viewSearchTerm, setViewSearchTerm] = useState('');
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('🎨 showCreateMenu:', showCreateMenu); // Add this to see state changes

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        createBtnRef.current && 
        !createBtnRef.current.contains(event.target as Node) && 
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        console.log('👆 Clicked outside, closing menu'); // Add this
        setShowCreateMenu(false);
      }
    };

    if (showCreateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateMenu]);

  const filteredViews = views.filter(view => view.name.toLowerCase().includes(viewSearchTerm.toLowerCase()));

  return (
    <div className='left-side-bar'>
      <div style={{ position: 'relative' }}>
        <button
          ref={createBtnRef}
          className="sidebar-buttons"
          onClick={() => {
            console.log('➕ Create New clicked, current state:', showCreateMenu); // Add this
            setShowCreateMenu(!showCreateMenu)
          }}
          style={{
            cursor: 'pointer',
          }}
        >
          + Create New...
        </button>
        {showCreateMenu && (
          <>
            <div
              ref={dropdownRef}
              style={{
                position: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                fontSize: '13px',
                top: y+140,
                left: x+357,
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '13px',
                zIndex: 1000,
                minWidth: '300px',
              }}
            >
              <button
                onClick={(e) => {
                  onCreateView?.();
                  setShowCreateMenu(false);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MdGridView style={{ marginRight: '8px' }} />
                Grid View
              </button>
              <button
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MdCalendarToday style={{ marginRight: '8px' }}/>
                Calendar
              </button>
              <button
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MdViewModule style={{ marginRight: '8px' }}/>
                Gallery
              </button>
              <button
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MdViewKanban style={{ marginRight: '8px' }}/>
                Kanban
              </button>
              <button
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MdTimeline style={{ marginRight: '8px' }}/>
                Timeline
              </button>
              <button
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MdList style={{ marginRight: '8px'}}/>
                List
              </button>
              <button
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MdList style={{ marginRight: '8px' }}/>
                Gantt
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ position: 'relative', marginTop: '8px' }}>
        <button className="sidebar-buttons-search">
          <Image src={search} alt='Search' height={12} width={12}/>
          <input
            type="text"
            placeholder="Find a view"
            value={viewSearchTerm}
            className='sidebar-buttons-find'
            onChange={(e) => setViewSearchTerm(e.target.value)}
          />
        </button>
      </div>

      <div style={{ marginTop: '12px' }}>
        <button
          className={`sidebar-buttons ${!currentViewId ? 'active-view' : ''}`}
          onClick={() => onViewSelect?.(null)}
          style={{
            backgroundColor: !currentViewId ? '#e3f2fd' : 'transparent',
            fontWeight: !currentViewId ? 600 : 400,
          }}
        >
          Grid View
        </button>

        {filteredViews.map((view) => (
          <div
            key={view.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
            }}
          >
            <button
              className={`sidebar-buttons ${currentViewId === view.id ? 'active-view' : ''}`}
              onClick={() => onViewSelect?.(view.id)}
              style={{
                backgroundColor: currentViewId === view.id ? '#e3f2fd' : 'transparent',
                fontWeight: currentViewId === view.id ? 600 : 400,
                flex: 1,
              }}
            >
              📊 {view.name}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete view "${view.name}"?`)) {
                  onDeleteView?.(view.id);
                }
              }}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#666',
              }}
              title="Delete view"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}