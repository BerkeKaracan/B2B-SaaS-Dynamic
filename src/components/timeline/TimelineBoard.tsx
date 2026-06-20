"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/store/useCanvasStore";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  MapPin,
  Clock,
  FileText,
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  BookmarkPlus,
  LayoutDashboard,
  X,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";

export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NO PRIORITY";

const PRIORITIES: Record<TaskPriority, string> = {
  URGENT: "#E3123B",
  HIGH: "#7B323D",
  MEDIUM: "#93B27D",
  LOW: "#BEF109",
  "NO PRIORITY": "#B2BAAE",
};

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  URGENT: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  "NO PRIORITY": 1,
};

export interface TimelineEvent {
  id: string;
  monthKey: string;
  title: string;
  description?: string;
  place?: string;
  time?: string;
  notes?: string;
  assignee?: string;
  priority: TaskPriority;
  isDetailed: boolean;
}

export interface TimelineSavedView {
  id: string;
  name: string;
  filterQuery: string;
  filterPriority: TaskPriority | "ALL";
  sortBy: "manual" | "priority";
}

const generateNextDays = (daysCount = 30) => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const current = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i,
    );
    const dayName = current.toLocaleString("en-US", { weekday: "short" });
    const monthName = current.toLocaleString("en-US", { month: "short" });
    const dayNum = String(current.getDate()).padStart(2, "0");
    const monthNum = String(current.getMonth() + 1).padStart(2, "0");
    const year = current.getFullYear();

    days.push({
      key: `${year}-${monthNum}-${dayNum}`,
      year: year,
      dayNum: dayNum,
      dayName: dayName,
      monthName: monthName,
      isToday: i === 0,
    });
  }
  return days;
};

