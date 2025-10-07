'use client';

import { useState, useCallback } from 'react';
import { api } from "ritthickclone/trpc/react";
import BaseHeader from '../_components/BaseHeader';
import TableTabs from '../_components/TableTabs';
import TableControls from '../_components/TableControls';
import DataTable from '../_components/DataTable';
import BaseConfigModal from '../_components/BaseConfigurationModel';
import NavigateSidebar from '../_components/NavigateSideBar';
import type { BaseDashboardClientProps } from '../../types';
import '../../styles/basedashboard.css';

export default function BaseDashboardClient({ session, base: initialBase }: BaseDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('Data');
  const [baseName, setBaseName] = useState(initialBase.name ?? 'Untitled Base');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

  const [base, setBase] = useState(initialBase)

  const currentTable = base.tables?.[currentTableIndex] ?? base.tables?.[0] ?? null;

  const createTableMutation = api.base.createTable.useMutation({
    onSuccess: (newTable) => {
      console.log('Table created:', newTable);

      // ✅ Replace the optimistic table with the real one instead of adding
      setBase(prevBase => ({
        ...prevBase,
        tables: prevBase.tables?.map(table => 
          table.id.startsWith('temp-table-') 
            ? {
                ...newTable,
                columns: newTable.columns || [],
                records: newTable.records || []
              }
            : table
        ) || []
      }));

      // ✅ Keep the same table index (no need to change)
      // setCurrentTableIndex stays the same since we're replacing, not adding
    },
    onError: (error) => {
      console.error('Failed to create table:', error);

       // ✅ Remove optimistic table on error
      setBase(prevBase => ({
        ...prevBase,
        tables: prevBase.tables?.slice(0, -1) || []
      }));
      
      // ✅ Reset to previous table
      setCurrentTableIndex(Math.max(0, (base.tables?.length || 1) - 2));
    },
  });

  const handleCreateTable = () => {
    // ✅ Create optimistic table immediately
    const optimisticTable = {
      id: `temp-table-${Date.now()}`,
      name: 'Untitled Table',
      baseId: base.id,
      columns: [
        {
          id: `temp-col-${Date.now()}-1`,
          name: 'Name',
          type: 'text',
          position: 0,
          tableId: `temp-table-${Date.now()}`,
          options: {},
        },
        {
          id: `temp-col-${Date.now()}-2`,
          name: 'Notes',
          type: 'text',
          position: 1,
          tableId: `temp-table-${Date.now()}`,
          options: {},
        },
      ],
      records: [],
    };

    // ✅ Add optimistic table to state immediately
    setBase(prevBase => ({
      ...prevBase,
      tables: [...(prevBase.tables ?? []), optimisticTable]
    }));

    // ✅ Switch to the optimistic table immediately
    setCurrentTableIndex(base.tables?.length ?? 0);

    // ✅ Create real table
    createTableMutation.mutate({
      baseId: base.id,
    });
  };

  const updateTableColumns = useCallback((tableId: string, newColumn: any) => {
    setBase(prevBase => ({
      ...prevBase,
      tables: prevBase.tables?.map(table => 
        table.id === tableId 
          ? { 
              ...table, 
              columns: table.columns?.some(col => col.id === newColumn.id)
                ? table.columns.map(col => col.id === newColumn.id ? newColumn : col) // Replace existing
                : [...(table.columns || []), newColumn] // Add new
            }
          : table
      ) || []
    }));
  }, []);

  const updateBaseName = api.base.updateName.useMutation({
    onSuccess: (updatedBase) => {
      setIsEditing(false);
      setBase(prevBase => ({
        ...prevBase,
        name: updatedBase.name
      }));
      setBaseName(updatedBase.name);
    },
    onError: (error) => {
      console.error('Failed to update base name:', error);
      setBaseName(base.name ?? 'Untitled Base');
      setIsEditing(false);
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
              handleCreateTable={handleCreateTable}
              createTableMutation={createTableMutation}
            />
            
            <div className="table-container">
              <TableControls />
              <DataTable currentTable={currentTable} onColumnUpdate={updateTableColumns}/>
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