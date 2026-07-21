'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import KanbanTaskCard, { type KanbanTaskCardLabels } from './KanbanTaskCard';
import { hexWithAlpha } from './kanbanStyles';
import type { Task, TaskStatus } from './types';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  isReadonly: boolean;
  openTaskMenu: string | null;
  labels: KanbanTaskCardLabels & {
    addTask: string;
    emptyColumn: string;
    emptyColumnHint: string;
  };
  onAddTask: (status: TaskStatus) => void;
  onToggleMenu: (taskId: string) => void;
  onCloseMenu: () => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (taskId: string, title: string) => void;
}

function KanbanColumn({
  id,
  title,
  color,
  tasks,
  isReadonly,
  openTaskMenu,
  labels,
  onAddTask,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDuplicate,
  onDelete,
}: KanbanColumnProps) {
  const wash = hexWithAlpha(color, 0.12);
  const washStrong = hexWithAlpha(color, 0.2);
  const washSoft = hexWithAlpha(color, 0.07);
  const borderTint = hexWithAlpha(color, 0.32);
  const badgeBg = hexWithAlpha(color, 0.18);
  const badgeBorder = hexWithAlpha(color, 0.4);

  return (
    <div
      className="relative w-[85vw] sm:w-[21.5rem] shrink-0 flex flex-col h-full max-h-full rounded-2xl border overflow-hidden transition-colors duration-200 bg-zinc-50 dark:bg-zinc-950/50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]"
      style={{ borderColor: borderTint }}
    >
      {/* Column body tint wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-80"
        style={{
          background: `linear-gradient(180deg, ${washStrong} 0%, ${washSoft} 32%, transparent 62%)`,
        }}
        aria-hidden
      />

      {/* Column color rail */}
      <div
        className="relative h-1.5 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${hexWithAlpha(color, 0.8)} 55%, ${hexWithAlpha(color, 0.2)} 100%)`,
        }}
        aria-hidden
      />

      <div
        className="relative px-3.5 py-3 flex items-center justify-between gap-2 shrink-0 border-b backdrop-blur-[2px]"
        style={{
          borderColor: borderTint,
          background: `linear-gradient(90deg, ${washStrong} 0%, ${hexWithAlpha(color, 0.06)} 100%)`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-900"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 0 3px ${hexWithAlpha(color, 0.25)}`,
            }}
            aria-hidden
          />
          <h3 className="font-bold tracking-wide text-[12px] truncate uppercase text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
        </div>
        <span
          className="min-w-6 h-6 px-1.5 inline-flex items-center justify-center rounded-lg text-[11px] font-bold tabular-nums shrink-0 border"
          style={{
            backgroundColor: badgeBg,
            borderColor: badgeBorder,
            color,
          }}
        >
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            className={`relative flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 custom-scrollbar transition-[background-color,box-shadow] duration-200 min-h-40 ${
              snapshot.isDraggingOver
                ? 'ring-1 ring-inset ring-sky-400/50 dark:ring-sky-600/45'
                : ''
            }`}
            style={{
              background: snapshot.isDraggingOver
                ? `linear-gradient(180deg, ${hexWithAlpha(color, 0.16)} 0%, ${hexWithAlpha(color, 0.05)} 100%)`
                : undefined,
            }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-12 px-4 text-center pointer-events-none min-h-36">
                <div
                  className="w-11 h-11 rounded-xl border border-dashed flex items-center justify-center"
                  style={{
                    borderColor: badgeBorder,
                    background: `linear-gradient(145deg, ${washStrong}, ${hexWithAlpha(color, 0.04)})`,
                    boxShadow: `inset 0 0 0 1px ${hexWithAlpha(color, 0.12)}`,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 0 4px ${hexWithAlpha(color, 0.22)}`,
                    }}
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color }}>
                    {labels.emptyColumn}
                  </p>
                  <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {labels.emptyColumnHint}
                  </p>
                </div>
              </div>
            )}

            {tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
                isDragDisabled={isReadonly}
              >
                {(dragProvided, dragSnapshot) => (
                  <KanbanTaskCard
                    task={task}
                    provided={dragProvided}
                    snapshot={dragSnapshot}
                    isMenuOpen={openTaskMenu === task.id}
                    labels={labels}
                    onOpen={() => onEdit(task)}
                    onToggleMenu={() => onToggleMenu(task.id)}
                    onEdit={() => {
                      onCloseMenu();
                      onEdit(task);
                    }}
                    onDuplicate={() => onDuplicate(task)}
                    onDelete={() => onDelete(task.id, task.title)}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {!isReadonly && (
              <button
                type="button"
                onClick={() => onAddTask(id)}
                className="mt-0.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border border-dashed group/add bg-white/60 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400"
                style={{ borderColor: badgeBorder }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = wash;
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.color = color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.borderColor = badgeBorder;
                  e.currentTarget.style.color = '';
                }}
              >
                <Plus className="w-3.5 h-3.5 opacity-70 group-hover/add:opacity-100 transition-opacity" />
                {labels.addTask.replace(/^\+\s*/, '')}
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default React.memo(KanbanColumn);
