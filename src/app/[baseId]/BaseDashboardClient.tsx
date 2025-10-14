'use client';

import { useState, useCallback } from 'react';
import { api } from "ritthickclone/trpc/react";
import React from 'react';
import BaseHeader from '../_components/BaseHeader';
import TableTabs from '../_components/TableTabs';
import TableControls from '../_components/TableControls';
import DataTable from '../_components/DataTable';
import BaseConfigModal from '../_components/BaseConfigurationModel';
import NavigateSidebar from '../_components/NavigateSideBar';
import type { BaseDashboardClientProps } from '../../types';
import '../../styles/basedashboard.css';


interface FilterCondition {
  id: string;
  columnId: string;
  columnName: string;
  columnType: string;
  operator: string;
  value: string;
}


export default function BaseDashboardClient({ session, base: initialBase }: BaseDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('Data');
  const [baseName, setBaseName] = useState(initialBase.name ?? 'Untitled Base');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [add100kRowsPressed, set100kRowsPressed] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [currentSort, setCurrentSort] = useState<Array<{ columnId: string; direction: 'asc' | 'desc' }>>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterCondition[]>([]);

  const [base, setBase] = useState(initialBase)

  const currentTable = base.tables?.[currentTableIndex] ?? base.tables?.[0] ?? null;

   React.useEffect(() => {
    if (currentTable) {
      // Load sort configuration from database
      if (currentTable.sortConfig && Array.isArray(currentTable.sortConfig)) {
        setCurrentSort(currentTable.sortConfig as Array<{ columnId: string; direction: 'asc' | 'desc' }>);
      } else {
        setCurrentSort([]);
      }

      // Load filter configuration from database
      if (currentTable.filterConfig && Array.isArray(currentTable.filterConfig)) {
        setCurrentFilters(currentTable.filterConfig as FilterCondition[]);
      } else {
        setCurrentFilters([]);
      }
    }
  }, [currentTable?.id]);

  const updateTableSortMutation = api.base.updateTableSort.useMutation();
  const updateTableFiltersMutation = api.base.updateTableFilters.useMutation();

  // Add filter handlers
  const handleAddFilter = useCallback((filter: FilterCondition) => {
    const newFilters = [...currentFilters, filter];
    setCurrentFilters(newFilters);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: newFilters,
      });
    }
  }, [currentFilters, currentTable?.id, updateTableFiltersMutation]);

  const handleUpdateFilter = useCallback((filterId: string, updates: Partial<FilterCondition>) => {
    const newFilters = currentFilters.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    );
    setCurrentFilters(newFilters);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: newFilters,
      });
    }
  }, [currentFilters, currentTable?.id, updateTableFiltersMutation]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    const newFilters = currentFilters.filter(filter => filter.id !== filterId);
    setCurrentFilters(newFilters);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: newFilters,
      });
    }
  }, [currentFilters, currentTable?.id, updateTableFiltersMutation]);

  const handleClearAllFilters = useCallback(() => {
    setCurrentFilters([]);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: [],
      });
    }
  }, [currentTable?.id, updateTableFiltersMutation]);


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

  const handleSort = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    setCurrentSort(prevSort => {
      // Check if this column is already being sorted
      const existingIndex = prevSort.findIndex(sort => sort.columnId === columnId);
      
      let newSort;
      if (existingIndex !== -1) {
        // Update existing sort direction
        newSort = [...prevSort];
        newSort[existingIndex] = { columnId, direction };
      } else {
        // Add new sort to the end
        newSort = [...prevSort, { columnId, direction }];
      }
      
      // Always persist to database
      if (currentTable?.id) {
        updateTableSortMutation.mutate({
          tableId: currentTable.id,
          sortConfig: newSort,
        });
      }
      
      return newSort;
    });
  }, [currentTable?.id, updateTableSortMutation]);

  const handleClearSort = useCallback(() => {
    setCurrentSort([]);
    
    if (currentTable?.id) {
      updateTableSortMutation.mutate({
        tableId: currentTable.id,
        sortConfig: [],
      });
    }
  }, [currentTable?.id, updateTableSortMutation]);

  const handleRemoveColumnSort = useCallback((columnId: string) => {
    setCurrentSort(prevSort => {
      const newSort = prevSort.filter(sort => sort.columnId !== columnId);
      
      if (currentTable?.id) {
        updateTableSortMutation.mutate({
          tableId: currentTable.id,
          sortConfig: newSort,
        });
      }
      
      return newSort;
    });
  }, [currentTable?.id, updateTableSortMutation]);


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
              columns: (() => {
                const currentColumns = table.columns ?? [];
                
                // Check if this is updating a temp column
                const tempColumnIndex = currentColumns.findIndex(col =>
                  col.id.startsWith('temp-col-') && 
                  col.name === newColumn.name && 
                  col.position === newColumn.position
                );
                
                if (tempColumnIndex !== -1) {
                  // Replace the temp column with real column data
                  return currentColumns.map((col, index) => 
                    index === tempColumnIndex ? newColumn : col
                  );
                }
                
                // Check if column already exists (update case)
                const existingColumnIndex = currentColumns.findIndex(col => col.id === newColumn.id);
                if (existingColumnIndex !== -1) {
                  // Update existing column
                  return currentColumns.map((col, index) => 
                    index === existingColumnIndex ? newColumn : col
                  );
                }
                
                // Add new column to the end
                return [...currentColumns, newColumn];
              })()
            }
          : table
      ) ?? []
    }));
  }, []);

  const removeTableColumn = useCallback((tableId: string, columnId: string) => {
    setBase(prevBase => ({
      ...prevBase,
      tables: prevBase.tables?.map(table => 
        table.id === tableId 
          ? { 
              ...table, 
              columns: table.columns?.filter(col => col.id !== columnId) ?? []
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
                currentSort={currentSort}
                onSort={handleSort}
                onClearSort={handleClearSort} // Add this prop
                onRemoveColumnSort={handleRemoveColumnSort}
                currentFilters={currentFilters}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onRemoveFilter={handleRemoveFilter}
                onClearAllFilters={handleClearAllFilters}
                baseColor={base.color}
              />
              <DataTable 
                currentTable={currentTable} 
                onColumnUpdate={updateTableColumns} 
                onColumnRemove={removeTableColumn}
                add100kRowsPressed={add100kRowsPressed} 
                set100kRowsPressed={set100kRowsPressed}
                hiddenColumns={hiddenColumns}
                onHideColumn={handleHideColumn}
                currentSort={currentSort}
                onSort={handleSort}
                currentFilters={currentFilters}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onRemoveFilter={handleRemoveFilter}
                onClearAllFilters={handleClearAllFilters}
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