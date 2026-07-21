'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useTranslations } from 'next-intl';
import { Database } from 'lucide-react';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import toast from 'react-hot-toast';
import type {
  CellValue,
  DatabaseSavedView,
  Property,
  PropertyType,
  RowRecord,
  SortConfig,
} from './types';
import {
  DEFAULT_PROPERTIES,
  DEFAULT_ROWS,
  generateId,
} from './types';
import { SURFACE } from './databaseStyles';
import DatabaseToolbar from './DatabaseToolbar';
import DatabaseTable from './DatabaseTable';

interface DatabaseBoardProps {
  projectId: string;
}

export type { DatabaseSavedView };

function DatabaseBoard({ projectId }: DatabaseBoardProps) {
  const t = useTranslations('DatabaseBoard');
  const { isReadonly, dataSource, persist, migrateLegacyKeys } =
    useBoardPersistence(projectId);

  const persistDatabase = useCallback(
    (partial: Record<string, unknown>) => {
      persist(partial);
    },
    [persist]
  );

  const properties = useMemo(
    () =>
      (dataSource.databaseProperties as Property[] | undefined) ||
      DEFAULT_PROPERTIES,
    [dataSource.databaseProperties]
  );

  const rows = useMemo(
    () => (dataSource.databaseRows as RowRecord[] | undefined) || DEFAULT_ROWS,
    [dataSource.databaseRows]
  );

  const savedViews = useMemo(
    () =>
      (dataSource.databaseSavedViews as DatabaseSavedView[] | undefined) || [],
    [dataSource.databaseSavedViews]
  );

  const dbTitle = useMemo(
    () =>
      (dataSource.databaseTitle as string | undefined) || t('untitled'),
    [dataSource.databaseTitle, t]
  );

  const [isClient, setIsClient] = useState(false);
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeDateCell, setActiveDateCell] = useState<{
    rowId: string;
    propId: string;
  } | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    migrateLegacyKeys([
      'databaseProperties',
      'databaseRows',
      'databaseTitle',
      'databaseSavedViews',
    ]);
  }, [migrateLegacyKeys]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (filterRef.current && !filterRef.current.contains(target as Node))
        setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(target as Node))
        setIsSortOpen(false);

      if (target && typeof target.closest === 'function') {
        if (
          !target.closest('.row-dropdown-menu') &&
          !target.closest('.row-menu-trigger')
        ) {
          setOpenRowMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveProperties = (newProps: Property[]) => {
    persistDatabase({ databaseProperties: newProps });
  };

  const saveRows = (newRows: RowRecord[]) => {
    persistDatabase({ databaseRows: newRows });
  };

  const saveTitle = (newTitle: string) => {
    persistDatabase({ databaseTitle: newTitle });
  };

  const handleAddProperty = (type: PropertyType) => {
    if (isReadonly) return;
    const newPropId = generateId('prop');
    const newProps = [
      ...properties,
      { id: newPropId, name: t(`newProperty.${type}`), type },
    ];
    const newRows = rows.map((row) => ({
      ...row,
      [newPropId]: type === 'checkbox' ? false : '',
    }));
    saveProperties(newProps);
    saveRows(newRows);
    setIsPropertyMenuOpen(false);
  };

  const handleDeleteProperty = (propId: string) => {
    if (isReadonly) return;
    if (properties.length === 1) return;
    const newProps = properties.filter((p) => p.id !== propId);
    const newRows = rows.map((row) => {
      const updatedRow = { ...row };
      delete updatedRow[propId];
      return updatedRow;
    });
    saveProperties(newProps);
    saveRows(newRows);
    if (sortConfig?.propId === propId) setSortConfig(null);
  };

  const handleAddRow = () => {
    if (isReadonly) return;
    const newRow: RowRecord = { id: generateId('row') };
    properties.forEach((prop) => {
      newRow[prop.id] = prop.type === 'checkbox' ? false : '';
    });
    saveRows([...rows, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    if (isReadonly) return;
    saveRows(rows.filter((r) => r.id !== rowId));
    setOpenRowMenu(null);
    if (selectedRowId === rowId) setSelectedRowId(null);
  };

  const handleDuplicateRow = (rowId: string) => {
    if (isReadonly) return;
    const rowToDuplicate = rows.find((r) => r.id === rowId);
    if (!rowToDuplicate) return;

    const newRowId = generateId('row');
    const newRow: RowRecord = { ...rowToDuplicate, id: newRowId };

    const textProp = properties.find((p) => p.type === 'text');
    if (textProp && typeof newRow[textProp.id] === 'string') {
      newRow[textProp.id] = `${newRow[textProp.id]} ${t('copySuffix')}`;
    }

    saveRows([...rows, newRow]);
    toast.success(t('toastRowDuplicated'));
    setOpenRowMenu(null);
  };

  const updateCell = (rowId: string, propId: string, value: CellValue) => {
    if (isReadonly) return;
    saveRows(
      rows.map((row) => (row.id === rowId ? { ...row, [propId]: value } : row))
    );
  };

  const updatePropertyName = (propId: string, name: string) => {
    if (isReadonly) return;
    saveProperties(
      properties.map((prop) => (prop.id === propId ? { ...prop, name } : prop))
    );
  };

  const handleSaveView = () => {
    if (isReadonly) return;
    const viewName = prompt(t('promptViewName'));
    if (!viewName?.trim()) return;

    const newView: DatabaseSavedView = {
      id: generateId('view-db'),
      name: viewName,
      filterQuery,
      sortConfig,
    };
    const updatedViews = [...savedViews, newView];
    persistDatabase({ databaseSavedViews: updatedViews });
    setActiveViewId(newView.id);
    setIsFilterOpen(false);
    toast.success(t('toastViewSaved', { name: viewName }));
  };

  const applyView = (viewId: string | null) => {
    setActiveViewId(viewId);
    if (viewId === null) {
      setFilterQuery('');
      setSortConfig(null);
      return;
    }
    const view = savedViews.find((v) => v.id === viewId);
    if (view) {
      setFilterQuery(view.filterQuery);
      setSortConfig(view.sortConfig);
    }
  };

  const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    if (isReadonly) return;
    if (window.confirm(t('confirmDeleteView'))) {
      const updatedViews = savedViews.filter((v) => v.id !== viewId);
      persistDatabase({ databaseSavedViews: updatedViews });
      if (activeViewId === viewId) applyView(null);
      toast.success(t('toastViewDeleted'));
    }
  };

  const handleNotionExport = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading(t('toastExportLoading'));

    try {
      const res = await fetch('/api/notion-export', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbTitle, properties, rows }),
      });

      const data = await res.json();

      if (res.status === 401) {
        toast.error(t('toastExportAuth'), { id: loadingToast });
        return;
      }

      if (res.ok && data.success) {
        toast.success(t('toastExportSuccess'), { id: loadingToast });
        if (data.url) window.open(data.url, '_blank');
      } else {
        toast.error(data.error || t('toastExportFailed'), {
          id: loadingToast,
        });
      }
    } catch {
      toast.error(t('toastExportError'), { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  const processedRows = useMemo(
    () =>
      rows
        .filter((row) => {
          if (!filterQuery) return true;
          const q = filterQuery.toLowerCase();
          return properties.some((prop) =>
            String(row[prop.id] || '')
              .toLowerCase()
              .includes(q)
          );
        })
        .sort((a, b) => {
          if (!sortConfig) return 0;
          const valA = String(a[sortConfig.propId] || '').toLowerCase();
          const valB = String(b[sortConfig.propId] || '').toLowerCase();
          if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
          return 0;
        }),
    [rows, properties, filterQuery, sortConfig]
  );

  const hasToolbarSlot = useHasProjectToolbarSlot();

  const toolbarLabels = useMemo(
    () => ({
      defaultView: t('defaultView'),
      filter: t('filter'),
      searchDatabase: t('searchDatabase'),
      searchPlaceholder: t('searchPlaceholder'),
      saveView: t('saveView'),
      clearFilter: t('clearFilter'),
      sort: t('sort'),
      sortByColumn: t('sortByColumn'),
      sortNone: t('sortNone'),
      sortAsc: t('sortAsc'),
      sortDesc: t('sortDesc'),
      export: t('export'),
      newRow: t('newRow'),
    }),
    [t]
  );

  const tableLabels = useMemo(
    () => ({
      propertyName: t('propertyName'),
      addProperty: t('addProperty'),
      propertyType: t('propertyType'),
      typeText: t('typeText'),
      typeNumber: t('typeNumber'),
      typeSelect: t('typeSelect'),
      typeDate: t('typeDate'),
      typeCheckbox: t('typeCheckbox'),
      deleteProperty: t('deleteProperty'),
      empty: t('empty'),
      duplicate: t('duplicate'),
      delete: t('delete'),
      newRow: t('newRow'),
      noResults: t('noResults', { query: filterQuery }),
      noResultsHint: t('noResultsHint'),
      emptyTitle: t('emptyTitle'),
      emptyHint: t('emptyHint'),
      filtered: t('filtered'),
    }),
    [t, filterQuery]
  );

  const toolbarActions = (
    <DatabaseToolbar
      savedViews={savedViews}
      activeViewId={activeViewId}
      filterQuery={filterQuery}
      sortConfig={sortConfig}
      properties={properties}
      isFilterOpen={isFilterOpen}
      isSortOpen={isSortOpen}
      isExporting={isExporting}
      isReadonly={isReadonly}
      filterRef={filterRef}
      sortRef={sortRef}
      labels={toolbarLabels}
      onApplyView={applyView}
      onDeleteView={handleDeleteView}
      onToggleFilter={() => {
        setIsSortOpen(false);
        setIsFilterOpen((open) => !open);
      }}
      onToggleSort={() => {
        setIsFilterOpen(false);
        setIsSortOpen((open) => !open);
      }}
      onFilterChange={(value) => {
        setFilterQuery(value);
        setActiveViewId(null);
      }}
      onClearFilter={() => {
        setFilterQuery('');
        setActiveViewId(null);
      }}
      onSaveView={handleSaveView}
      onSortChange={(config) => {
        setSortConfig(config);
        setActiveViewId(null);
        setIsSortOpen(false);
      }}
      onExport={handleNotionExport}
      onAddRow={handleAddRow}
    />
  );

  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  if (!isClient) return null;

  const rowCountLabel = filterQuery
    ? t('rowCountFiltered', {
        shown: processedRows.length,
        total: rows.length,
      })
    : t('rowCount', { count: processedRows.length });

  const propertyCountLabel = t('propertyCount', {
    count: properties.length,
  });

  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden font-sans z-10 h-full min-h-0 ${SURFACE.stage}`}
    >
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div className="h-14 px-4 border-b border-zinc-200/90 dark:border-zinc-800 flex items-center justify-end bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md select-none shrink-0 relative z-50">
          {toolbarActions}
        </div>
      )}

      <div className="flex-1 overflow-auto min-h-0 px-4 py-4 md:px-6 md:py-5 relative custom-scrollbar z-10">
        <div className="mb-3.5 max-w-3xl animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-start gap-2.5 mb-0.5">
            <div className="mt-1 w-7 h-7 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 dark:from-sky-950/50 dark:to-teal-950/30 border border-sky-200/80 dark:border-sky-800/50 flex items-center justify-center shrink-0 shadow-sm">
              <Database className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={dbTitle}
                onChange={(e) => saveTitle(e.target.value)}
                readOnly={isReadonly}
                placeholder={t('titlePlaceholder')}
                className={`text-xl md:text-[1.45rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 w-full focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 bg-transparent ${
                  isReadonly ? 'cursor-default' : ''
                }`}
              />
              <p className="mt-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
                {rowCountLabel}
                {properties.length > 0 ? ` · ${propertyCountLabel}` : ''}
                {isReadonly ? (
                  <span className="ml-1.5 inline-flex items-center px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-semibold uppercase tracking-wide">
                    {t('readonlyBadge')}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <DatabaseTable
          properties={properties}
          rows={processedRows}
          filterQuery={filterQuery}
          isReadonly={isReadonly}
          isPropertyMenuOpen={isPropertyMenuOpen}
          openRowMenu={openRowMenu}
          activeDateCell={activeDateCell}
          selectedRowId={selectedRowId}
          labels={tableLabels}
          onSelectRow={setSelectedRowId}
          onUpdatePropertyName={updatePropertyName}
          onDeleteProperty={handleDeleteProperty}
          onTogglePropertyMenu={() =>
            setIsPropertyMenuOpen((open) => !open)
          }
          onAddProperty={handleAddProperty}
          onUpdateCell={updateCell}
          onSetActiveDateCell={setActiveDateCell}
          onToggleRowMenu={setOpenRowMenu}
          onDuplicateRow={handleDuplicateRow}
          onDeleteRow={handleDeleteRow}
          onAddRow={handleAddRow}
        />
      </div>
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(DatabaseBoard);
