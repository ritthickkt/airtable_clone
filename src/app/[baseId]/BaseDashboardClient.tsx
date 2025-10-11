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
  const [add100kRowsPressed, set100kRowsPressed] = useState(false);

  // Add hidden columns state here
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const [base, setBase] = useState(initialBase)

  const currentTable = base.tables?.[currentTableIndex] ?? base.tables?.[0] ?? null;


  const handleShowColumn = useCallback((columnId: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      newSet.delete(columnId);
      return newSet;
    });
  }, []);

  const handleHideColumn = useCallback((columnId: string) => {
    setHiddenColumns(prev => new Set([...prev, columnId]));
  }, []);

  const handleShowAllColumns = useCallback(() => {
    setHiddenColumns(new Set());
  }, []);

  const handleHideAllColumns = useCallback(() => {
    if (currentTable?.columns && currentTable.columns.length > 1) {
      const columnsToHide = currentTable.columns.slice(1).map(col => col.id);
      setHiddenColumns(new Set(columnsToHide));
    }
  }, [currentTable?.columns]);


  const createTableMutation = api.base.createTable.useMutation({
    onSuccess: (newTable) => {
      console.log('Table created:', newTable);

      setBase(prevBase => ({
        ...prevBase,
        tables: prevBase.tables?.map(table =>
          table.id.startsWith('temp-table-')
            ? {
                id: ( newTable as any).id ?? '', // fallback to empty string if undefined
                name: ( newTable as any).name ?? '',
                baseId: ( newTable as any).baseId ?? prevBase.id,
                columns: Array.isArray(( newTable as any).columns) ? ( newTable as any).columns : [],
                records: Array.isArray(( newTable as any).records) ? ( newTable as any).records : [],
                createdAt: ( newTable as any).createdAt ?? new Date(),
                updatedAt: ( newTable as any).updatedAt ?? new Date(),
                // add any other required fields from your Table type here
              }
            : table
        ) ?? []
      }));

    },
    onError: (error) => {
      console.error('Failed to create table:', error);

      setBase(prevBase => ({
        ...prevBase,
        tables: prevBase.tables?.slice(0, -1) ?? []
      }));
      
      setCurrentTableIndex(Math.max(0, (base.tables?.length ?? 1) - 2));
    },
  });

  const handleCreateTable = () => {
    const now = new Date();
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
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `temp-col-${Date.now()}-2`,
          name: 'Notes',
          type: 'text',
          position: 1,
          tableId: `temp-table-${Date.now()}`,
          options: {},
          createdAt: now,
          updatedAt: now,
        },
      ],
      records: [],
      createdAt: now,
      updatedAt: now,
      // add any other required fields from your Table type here
    };

    setBase(prevBase => ({
      ...prevBase,
      tables: [...(prevBase.tables ?? []), optimisticTable]
    }));

    setCurrentTableIndex(base.tables?.length ?? 0);

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
                : [...(table.columns ?? []), newColumn] // Add new
            }
          : table
      ) ?? []
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
              <TableControls 
                set100kRowsPressed={set100kRowsPressed}
                hiddenColumns={Array.from(hiddenColumns)}
                allColumns={currentTable?.columns?.map(col => ({
                  id: col.id,
                  name: col.name,
                  type: col.type
                })) ?? []}
                onShowColumn={handleShowColumn}
                onShowAllColumns={handleShowAllColumns}
                onHideAllColumns={handleHideAllColumns}
                onHideColumn={handleHideColumn}
              />
              <DataTable 
                currentTable={currentTable} 
                onColumnUpdate={updateTableColumns} 
                add100kRowsPressed={add100kRowsPressed} 
                set100kRowsPressed={set100kRowsPressed}
                hiddenColumns={hiddenColumns}
                onHideColumn={handleHideColumn}
              />
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