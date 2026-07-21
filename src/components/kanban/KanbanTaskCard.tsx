'use client';

/* DnD `provided.innerRef` / `draggableProps` must bind during render (@hello-pangea/dnd). */
/* eslint-disable react-hooks/refs */

import React from 'react';
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Edit2,
  Calendar,
  GitCommitHorizontal,
  User,
} from 'lucide-react';
import type { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import type { Task } from './types';
import { PRIORITY_UI } from './kanbanStyles';

export interface KanbanTaskCardLabels {
  for: string;
  start: string;
  deadline: string;
  editTask: string;
  duplicate: string;
  delete: string;
}

interface KanbanTaskCardProps {
  task: Task;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  isMenuOpen: boolean;
  labels: KanbanTaskCardLabels;
  onOpen: () => void;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function assigneeLabel(assignee: string) {
  if (!assignee) return null;
  return assignee.includes('@') ? assignee.split('@')[0] : assignee;
}

function KanbanTaskCard({
  task,
  provided,
  snapshot,
  isMenuOpen,
  labels,
  onOpen,
  onToggleMenu,
  onEdit,
  onDuplicate,
  onDelete,
}: KanbanTaskCardProps) {
  const priority = PRIORITY_UI[task.priority] || PRIORITY_UI['NO PRIORITY'];
  const who = assigneeLabel(task.assignee);
  const hasDates = Boolean(task.startDate || task.deadline);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onOpen}
      style={provided.draggableProps.style}
      className={`group relative flex flex-col rounded-xl border overflow-visible cursor-grab active:cursor-grabbing transition-[box-shadow,transform,border-color] duration-200 ${priority.card} ${priority.border} ${
        snapshot.isDragging
          ? 'shadow-[0_18px_44px_-14px_rgba(0,0,0,0.28)] ring-2 ring-sky-500/25 z-50 scale-[1.02]'
          : 'shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.16)] hover:-translate-y-px'
      }`}
    >
      {/* Priority accent rail — full height */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[11px] ${priority.accent}`}
        aria-hidden
      />

      <div className="relative pl-3.5 pr-2.5 pt-2.5 pb-2.5 flex flex-col gap-2.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="text-[13.5px] font-semibold leading-snug tracking-tight text-zinc-950 dark:text-zinc-50 line-clamp-2">
              {task.title}
            </h4>
            {task.description ? (
              <p className="text-[11px] mt-1 line-clamp-2 font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {task.description}
              </p>
            ) : null}
          </div>

          <div className="relative shrink-0 -mr-0.5">
            <button
              type="button"
              className={`task-menu-trigger p-1 rounded-md text-zinc-400 group-hover:opacity-100 focus:opacity-100 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white/80 dark:hover:bg-zinc-800 transition-all ${
                isMenuOpen
                  ? 'opacity-100 bg-white/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                  : 'opacity-0'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMenu();
              }}
              aria-label="Task menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {isMenuOpen && (
              <div className="task-dropdown-menu absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.14)] border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 z-70 animate-in fade-in zoom-in-95 duration-150 cursor-default text-zinc-900 dark:text-zinc-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> {labels.editTask}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> {labels.duplicate}
                </button>
                <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {labels.delete}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Priority + meta chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wide uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:shadow-none ${priority.chip}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priority.accent}`} aria-hidden />
            {priority.label}
          </span>
          {who && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold max-w-36 truncate ${priority.meta}`}
            >
              <User className="w-2.5 h-2.5 shrink-0 opacity-80" />
              <span className="truncate">
                {labels.for} {who}
              </span>
            </span>
          )}
          {task.commitCode && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-semibold ${priority.meta}`}
            >
              <GitCommitHorizontal className="w-2.5 h-2.5 shrink-0 opacity-80" />
              {task.commitCode.length > 8
                ? task.commitCode.slice(0, 7)
                : task.commitCode}
            </span>
          )}
        </div>

        {hasDates && (
          <div className={`flex items-center gap-2 pt-2 border-t ${priority.divider}`}>
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-md border shrink-0 ${priority.meta}`}
            >
              <Calendar className="w-3 h-3 opacity-90" />
            </span>
            <div className="flex items-center gap-2 text-[10px] font-semibold tabular-nums min-w-0">
              {task.startDate && (
                <span className="truncate text-zinc-600 dark:text-zinc-400">
                  {labels.start} {task.startDate}
                </span>
              )}
              {task.startDate && task.deadline && (
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
              )}
              {task.deadline && (
                <span className="truncate text-zinc-800 dark:text-zinc-200">
                  {labels.deadline} {task.deadline}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(KanbanTaskCard);
