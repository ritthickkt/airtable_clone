'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from "ritthickclone/trpc/react";
import React from 'react';
import BaseHeader from '../_components/BaseHeader';
import TableTabs from '../_components/TableTabs';
import TableControls from '../_components/TableControls';
import DataTable from '../_components/DataTable';
import BaseConfigModal from '../_components/BaseConfigurationModel';
import NavigateSidebar from '../_components/NavigateSideBar';
import ViewCreationModal from '../_components/ViewCreationMenu';
import type { BaseDashboardClientProps } from '../../types';
import '../../styles/basedashboard.css';
import '../../styles/searchfield.css';

interface FilterCondition {
  id: string;
  columnId: string;
  columnName: string;
  columnType: string;
  operator: string;
  value: string;
}

interface ViewConfig {
  hiddenColumns: string[];
  sort: Array<{ columnId: string; direction: 'asc' | 'desc' }>;
  filters: FilterCondition[];
  searchTerm?: string;
}

interface SearchResult {
  rowId: string;
  rowIndex: number;
  columnId: string;
  columnName: string;
  value: string;
  isColumnHeader?: boolean;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [sortingLoading, setSortingLoading] = useState(false);
  const [filteringLoading, setFilteringLoading] = useState(false);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [showViewCreationModal, setShowViewCreationModal] = useState(false);
  const [viewModalPosition, setViewModalPosition] = useState({ x: 0, y: 0});
  const [base, setBase] = useState(initialBase);

  if (base && (!base.tables || base.tables.length === 0)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{
            color: '#666',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            Setting up your base...
          </p>
        </div>
      </div>
    );
  }

  const currentTable = base.tables?.[currentTableIndex] ?? base.tables?.[0] ?? null;

  const { data: views = [], refetch: refetchViews } = api.view.getByTableId.useQuery(
    { tableId: currentTable?.id ?? '' },
    { enabled: !!currentTable?.id }
  );

  const createViewMutation = api.view.create.useMutation();
  const updateViewMutation = api.view.update.useMutation();
  const deleteViewMutation = api.view.delete.useMutation();

  useEffect(() => {
  if (currentViewId) {
    const view = views.find(v => v.id === currentViewId);
    if (view) {
      // Type assert the config as ViewConfig
      const config = view.config as unknown as ViewConfig;
      setHiddenColumns(new Set(config.hiddenColumns ?? []));
      setCurrentSort(config.sort ?? []);
      setCurrentFilters(config.filters ?? []);
      setSearchTerm(config.searchTerm ?? '');
    }
  } else {
    setHiddenColumns(new Set());
    setCurrentSort([]);
    setCurrentFilters([]);
    setSearchTerm('');
  }
}, [currentViewId, views]);

  useEffect(() => {
    setCurrentViewId(null);
    setHiddenColumns(new Set());
    setCurrentSort([]);
    setCurrentFilters([]);
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, [currentTableIndex]);

  const handleCreateView = useCallback(() => {
    console.log('🔍 handleCreateView called'); // Add this
    const sidebar = document.querySelector('.left-side-bar');
    console.log('📍 Sidebar element:', sidebar); // Add this
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      console.log('📍 Position:', { x: rect.right + 20, y: rect.top + 100 }); // Add this
      setViewModalPosition({
        x: rect.right + 20,
        y: rect.top + 100,
      });
    }
    setShowViewCreationModal(true);
    console.log('✅ Modal should open now'); // Add this
  }, []);

  const handleViewCreation = useCallback(async (name: string) => {
    if (!currentTable) return;

    try {
      const newView = await createViewMutation.mutateAsync({
        tableId: currentTable.id,
        name,
        config: {
          hiddenColumns: Array.from(hiddenColumns),
          sort: currentSort,
          filters: currentFilters,
          searchTerm: searchTerm || undefined,
        },
      });

      await refetchViews();
      setCurrentViewId(newView.id);
      setShowViewCreationModal(false);
    } catch (error) {
      console.error('Failed to create view:', error);
      alert('Failed to create view. Please try again.');
    }
  }, [currentTable, hiddenColumns, currentSort, currentFilters, searchTerm, createViewMutation, refetchViews]);

  const handleViewSelect = useCallback((viewId: string | null) => {
    setCurrentViewId(viewId);
  }, []);

  const handleDeleteView = useCallback(async (viewId: string) => {
    try {
      await deleteViewMutation.mutateAsync({ viewId });
      await refetchViews();
      if (currentViewId === viewId) {
        setCurrentViewId(null);
      }
    } catch (error) {
      console.error('Failed to delete view:', error);
      alert('Failed to delete view. Please try again.');
    }
  }, [deleteViewMutation, refetchViews, currentViewId]);

