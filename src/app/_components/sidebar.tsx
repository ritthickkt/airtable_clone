import Image from 'next/image';
import search from '../assets/search.svg';
import { useState, useRef, useEffect } from 'react';
import '../../styles/SideBar.css'
import { cursorTo } from 'readline';
import ViewCreationModal from './ViewCreationMenu';
import { MdGridView, MdCalendarToday, MdViewModule, MdViewKanban, MdTimeline, MdList } from 'react-icons/md';
import GridView from '../assets/grid-grid-creation.svg';
import Calendar from '../assets/calendar.svg';
import Gallery from '../assets/gallery.svg';
import Kanban from '../assets/kanban.svg';
import CheckList from '../assets/checklist.svg';
import Gantt from '../assets/Gantt.svg';
import Timeline from '../assets/timeline.svg';
import ViewDeleteConfirm from './ViewDeleteConfirm';

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
}

export default function Sidebar({
  views = [],
  currentViewId = null,
  onViewSelect,
  onCreateView,
  onDeleteView,
}: SideBarProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [viewSearchTerm, setViewSearchTerm] = useState('');
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [viewMenuPosition, setViewMenuPosition] = useState({ x: 0, y: 0 });
  const [showViewMenu, setShowViewMenu] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteView, setPendingDeleteView] = useState<{ id: string; name: string } | null>(null);

  const handleOpenViewMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setViewMenuPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8, 
    });
    setShowViewMenu(true);
  };

  const handleDeleteViewClick = (view: { id: string; name: string }) => {
    setPendingDeleteView(view);
    setDeleteConfirmOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        createBtnRef.current && 
        !createBtnRef.current.contains(event.target as Node) && 
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        console.log('👆 Clicked outside, closing menu'); 
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
    <>
      <div className='left-side-bar' ref={sidebarRef}>
        <div style={{ position: 'relative' }}>
          <button
            ref={createBtnRef}
            className="sidebar-buttons"
            onClick={() => {
              if (sidebarRef.current) {
                const rect = sidebarRef.current.getBoundingClientRect();
                setViewMenuPosition({
                  x: rect.right + window.scrollX, 
                  y: rect.top + window.scrollY,  
                });
              }
              setShowCreateMenu(true);
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
                  top: viewMenuPosition.y + 10,
                  left: viewMenuPosition.x - 1,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  padding: '13px',
                  zIndex: 1000,
                  minWidth: '250px',
                }}
              >
                <button
                  onClick={(e) => {
                    if (onCreateView) {
                      onCreateView();
                    }
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
                  <Image src={GridView} alt='' width={15} height={15} style={{ marginRight: '8px'}}/>
                  Grid
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
                  <Image src={Calendar} alt='' width={15} height={15} style={{ marginRight: '8px'}}/>
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
                  <Image src={Gallery} alt='' width={15} height={15} style={{ marginRight: '8px'}}/>
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
                  <Image src={Kanban} alt='' width={15} height={15} style={{ marginRight: '8px'}}/>
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
                  <Image src={Timeline} alt='' width={15} height={15} style={{ marginRight: '8px'}}/>
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
                  <Image src={CheckList} alt='' width={15} height={15} style={{ marginRight: '8px'}}/>
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
                  <Image src={Gantt} alt='' width={15} height={15} style={{ marginRight: '8px'}}/>
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
              backgroundColor: !currentViewId ? '#F8F8F8' : 'transparent',
            }}
          >
            Default View
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
                  backgroundColor: currentViewId === view.id ? '#F8F8F8' : 'transparent',
                  flex: 1,
                }}
              >
                <MdGridView style={{ marginRight: '8px' }}/>
                {view.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteViewClick(view);
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
      <ViewDeleteConfirm
        isOpen={deleteConfirmOpen}
        viewName={pendingDeleteView?.name}
        onConfirm={() => {
          if (pendingDeleteView) {
            onDeleteView?.(pendingDeleteView.id);
          }
          setDeleteConfirmOpen(false);
          setPendingDeleteView(null);
        }}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setPendingDeleteView(null);
        }}
      />
    </>
  );
}