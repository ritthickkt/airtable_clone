'use client';

import { useState } from 'react';
import { api } from "ritthickclone/trpc/react";
import BaseHeader from '../_components/BaseHeader';
import TableTabs from '../_components/TableTabs';
import TableControls from '../_components/TableControls';
import DataTable from '../_components/DataTable';
import BaseConfigModal from '../_components/BaseConfigurationModel';
import NavigateSidebar from '../_components/NavigateSideBar';
import type { BaseDashboardClientProps } from '../../types';
import '../../styles/basedashboard.css';

export default function BaseDashboardClient({ session, base }: BaseDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('Data');
  const [baseName, setBaseName] = useState(base.name ?? 'Untitled Base');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

  const currentTable = base.tables?.[currentTableIndex] ?? base.tables?.[0] ?? null;

  const updateBaseName = api.base.updateName.useMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      console.error('Failed to update base name:', error);
      setBaseName(base.name ?? 'Untitled Base');
    },
  });

  const handleNameSave = () => {
    if (baseName.trim() && baseName !== (base.name ?? '')) {
      updateBaseName.mutate({
        id: base.id,
        name: baseName.trim(),
      });
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div className="base-dashboard">
      <NavigateSidebar session={session}/>
      <div className='main-of-the-main-content'>
        <BaseHeader 
          session={session}
          base={base}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          baseName={baseName}
          setBaseName={setBaseName}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleNameSave={handleNameSave}
        />
        <div className="base-dashboard-main-content">
          <div className="base-content">
            <TableTabs 
              base={base}
              currentTableIndex={currentTableIndex}
              setCurrentTableIndex={setCurrentTableIndex}
            />
            
            <div className="table-container">
              <TableControls />
              <DataTable currentTable={currentTable} />
            </div>
          </div>
        </div>

        <BaseConfigModal 
          base={base}
          baseName={baseName}
          setBaseName={setBaseName}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleNameSave={handleNameSave}
        />
      </div>
    </div>
  );
}