  const handleUpdateCurrentView = useCallback(async () => {
    if (!currentViewId) return;

    try {
      await updateViewMutation.mutateAsync({
        viewId: currentViewId,
        config: {
          hiddenColumns: Array.from(hiddenColumns),
          sort: currentSort,
          filters: currentFilters,
          searchTerm: searchTerm || undefined,
        },
      });
      await refetchViews();
    } catch (error) {
      console.error('Failed to update view:', error);
    }
  }, [currentViewId, hiddenColumns, currentSort, currentFilters, searchTerm, updateViewMutation, refetchViews]);

  // Auto-save view when configuration changes
  useEffect(() => {
    if (currentViewId) {
      const timeoutId = setTimeout(() => {
        handleUpdateCurrentView();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentViewId, hiddenColumns, currentSort, currentFilters, searchTerm, handleUpdateCurrentView]);


  const { data: tableWithSortedRecords, refetch } = api.base.getTableRecords.useQuery(
    {
      tableId: currentTable?.id ?? '',
      sortConfig: currentSort,
      filterConfig: currentFilters,
    },
    {
      enabled: !!currentTable?.id,
    }
  );

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
    setFilteringLoading(true);
    const newFilters = [...currentFilters, filter];
    setCurrentFilters(newFilters);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: newFilters,
      }, {
        onSuccess: () => {
          refetch().finally(() => {
            setFilteringLoading(false);
          });
        },
        onError: () => {
          setFilteringLoading(false);
        }
      });
    } else {
      setFilteringLoading(false);
    }
  }, [currentFilters, currentTable?.id, updateTableFiltersMutation, refetch]);

  const handleUpdateFilter = useCallback((filterId: string, updates: Partial<FilterCondition>) => {
    setFilteringLoading(true);
    const newFilters = currentFilters.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    );
    setCurrentFilters(newFilters);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: newFilters,
      }, {
        onSuccess: () => {
          refetch().finally(() => {
            setFilteringLoading(false);
          });
        },
        onError: () => {
          setFilteringLoading(false);
        }
      });
    } else {
      setFilteringLoading(false);
    }
  }, [currentFilters, currentTable?.id, updateTableFiltersMutation, refetch]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    setFilteringLoading(true);
    const newFilters = currentFilters.filter(filter => filter.id !== filterId);
    setCurrentFilters(newFilters);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: newFilters,
      }, {
        onSuccess: () => {
          refetch().finally(() => {
            setFilteringLoading(false);
          });
        },
        onError: () => {
          setFilteringLoading(false);
        }
      });
    } else {
      setFilteringLoading(false);
    }
  }, [currentFilters, currentTable?.id, updateTableFiltersMutation, refetch]);

  const handleClearAllFilters = useCallback(() => {
    setFilteringLoading(true);
    setCurrentFilters([]);
    
    if (currentTable?.id) {
      updateTableFiltersMutation.mutate({
        tableId: currentTable.id,
        filterConfig: [],
      }, {
        onSuccess: () => {
          refetch().finally(() => {
            setFilteringLoading(false);
          });
        },
        onError: () => {
          setFilteringLoading(false);
        }
      });
    } else {
      setFilteringLoading(false);
    }
  }, [currentTable?.id, updateTableFiltersMutation, refetch]);


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
    setSortingLoading(true);
    
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
        }, {
          onSuccess: () => {
            // Refetch and then stop loading
            refetch().finally(() => {
              setSortingLoading(false);
            });
          },
          onError: () => {
            setSortingLoading(false);
          }
        });
      } else {
        setSortingLoading(false);
      }
      
      return newSort;
    });
  }, [currentTable?.id, updateTableSortMutation, refetch]);

  const handleClearSort = useCallback(() => {
    setSortingLoading(true);
    setCurrentSort([]);
    
    if (currentTable?.id) {
      updateTableSortMutation.mutate({
        tableId: currentTable.id,
        sortConfig: [],
      }, {
        onSuccess: () => {
          // Force refetch to get unsorted data from database
          refetch().finally(() => {
            setSortingLoading(false);
          });
        },
        onError: () => {
          setSortingLoading(false);
        }
      });
    } else {
      setSortingLoading(false);
    }
  }, [currentTable?.id, updateTableSortMutation, refetch]);

  const handleRemoveColumnSort = useCallback((columnId: string) => {
    setSortingLoading(true);
    
    setCurrentSort(prevSort => {
      const newSort = prevSort.filter(sort => sort.columnId !== columnId);
      
      if (currentTable?.id) {
        updateTableSortMutation.mutate({
          tableId: currentTable.id,
          sortConfig: newSort,
        }, {
          onSuccess: () => {
            // Only refetch if there are remaining sorts AND filters
            if (newSort.length > 0 && currentFilters.length >= 0) {
              refetch().finally(() => {
                setSortingLoading(false);
              });
            } else if (currentFilters.length > 0) {
              // If there are filters but no sorts, still refetch to apply filters
              refetch().finally(() => {
                setSortingLoading(false);
              });
            } else {
              setSortingLoading(false);
            }
          },
          onError: () => {
            setSortingLoading(false);
          }
        });
      } else {
        setSortingLoading(false);
      }
      
      return newSort;
    });
  }, [currentTable?.id, updateTableSortMutation, refetch, currentFilters]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    if (!term.trim() || !currentTable) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results: SearchResult[] = [];
    const normalizedTerm = term.toLowerCase();

      // Search in column headers
    currentTable.columns?.forEach(column => {
        if (column.name.toLowerCase().includes(normalizedTerm)) {
          results.push({
            rowId: 'header',
            rowIndex: -1,
            columnId: column.id,
            columnName: column.name,
            value: column.name,
            isColumnHeader: true
          });
        }
    });

    // Get table data from the query result or table records
    const tableData = tableWithSortedRecords?.records?.map((record) => {
      const data = record.data as Record<string, unknown> || {};
      return {
        id: record.id,
        ...data,
      } as Record<string, unknown> & { id: string }; // Add proper typing here
    }) ?? currentTable.records?.map((record) => {
      const data = record.data as Record<string, unknown> || {};
      return {
        id: record.id,
        ...data,
      } as Record<string, unknown> & { id: string }; // Add proper typing here
    }) ?? [];

    // Search in table data
    tableData.forEach((row, rowIndex) => {
      currentTable.columns?.forEach(column => {
        const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
        // Now row is properly typed as Record<string, unknown> & { id: string }
        const cellValue = (row[fieldKey] as string | undefined)?.toString() ?? '';
        
        if (cellValue.toLowerCase().includes(normalizedTerm)) {
          results.push({
            rowId: row.id,
            rowIndex,
            columnId: column.id,
            columnName: column.name,
            value: cellValue
          });
        }
      });
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [currentTable, tableWithSortedRecords]);

  const handleSearchNavigate = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    setCurrentSearchIndex(prevIndex => {
      if (direction === 'next') {
        return (prevIndex + 1) % searchResults.length;
      } else {
        return prevIndex === 0 ? searchResults.length - 1 : prevIndex - 1;
      }
    });
  }, [searchResults.length]);

  const handleSearchSelect = useCallback((index: number) => {
    setCurrentSearchIndex(index);
  }, []);


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
    const tableCount = base.tables?.length ?? 0;

    const optimisticTable = {
      id: `temp-table-${Date.now()}`,
      name: `Table ${tableCount + 1}`,
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

  const handleNameSave = (name?: string) => {
    const nameToSave = name ?? baseName;
    if (nameToSave.trim() && nameToSave !== (base.name ?? '')) {
      updateBaseName.mutate({
        id: base.id,
        name: nameToSave.trim(),
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
                onClearSort={handleClearSort}
                onRemoveColumnSort={handleRemoveColumnSort}
                currentFilters={currentFilters}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onRemoveFilter={handleRemoveFilter}
                onClearAllFilters={handleClearAllFilters}
                baseColor={base.color ?? undefined}
                sortingLoading={sortingLoading}
                filteringLoading={filteringLoading}
                onSearch={handleSearch}
                searchTerm={searchTerm}
                searchResults={searchResults}
                currentSearchIndex={currentSearchIndex}
                onSearchNavigate={handleSearchNavigate}
                onSearchSelect={handleSearchSelect}
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
                // sortingLoading={sortingLoading}
                // filteringLoading={filteringLoading}
                searchTerm={searchTerm}
                searchResults={searchResults}
                currentSearchIndex={currentSearchIndex}
                views={views}
                currentViewId={currentViewId}
                onViewSelect={handleViewSelect}
                onCreateView={handleCreateView}
                onDeleteView={handleDeleteView}
                x={viewModalPosition.x}
                y={viewModalPosition.y}
              />
              {/* Loading overlay */}
              {(sortingLoading || filteringLoading) && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    background: 'white',
                    padding: '20px 30px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #f3f3f3',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>
                      {sortingLoading ? 'Applying sort...' : 'Applying filters...'}
                    </span>
                  </div>
                </div>
              )}
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
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