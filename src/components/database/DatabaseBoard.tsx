'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Type,
  Calendar,
  Hash,
  List as ListIcon,
  CheckSquare,
  GripVertical,
  FileText,
  Trash2,
  ArrowUpDown,
  BookmarkPlus,
  LayoutDashboard,
  X,
  MoreHorizontal,
  Copy,
  CloudUpload,
  Loader2,
} from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useProjectEditMode } from '@/hooks/useProjectEditMode';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import { Calendar as CustomCalendar } from '@/components/ui/calendar';
import toast from 'react-hot-toast';

interface DatabaseBoardProps {
  projectId: string;
}

type PropertyType = 'text' | 'number' | 'select' | 'date' | 'checkbox';
type CellValue = string | number | boolean;

interface Property {
  id: string;
  name: string;
  type: PropertyType;
}

interface RowRecord {
  id: string;
  [propertyId: string]: CellValue;
}

export interface DatabaseSavedView {
  id: string;
  name: string;
  filterQuery: string;
  sortConfig: { propId: string; dir: 'asc' | 'desc' } | null;
}

const DEFAULT_PROPERTIES: Property[] = [
  { id: 'prop-title', name: 'Name', type: 'text' },
];

const DEFAULT_ROWS: RowRecord[] = [
  { id: 'row-1', 'prop-title': '' },
  { id: 'row-2', 'prop-title': '' },
  { id: 'row-3', 'prop-title': '' },
];

