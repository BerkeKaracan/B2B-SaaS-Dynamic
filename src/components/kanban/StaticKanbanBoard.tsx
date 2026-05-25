"use client";

import React, { useState, useEffect } from "react";
import { fetchAPI } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Calendar } from "@/components/ui/calendar";

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

export interface KanbanRecordData {
  name?: string;
  status?: string;
  visibility?: string;
  template?: string;
  tasks?: Task[];
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fullRecordData, setFullRecordData] = useState<KanbanRecordData | null>(
    null,
  );

  const { user } = useAuthStore();
  const currentUserName =
    user?.full_name || user?.email?.split("@")[0] || "System User";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetchAPI(`/api/records/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          const recordData: KanbanRecordData = data.record_data || {};
          setFullRecordData(recordData);
          setTasks(recordData.tasks || []);
        }
      } catch (err) {
        console.error("Görevler çekilemedi:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) fetchTasks();
  }, [projectId]);

  const handleOpenAddModal = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskAssignee("");
    setNewTaskCommit("");
    setNewTaskPriority("NO PRIORITY");
    setStartDateObj(undefined);
    setDeadlineObj(undefined);
    setShowStartCalendar(false);
    setShowDeadlineCalendar(false);
    setIsAddModalOpen(true);
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
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

    const updatedTasks = [...tasks, taskToSave];
    setTasks(updatedTasks);
    setIsAddModalOpen(false);

    try {
      const updatedRecordData: KanbanRecordData = {
        ...fullRecordData,
        tasks: updatedTasks,
      };
      await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedRecordData }),
      });
      setFullRecordData(updatedRecordData);
    } catch (err) {
      console.error("Görev kaydedilemedi:", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => setDraggedTaskId(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedBy: currentUserName }
        : task,
    );
    setTasks(updatedTasks);
    setDraggedTaskId(null);

    try {
      const updatedRecordData: KanbanRecordData = {
        ...fullRecordData,
        tasks: updatedTasks,
      };
      await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedRecordData }),
      });
      setFullRecordData(updatedRecordData);
    } catch (err) {
      console.error("Görev güncellenemedi:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50">
        <span className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 overflow-hidden relative">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 shrink-0 z-10 shadow-xs">
        <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
          Project Board
        </h2>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 shadow-xs">
            Filter
          </button>
          <button className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 shadow-xs">
            Sort
          </button>

          <div className="w-px h-6 bg-zinc-200 mx-1"></div>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex items-center justify-center w-8 h-8 bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200 transition-colors font-bold text-sm border border-zinc-200"
            title="Toggle Github History"
          >
            {isDrawerOpen ? "[>]" : "[<]"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex gap-6 p-6 overflow-x-auto items-start custom-scrollbar">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="w-[340px] shrink-0 flex flex-col max-h-full bg-zinc-100/50 rounded-xl border border-zinc-200"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div
                  className="p-4 rounded-t-xl border-b border-zinc-200/50 flex items-center justify-between shadow-sm shrink-0"
                  style={{ backgroundColor: col.color }}
                >
                  <h3 className="font-black text-white tracking-wider">
                    {col.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {colTasks.map((task) => {
                    const isDarkBg = ["URGENT", "HIGH", "MEDIUM"].includes(
                      task.priority,
                    );
                    const textColor = isDarkBg ? "text-white" : "text-zinc-900";
                    const mutedTextColor = isDarkBg
                      ? "text-white/80"
                      : "text-zinc-500";
                    const borderColor = isDarkBg
                      ? "border-white/20"
                      : "border-zinc-200";

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        style={{ backgroundColor: PRIORITIES[task.priority] }}
                        className={`rounded-xl shadow-xs flex flex-col relative overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md
                          ${draggedTaskId === task.id ? "opacity-40 scale-95" : "opacity-100 scale-100"}
                          ${textColor}
                        `}
                      >
                        <div className="p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="text-sm font-extrabold leading-snug tracking-tight">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p
                                  className={`text-[11px] mt-1 line-clamp-2 ${mutedTextColor}`}
                                >
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {task.commitCode && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${isDarkBg ? "bg-white/10 border-white/20" : "bg-white/50 border-zinc-300"}`}
                                >
                                  {task.commitCode}
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkBg ? "bg-white/10 border-white/20" : "bg-zinc-200/50 border-zinc-200"}`}
                              >
                                For {task.assignee}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`h-px w-full ${borderColor} my-0.5`}
                          />

                          <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-[9px] font-medium ${mutedTextColor}`}
                              >
                                Created by{" "}
                                <span className="font-bold">
                                  {task.createdBy}
                                </span>
                              </span>
                              <span
                                className={`text-[9px] font-medium ${mutedTextColor}`}
                              >
                                Updated by{" "}
                                <span className="font-bold">
                                  {task.updatedBy}
                                </span>
                              </span>
                            </div>

                            <div className="flex flex-col items-end gap-0.5 text-[10px] font-bold">
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
                    );
                  })}

                  <button
                    onClick={() => handleOpenAddModal(col.id)}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 transition-all border border-dashed border-zinc-300"
                  >
                    + Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`absolute top-0 right-0 bottom-0 bg-white border-l border-zinc-200 shadow-2xl transition-transform duration-300 ease-in-out z-20 flex flex-col w-80 ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-extrabold text-zinc-900 text-sm">
              Github History
            </h3>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-center w-7 h-7 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 font-bold text-sm"
            >
              &gt;
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs text-zinc-500">Commits ve PR geçmişleri...</p>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-xl font-extrabold text-zinc-900">
                Add New Task
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 font-bold px-2 py-1 bg-zinc-200/50 rounded-lg"
              >
                X
              </button>
            </div>

            <form
              onSubmit={handleAddTaskSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
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
                  className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-medium focus:ring-1 focus:ring-zinc-950 focus:outline-none"
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
                  className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-medium focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                  placeholder="Task details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as TaskPriority)
                    }
                    className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-bold focus:outline-none bg-white"
                  >
                    {Object.keys(PRIORITIES).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-medium focus:outline-none"
                    placeholder="User001"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Commit Code
                  </label>
                  <input
                    type="text"
                    value={newTaskCommit}
                    onChange={(e) => setNewTaskCommit(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none"
                    placeholder="e.g. 0560MK8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                <div className="relative">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Start Date (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartCalendar(!showStartCalendar);
                      setShowDeadlineCalendar(false);
                    }}
                    className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-left bg-zinc-50 hover:bg-zinc-100 flex justify-between items-center"
                  >
                    <span>
                      {startDateObj
                        ? startDateObj.toLocaleDateString("en-GB")
                        : "Choose Date"}
                    </span>
                    {startDateObj && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartDateObj(undefined);
                        }}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        ✖
                      </span>
                    )}
                  </button>
                  {showStartCalendar && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white border border-zinc-200 shadow-xl rounded-2xl p-2 z-50">
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
                    className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-left bg-zinc-50 hover:bg-zinc-100 flex justify-between items-center"
                  >
                    <span>
                      {deadlineObj
                        ? deadlineObj.toLocaleDateString("en-GB")
                        : "Choose Date"}
                    </span>
                    {deadlineObj && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeadlineObj(undefined);
                        }}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        ✖
                      </span>
                    )}
                  </button>
                  {showDeadlineCalendar && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white border border-zinc-200 shadow-xl rounded-2xl p-2 z-50">
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

              <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 shadow-md"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
