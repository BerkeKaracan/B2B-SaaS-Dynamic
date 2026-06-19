"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Type,
  Calendar,
  Hash,
  List,
  CheckSquare,
  GripVertical,
  FileText,
  Trash2,
} from "lucide-react";
import { useCanvasStore } from "@/store/useCanvasStore";

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

  const [dbTitle, setDbTitle] = useState(
    (metadata?.databaseTitle as string) || "Untitled Database",
  );
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
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
  };

  const handleAddRow = () => {
    const newRow: RowRecord = { id: `row-${Date.now()}` };
    properties.forEach((prop) => {
      newRow[prop.id] = prop.type === "checkbox" ? false : "";
    });
    saveRows([...rows, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    const newRows = rows.filter((r) => r.id !== rowId);
    saveRows(newRows);
  };

  const updateCell = (rowId: string, propId: string, value: CellValue) => {
    const newRows = rows.map((row) =>
      row.id === rowId ? { ...row, [propId]: value } : row,
    );
    saveRows(newRows);
  };

  const updatePropertyName = (propId: string, name: string) => {
    const newProps = properties.map((prop) =>
      prop.id === propId ? { ...prop, name } : prop,
    );
    saveProperties(newProps);
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
        return <List className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case "checkbox":
        return <CheckSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden font-sans relative">
      <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between bg-white select-none shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 px-2 py-1 rounded cursor-pointer transition-colors">
            <List className="w-4 h-4 text-zinc-500" />
            Table
          </div>
          <div className="h-3.5 w-px bg-zinc-300"></div>
          <button className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
            + Add View
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-zinc-500 hover:bg-zinc-100 p-1.5 rounded transition-colors flex items-center gap-1.5 text-sm font-medium">
            <Search className="w-4 h-4" /> Filter
          </button>
          <button className="text-zinc-500 hover:bg-zinc-100 p-1.5 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={handleAddRow}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors ml-2 shadow-sm"
          >
            New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white p-8 pt-10 relative custom-scrollbar">
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
                    className="flex items-center gap-1.5 px-2 py-1.5 w-full h-full"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {isPropertyMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsPropertyMenuOpen(false)}
                      ></div>
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-zinc-200 shadow-xl rounded-lg py-1.5 z-20">
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
                          <List className="w-4 h-4 text-zinc-400" /> Select
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
              {rows.map((row) => (
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
                          <input
                            type="date"
                            value={(row[prop.id] as string) || ""}
                            onChange={(e) =>
                              updateCell(row.id, prop.id, e.target.value)
                            }
                            className="w-full h-full bg-transparent focus:outline-none text-sm text-zinc-600 cursor-pointer"
                          />
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
                            className={`w-full bg-transparent focus:outline-none text-sm transition-all ${
                              row[prop.id]
                                ? "bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 font-medium"
                                : "text-zinc-900 placeholder:text-transparent group-hover/cell:placeholder:text-zinc-300"
                            }`}
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