const generateId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export default function DatabaseBoard({ projectId }: DatabaseBoardProps) {
  const { isReadonly } = useProjectEditMode();
  const { metadata, updateMetadata, pages, updatePageSettings } =
    useCanvasStore();

  // Standalone template → top-level metadata; Infinite frame → page.settings
  const canvasPage = useMemo(
    () => pages.find((p) => p.id === projectId),
    [pages, projectId]
  );
  const isPageScoped = !!canvasPage;
  const pageSettings = useMemo(
    () => (canvasPage?.settings || {}) as Record<string, unknown>,
    [canvasPage?.settings]
  );

  const dataSource = useMemo(() => {
    return isPageScoped ? pageSettings : metadata;
  }, [isPageScoped, pageSettings, metadata]);

  const persistDatabase = useCallback(
    (partial: Record<string, unknown>) => {
      if (isReadonly) return;
      if (isPageScoped) {
        updatePageSettings(projectId, partial);
      } else {
        updateMetadata(partial);
      }
    },
    [isReadonly, isPageScoped, projectId, updatePageSettings, updateMetadata]
  );

  const properties = useMemo(
    () =>
      (dataSource.databaseProperties as Property[] | undefined) ||
      DEFAULT_PROPERTIES,
    [dataSource.databaseProperties]
  );

  const rows = useMemo(
    () =>
      (dataSource.databaseRows as RowRecord[] | undefined) || DEFAULT_ROWS,
    [dataSource.databaseRows]
  );

  const savedViews = useMemo(
    () =>
      (dataSource.databaseSavedViews as DatabaseSavedView[] | undefined) ||
      [],
    [dataSource.databaseSavedViews]
  );

  const dbTitle = useMemo(
    () =>
      (dataSource.databaseTitle as string | undefined) || 'Untitled Database',
    [dataSource.databaseTitle]
  );

  const [isClient, setIsClient] = useState(false);
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    propId: string;
    dir: 'asc' | 'desc';
  } | null>(null);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Migrate legacy global metadata into this frame once (only if no other frame already owns DB data)
  useEffect(() => {
    if (!isPageScoped) return;
    if (pageSettings.databaseRows !== undefined) return;
    if (
      metadata.databaseRows === undefined &&
      metadata.databaseProperties === undefined
    )
      return;
    const otherOwns = pages.some(
      (p) =>
        p.id !== projectId &&
        (p.settings as Record<string, unknown> | undefined)?.databaseRows !==
          undefined
    );
    if (otherOwns) return;
    updatePageSettings(projectId, {
      databaseProperties: metadata.databaseProperties ?? DEFAULT_PROPERTIES,
      databaseRows: metadata.databaseRows ?? DEFAULT_ROWS,
      databaseTitle: metadata.databaseTitle ?? 'Untitled Database',
      databaseSavedViews: metadata.databaseSavedViews ?? [],
    });
  }, [
    isPageScoped,
    projectId,
    pages,
    pageSettings.databaseRows,
    metadata.databaseRows,
    metadata.databaseProperties,
    metadata.databaseTitle,
    metadata.databaseSavedViews,
    updatePageSettings,
  ]);

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

  const [activeDateCell, setActiveDateCell] = useState<{
    rowId: string;
    propId: string;
  } | null>(null);

  const handleAddProperty = (type: PropertyType) => {
    if (isReadonly) return;
    const newPropId = generateId('prop');
    const newProps = [
      ...properties,
      { id: newPropId, name: `New ${type}`, type },
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
  };

  const handleDuplicateRow = (rowId: string) => {
    if (isReadonly) return;
    const rowToDuplicate = rows.find((r) => r.id === rowId);
    if (!rowToDuplicate) return;

    const newRowId = generateId('row');
    const newRow: RowRecord = { ...rowToDuplicate, id: newRowId };

    const textProp = properties.find((p) => p.type === 'text');
    if (textProp && typeof newRow[textProp.id] === 'string') {
      newRow[textProp.id] = `${newRow[textProp.id]} (Copy)`;
    }

    const updatedRows = [...rows, newRow];
    saveRows(updatedRows);
    toast.success('Row duplicated successfully!');
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
    const viewName = prompt('Enter a name for this database view:');
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
    toast.success(`View "${viewName}" saved!`);
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
    if (window.confirm('Delete this view?')) {
      const updatedViews = savedViews.filter((v) => v.id !== viewId);
      persistDatabase({ databaseSavedViews: updatedViews });
      if (activeViewId === viewId) applyView(null);
      toast.success('View deleted.');
    }
  };

  const handleNotionExport = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading('Creating Notion Database...');

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
        toast.error('Please sign in again to export.', { id: loadingToast });
        return;
      }

      if (res.ok && data.success) {
        toast.success('Successfully exported to Notion!', { id: loadingToast });
        if (data.url) window.open(data.url, '_blank');
      } else {
        toast.error(data.error || 'Integration setup missing or failed.', {
          id: loadingToast,
        });
      }
    } catch (err) {
      toast.error('An error occurred during export.', { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  const getPropertyIcon = (type: PropertyType) => {
    switch (type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case 'select':
        return <ListIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case 'checkbox':
        return <CheckSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const processedRows = rows
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
    });

  const hasToolbarSlot = useHasProjectToolbarSlot();

  const toolbarActions = (
    <div className="flex items-center gap-1.5 shrink-0 min-w-0 overflow-visible">
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar hide-scrollbar-y max-w-[40vw] md:max-w-none">
        <button
          type="button"
          onClick={() => applyView(null)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeViewId === null ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
        >
          <ListIcon className="w-3.5 h-3.5" /> Default View
        </button>
        {savedViews.length > 0 && (
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1 shrink-0" />
        )}
        {savedViews.map((view) => (
          <div
            key={view.id}
            className="flex items-center group relative shrink-0"
          >
            <button
              type="button"
              onClick={() => applyView(view.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 pr-6 rounded-lg transition-colors whitespace-nowrap ${activeViewId === view.id ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> {view.name}
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteView(e, view.id)}
              className={`absolute right-1 w-4 h-4 rounded-md flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${activeViewId === view.id ? 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300' : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500'}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="hidden sm:block w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
      <div className="relative overflow-visible" ref={filterRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSortOpen(false);
            setIsFilterOpen((open) => !open);
          }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${isFilterOpen || filterQuery ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <Search className="w-3.5 h-3.5" /> Filter
          {filterQuery && (
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 ml-0.5" />
          )}
        </button>
        {isFilterOpen && (
          <div
            className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-xl p-3 z-[120] animate-in fade-in slide-in-from-top-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Search Database
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => {
                  setFilterQuery(e.target.value);
                  setActiveViewId(null);
                }}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors placeholder:text-zinc-400"
              />
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleSaveView}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors"
              >
                <BookmarkPlus className="w-3 h-3" /> Save as Custom View
              </button>
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterQuery('');
                    setActiveViewId(null);
                  }}
                  className="w-full py-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="relative overflow-visible" ref={sortRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFilterOpen(false);
            setIsSortOpen((open) => !open);
          }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${isSortOpen || sortConfig ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <ArrowUpDown className="w-3.5 h-3.5" /> Sort
          {sortConfig && (
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 ml-0.5" />
          )}
        </button>
        {isSortOpen && (
          <div
            className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-xl p-2 z-[120] animate-in fade-in slide-in-from-top-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2 block">
              Sort By Column
            </label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setSortConfig(null);
                  setActiveViewId(null);
                  setIsSortOpen(false);
                }}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg text-left transition-colors ${!sortConfig ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
              >
                None (Default)
              </button>
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="flex flex-col mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-800"
                >
                  <span className="text-[10px] font-semibold text-zinc-400 px-2 mb-1 truncate">
                    {prop.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSortConfig({ propId: prop.id, dir: 'asc' });
                      setActiveViewId(null);
                      setIsSortOpen(false);
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${sortConfig?.propId === prop.id && sortConfig.dir === 'asc' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                  >
                    Ascending (A-Z)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortConfig({ propId: prop.id, dir: 'desc' });
                      setActiveViewId(null);
                      setIsSortOpen(false);
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${sortConfig?.propId === prop.id && sortConfig.dir === 'desc' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                  >
                    Descending (Z-A)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleNotionExport}
        disabled={isExporting}
        className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm disabled:opacity-70"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CloudUpload className="w-3.5 h-3.5" />
        )}
        Export
      </button>
      {!isReadonly && (
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm ml-0.5"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      )}
    </div>
  );

  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent overflow-hidden font-sans z-10">
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-end bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md select-none shrink-0 relative z-50">
          {toolbarActions}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-transparent px-6 py-6 md:px-8 md:py-8 relative custom-scrollbar z-10">
        <div className="mb-6 max-w-3xl">
          <input
            type="text"
            value={dbTitle}
            onChange={(e) => saveTitle(e.target.value)}
            readOnly={isReadonly}
            placeholder="Untitled Database"
            className={`text-3xl md:text-[2rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 w-full focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 ${isReadonly ? 'cursor-default' : ''}`}
          />
          <p className="mt-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
            {processedRows.length}
            {filterQuery ? ` of ${rows.length}` : ''}{' '}
            {processedRows.length === 1 ? 'row' : 'rows'}
            {properties.length > 0
              ? ` · ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
              : ''}
          </p>
        </div>

        <div className="min-w-max pb-32 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm">
          <table className="text-left border-collapse whitespace-nowrap w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="w-10 py-1.5 bg-zinc-50/80 dark:bg-zinc-900/80" />
                {properties.map((prop) => (
                  <th
                    key={prop.id}
                    className="border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 font-normal text-zinc-500 text-sm hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 group/header transition-colors min-w-[150px] max-w-[300px] relative"
                  >
                    <div className="flex items-center justify-between px-2.5 py-2">
                      <div className="flex items-center gap-1.5 flex-1 w-full min-w-0">
                        {getPropertyIcon(prop.type)}
                        <input
                          type="text"
                          value={prop.name}
                          onChange={(e) =>
                            updatePropertyName(prop.id, e.target.value)
                          }
                          className="bg-transparent focus:outline-none text-zinc-600 dark:text-zinc-300 w-full placeholder:text-zinc-300 font-medium text-sm tracking-tight"
                          placeholder="Property name"
                        />
                      </div>
                      {properties.length > 1 && (
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="opacity-0 group-hover/header:opacity-100 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all p-1 rounded-md"
                          title="Delete Property"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 font-normal text-zinc-500 text-sm hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors w-24 relative">
                  <button
                    onClick={() => setIsPropertyMenuOpen(!isPropertyMenuOpen)}
                    className="flex items-center justify-center gap-1.5 px-2 py-2 w-full h-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    title="Add property"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {isPropertyMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsPropertyMenuOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Property Type
                        </div>
                        <button
                          onClick={() => handleAddProperty('text')}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 text-left rounded-md mx-0"
                        >
                          <Type className="w-4 h-4 text-zinc-400" /> Text
                        </button>
                        <button
                          onClick={() => handleAddProperty('number')}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 text-left"
                        >
                          <Hash className="w-4 h-4 text-zinc-400" /> Number
                        </button>
                        <button
                          onClick={() => handleAddProperty('select')}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 text-left"
                        >
                          <ListIcon className="w-4 h-4 text-zinc-400" /> Select
                        </button>
                        <button
                          onClick={() => handleAddProperty('date')}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 text-left"
                        >
                          <Calendar className="w-4 h-4 text-zinc-400" /> Date
                        </button>
                        <button
                          onClick={() => handleAddProperty('checkbox')}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 text-left"
                        >
                          <CheckSquare className="w-4 h-4 text-zinc-400" />{' '}
                          Checkbox
                        </button>
                      </div>
                    </>
                  )}
                </th>
                <th className="bg-zinc-50/80 dark:bg-zinc-900/80 w-full" />
              </tr>
            </thead>
            <tbody>
              {processedRows.map((row) => (
                <tr
                  key={row.id}
                  className="group/row border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="w-10 text-center align-middle p-0">
                    <div className="opacity-0 group-hover/row:opacity-100 flex flex-col items-center justify-center gap-0.5 w-full h-full p-1 transition-all">
                      <button className="text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 p-0.5 rounded-md cursor-grab">
                        <GripVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  {properties.map((prop) => (
                    <td
                      key={`${row.id}-${prop.id}`}
                      className="border-r border-zinc-100 dark:border-zinc-800/80 p-0 align-top relative group/cell"
                    >
                      <div className="min-h-[36px] w-full flex items-center px-2.5 py-1 focus-within:ring-2 focus-within:ring-inset focus-within:ring-zinc-900/10 focus-within:bg-zinc-50/80 dark:focus-within:bg-zinc-800/40 transition-colors">
                        {prop.type === 'text' && (
                          <input
                            type="text"
                            value={(row[prop.id] as string) || ''}
                            onChange={(e) =>
                              updateCell(row.id, prop.id, e.target.value)
                            }
                            className="w-full h-full bg-transparent focus:outline-none text-sm text-zinc-900 dark:text-zinc-100"
                          />
                        )}
                        {prop.type === 'number' && (
                          <input
                            type="number"
                            value={(row[prop.id] as string | number) || ''}
                            onChange={(e) =>
                              updateCell(row.id, prop.id, e.target.value)
                            }
                            className="w-full h-full bg-transparent focus:outline-none text-sm text-zinc-900 dark:text-zinc-100 tabular-nums"
                          />
                        )}
                        {prop.type === 'date' && (
                          <div className="w-full h-full relative">
                            <div
                              onClick={() =>
                                setActiveDateCell({
                                  rowId: row.id,
                                  propId: prop.id,
                                })
                              }
                              className="w-full h-full min-h-[26px] bg-transparent focus:outline-none text-sm cursor-pointer flex items-center"
                            >
                              {(row[prop.id] as string) ? (
                                <span className="text-zinc-900 dark:text-zinc-100 tabular-nums">
                                  {row[prop.id] as string}
                                </span>
                              ) : (
                                <span className="text-transparent group-hover/cell:text-zinc-300 dark:group-hover/cell:text-zinc-600">
                                  Empty
                                </span>
                              )}
                            </div>
                            {activeDateCell?.rowId === row.id &&
                              activeDateCell?.propId === prop.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setActiveDateCell(null)}
                                  />
                                  <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-xl p-1">
                                    <CustomCalendar
                                      mode="single"
                                      selected={
                                        row[prop.id]
                                          ? new Date(row[prop.id] as string)
                                          : undefined
                                      }
                                      onSelect={(date) => {
                                        if (date) {
                                          const y = date.getFullYear();
                                          const m = String(
                                            date.getMonth() + 1
                                          ).padStart(2, '0');
                                          const d = String(
                                            date.getDate()
                                          ).padStart(2, '0');
                                          updateCell(
                                            row.id,
                                            prop.id,
                                            `${y}-${m}-${d}`
                                          );
                                        } else updateCell(row.id, prop.id, '');
                                        setActiveDateCell(null);
                                      }}
                                      initialFocus
                                    />
                                  </div>
                                </>
                              )}
                          </div>
                        )}
                        {prop.type === 'checkbox' && (
                          <div className="w-full flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={(row[prop.id] as boolean) || false}
                              onChange={(e) =>
                                updateCell(row.id, prop.id, e.target.checked)
                              }
                              className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 focus:ring-zinc-900/20 cursor-pointer"
                            />
                          </div>
                        )}
                        {prop.type === 'select' && (
                          <input
                            type="text"
                            value={(row[prop.id] as string) || ''}
                            onChange={(e) =>
                              updateCell(row.id, prop.id, e.target.value)
                            }
                            placeholder="Empty"
                            className={`w-full bg-transparent focus:outline-none text-sm transition-all ${row[prop.id] ? 'bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-200 font-medium w-fit' : 'text-zinc-900 dark:text-zinc-100 placeholder:text-transparent group-hover/cell:placeholder:text-zinc-300'}`}
                          />
                        )}
                      </div>
                    </td>
                  ))}

                  <td className="border-r border-zinc-100 dark:border-zinc-800/80 w-12 text-center p-0 align-middle relative">
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenRowMenu(openRowMenu === row.id ? null : row.id);
                      }}
                      className="row-menu-trigger opacity-0 group-hover/row:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-md transition-all mx-auto flex items-center justify-center"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openRowMenu === row.id && (
                      <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="row-dropdown-menu absolute right-full top-1/2 -translate-y-1/2 mr-2 w-36 bg-white dark:bg-zinc-900 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 z-70 animate-in fade-in zoom-in-95 cursor-default text-left"
                      >
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDuplicateRow(row.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteRow(row.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>

                  <td />
                </tr>
              ))}

              {processedRows.length === 0 && filterQuery && (
                <tr>
                  <td
                    colSpan={properties.length + 2}
                    className="py-12 text-center"
                  >
                    <div className="inline-flex flex-col items-center gap-2 px-4">
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center">
                        <Search className="w-4 h-4 text-zinc-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        No results for &quot;{filterQuery}&quot;
                      </p>
                      <p className="text-[11px] font-medium text-zinc-400">
                        Try a different filter or clear it
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              <tr>
                <td className="w-10" />
                <td colSpan={properties.length + 2} className="p-0">
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-2.5 py-2 w-full text-left transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
