'use client';

import React from 'react';
import { Plus, GripHorizontal, Sparkles } from 'lucide-react';
import type { MindNode, NodeTier } from './types';
import { NODE_DIM } from './types';
import { NODE_UI } from './mindmapStyles';

type MindMapNodeProps = {
  node: MindNode;
  tier: NodeTier;
  isDragging: boolean;
  isEditing: boolean;
  isJustAdded: boolean;
  isReadonly: boolean;
  labels: {
    dragNode: string;
    addNode: string;
    typePlaceholder: string;
  };
  onPointerDown: (e: React.PointerEvent, nodeId: string) => void;
  onStartEdit: (nodeId: string) => void;
  onEndEdit: () => void;
  onChangeText: (nodeId: string, text: string) => void;
  onAddChild: (nodeId: string, x: number, y: number) => void;
};

function MindMapNode({
  node,
  tier,
  isDragging,
  isEditing,
  isJustAdded,
  isReadonly,
  labels,
  onPointerDown,
  onStartEdit,
  onEndEdit,
  onChangeText,
  onAddChild,
}: MindMapNodeProps) {
  const ui = NODE_UI[tier];
  const dim = NODE_DIM[tier];
  const isRoot = tier === 'root';

  return (
    <div
      data-mind-node-id={node.id}
      className={`mind-node absolute flex items-center justify-center group pointer-events-auto ${
        isDragging ? 'z-50' : ''
      } ${isJustAdded ? 'animate-in fade-in zoom-in-95 duration-300' : ''}`}
      style={{ left: node.x, top: node.y, width: dim.w }}
    >
      <div
        className={`relative z-0 w-full rounded-2xl border transition-[transform,box-shadow,border-color] duration-200 flex items-stretch ${ui.shell} ${ui.border} ${
          isDragging
            ? `scale-[1.04] ring-2 ${ui.ring} ${ui.glow}`
            : 'hover:-translate-y-0.5 hover:shadow-md'
        } ${isRoot ? 'min-h-[60px]' : 'min-h-[48px]'}`}
      >
        <div
          className={`shrink-0 w-1.5 self-stretch rounded-l-2xl ${ui.accentBar} ${
            isRoot ? 'opacity-90' : ''
          }`}
        />

        <div className="relative flex-1 px-3.5 py-3 flex items-center justify-center min-w-0 overflow-hidden rounded-r-2xl">
          {isRoot && (
            <Sparkles
              size={12}
              className="absolute left-2.5 top-2 opacity-50 pointer-events-none"
            />
          )}

          {isEditing && !isReadonly ? (
            <input
              autoFocus
              value={node.text}
              onChange={(e) => onChangeText(node.id, e.target.value)}
              onBlur={onEndEdit}
              onKeyDown={(e) => e.key === 'Enter' && onEndEdit()}
              onPointerDown={(e) => e.stopPropagation()}
              className={`w-full bg-transparent text-center font-semibold outline-none placeholder:opacity-50 ${ui.text} ${
                isRoot ? 'text-sm tracking-tight' : 'text-[13px]'
              }`}
              placeholder={labels.typePlaceholder}
            />
          ) : (
            <span
              onClick={() => {
                if (!isReadonly) onStartEdit(node.id);
              }}
              className={`font-semibold text-center truncate w-full select-none ${ui.text} ${
                isReadonly ? 'cursor-default' : 'cursor-text'
              } ${isRoot ? 'text-sm tracking-tight' : 'text-[13px]'}`}
            >
              {node.text}
            </span>
          )}
        </div>
      </div>

      {!isReadonly && (
        <>
          <div
            onPointerDown={(e) => onPointerDown(e, node.id)}
            className={`absolute -top-2.5 right-2 z-30 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-sm ${
              isRoot
                ? 'bg-white/20 border border-white/30 text-white/80 hover:text-white hover:bg-white/30'
                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-zinc-400 hover:text-sky-600 dark:hover:text-sky-300'
            }`}
            title={labels.dragNode}
          >
            <GripHorizontal size={12} />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id, node.x, node.y);
            }}
            className="absolute -right-3 -bottom-3 z-30 bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 border-2 border-white dark:border-zinc-900 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-md shadow-sky-600/30"
            title={labels.addNode}
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </>
      )}
    </div>
  );
}

export default React.memo(MindMapNode);
