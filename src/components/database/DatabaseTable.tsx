'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  MoreHorizontal,
  Copy,
  Table2,
  Database,
} from 'lucide-react';
import { Calendar as CustomCalendar } from '@/components/ui/calendar';
import type {
  CellValue,
  Property,
  PropertyType,
  RowRecord,
} from './types';
import { PROPERTY_UI, ROW, SURFACE } from './databaseStyles';

export type DatabaseTableLabels = {
  propertyName: string;
  addProperty: string;
  propertyType: string;
  typeText: string;
  typeNumber: string;
  typeSelect: string;
  typeDate: string;
  typeCheckbox: string;
  deleteProperty: string;
  empty: string;
  duplicate: string;
  delete: string;
  newRow: string;
  noResults: string;
  noResultsHint: string;
  emptyTitle: string;
  emptyHint: string;
  filtered: string;
};

type DatabaseTableProps = {
  properties: Property[];
  rows: RowRecord[];
  filterQuery: string;
  isReadonly: boolean;
  isPropertyMenuOpen: boolean;
  openRowMenu: string | null;
  activeDateCell: { rowId: string; propId: string } | null;
  selectedRowId: string | null;
  labels: DatabaseTableLabels;
  onSelectRow: (rowId: string | null) => void;
  onUpdatePropertyName: (propId: string, name: string) => void;
  onDeleteProperty: (propId: string) => void;
  onTogglePropertyMenu: () => void;
  onAddProperty: (type: PropertyType) => void;
  onUpdateCell: (rowId: string, propId: string, value: CellValue) => void;
  onSetActiveDateCell: (
    cell: { rowId: string; propId: string } | null
  ) => void;
  onToggleRowMenu: (rowId: string | null) => void;
  onDuplicateRow: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
  onAddRow: () => void;
};

const PROPERTY_MENU_WIDTH = 208;
const PROPERTY_MENU_PAD = 8;

function PropertyIcon({ type }: { type: PropertyType }) {
  const ui = PROPERTY_UI[type];
  const cls = `w-3 h-3 shrink-0 ${ui.icon}`;
  switch (type) {
    case 'text':
      return <Type className={cls} />;
    case 'number':
      return <Hash className={cls} />;
    case 'date':
      return <Calendar className={cls} />;
    case 'select':
      return <ListIcon className={cls} />;
    case 'checkbox':
      return <CheckSquare className={cls} />;
    default:
      return <FileText className={`w-3 h-3 shrink-0 text-zinc-400`} />;
  }
}

