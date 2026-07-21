'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { GripHorizontal, Trash2 } from 'lucide-react';
import type { ActiveTool, FloatingText } from './types';

type FloatingTextNodeProps = {
  projectId: string;
  text: FloatingText;
  activeTool: ActiveTool;
  isDragging: boolean;
  isReadonly: boolean;
  dragTitle: string;
  dragHintTitle: string;
  deleteTitle: string;
  placeholder: string;
  onStartDrag: (e: ReactPointerEvent, textItem: FloatingText) => void;
  onChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
};

export default function FloatingTextNode({
  projectId,
  text,
  activeTool,
  isDragging,
  isReadonly,
  dragTitle,
  dragHintTitle,
  deleteTitle,
  placeholder,
  onStartDrag,
  onChange,
  onDelete,
}: FloatingTextNodeProps) {
  const chromeVisible = activeTool === 'hand' || activeTool === 'text';

  return (
    <div
      id={`text-node-${projectId}-${text.id}`}
      tabIndex={0}
      className="absolute text-block-wrapper flex flex-col group outline-none"
      style={{
        left: text.x,
        top: text.y,
        pointerEvents: 'auto',
        zIndex: isDragging ? 50 : 20,
      }}
      onKeyDown={(e) => {
        if (
          (e.key === 'Delete' || e.key === 'Backspace') &&
          document.activeElement === e.currentTarget
        ) {
          e.preventDefault();
          if (!isReadonly) onDelete(text.id);
        }
      }}
    >
      <div
        className={`absolute -top-12 left-0 ${
          chromeVisible
            ? 'opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0'
            : 'opacity-0 pointer-events-none'
        } transition-all duration-200 ease-out z-50 after:absolute after:content-[''] after:w-full after:h-8 after:-bottom-8 after:left-0`}
      >
        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-700 shadow-[0_10px_28px_-14px_rgba(24,24,27,0.45)]">
          <div
            onPointerDown={(e) => onStartDrag(e, text)}
            className={`p-1.5 rounded-full cursor-grab active:cursor-grabbing hover:bg-sky-50 dark:hover:bg-sky-950/40 text-zinc-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors ${
              activeTool !== 'hand' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={activeTool === 'hand' ? dragTitle : dragHintTitle}
          >
            <GripHorizontal size={14} />
          </div>

          <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-700" />

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (!isReadonly) onDelete(text.id);
            }}
            className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            title={deleteTitle}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div
        className={`relative rounded-2xl transition-shadow duration-200 ${
          isDragging
            ? 'shadow-[0_16px_40px_-18px_rgba(14,165,233,0.45)]'
            : 'shadow-[0_8px_24px_-16px_rgba(24,24,27,0.28)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.55)]'
        }`}
      >
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full opacity-80"
          style={{ backgroundColor: text.color }}
          aria-hidden
        />
        <textarea
          value={text.content}
          onChange={(e) => {
            onChange(text.id, e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Delete' && text.content === '') {
              e.preventDefault();
              if (!isReadonly) onDelete(text.id);
            }
            if (e.key === 'Escape') {
              e.currentTarget.blur();
            }
          }}
          autoFocus={text.content === ''}
          onFocus={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          readOnly={isReadonly}
          className="bg-white/88 dark:bg-zinc-900/88 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-sky-300/70 dark:hover:border-sky-700/60 focus:border-sky-400 dark:focus:border-sky-600 focus:ring-2 focus:ring-sky-400/20 dark:focus:ring-sky-500/15 rounded-2xl outline-none resize-none overflow-hidden pl-4 pr-3 py-3 transition-colors allow-text-select backdrop-blur-[2px]"
          style={{
            color: text.color,
            fontSize: `${text.size}px`,
            fontFamily: text.font,
            lineHeight: '1.25',
            minWidth: '120px',
            minHeight: '44px',
          }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
