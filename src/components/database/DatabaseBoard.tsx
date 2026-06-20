"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { Calendar as CustomCalendar } from "@/components/ui/calendar";
import toast from "react-hot-toast";

interface DatabaseBoardProps {
  projectId: string;
}

type PropertyType = "text" | "number" | "select" | "date" | "checkbox";
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
  sortConfig: { propId: string; dir: "asc" | "desc" } | null;
}

export default function DatabaseBoard({ projectId }: DatabaseBoardProps) {
  const { metadata, updateMetadata } = useCanvasStore();
  const [isClient, setIsClient] = useState(false);

  const [properties, setProperties] = useState<Property[]>(
    (metadata?.databaseProperties as Property[]) || [
      { id: "prop-title", name: "Name", type: "text" },
    ],
  );

  const [rows, setRows] = useState<RowRecord[]>(
    (metadata?.databaseRows as RowRecord[]) || [
      { id: "row-1", "prop-title": "" },
      { id: "row-2", "prop-title": "" },
      { id: "row-3", "prop-title": "" },
    ],
  );

  const savedViews = (metadata.databaseSavedViews as DatabaseSavedView[]) || [];

  const [dbTitle, setDbTitle] = useState(
    (metadata?.databaseTitle as string) || "Untitled Database",
  );
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);

  const [filterQuery, setFilterQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    propId: string;
    dir: "asc" | "desc";
  } | null>(null);

  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      )
        setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node))
        setIsSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveProperties = (newProps: Property[]) => {
    setProperties(newProps);
    updateMetadata({ databaseProperties: newProps });
  };
  const saveRows = (newRows: RowRecord[]) => {
    setRows(newRows);
    updateMetadata({ databaseRows: newRows });
  };
  const saveTitle = (newTitle: string) => {
    setDbTitle(newTitle);
    updateMetadata({ databaseTitle: newTitle });
  };

  const [activeDateCell, setActiveDateCell] = useState<{
    rowId: string;
    propId: string;
  } | null>(null);

  const handleAddProperty = (type: PropertyType) => {
    const newPropId = `prop-${Date.now()}`;
    const newProps = [
      ...properties,
      { id: newPropId, name: `New ${type}`, type },
    ];
    const newRows = rows.map((row) => ({
      ...row,
      [newPropId]: type === "checkbox" ? false : "",
    }));
    saveProperties(newProps);
    saveRows(newRows);
    setIsPropertyMenuOpen(false);
  };

  const handleDeleteProperty = (propId: string) => {
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
    const newRow: RowRecord = { id: `row-${Date.now()}` };
    properties.forEach((prop) => {
      newRow[prop.id] = prop.type === "checkbox" ? false : "";
    });
    saveRows([...rows, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    saveRows(rows.filter((r) => r.id !== rowId));
  };

  const updateCell = (rowId: string, propId: string, value: CellValue) => {
    saveRows(
      rows.map((row) => (row.id === rowId ? { ...row, [propId]: value } : row)),
    );
  };

  const updatePropertyName = (propId: string, name: string) => {
    saveProperties(
      properties.map((prop) => (prop.id === propId ? { ...prop, name } : prop)),
    );
  };

  const handleSaveView = () => {
    const viewName = prompt("Enter a name for this database view:");
    if (!viewName?.trim()) return;

    const newView: DatabaseSavedView = {
      id: "view-db-" + Date.now(),
      name: viewName,
      filterQuery,
      sortConfig,
    };
    const updatedViews = [...savedViews, newView];
    updateMetadata({ databaseSavedViews: updatedViews });
    setActiveViewId(newView.id);
    setIsFilterOpen(false);
    toast.success(`View "${viewName}" saved!`);
  };

  const applyView = (viewId: string | null) => {
    setActiveViewId(viewId);
    if (viewId === null) {
      setFilterQuery("");
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
    if (window.confirm("Delete this view?")) {
      const updatedViews = savedViews.filter((v) => v.id !== viewId);
      updateMetadata({ databaseSavedViews: updatedViews });
      if (activeViewId === viewId) applyView(null);
      toast.success("View deleted.");
    }
  };

  const getPropertyIcon = (type: PropertyType) => {
    switch (type) {
      case "text":
        return <Type className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case "number":
        return <Hash className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case "date":
        return <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case "select":
        return <ListIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case "checkbox":
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
        String(row[prop.id] || "")
          .toLowerCase()
          .includes(q),
      );
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const valA = String(a[sortConfig.propId] || "").toLowerCase();
      const valB = String(b[sortConfig.propId] || "").toLowerCase();
      if (valA < valB) return sortConfig.dir === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });

  if (!isClient) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden font-sans relative z-10">
      <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-white select-none shrink-0 relative z-50">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar hide-scrollbar-y pr-4 flex-1">
          <button
            onClick={() => applyView(null)}
            className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 rounded transition-colors whitespace-nowrap ${activeViewId === null ? "text-zinc-900 bg-zinc-100" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"}`}
          >
            <ListIcon className="w-4 h-4" /> Default View
          </button>

          {savedViews.length > 0 && (
            <div className="h-4 w-px bg-zinc-300 mx-1 shrink-0"></div>
          )}

          {savedViews.map((view) => (
            <div
              key={view.id}
              className="flex items-center group relative shrink-0"
            >
              <button
                onClick={() => applyView(view.id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 pr-6 rounded transition-colors whitespace-nowrap ${activeViewId === view.id ? "text-indigo-700 bg-indigo-50" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> {view.name}
              </button>
              <button
                onClick={(e) => handleDeleteView(e, view.id)}
                className={`absolute right-1 w-4 h-4 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${activeViewId === view.id ? "hover:bg-indigo-200 text-indigo-700" : "hover:bg-red-100 text-red-500"}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-zinc-100 shrink-0">
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${isFilterOpen || filterQuery ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100"}`}
            >
              <Search className="w-3.5 h-3.5" /> Filter
              {filterQuery && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"></span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-zinc-200 shadow-xl rounded-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
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
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 mt-2 border-t border-zinc-100 flex flex-col gap-1.5">
                  <button
                    onClick={handleSaveView}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <BookmarkPlus className="w-3 h-3" /> Save as Custom View
                  </button>
                  {filterQuery && (
                    <button
                      onClick={() => {
                        setFilterQuery("");
                        setActiveViewId(null);
                      }}
                      className="w-full py-1.5 text-[10px] font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${isSortOpen || sortConfig ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100"}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort
              {sortConfig && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"></span>
              )}
            </button>

            {isSortOpen && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-zinc-200 shadow-xl rounded-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2 block">
                  Sort By Column
                </label>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => {
                      setSortConfig(null);
                      setActiveViewId(null);
                      setIsSortOpen(false);
                    }}
                    className={`px-2 py-1.5 text-xs font-bold rounded-lg text-left transition-colors ${!sortConfig ? "bg-indigo-50 text-indigo-700" : "hover:bg-zinc-50 text-zinc-700"}`}
                  >
                    None (Default)
                  </button>
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="flex flex-col mt-1 pt-1 border-t border-zinc-100"
                    >
                      <span className="text-[10px] font-bold text-zinc-400 px-2 mb-1 truncate">
                        {prop.name}
                      </span>
                      <button
                        onClick={() => {
                          setSortConfig({ propId: prop.id, dir: "asc" });
                          setActiveViewId(null);
                          setIsSortOpen(false);
                        }}
                        className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${sortConfig?.propId === prop.id && sortConfig.dir === "asc" ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-zinc-50 text-zinc-700"}`}
                      >
                        Ascending (A-Z)
                      </button>
                      <button
                        onClick={() => {
                          setSortConfig({ propId: prop.id, dir: "desc" });
                          setActiveViewId(null);
                          setIsSortOpen(false);
                        }}
                        className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${sortConfig?.propId === prop.id && sortConfig.dir === "desc" ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-zinc-50 text-zinc-700"}`}
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
            onClick={handleAddRow}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ml-2 shadow-sm"
          >
            New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white p-8 pt-10 relative custom-scrollbar z-10">
        <div className="mb-8 max-w-3xl">
          <input
            type="text"
            value={dbTitle}
            onChange={(e) => saveTitle(e.target.value)}
            placeholder="Untitled Database"
            className="text-4xl font-bold text-zinc-900 w-full focus:outline-none placeholder:text-zinc-300 placeholder:font-bold"
          />
        </div>

        <div className="min-w-max pb-32">
          <table className="text-left border-collapse whitespace-nowrap w-full">
            <thead>
              <tr className="border-y border-zinc-200">
                <th className="w-10 py-1.5 bg-white"></th>
                {properties.map((prop) => (
                  <th
                    key={prop.id}
                    className="border-r border-zinc-200 bg-white font-normal text-zinc-500 text-sm hover:bg-zinc-50 group/header transition-colors min-w-[150px] max-w-[300px] relative"
                  >
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-1.5 flex-1 w-full">
                        {getPropertyIcon(prop.type)}
                        <input
                          type="text"
                          value={prop.name}
                          onChange={(e) =>
                            updatePropertyName(prop.id, e.target.value)
                          }
                          className="bg-transparent focus:outline-none text-zinc-600 w-full placeholder:text-zinc-300 font-medium"
                          placeholder="Property name"
                        />
                      </div>
                      {properties.length > 1 && (
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="opacity-0 group-hover/header:opacity-100 text-zinc-300 hover:text-red-500 transition-all p-1"
                          title="Delete Property"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="border-r border-zinc-200 bg-white font-normal text-zinc-500 text-sm hover:bg-zinc-50 transition-colors w-24 relative">
                  <button
                    onClick={() => setIsPropertyMenuOpen(!isPropertyMenuOpen)}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 w-full h-full"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {isPropertyMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsPropertyMenuOpen(false)}
                      ></div>
                      <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-zinc-200 shadow-xl rounded-lg py-1.5 z-50">
                        <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                          Property Type
                        </div>
                        <button
                          onClick={() => handleAddProperty("text")}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-100 text-sm text-zinc-700 text-left"
                        >
                          <Type className="w-4 h-4 text-zinc-400" /> Text
                        </button>
                        <button
                          onClick={() => handleAddProperty("number")}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-100 text-sm text-zinc-700 text-left"
                        >
                          <Hash className="w-4 h-4 text-zinc-400" /> Number
                        </button>
                        <button
                          onClick={() => handleAddProperty("select")}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-100 text-sm text-zinc-700 text-left"
                        >
                          <ListIcon className="w-4 h-4 text-zinc-400" /> Select
                        </button>
                        <button
                          onClick={() => handleAddProperty("date")}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-100 text-sm text-zinc-700 text-left"
                        >
                          <Calendar className="w-4 h-4 text-zinc-400" /> Date
                        </button>
                        <button
                          onClick={() => handleAddProperty("checkbox")}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-zinc-100 text-sm text-zinc-700 text-left"
                        >
                          <CheckSquare className="w-4 h-4 text-zinc-400" />{" "}
                          Checkbox
                        </button>
                      </div>
                    </>
                  )}
                </th>
                <th className="bg-white w-full"></th>
              </tr>
            </thead>
            <tbody>
              {processedRows.map((row) => (
                <tr
                  key={row.id}
                  className="group/row border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="w-10 text-center align-middle p-0">
                    <div className="opacity-0 group-hover/row:opacity-100 flex flex-col items-center justify-center gap-0.5 w-full h-full p-1 transition-all">
                      <button className="text-zinc-300 hover:text-zinc-600 hover:bg-zinc-200 p-0.5 rounded cursor-grab">
                        <GripVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  {properties.map((prop) => (
                    <td
                      key={`${row.id}-${prop.id}`}
                      className="border-r border-zinc-100 p-0 align-top relative group/cell"
                    >
                      <div className="min-h-[34px] w-full flex items-center px-2 py-1 focus-within:ring-1 focus-within:ring-blue-400 focus-within:bg-blue-50/10 transition-colors">
                        {prop.type === "text" && (
                          <input
                            type="text"
                            value={(row[prop.id] as string) || ""}
                            onChange={(e) =>
                              updateCell(row.id, prop.id, e.target.value)
                            }
                            className="w-full h-full bg-transparent focus:outline-none text-sm text-zinc-900"
                          />
                        )}
                        {prop.type === "number" && (
                          <input
                            type="number"
                            value={(row[prop.id] as string | number) || ""}
                            onChange={(e) =>
                              updateCell(row.id, prop.id, e.target.value)
                            }
                            className="w-full h-full bg-transparent focus:outline-none text-sm text-zinc-900"
                          />
                        )}
                        {prop.type === "date" && (
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
                                <span className="text-zinc-900">
                                  {row[prop.id] as string}
                                </span>
                              ) : (
                                <span className="text-transparent group-hover/cell:text-zinc-300">
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
                                  ></div>
                                  <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-200 shadow-xl rounded-xl p-1">
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
                                            date.getMonth() + 1,
                                          ).padStart(2, "0");
                                          const d = String(
                                            date.getDate(),
                                          ).padStart(2, "0");
                                          updateCell(
                                            row.id,
                                            prop.id,
                                            `${y}-${m}-${d}`,
                                          );
                                        } else updateCell(row.id, prop.id, "");
                                        setActiveDateCell(null);
                                      }}
                                      initialFocus
                                    />
                                  </div>
                                </>
                              )}
                          </div>
                        )}
                        {prop.type === "checkbox" && (
                          <div className="w-full flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={(row[prop.id] as boolean) || false}
                              onChange={(e) =>
                                updateCell(row.id, prop.id, e.target.checked)
                              }
                              className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        )}
                        {prop.type === "select" && (
                          <input
                            type="text"
                            value={(row[prop.id] as string) || ""}
                            onChange={(e) =>
                              updateCell(row.id, prop.id, e.target.value)
                            }
                            placeholder="Empty"
                            className={`w-full bg-transparent focus:outline-none text-sm transition-all ${row[prop.id] ? "bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 font-medium w-fit" : "text-zinc-900 placeholder:text-transparent group-hover/cell:placeholder:text-zinc-300"}`}
                          />
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="border-r border-zinc-100 w-12 text-center p-0 align-middle">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="opacity-0 group-hover/row:opacity-100 text-zinc-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all mx-auto"
                      title="Delete Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td></td>
                </tr>
              ))}

              {processedRows.length === 0 && filterQuery && (
                <tr>
                  <td
                    colSpan={properties.length + 2}
                    className="py-8 text-center text-sm font-medium text-zinc-400"
                  >
                    No results found for &quot;{filterQuery}&quot;
                  </td>
                </tr>
              )}

              <tr>
                <td className="w-10"></td>
                <td colSpan={properties.length + 2} className="p-0">
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 px-2 py-1.5 w-full text-left transition-colors"
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