export default function TimelineBoard({
  projectId: _projectId,
}: {
  projectId: string;
}) {
  const { metadata, updateMetadata } = useCanvasStore();
  const [events, setEvents] = useState<TimelineEvent[]>(
    (metadata.timelineEvents as TimelineEvent[]) || [],
  );

  const savedViews = (metadata.timelineSavedViews as TimelineSavedView[]) || [];

  const [columns] = useState(generateNextDays(30));
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [openEventMenu, setOpenEventMenu] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<TimelineEvent>>({
    title: "",
    priority: "NO PRIORITY",
    isDetailed: false,
  });
  const [activeMonthKey, setActiveMonthKey] = useState<string>("");

  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "ALL">(
    "ALL",
  );
  const [sortBy, setSortBy] = useState<"manual" | "priority">("manual");

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
      const target = event.target as Element;

      if (filterRef.current && !filterRef.current.contains(target as Node))
        setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(target as Node))
        setIsSortOpen(false);

      if (target && typeof target.closest === "function") {
        if (
          !target.closest(".event-dropdown-menu") &&
          !target.closest(".event-menu-trigger")
        ) {
          setOpenEventMenu(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateEvents = (newEvents: TimelineEvent[]) => {
    setEvents(newEvents);
    updateMetadata({ timelineEvents: newEvents });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (sortBy !== "manual") {
      setSortBy("manual");
      setActiveViewId(null);
      toast("Sort automatically reset to Manual for Drag & Drop", {
        icon: "ℹ️",
      });
    }

    const draggedEvent = events.find((e) => e.id === draggableId);
    if (!draggedEvent) return;

    const newEvents = events.filter((e) => e.id !== draggableId);
    const updatedEvent = { ...draggedEvent, monthKey: destination.droppableId };

    const destColEvents = newEvents.filter(
      (e) => e.monthKey === destination.droppableId,
    );
    destColEvents.splice(destination.index, 0, updatedEvent);

    const finalEvents = [
      ...newEvents.filter((e) => e.monthKey !== destination.droppableId),
      ...destColEvents,
    ];

    updateEvents(finalEvents);
  };

  const openModal = (monthKey: string, eventToEdit?: TimelineEvent) => {
    setActiveMonthKey(monthKey);
    if (eventToEdit) {
      setEditingEventId(eventToEdit.id);
      setFormData(eventToEdit);
    } else {
      setEditingEventId(null);
      setFormData({
        title: "",
        description: "",
        place: "",
        time: "",
        notes: "",
        assignee: "",
        priority: "NO PRIORITY",
        isDetailed: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleDuplicateEvent = (eventToDuplicate: TimelineEvent) => {
    const duplicatedEvent: TimelineEvent = {
      ...eventToDuplicate,
      id: "evt-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      title: `${eventToDuplicate.title} (Copy)`,
    };
    const updatedEvents = [...events, duplicatedEvent];
    updateEvents(updatedEvents);
    toast.success("Event duplicated successfully!");
    setOpenEventMenu(null);
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      const updatedEvents = events.filter((e) => e.id !== eventId);
      updateEvents(updatedEvents);
      toast.success("Event deleted!");
    }
    setOpenEventMenu(null);
  };

  const processSubmit = (addAnother: boolean = false) => {
    if (!formData.title?.trim()) {
      toast.error("Event title is required!");
      return;
    }

    let updatedEvents = [...events];
    if (editingEventId) {
      updatedEvents = updatedEvents.map((ev) =>
        ev.id === editingEventId
          ? {
              ...(formData as TimelineEvent),
              id: editingEventId,
              monthKey: activeMonthKey,
            }
          : ev,
      );
      toast.success("Event updated!");
    } else {
      updatedEvents.push({
        ...(formData as TimelineEvent),
        id: "evt-" + Date.now(),
        monthKey: activeMonthKey,
      });
      toast.success("Event added!");
    }

    updateEvents(updatedEvents);

    if (addAnother) {
      setEditingEventId(null);
      setFormData({
        ...formData,
        title: "",
        description: "",
        place: "",
        time: "",
        notes: "",
        assignee: "",
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const handleSaveView = () => {
    const viewName = prompt("Enter a name for this timeline view:");
    if (!viewName?.trim()) return;

    const newView: TimelineSavedView = {
      id: "view-tl-" + Date.now(),
      name: viewName,
      filterQuery,
      filterPriority,
      sortBy,
    };
    const updatedViews = [...savedViews, newView];
    updateMetadata({ timelineSavedViews: updatedViews });
    setActiveViewId(newView.id);
    setIsFilterOpen(false);
    toast.success(`View "${viewName}" saved!`);
  };

  const applyView = (viewId: string | null) => {
    setActiveViewId(viewId);
    if (viewId === null) {
      setFilterQuery("");
      setFilterPriority("ALL");
      setSortBy("manual");
      return;
    }
    const view = savedViews.find((v) => v.id === viewId);
    if (view) {
      setFilterQuery(view.filterQuery);
      setFilterPriority(view.filterPriority);
      setSortBy(view.sortBy);
    }
  };

  const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this view?")) {
      const updatedViews = savedViews.filter((v) => v.id !== viewId);
      updateMetadata({ timelineSavedViews: updatedViews });
      if (activeViewId === viewId) applyView(null);
      toast.success("View deleted.");
    }
  };

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50 overflow-hidden select-none">
      <div className="flex flex-col bg-white border-b border-zinc-200 shrink-0 z-10 shadow-xs">
        <div className="flex items-center justify-between p-4 md:px-6 py-4">
          <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 tracking-tight">
            Timeline Planning
          </h2>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs border ${isFilterOpen || filterQuery || filterPriority !== "ALL" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"}`}
              >
                <Filter className="w-3.5 h-3.5" /> Filter
                {(filterQuery || filterPriority !== "ALL") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"></span>
                )}
              </button>
              {isFilterOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-zinc-200 shadow-xl rounded-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
                        Search Content
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
                          placeholder="Title or Assignee..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
                        Priority Filter
                      </label>
                      <select
                        value={filterPriority}
                        onChange={(e) => {
                          setFilterPriority(
                            e.target.value as TaskPriority | "ALL",
                          );
                          setActiveViewId(null);
                        }}
                        className="w-full px-2 py-1.5 text-xs font-bold border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="ALL">All Priorities</option>
                        {Object.keys(PRIORITIES).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1.5">
                      <button
                        onClick={handleSaveView}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <BookmarkPlus className="w-3 h-3" /> Save as Custom View
                      </button>
                      {(filterQuery || filterPriority !== "ALL") && (
                        <button
                          onClick={() => applyView(null)}
                          className="w-full py-1.5 text-[10px] font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs border ${isSortOpen || sortBy !== "manual" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort
                {sortBy !== "manual" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"></span>
                )}
              </button>
              {isSortOpen && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-zinc-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setSortBy("manual");
                        setActiveViewId(null);
                        setIsSortOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${sortBy === "manual" ? "bg-indigo-50 text-indigo-700" : "hover:bg-zinc-50 text-zinc-700"}`}
                    >
                      Manual (Drag & Drop)
                    </button>
                    <button
                      onClick={() => {
                        setSortBy("priority");
                        setActiveViewId(null);
                        setIsSortOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${sortBy === "priority" ? "bg-indigo-50 text-indigo-700" : "hover:bg-zinc-50 text-zinc-700"}`}
                    >
                      Priority (High to Low)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 md:px-6 pb-2 overflow-x-auto custom-scrollbar hide-scrollbar-y">
          <button
            onClick={() => applyView(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap ${activeViewId === null ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Default View
          </button>

          {savedViews.map((view) => (
            <div key={view.id} className="flex items-center group relative">
              <button
                onClick={() => applyView(view.id)}
                className={`flex items-center pr-6 pl-3 py-1.5 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap ${activeViewId === view.id ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
              >
                {view.name}
              </button>
              <button
                onClick={(e) => handleDeleteView(e, view.id)}
                className={`absolute right-1.5 w-4 h-4 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${activeViewId === view.id ? "hover:bg-indigo-700 text-white" : "hover:bg-red-500 hover:text-white text-zinc-400"}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative w-full">
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar h-full">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 p-4 md:p-6 items-start h-full w-max">
              {columns.map((col) => {
                const colEvents = events
                  .filter((e) => e.monthKey === col.key)
                  .filter((e) => {
                    if (filterQuery) {
                      const q = filterQuery.toLowerCase();
                      if (
                        !e.title.toLowerCase().includes(q) &&
                        !(e.assignee || "").toLowerCase().includes(q)
                      )
                        return false;
                    }
                    if (
                      filterPriority !== "ALL" &&
                      e.priority !== filterPriority
                    )
                      return false;
                    return true;
                  })
                  .sort((a, b) => {
                    if (sortBy === "priority")
                      return (
                        PRIORITY_WEIGHTS[b.priority] -
                        PRIORITY_WEIGHTS[a.priority]
                      );
                    return 0;
                  });

                return (
                  <div
                    key={col.key}
                    className="w-[85vw] sm:w-[320px] shrink-0 flex flex-col max-h-full"
                  >
                    <div
                      className={`flex items-center justify-between p-3 mb-3 rounded-xl border-2 shadow-sm shrink-0 transition-colors ${col.isToday ? "bg-indigo-50 border-indigo-200" : "bg-white border-zinc-200"}`}
                    >
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${col.isToday ? "text-indigo-500" : "text-zinc-400"}`}
                        >
                          {col.monthName} {col.year}
                        </span>
                        <div className="flex items-end gap-1.5 mt-0.5">
                          <span
                            className={`text-2xl font-black leading-none ${col.isToday ? "text-indigo-900" : "text-zinc-900"}`}
                          >
                            {col.dayNum}
                          </span>
                          <span
                            className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${col.isToday ? "text-indigo-600" : "text-zinc-500"}`}
                          >
                            {col.dayName}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {col.isToday && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded uppercase tracking-wider animate-pulse">
                            Today
                          </span>
                        )}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${col.isToday ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}
                        >
                          {colEvents.length}
                        </div>
                      </div>
                    </div>

                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <div
                          className={`flex-1 overflow-y-auto p-2 flex flex-col gap-3 custom-scrollbar rounded-xl transition-colors min-h-[150px] ${snapshot.isDraggingOver ? "bg-zinc-200/40" : "bg-transparent"}`}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {colEvents.map((event, index) => {
                            const isDarkBg = [
                              "URGENT",
                              "HIGH",
                              "MEDIUM",
                            ].includes(event.priority);
                            const textColor = isDarkBg
                              ? "text-white"
                              : "text-zinc-900";
                            const mutedColor = isDarkBg
                              ? "text-white/70"
                              : "text-zinc-600";
                            const borderColor = isDarkBg
                              ? "border-white/20"
                              : "border-zinc-300";

                            return (
                              <Draggable
                                key={event.id}
                                draggableId={event.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => openModal(col.key, event)}
                                    className={`rounded-xl shadow-sm flex flex-col cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition-transform ${snapshot.isDragging ? "shadow-2xl scale-105 z-50 ring-2 ring-zinc-400" : ""} ${textColor}`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      backgroundColor:
                                        PRIORITIES[event.priority],
                                    }}
                                  >
                                    {!event.isDetailed ? (
                                      <div className="p-3 font-extrabold text-sm text-center tracking-wide relative">
                                        <div className="absolute top-1.5 right-1.5">
                                          <button
                                            onMouseDown={(e) =>
                                              e.stopPropagation()
                                            }
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setOpenEventMenu(
                                                openEventMenu === event.id
                                                  ? null
                                                  : event.id,
                                              );
                                            }}
                                            className={`event-menu-trigger p-1 rounded-md transition-colors ${isDarkBg ? "hover:bg-white/20 text-white" : "hover:bg-zinc-200/50 text-zinc-500"}`}
                                          >
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                          </button>
                                          {openEventMenu === event.id && (
                                            <div
                                              onMouseDown={(e) =>
                                                e.stopPropagation()
                                              }
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className="event-dropdown-menu absolute right-0 top-full mt-1 w-36 bg-white shadow-xl border border-zinc-200 rounded-lg p-1 z-[70] animate-in fade-in zoom-in-95 cursor-default text-zinc-900"
                                            >
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  openModal(col.key, event);
                                                  setOpenEventMenu(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />{" "}
                                                Edit
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDuplicateEvent(event);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                                              >
                                                <Copy className="w-3.5 h-3.5" />{" "}
                                                Duplicate
                                              </button>
                                              <div className="w-full h-px bg-zinc-100 my-0.5"></div>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDeleteEvent(
                                                    event.id,
                                                    event.title,
                                                  );
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />{" "}
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        <span className="pr-4">
                                          {event.title}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="p-3.5 flex flex-col gap-2 relative">
                                        <div className="absolute top-2 right-2">
                                          <button
                                            onMouseDown={(e) =>
                                              e.stopPropagation()
                                            }
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setOpenEventMenu(
                                                openEventMenu === event.id
                                                  ? null
                                                  : event.id,
                                              );
                                            }}
                                            className={`event-menu-trigger p-1.5 rounded-md transition-colors ${isDarkBg ? "hover:bg-white/20 text-white" : "hover:bg-zinc-200/50 text-zinc-500"}`}
                                          >
                                            <MoreHorizontal className="w-4 h-4" />
                                          </button>
                                          {openEventMenu === event.id && (
                                            <div
                                              onMouseDown={(e) =>
                                                e.stopPropagation()
                                              }
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className="event-dropdown-menu absolute right-0 top-full mt-1 w-40 bg-white shadow-xl border border-zinc-200 rounded-lg p-1 z-[70] animate-in fade-in zoom-in-95 cursor-default text-zinc-900"
                                            >
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  openModal(col.key, event);
                                                  setOpenEventMenu(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />{" "}
                                                Edit
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDuplicateEvent(event);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                                              >
                                                <Copy className="w-3.5 h-3.5" />{" "}
                                                Duplicate
                                              </button>
                                              <div className="w-full h-px bg-zinc-100 my-1"></div>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDeleteEvent(
                                                    event.id,
                                                    event.title,
                                                  );
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />{" "}
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {event.assignee && (
                                          <div
                                            className={`text-[10px] font-bold px-2 py-1 w-max rounded-md mb-1 ${isDarkBg ? "bg-black/20" : "bg-white/50 border border-zinc-300"} ${textColor}`}
                                          >
                                            For: {event.assignee}
                                          </div>
                                        )}
                                        <h4 className="text-sm font-black uppercase tracking-tight pr-6">
                                          {event.title}
                                        </h4>
                                        {event.description && (
                                          <p
                                            className={`text-xs font-medium line-clamp-2 ${mutedColor}`}
                                          >
                                            {event.description}
                                          </p>
                                        )}
                                        <div
                                          className={`w-full h-px my-1 ${borderColor}`}
                                        ></div>
                                        <div className="flex flex-col gap-1.5 mt-1">
                                          {event.place && (
                                            <div
                                              className={`flex items-center gap-1.5 text-[11px] font-semibold ${mutedColor}`}
                                            >
                                              <MapPin size={12} /> {event.place}
                                            </div>
                                          )}
                                          {event.time && (
                                            <div
                                              className={`flex items-center gap-1.5 text-[11px] font-semibold ${mutedColor}`}
                                            >
                                              <Clock size={12} /> {event.time}
                                            </div>
                                          )}
                                          {event.notes && (
                                            <div
                                              className={`flex items-start gap-1.5 text-[11px] font-semibold ${mutedColor}`}
                                            >
                                              <FileText
                                                size={12}
                                                className="shrink-0 mt-0.5"
                                              />{" "}
                                              <span className="line-clamp-2">
                                                {event.notes}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          <button
                            onClick={() => openModal(col.key)}
                            className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-xs font-extrabold text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 transition-all border-2 border-dashed border-zinc-200 hover:border-zinc-300"
                          >
                            <Plus size={14} strokeWidth={3} /> Add Event
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>

      {isModalOpen && isClient && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-zinc-950/60 backdrop-blur-sm sm:p-4">
              <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                  <h2 className="text-lg font-black text-zinc-900">
                    {editingEventId ? "Edit Event" : "Add Timeline Event"}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-950 bg-white hover:bg-zinc-200 border border-zinc-200 rounded-full transition-colors p-1.5 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar pb-8 sm:pb-5">
                  <div className="flex items-center justify-between bg-zinc-100 p-2 rounded-xl">
                    <span className="text-xs font-bold text-zinc-600 px-2">
                      Card Style
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isDetailed: false })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!formData.isDetailed ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200"}`}
                      >
                        Simple Block
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isDetailed: true })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.isDetailed ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:bg-zinc-200"}`}
                      >
                        Detailed Card
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Target Date
                    </label>
                    <select
                      value={activeMonthKey}
                      onChange={(e) => setActiveMonthKey(e.target.value)}
                      className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-bold focus:outline-none cursor-pointer bg-white"
                    >
                      {columns.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.dayNum} {col.monthName} {col.year} ({col.dayName}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Title
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="e.g. FUAR or MEETING"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Color / Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-bold focus:outline-none cursor-pointer bg-white"
                    >
                      {Object.keys(PRIORITIES).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.isDetailed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-zinc-100 pt-4 mt-2">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Assignee / Connection
                        </label>
                        <input
                          type="text"
                          value={formData.assignee}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              assignee: e.target.value,
                            })
                          }
                          className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:outline-none"
                          placeholder="e.g. Mrs. John"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:outline-none resize-none"
                          placeholder="Event details..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                            Place
                          </label>
                          <input
                            type="text"
                            value={formData.place}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                place: e.target.value,
                              })
                            }
                            className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:outline-none"
                            placeholder="Location..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                            Time
                          </label>
                          <input
                            type="text"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({ ...formData, time: e.target.value })
                            }
                            className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:outline-none"
                            placeholder="e.g. 14:00 - 16:00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="w-full px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:outline-none resize-none"
                          placeholder="Extra informations..."
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2 shrink-0 mt-4 sticky bottom-0 bg-white">
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={() => {
                          updateEvents(
                            events.filter((e) => e.id !== editingEventId),
                          );
                          setIsModalOpen(false);
                          toast.success("Event deleted!");
                        }}
                        className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl mr-auto"
                      >
                        Delete
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      Cancel
                    </button>

                    {!editingEventId && (
                      <button
                        type="button"
                        onClick={() => processSubmit(true)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors hidden sm:block"
                      >
                        Save & Add Another
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => processSubmit(false)}
                      className="px-6 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 shadow-md"
                    >
                      {editingEventId ? "Save Changes" : "Save & Close"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
