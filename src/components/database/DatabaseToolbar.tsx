'use client';

import {
  Plus,
  Search,
  List as ListIcon,
  ArrowUpDown,
  BookmarkPlus,
  LayoutDashboard,
  X,
  CloudUpload,
  Loader2,
} from 'lucide-react';
import type { DatabaseSavedView, Property, SortConfig } from './types';
import { SURFACE, TOOLBAR } from './databaseStyles';

export type DatabaseToolbarLabels = {
  defaultView: string;
  filter: string;
  searchDatabase: string;
  searchPlaceholder: string;
  saveView: string;
  clearFilter: string;
  sort: string;
  sortByColumn: string;
  sortNone: string;
  sortAsc: string;
  sortDesc: string;
  export: string;
  newRow: string;
};

type DatabaseToolbarProps = {
  savedViews: DatabaseSavedView[];
  activeViewId: string | null;
  filterQuery: string;
  sortConfig: SortConfig;
  properties: Property[];
  isFilterOpen: boolean;
  isSortOpen: boolean;
  isExporting: boolean;
  isReadonly: boolean;
  filterRef: React.RefObject<HTMLDivElement | null>;
  sortRef: React.RefObject<HTMLDivElement | null>;
  labels: DatabaseToolbarLabels;
  onApplyView: (viewId: string | null) => void;
  onDeleteView: (e: React.MouseEvent, viewId: string) => void;
  onToggleFilter: () => void;
  onToggleSort: () => void;
  onFilterChange: (value: string) => void;
  onClearFilter: () => void;
  onSaveView: () => void;
  onSortChange: (config: SortConfig) => void;
  onExport: () => void;
  onAddRow: () => void;
};

export default function DatabaseToolbar({
  savedViews,
  activeViewId,
  filterQuery,
  sortConfig,
  properties,
  isFilterOpen,
  isSortOpen,
  isExporting,
  isReadonly,
  filterRef,
  sortRef,
  labels,
  onApplyView,
  onDeleteView,
  onToggleFilter,
  onToggleSort,
  onFilterChange,
  onClearFilter,
  onSaveView,
  onSortChange,
  onExport,
  onAddRow,
}: DatabaseToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0 min-w-0 overflow-visible">
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar hide-scrollbar-y max-w-[40vw] md:max-w-none">
        <button
          type="button"
          onClick={() => onApplyView(null)}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${
            activeViewId === null ? TOOLBAR.activeView : TOOLBAR.idleView
          }`}
        >
          <ListIcon className="w-3 h-3" />
          {labels.defaultView}
        </button>
        {savedViews.length > 0 && (
          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5 shrink-0" />
        )}
        {savedViews.map((view) => (
          <div
            key={view.id}
            className="flex items-center group relative shrink-0"
          >
            <button
              type="button"
              onClick={() => onApplyView(view.id)}
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 pr-5 rounded-md transition-all duration-200 whitespace-nowrap ${
                activeViewId === view.id
                  ? TOOLBAR.activeView
                  : TOOLBAR.idleView
              }`}
            >
              <LayoutDashboard className="w-3 h-3" />
              {view.name}
            </button>
            {!isReadonly && (
              <button
                type="button"
                onClick={(e) => onDeleteView(e, view.id)}
                className={`absolute right-1 w-4 h-4 rounded-md flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${
                  activeViewId === view.id
                    ? 'hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300'
                    : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500'
                }`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="hidden sm:block w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

      <div className="relative overflow-visible" ref={filterRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFilter();
          }}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all duration-200 ${
            isFilterOpen || filterQuery ? TOOLBAR.activeTool : TOOLBAR.idleTool
          }`}
        >
          <Search className="w-3 h-3" />
          {labels.filter}
          {filterQuery ? (
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 ml-0.5 animate-in zoom-in duration-200" />
          ) : null}
        </button>
        {isFilterOpen && (
          <div
            className={`absolute top-full mt-2 right-0 w-64 ${SURFACE.popover} p-3 z-120 animate-in fade-in slide-in-from-top-2 duration-200`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <label className="text-[10px] font-semibold text-teal-700/80 dark:text-teal-400/90 uppercase tracking-wider mb-1.5 block">
              {labels.searchDatabase}
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => onFilterChange(e.target.value)}
                placeholder={labels.searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400 dark:focus:border-teal-600 transition-colors placeholder:text-zinc-400"
              />
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
              {!isReadonly && (
                <button
                  type="button"
                  onClick={onSaveView}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/50 border border-sky-200/70 dark:border-sky-800/60 rounded-lg hover:bg-sky-100/80 dark:hover:bg-sky-900/40 transition-colors"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  {labels.saveView}
                </button>
              )}
              {filterQuery ? (
                <button
                  type="button"
                  onClick={onClearFilter}
                  className="w-full py-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                >
                  {labels.clearFilter}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="relative overflow-visible" ref={sortRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSort();
          }}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all duration-200 ${
            isSortOpen || sortConfig ? TOOLBAR.activeTool : TOOLBAR.idleTool
          }`}
        >
          <ArrowUpDown className="w-3 h-3" />
          {labels.sort}
          {sortConfig ? (
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 ml-0.5 animate-in zoom-in duration-200" />
          ) : null}
        </button>
        {isSortOpen && (
          <div
            className={`absolute top-full mt-2 right-0 w-56 ${SURFACE.popover} p-2 z-120 animate-in fade-in slide-in-from-top-2 duration-200`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <label className="text-[10px] font-semibold text-teal-700/80 dark:text-teal-400/90 uppercase tracking-wider mb-2 px-2 block">
              {labels.sortByColumn}
            </label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  onSortChange(null);
                }}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg text-left transition-colors ${
                  !sortConfig
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {labels.sortNone}
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
                      onSortChange({ propId: prop.id, dir: 'asc' });
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${
                      sortConfig?.propId === prop.id && sortConfig.dir === 'asc'
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-semibold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {labels.sortAsc}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({ propId: prop.id, dir: 'desc' });
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${
                      sortConfig?.propId === prop.id &&
                      sortConfig.dir === 'desc'
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-semibold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {labels.sortDesc}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all duration-200 disabled:opacity-70 ${TOOLBAR.export}`}
      >
        {isExporting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <CloudUpload className="w-3 h-3" />
        )}
        {labels.export}
      </button>

      {!isReadonly && (
        <button
          type="button"
          onClick={onAddRow}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all duration-200 ml-0.5 ${TOOLBAR.primary}`}
        >
          <Plus className="w-3 h-3" />
          {labels.newRow}
        </button>
      )}
    </div>
  );
}
