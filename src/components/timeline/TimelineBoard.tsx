"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Calendar } from "@/components/ui/calendar";
import toast from "react-hot-toast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export type EventStatus =
  | "BACKLOG"
  | "CURRENT MONTH"
  | "NEXT MONTH"
  | "COMPLETED";
export type EventPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  assignee: string;
  createdBy: string;
  startDate?: string;
  endDate?: string;
  priority: EventPriority;
  status: EventStatus;
}

const PRIORITIES: Record<EventPriority, string> = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  NORMAL: "bg-blue-50 text-blue-700 border-blue-200",
  LOW: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const COLUMNS: { id: EventStatus; title: string }[] = [
  { id: "BACKLOG", title: "Backlog / Future" },
  { id: "CURRENT MONTH", title: "Current Month" },
  { id: "NEXT MONTH", title: "Next Month" },
  { id: "COMPLETED", title: "Completed" },
];

export default function TimelineBoard({ projectId }: { projectId: string }) {
  const { metadata, updateMetadata } = useCanvasStore();
  const events = (metadata.timelineEvents as TimelineEvent[]) || [];
  const collaborators =
    (metadata.collaborators as { email: string; role: string }[]) || [];

  const { user } = useAuthStore();
  const currentUserName =
    user?.full_name || user?.email?.split("@")[0] || "System User";

  const [isClient, setIsClient] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventAssignee, setNewEventAssignee] = useState("");
  const [newEventPriority, setNewEventPriority] =
    useState<EventPriority>("NORMAL");
  const [newEventStatus, setNewEventStatus] = useState<EventStatus>("BACKLOG");

  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined);
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(undefined);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  const updateEvents = (newEvents: TimelineEvent[]) => {
    updateMetadata({ timelineEvents: newEvents });
  };

  const handleOpenAddModal = (status: EventStatus) => {
    setEditingEventId(null);
    setNewEventStatus(status);
    setNewEventTitle("");
    setNewEventDescription("");
    setNewEventAssignee("");
    setNewEventPriority("NORMAL");
    setStartDateObj(undefined);
    setEndDateObj(undefined);
    setIsAddModalOpen(true);
  };

  const handleEditEvent = (ev: TimelineEvent) => {
    setEditingEventId(ev.id);
    setNewEventStatus(ev.status);
    setNewEventTitle(ev.title);
    setNewEventDescription(ev.description);
    setNewEventAssignee(ev.assignee);
    setNewEventPriority(ev.priority);

    if (ev.startDate) {
      const [day, month, year] = ev.startDate.split("/");
      setStartDateObj(
        new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
      );
    } else {
      setStartDateObj(undefined);
    }

    if (ev.endDate) {
      const [day, month, year] = ev.endDate.split("/");
      setEndDateObj(
        new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
      );
    } else {
      setEndDateObj(undefined);
    }
    setIsAddModalOpen(true);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const formattedStart = startDateObj
      ? startDateObj.toLocaleDateString("en-GB")
      : undefined;
    const formattedEnd = endDateObj
      ? endDateObj.toLocaleDateString("en-GB")
      : undefined;

    let updatedEvents = [...events];

    if (editingEventId) {
      updatedEvents = updatedEvents.map((ev) =>
        ev.id === editingEventId
          ? {
              ...ev,
              title: newEventTitle,
              description: newEventDescription,
              assignee: newEventAssignee || "Unassigned",
              startDate: formattedStart,
              endDate: formattedEnd,
              priority: newEventPriority,
              status: newEventStatus,
            }
          : ev,
      );
      toast.success("Event updated.");
    } else {
      updatedEvents.push({
        id: "evt-" + Date.now(),
        title: newEventTitle,
        description: newEventDescription,
        assignee: newEventAssignee || "Unassigned",
        createdBy: currentUserName,
        startDate: formattedStart,
        endDate: formattedEnd,
        priority: newEventPriority,
        status: newEventStatus,
      });
      toast.success("Event scheduled.");
    }

    updateEvents(updatedEvents);
    setIsAddModalOpen(false);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const dragged = events.find((e) => e.id === draggableId);
    if (!dragged) return;

    const newEvents = events.filter((e) => e.id !== draggableId);
    const updatedDragged = {
      ...dragged,
      status: destination.droppableId as EventStatus,
    };

    const destColEvents = newEvents.filter(
      (e) => e.status === destination.droppableId,
    );
    destColEvents.splice(destination.index, 0, updatedDragged);

    const finalEvents: TimelineEvent[] = [];
    for (const col of COLUMNS) {
      if (col.id === destination.droppableId) {
        finalEvents.push(...destColEvents);
      } else {
        finalEvents.push(...newEvents.filter((e) => e.status === col.id));
      }
    }

    updateEvents(finalEvents);
  };

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 md:px-6 py-4 bg-white border-b border-zinc-200 shrink-0 shadow-xs z-10">
        <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 tracking-tight">
          Timeline Planning
        </h2>
        <div className="flex gap-2">
          <button className="hidden sm:block text-xs font-bold px-3 py-1.5 rounded-md border border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50">
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 md:gap-6 p-4 md:p-6 items-start h-full w-max">
            {COLUMNS.map((col) => {
              const colEvents = events.filter((e) => e.status === col.id);

              return (
                <div
                  key={col.id}
                  className="w-[85vw] sm:w-80 shrink-0 flex flex-col h-full bg-zinc-100/50 rounded-2xl border border-zinc-200/60"
                >
                  <div className="p-3 md:p-4 border-b border-zinc-200/50 flex items-center justify-between bg-zinc-100 rounded-t-2xl shrink-0">
                    <h3 className="font-bold text-zinc-700 text-xs md:text-sm tracking-wide uppercase">
                      {col.title}
                    </h3>
                    <span className="bg-white text-zinc-500 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md shadow-sm border border-zinc-200">
                      {colEvents.length}
                    </span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`flex-1 overflow-y-auto p-2 md:p-3 flex flex-col gap-2 md:gap-3 custom-scrollbar transition-colors ${
                          snapshot.isDraggingOver ? "bg-zinc-200/30" : ""
                        }`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {colEvents.map((ev, index) => (
                          <Draggable
                            key={ev.id}
                            draggableId={ev.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleEditEvent(ev)}
                                className={`group relative bg-white border rounded-xl flex flex-col gap-2 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition-all p-3 md:p-4
                                  ${PRIORITIES[ev.priority]} 
                                  ${snapshot.isDragging ? "shadow-2xl scale-105 z-50 ring-2 ring-zinc-400" : "shadow-sm hover:shadow-md"}
                                `}
                              >
                                <div>
                                  <h4 className="text-xs md:text-sm font-black tracking-tight leading-snug">
                                    {ev.title}
                                  </h4>
                                  {ev.description && (
                                    <p className="text-[10px] md:text-xs font-medium opacity-80 mt-1 line-clamp-2">
                                      {ev.description}
                                    </p>
                                  )}
                                </div>
                                <div className="h-px bg-current opacity-10 w-full my-1"></div>
                                <div className="flex justify-between items-end gap-2">
                                  <div className="flex flex-col gap-0.5">
                                    {ev.startDate && (
                                      <span className="text-[9px] md:text-[10px] font-bold opacity-75">
                                        S: {ev.startDate}
                                      </span>
                                    )}
                                    {ev.endDate && (
                                      <span className="text-[9px] md:text-[10px] font-bold opacity-75">
                                        E: {ev.endDate}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-white/50 border border-current opacity-80 shrink-0">
                                    {ev.assignee}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        <button
                          onClick={() => handleOpenAddModal(col.id)}
                          className="mt-1 md:mt-2 w-full flex items-center justify-center gap-2 py-2 md:py-3 rounded-xl text-xs font-extrabold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 transition-all border border-dashed border-zinc-300 hover:border-zinc-400"
                        >
                          + Add Event
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

      {isAddModalOpen && isClient && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-zinc-950/60 backdrop-blur-sm sm:p-4">
              <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                <div className="p-4 md:p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                  <h2 className="text-lg md:text-xl font-extrabold text-zinc-900">
                    {editingEventId ? "Edit Event" : "Schedule Event"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-950 bg-white hover:bg-zinc-200 border border-zinc-200 rounded-full transition-colors p-1.5 shadow-sm"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={handleEventSubmit}
                  className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar pb-8 sm:pb-6"
                >
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Event Title
                    </label>
                    <input
                      required
                      type="text"
                      autoFocus
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      placeholder="e.g. Q3 Kickoff"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      placeholder="Event details..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Priority Level
                      </label>
                      <select
                        value={newEventPriority}
                        onChange={(e) =>
                          setNewEventPriority(e.target.value as EventPriority)
                        }
                        className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-bold focus:outline-none bg-white"
                      >
                        {Object.keys(PRIORITIES).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Lead Assignee
                      </label>
                      <input
                        type="text"
                        value={newEventAssignee}
                        onChange={(e) => setNewEventAssignee(e.target.value)}
                        onFocus={() => setShowAssigneeDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowAssigneeDropdown(false), 200)
                        }
                        className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        placeholder="Search user..."
                      />
                      {showAssigneeDropdown && collaborators.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 shadow-xl rounded-xl overflow-hidden z-50 max-h-40 overflow-y-auto">
                          {collaborators
                            .filter((c) =>
                              c.email
                                .toLowerCase()
                                .includes(newEventAssignee.toLowerCase()),
                            )
                            .map((c, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setNewEventAssignee(c.email.split("@")[0]);
                                  setShowAssigneeDropdown(false);
                                }}
                                className="px-3 py-3 sm:py-2 hover:bg-zinc-100 cursor-pointer text-xs font-semibold text-zinc-700 flex justify-between"
                              >
                                <span className="truncate">{c.email}</span>
                                <span className="text-[9px] uppercase bg-zinc-200 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                  {c.role}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                    <div className="relative flex flex-col">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                        Start Date
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowStartCalendar(!showStartCalendar);
                          setShowEndCalendar(false);
                        }}
                        className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-xs font-semibold text-left bg-zinc-50 hover:bg-zinc-100 flex justify-between items-center"
                      >
                        <span>
                          {startDateObj
                            ? startDateObj.toLocaleDateString("en-GB")
                            : "Date"}
                        </span>
                        {startDateObj && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setStartDateObj(undefined);
                            }}
                            className="text-zinc-400 hover:text-red-500 p-1"
                          >
                            ✖
                          </span>
                        )}
                      </button>
                      {showStartCalendar && (
                        <div className="mt-2 bg-white border border-zinc-200 shadow-sm rounded-2xl p-2 animate-in fade-in zoom-in-95 duration-100 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={startDateObj}
                            onSelect={(date) => {
                              setStartDateObj(date);
                              setShowStartCalendar(false);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="relative flex flex-col">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                        End Date
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEndCalendar(!showEndCalendar);
                          setShowStartCalendar(false);
                        }}
                        className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-xs font-semibold text-left bg-zinc-50 hover:bg-zinc-100 flex justify-between items-center"
                      >
                        <span>
                          {endDateObj
                            ? endDateObj.toLocaleDateString("en-GB")
                            : "Date"}
                        </span>
                        {endDateObj && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEndDateObj(undefined);
                            }}
                            className="text-zinc-400 hover:text-red-500 p-1"
                          >
                            ✖
                          </span>
                        )}
                      </button>
                      {showEndCalendar && (
                        <div className="mt-2 bg-white border border-zinc-200 shadow-sm rounded-2xl p-2 animate-in fade-in zoom-in-95 duration-100 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={endDateObj}
                            onSelect={(date) => {
                              setEndDateObj(date);
                              setShowEndCalendar(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-end gap-3 shrink-0 sticky bottom-0 bg-white">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-5 py-3 sm:py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 sm:px-6 py-3 sm:py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 shadow-md flex-1 sm:flex-none"
                    >
                      {editingEventId ? "Save Event" : "Schedule Event"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