function PropertyTypeOption({
  type,
  label,
  onClick,
}: {
  type: PropertyType;
  label: string;
  onClick: () => void;
}) {
  const ui = PROPERTY_UI[type];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 text-left transition-colors"
    >
      <span
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${ui.chip}`}
      >
        <PropertyIcon type={type} />
      </span>
      {label}
    </button>
  );
}

function clampPropertyMenuPosition(trigger: DOMRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Prefer below + left-aligned to trigger (opens rightward into the board)
  let left = trigger.left;
  if (left + PROPERTY_MENU_WIDTH > vw - PROPERTY_MENU_PAD) {
    left = trigger.right - PROPERTY_MENU_WIDTH;
  }
  left = Math.max(
    PROPERTY_MENU_PAD,
    Math.min(left, vw - PROPERTY_MENU_WIDTH - PROPERTY_MENU_PAD)
  );

  const top = Math.min(trigger.bottom + 6, vh - PROPERTY_MENU_PAD);
  return { top, left };
}

export default function DatabaseTable({
  properties,
  rows,
  filterQuery,
  isReadonly,
  isPropertyMenuOpen,
  openRowMenu,
  activeDateCell,
  selectedRowId,
  labels,
  onSelectRow,
  onUpdatePropertyName,
  onDeleteProperty,
  onTogglePropertyMenu,
  onAddProperty,
  onUpdateCell,
  onSetActiveDateCell,
  onToggleRowMenu,
  onDuplicateRow,
  onDeleteRow,
  onAddRow,
}: DatabaseTableProps) {
  const isEmptyBoard = rows.length === 0 && !filterQuery;
  const isFilterEmpty = rows.length === 0 && !!filterQuery;
  const addPropertyBtnRef = useRef<HTMLButtonElement>(null);
  const [propertyMenuPos, setPropertyMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const updatePropertyMenuPos = () => {
    const el = addPropertyBtnRef.current;
    if (!el) return;
    setPropertyMenuPos(clampPropertyMenuPosition(el.getBoundingClientRect()));
  };

  const handleTogglePropertyMenu = () => {
    if (!isPropertyMenuOpen) {
      updatePropertyMenuPos();
    }
    onTogglePropertyMenu();
  };

  useEffect(() => {
    if (!isPropertyMenuOpen) return;
    const onReposition = () => updatePropertyMenuPos();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [isPropertyMenuOpen]);

  return (
    <div className={`${SURFACE.shell} overflow-hidden min-w-max`}>
      <div className="overflow-auto max-h-full custom-scrollbar">
        <table className="text-left border-collapse whitespace-nowrap w-full">
          <thead className="sticky top-0 z-20">
            <tr className={`${SURFACE.header}`}>
              <th className="w-9 py-0 sticky left-0 z-30 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-md" />
              {properties.map((prop) => {
                const ui = PROPERTY_UI[prop.type];
                return (
                  <th
                    key={prop.id}
                    className="border-r border-zinc-200/70 dark:border-zinc-800 font-normal text-zinc-500 text-xs hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50 group/header transition-colors min-w-[130px] max-w-[260px] relative"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 opacity-80">
                      <div className={`h-full w-full ${ui.accent}`} />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 pt-2">
                      <div className="flex items-center gap-1.5 flex-1 w-full min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${ui.chip}`}
                        >
                          <PropertyIcon type={prop.type} />
                        </span>
                        <input
                          type="text"
                          value={prop.name}
                          onChange={(e) =>
                            onUpdatePropertyName(prop.id, e.target.value)
                          }
                          readOnly={isReadonly}
                          className={`bg-transparent focus:outline-none text-zinc-700 dark:text-zinc-200 w-full placeholder:text-zinc-300 font-semibold text-xs tracking-tight ${
                            isReadonly ? 'cursor-default' : ''
                          }`}
                          placeholder={labels.propertyName}
                        />
                      </div>
                      {!isReadonly && properties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteProperty(prop.id)}
                          className="opacity-0 group-hover/header:opacity-100 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all p-0.5 rounded"
                          title={labels.deleteProperty}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="border-r border-zinc-200/70 dark:border-zinc-800 font-normal text-zinc-500 text-xs hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50 transition-colors w-10 relative overflow-visible">
                {!isReadonly && (
                  <>
                    <button
                      ref={addPropertyBtnRef}
                      type="button"
                      onClick={handleTogglePropertyMenu}
                      className="flex items-center justify-center gap-1 px-1.5 py-1.5 pt-2 w-full h-full text-zinc-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                      title={labels.addProperty}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {isPropertyMenuOpen &&
                      propertyMenuPos &&
                      typeof document !== 'undefined' &&
                      createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={handleTogglePropertyMenu}
                          />
                          <div
                            className={`fixed w-52 ${SURFACE.popover} py-1 z-50 animate-in fade-in zoom-in-95 duration-150`}
                            style={{
                              top: propertyMenuPos.top,
                              left: propertyMenuPos.left,
                            }}
                          >
                            <div className="px-2.5 py-1 text-[10px] font-semibold text-sky-700/80 dark:text-sky-400/90 uppercase tracking-wider">
                              {labels.propertyType}
                            </div>
                            <PropertyTypeOption
                              type="text"
                              label={labels.typeText}
                              onClick={() => onAddProperty('text')}
                            />
                            <PropertyTypeOption
                              type="number"
                              label={labels.typeNumber}
                              onClick={() => onAddProperty('number')}
                            />
                            <PropertyTypeOption
                              type="select"
                              label={labels.typeSelect}
                              onClick={() => onAddProperty('select')}
                            />
                            <PropertyTypeOption
                              type="date"
                              label={labels.typeDate}
                              onClick={() => onAddProperty('date')}
                            />
                            <PropertyTypeOption
                              type="checkbox"
                              label={labels.typeCheckbox}
                              onClick={() => onAddProperty('checkbox')}
                            />
                          </div>
                        </>,
                        document.body
                      )}
                  </>
                )}
              </th>
              <th className="w-full" />
            </tr>
          </thead>
          <tbody>
            {isEmptyBoard && (
              <tr>
                <td colSpan={properties.length + 3} className="p-0">
                  <div className="py-12 px-5 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative mb-3">
                      <div className="absolute inset-0 rounded-xl bg-sky-400/20 blur-xl" />
                      <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-teal-50 dark:from-sky-950/60 dark:to-teal-950/40 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-center shadow-sm">
                        <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {labels.emptyTitle}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 max-w-xs">
                      {labels.emptyHint}
                    </p>
                    {!isReadonly && (
                      <button
                        type="button"
                        onClick={onAddRow}
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/25 transition-all duration-200"
                      >
                        <Plus className="w-3 h-3" />
                        {labels.newRow}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {isFilterEmpty && (
              <tr>
                <td
                  colSpan={properties.length + 3}
                  className="py-10 text-center"
                >
                  <div className="inline-flex flex-col items-center gap-2 px-3 animate-in fade-in slide-in-from-bottom-2 duration-250">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-center">
                      <Search className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      {labels.noResults}
                    </p>
                    <p className="text-[10px] font-medium text-zinc-400">
                      {labels.noResultsHint}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {rows.map((row, rowIndex) => {
              const isSelected = selectedRowId === row.id;
              return (
                <tr
                  key={row.id}
                  style={{ animationDelay: `${Math.min(rowIndex, 12) * 18}ms` }}
                  className={`${ROW.base} ${ROW.hover} ${
                    isSelected ? ROW.selected : ''
                  } animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
                  <td
                    className="w-9 text-center align-middle p-0 sticky left-0 z-10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-sm group-hover/row:bg-sky-50/50 dark:group-hover/row:bg-sky-950/30"
                    onClick={() =>
                      onSelectRow(isSelected ? null : row.id)
                    }
                  >
                    <div className="opacity-40 group-hover/row:opacity-100 flex flex-col items-center justify-center gap-0 w-full h-full py-0.5 transition-all duration-150">
                      <button
                        type="button"
                        className="text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 p-0.5 rounded cursor-grab"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-3 h-3" />
                      </button>
                      <span className="text-[8px] font-semibold tabular-nums text-zinc-300 dark:text-zinc-600 group-hover/row:text-sky-500/80 leading-none">
                        {rowIndex + 1}
                      </span>
                    </div>
                  </td>
                  {properties.map((prop) => (
                    <td
                      key={`${row.id}-${prop.id}`}
                      className="border-r border-zinc-100 dark:border-zinc-800/80 p-0 align-top relative group/cell"
                      onFocusCapture={() => onSelectRow(row.id)}
                    >
                      <div
                        className={`min-h-8 w-full flex items-center px-2 py-1 transition-colors duration-150 ${SURFACE.cellFocus}`}
                      >
                        {prop.type === 'text' && (
                          <input
                            type="text"
                            value={(row[prop.id] as string) || ''}
                            onChange={(e) =>
                              onUpdateCell(row.id, prop.id, e.target.value)
                            }
                            readOnly={isReadonly}
                            className="w-full h-full bg-transparent focus:outline-none text-xs text-zinc-900 dark:text-zinc-100"
                          />
                        )}
                        {prop.type === 'number' && (
                          <input
                            type="number"
                            value={(row[prop.id] as string | number) || ''}
                            onChange={(e) =>
                              onUpdateCell(row.id, prop.id, e.target.value)
                            }
                            readOnly={isReadonly}
                            className="w-full h-full bg-transparent focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 tabular-nums"
                          />
                        )}
                        {prop.type === 'date' && (
                          <div className="w-full h-full relative">
                            <div
                              onClick={() => {
                                if (isReadonly) return;
                                onSetActiveDateCell({
                                  rowId: row.id,
                                  propId: prop.id,
                                });
                              }}
                              className="w-full h-full min-h-6 bg-transparent focus:outline-none text-xs cursor-pointer flex items-center"
                            >
                              {(row[prop.id] as string) ? (
                                <span className="inline-flex items-center gap-1 text-zinc-900 dark:text-zinc-100 tabular-nums px-1 py-0.5 rounded bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                                  <Calendar className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                                  {row[prop.id] as string}
                                </span>
                              ) : (
                                <span className="text-transparent group-hover/cell:text-zinc-300 dark:group-hover/cell:text-zinc-600 transition-colors">
                                  {labels.empty}
                                </span>
                              )}
                            </div>
                            {activeDateCell?.rowId === row.id &&
                              activeDateCell?.propId === prop.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => onSetActiveDateCell(null)}
                                  />
                                  <div
                                    className={`absolute top-full left-0 mt-1 z-50 ${SURFACE.popover} p-1 animate-in fade-in zoom-in-95 duration-150`}
                                  >
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
                                          onUpdateCell(
                                            row.id,
                                            prop.id,
                                            `${y}-${m}-${d}`
                                          );
                                        } else {
                                          onUpdateCell(row.id, prop.id, '');
                                        }
                                        onSetActiveDateCell(null);
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
                                onUpdateCell(
                                  row.id,
                                  prop.id,
                                  e.target.checked
                                )
                              }
                              disabled={isReadonly}
                              className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 text-teal-600 focus:ring-teal-500/30 cursor-pointer accent-teal-600"
                            />
                          </div>
                        )}
                        {prop.type === 'select' && (
                          <input
                            type="text"
                            value={(row[prop.id] as string) || ''}
                            onChange={(e) =>
                              onUpdateCell(row.id, prop.id, e.target.value)
                            }
                            readOnly={isReadonly}
                            placeholder={labels.empty}
                            className={`w-full bg-transparent focus:outline-none text-xs transition-all ${
                              row[prop.id]
                                ? 'bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-100 font-medium border border-amber-200/70 dark:border-amber-800/50 w-fit'
                                : 'text-zinc-900 dark:text-zinc-100 placeholder:text-transparent group-hover/cell:placeholder:text-zinc-300'
                            }`}
                          />
                        )}
                      </div>
                    </td>
                  ))}

                  <td className="border-r border-zinc-100 dark:border-zinc-800/80 w-10 text-center p-0 align-middle relative">
                    {!isReadonly && (
                      <>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleRowMenu(
                              openRowMenu === row.id ? null : row.id
                            );
                          }}
                          className="row-menu-trigger opacity-0 group-hover/row:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1 rounded transition-all duration-150 mx-auto flex items-center justify-center"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {openRowMenu === row.id && (
                          <div
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className={`row-dropdown-menu absolute right-full top-1/2 -translate-y-1/2 mr-1.5 w-36 ${SURFACE.popover} p-0.5 z-70 animate-in fade-in zoom-in-95 duration-150 cursor-default text-left`}
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDuplicateRow(row.id);
                              }}
                              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              {labels.duplicate}
                            </button>
                            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteRow(row.id);
                              }}
                              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              {labels.delete}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td />
                </tr>
              );
            })}

            {!isReadonly && !isEmptyBoard && (
              <tr className="group/add">
                <td className="w-9 sticky left-0 bg-white/80 dark:bg-zinc-950/60" />
                <td colSpan={properties.length + 2} className="p-0">
                  <button
                    type="button"
                    onClick={onAddRow}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50/60 dark:hover:bg-sky-950/25 px-2 py-1.5 w-full text-left transition-all duration-150"
                  >
                    <span className="w-5 h-5 rounded border border-dashed border-zinc-300 dark:border-zinc-600 group-hover/add:border-sky-400 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </span>
                    {labels.newRow}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isEmptyBoard && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Table2 className="w-2.5 h-2.5 text-sky-500/80" />
            <span className="tabular-nums">
              {rows.length} · {properties.length}
            </span>
          </div>
          {filterQuery ? (
            <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400">
              <Search className="w-2.5 h-2.5" />
              {labels.filtered}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
