"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/services/api";
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

export type TaskStatus = "TO DO" | "IN PROGRESS" | "DONE";
export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NO PRIORITY";

export interface Task {
  id: string;
  title: string;
  description: string;
  commitCode?: string;
  assignee: string;
  createdBy: string;
  updatedBy: string;
  startDate?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
}

const PRIORITIES: Record<TaskPriority, string> = {
  URGENT: "#E3123B",
  HIGH: "#7B323D",
  MEDIUM: "#93B27D",
  LOW: "#BEF109",
  "NO PRIORITY": "#B2BAAE",
};

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "TO DO", title: "TO DO", color: "#71C6C0" },
  { id: "IN PROGRESS", title: "IN PROGRESS", color: "#6682FB" },
  { id: "DONE", title: "DONE", color: "#89A841" },
];

export default function StaticKanbanBoard({
  projectId,
}: {
  projectId: string;
}) {
  const params = useParams();
  const tenantId = params?.tenantId as string;

  const { metadata, updateMetadata } = useCanvasStore();
  const tasks = (metadata.tasks as Task[]) || [];
  const collaborators =
    (metadata.collaborators as { email: string; role: string }[]) || [];

  const { user } = useAuthStore();
  const currentUserName =
    user?.full_name || user?.email?.split("@")[0] || "System User";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskCommit, setNewTaskCommit] = useState("");
  const [newTaskPriority, setNewTaskPriority] =
    useState<TaskPriority>("NO PRIORITY");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("TO DO");

  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined);
  const [deadlineObj, setDeadlineObj] = useState<Date | undefined>(undefined);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  const mapStatusToBackend = (status: TaskStatus) => {
    if (status === "IN PROGRESS") return "in_progress";
    if (status === "DONE") return "done";
    return "todo";
  };

  const syncTasksToBackend = async (currentTasks: Task[]) => {
    if (!tenantId || !projectId) return;

    const formattedTasks = currentTasks.map((t) => ({
      project_id: projectId,
      project_name:
        (metadata.name as string) ||
        (metadata.title as string) ||
        "Project Board",
      title: t.title,
      status: mapStatusToBackend(t.status),
      priority: t.priority,
      due_date: t.deadline || null,
      assigned_to: t.assignee,
    }));

    try {
      await fetchAPI("/api/tasks/sync", {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenantId,
          project_id: projectId,
          tasks: formattedTasks,
        }),
      });
    } catch (error) {
      console.error("Failed to sync tasks:", error);
    }
  };

  const updateTasks = (newTasks: Task[]) => {
    updateMetadata({ tasks: newTasks });
    syncTasksToBackend(newTasks);
  };

  const handleOpenAddModal = (status: TaskStatus) => {
    setEditingTaskId(null);
    setNewTaskStatus(status);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskAssignee("");
    setNewTaskCommit("");
    setNewTaskPriority("NO PRIORITY");
    setStartDateObj(undefined);
    setDeadlineObj(undefined);
    setIsAddModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskStatus(task.status);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description);
    setNewTaskAssignee(task.assignee);
    setNewTaskCommit(task.commitCode || "");
    setNewTaskPriority(task.priority);

    if (task.startDate) {
      const [day, month] = task.startDate.split("/");
      setStartDateObj(
        new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day)),
      );
    } else {
      setStartDateObj(undefined);
    }

    if (task.deadline) {
      const [day, month] = task.deadline.split("/");
      setDeadlineObj(
        new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day)),
      );
    } else {
      setDeadlineObj(undefined);
    }
    setIsAddModalOpen(true);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const formattedStart = startDateObj
      ? startDateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
        })
      : undefined;
    const formattedDeadline = deadlineObj
      ? deadlineObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
        })
      : undefined;

    let updatedTasks = [...tasks];

    if (editingTaskId) {
      updatedTasks = updatedTasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: newTaskTitle,
              description: newTaskDescription,
              commitCode: newTaskCommit || undefined,
              assignee: newTaskAssignee || "Unassigned",
              updatedBy: currentUserName,
              startDate: formattedStart,
              deadline: formattedDeadline,
              priority: newTaskPriority,
              status: newTaskStatus,
            }
          : task,
      );
      toast.success("Task updated successfully!");
    } else {
      const taskToSave: Task = {
        id: "t-" + Date.now(),
        title: newTaskTitle,
        description: newTaskDescription,
        commitCode: newTaskCommit || undefined,
        assignee: newTaskAssignee || "Unassigned",
        createdBy: currentUserName,
        updatedBy: currentUserName,
        startDate: formattedStart,
        deadline: formattedDeadline,
        priority: newTaskPriority,
        status: newTaskStatus,
      };
      updatedTasks.push(taskToSave);
      toast.success("New task created!");
    }

    updateTasks(updatedTasks);
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

    const draggedTask = tasks.find((t) => t.id === draggableId);
    if (!draggedTask) return;

    const newTasks = tasks.filter((t) => t.id !== draggableId);
    const updatedTask = {
      ...draggedTask,
      status: destination.droppableId as TaskStatus,
      updatedBy: currentUserName,
    };

    const destColTasks = newTasks.filter(
      (t) => t.status === destination.droppableId,
    );
    destColTasks.splice(destination.index, 0, updatedTask);

    const finalTasks: Task[] = [];
    for (const col of COLUMNS) {
      if (col.id === destination.droppableId) {
        finalTasks.push(...destColTasks);
      } else {
        finalTasks.push(...newTasks.filter((t) => t.status === col.id));
      }
    }

    updateTasks(finalTasks);
  };

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 md:px-6 py-4 bg-white border-b border-zinc-200 shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3 md:gap-4">
          <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 tracking-tight">
            Project Board
          </h2>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 shadow-xs">
            Filter
          </button>
          <button className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 shadow-xs">
            Sort
          </button>

          <div className="hidden sm:block w-px h-6 bg-zinc-200 mx-1"></div>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors font-bold text-sm border ${isDrawerOpen ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200"}`}
            title="Toggle Github History"
          >
            {isDrawerOpen ? "[>]" : "[<]"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative w-full">
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar h-full">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 md:gap-6 p-4 md:p-6 items-start h-full w-max">
              {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);

                return (
                  <div
                    key={col.id}
                    className="w-[85vw] sm:w-[340px] shrink-0 flex flex-col max-h-full bg-zinc-100/50 rounded-xl border border-zinc-200"
                  >
                    <div
                      className="p-3 md:p-4 rounded-t-xl border-b border-zinc-200/50 flex items-center justify-between shadow-sm shrink-0"
                      style={{ backgroundColor: col.color }}
                    >
                      <h3 className="font-black text-white tracking-wider text-sm md:text-base">
                        {col.title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                        {colTasks.length}
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          className={`flex-1 overflow-y-auto p-2 md:p-3 flex flex-col gap-2 md:gap-3 custom-scrollbar transition-colors ${snapshot.isDraggingOver ? "bg-zinc-200/30" : ""}`}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {colTasks.map((task, index) => {
                            const isDarkBg = [
                              "URGENT",
                              "HIGH",
                              "MEDIUM",
                            ].includes(task.priority);
                            const textColor = isDarkBg
                              ? "text-white"
                              : "text-zinc-900";
                            const mutedTextColor = isDarkBg
                              ? "text-white/80"
                              : "text-zinc-500";
                            const borderColor = isDarkBg
                              ? "border-white/20"
                              : "border-zinc-200";

                            return (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleEditTask(task)}
                                    style={{
                                      ...provided.draggableProps.style,
                                      backgroundColor:
                                        PRIORITIES[task.priority],
                                    }}
                                    className={`rounded-xl shadow-xs flex flex-col overflow-hidden cursor-grab active:cursor-grabbing hover:-translate-y-0.5
                                      ${snapshot.isDragging ? "shadow-2xl scale-105 z-50 opacity-100" : "opacity-100 scale-100"}
                                      ${textColor}
                                    `}
                                  >
                                    <div className="p-3 md:p-4 flex flex-col gap-2 md:gap-3">
                                      <div className="flex justify-between items-start gap-2 md:gap-4">
                                        <div className="flex-1">
                                          <h4 className="text-sm font-extrabold leading-snug tracking-tight">
                                            {task.title}
                                          </h4>
                                          {task.description && (
                                            <p
                                              className={`text-[10px] md:text-[11px] mt-1 line-clamp-2 ${mutedTextColor}`}
                                            >
                                              {task.description}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                          {task.commitCode && (
                                            <span
                                              className={`px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-mono font-bold border ${isDarkBg ? "bg-white/10 border-white/20" : "bg-white/50 border-zinc-300"}`}
                                            >
                                              {task.commitCode}
                                            </span>
                                          )}
                                          <span
                                            className={`text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkBg ? "bg-white/10 border-white/20" : "bg-zinc-200/50 border-zinc-200"}`}
                                          >
                                            For{" "}
                                            {task.assignee.includes("@")
                                              ? task.assignee.split("@")[0]
                                              : task.assignee}
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className={`h-px w-full ${borderColor} my-0.5`}
                                      />

                                      <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-0.5">
                                          <span
                                            className={`text-[8px] md:text-[9px] font-medium ${mutedTextColor}`}
                                          >
                                            Created by{" "}
                                            <span className="font-bold">
                                              {task.createdBy}
                                            </span>
                                          </span>
                                          <span
                                            className={`text-[8px] md:text-[9px] font-medium ${mutedTextColor}`}
                                          >
                                            Updated by{" "}
                                            <span className="font-bold">
                                              {task.updatedBy}
                                            </span>
                                          </span>
                                        </div>

                                        <div className="flex flex-col items-end gap-0.5 text-[9px] md:text-[10px] font-bold">
                                          {task.startDate && (
                                            <span className={mutedTextColor}>
                                              Start: {task.startDate}
                                            </span>
                                          )}
                                          {task.deadline && (
                                            <span className={mutedTextColor}>
                                              Deadline: {task.deadline}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}

                          <button
                            onClick={() => handleOpenAddModal(col.id)}
                            className="mt-1 md:mt-2 w-full flex items-center justify-center gap-2 py-2 md:py-3 rounded-xl text-xs font-extrabold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 transition-all border border-dashed border-zinc-300 hover:border-zinc-400"
                          >
                            + Add Task
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

        {isDrawerOpen && (
          <div className="w-[85vw] sm:w-80 shrink-0 bg-white border-l border-zinc-200 shadow-2xl flex flex-col h-full absolute md:relative right-0 z-40 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-zinc-800"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
                <h3 className="font-extrabold text-zinc-900 text-sm">
                  Git History
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center justify-center w-7 h-7 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 font-bold text-sm"
              >
                [&gt;]
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-zinc-50 custom-scrollbar relative">
              <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-zinc-200"></div>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 shrink-0 shadow-sm mt-0.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <line x1="12" y1="5" x2="12" y2="9"></line>
                      <line x1="12" y1="15" x2="12" y2="19"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      Merge pull request #42
                    </p>
                    <p className="text-[10px] font-medium text-zinc-500 mt-0.5">
                      by <b>User001</b> • 2 hours ago
                    </p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-zinc-200/50 text-zinc-600 rounded text-[9px] font-mono font-bold border border-zinc-200">
                      0560MK8
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-600 shrink-0 shadow-sm mt-0.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      Fix transparent dragging bug
                    </p>
                    <p className="text-[10px] font-medium text-zinc-500 mt-0.5">
                      by <b>Boss</b> • 5 hours ago
                    </p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-zinc-200/50 text-zinc-600 rounded text-[9px] font-mono font-bold border border-zinc-200">
                      1A9F43B
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && isClient && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-zinc-950/60 backdrop-blur-sm sm:p-4">
              <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                <div className="p-5 md:p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                  <h2 className="text-lg md:text-xl font-extrabold text-zinc-900">
                    {editingTaskId ? "Edit Task" : "Add New Task"}
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={handleTaskSubmit}
                  className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar pb-8 sm:pb-6"
                >
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Title
                    </label>
                    <input
                      required
                      type="text"
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      placeholder="Task title..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-sm font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      placeholder="Task details..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Priority
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) =>
                          setNewTaskPriority(e.target.value as TaskPriority)
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
                        Assignee
                      </label>
                      <input
                        type="text"
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
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
                                .includes(newTaskAssignee.toLowerCase()),
                            )
                            .map((c, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setNewTaskAssignee(c.email);
                                  setShowAssigneeDropdown(false);
                                }}
                                className="px-3 py-3 sm:py-2 hover:bg-zinc-100 cursor-pointer text-xs font-semibold text-zinc-700 flex justify-between items-center"
                              >
                                <span className="truncate">{c.email}</span>
                                <span className="text-[9px] uppercase bg-zinc-200 px-1.5 py-0.5 rounded ml-2">
                                  {c.role}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {editingTaskId && (
                      <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                          Commit Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={newTaskCommit}
                          onChange={(e) => setNewTaskCommit(e.target.value)}
                          className="w-full mt-1 px-3 py-3 sm:py-2 border border-blue-200 rounded-xl sm:rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="e.g. 0560MK8"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                        Start (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowStartCalendar(!showStartCalendar);
                          setShowDeadlineCalendar(false);
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

                    <div className="relative">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                        Deadline (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeadlineCalendar(!showDeadlineCalendar);
                          setShowStartCalendar(false);
                        }}
                        className="w-full mt-1 px-3 py-3 sm:py-2 border border-zinc-200 rounded-xl sm:rounded-lg text-xs font-semibold text-left bg-zinc-50 hover:bg-zinc-100 flex justify-between items-center"
                      >
                        <span>
                          {deadlineObj
                            ? deadlineObj.toLocaleDateString("en-GB")
                            : "Date"}
                        </span>
                        {deadlineObj && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeadlineObj(undefined);
                            }}
                            className="text-zinc-400 hover:text-red-500 p-1"
                          >
                            ✖
                          </span>
                        )}
                      </button>
                      {showDeadlineCalendar && (
                        <div className="mt-2 bg-white border border-zinc-200 shadow-sm rounded-2xl p-2 animate-in fade-in zoom-in-95 duration-100 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={deadlineObj}
                            onSelect={(date) => {
                              setDeadlineObj(date);
                              setShowDeadlineCalendar(false);
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
                      {editingTaskId ? "Save" : "Create"}
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
