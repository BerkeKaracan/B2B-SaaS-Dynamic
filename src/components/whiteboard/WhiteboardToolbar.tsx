'use client';

import {
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Type,
  Image as ImageIcon,
  Link2,
  Blocks,
  Trash2,
} from 'lucide-react';
import type { ActiveTool } from './types';
import { COLORS, FONTS, SIZES } from './types';
import { TOOL_ACTIVE, TOOL_IDLE } from './whiteboardStyles';

type Labels = {
  pan: string;
  pen: string;
  highlighter: string;
  eraser: string;
  text: string;
  font: string;
  size: string;
  thickness: string;
  eraserSize: string;
  panHint: string;
  clear: string;
  image: string;
  widget: string;
  link: string;
  tools: string;
  ink: string;
};

type WhiteboardToolbarProps = {
  activeTool: ActiveTool;
  activeColor: string;
  strokeWidth: number;
  activeFont: string;
  activeFontSize: number;
  isReadonly: boolean;
  isBoardEmpty: boolean;
  labels: Labels;
  onToolChange: (tool: ActiveTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onFontChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onClear: () => void;
  onImageClick: () => void;
  onWidgetClick: () => void;
  onLinkClick: () => void;
};

function ToolButton({
  active,
  tool,
  title,
  shortcut,
  onClick,
  children,
}: {
  active: boolean;
  tool: ActiveTool;
  title: string;
  shortcut?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
        active ? TOOL_ACTIVE[tool].btn : TOOL_IDLE
      }`}
    >
      {children}
      {shortcut ? (
        <span
          className={`hidden xl:inline text-[10px] font-bold tracking-wide ${
            active ? 'opacity-70' : 'opacity-50'
          }`}
        >
          {shortcut}
        </span>
      ) : null}
    </button>
  );
}

function ColorWells({
  activeColor,
  onColorChange,
}: {
  activeColor: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {COLORS.map((color) => {
        const selected = activeColor === color;
        return (
          <button
            type="button"
            key={color}
            onClick={() => onColorChange(color)}
            aria-label={color}
            className={`relative w-6 h-6 rounded-full transition-transform duration-150 ${
              selected ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          >
            <span
              className={`absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 transition-opacity ${
                selected
                  ? 'opacity-100 ring-sky-500 dark:ring-sky-400'
                  : 'opacity-0 ring-transparent'
              }`}
            />
            {color === '#ffffff' ? (
              <span className="absolute inset-0 rounded-full border border-zinc-300 dark:border-zinc-600 pointer-events-none" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function StrokePreview({
  width,
  color,
  highlighter,
}: {
  width: number;
  color: string;
  highlighter?: boolean;
}) {
  const size = Math.max(4, Math.min(22, width + (highlighter ? 4 : 0)));
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/70">
      <span
        className="rounded-full block"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          opacity: highlighter ? 0.45 : 1,
        }}
      />
    </div>
  );
}

export default function WhiteboardToolbar({
  activeTool,
  activeColor,
  strokeWidth,
  activeFont,
  activeFontSize,
  isReadonly,
  isBoardEmpty,
  labels,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onFontChange,
  onFontSizeChange,
  onClear,
  onImageClick,
  onWidgetClick,
  onLinkClick,
}: WhiteboardToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 min-w-0 w-full justify-end">
      {/* Tool rail */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/70 shrink-0 shadow-sm">
        <span className="hidden 2xl:inline px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {labels.tools}
        </span>
        <ToolButton
          active={activeTool === 'hand'}
          tool="hand"
          title={labels.pan}
          shortcut="H"
          onClick={() => onToolChange('hand')}
        >
          <Hand size={16} strokeWidth={2.25} />
        </ToolButton>

        <div className="w-px h-5 bg-zinc-300/80 dark:bg-zinc-600 mx-0.5" />

        <ToolButton
          active={activeTool === 'pen'}
          tool="pen"
          title={labels.pen}
          shortcut="P"
          onClick={() => onToolChange('pen')}
        >
          <Pen size={16} strokeWidth={2.25} />
        </ToolButton>

        <ToolButton
          active={activeTool === 'highlighter'}
          tool="highlighter"
          title={labels.highlighter}
          onClick={() => onToolChange('highlighter')}
        >
          <Highlighter size={16} strokeWidth={2.25} />
        </ToolButton>

        <ToolButton
          active={activeTool === 'eraser'}
          tool="eraser"
          title={labels.eraser}
          shortcut="E"
          onClick={() => onToolChange('eraser')}
        >
          <Eraser size={16} strokeWidth={2.25} />
        </ToolButton>

        <div className="w-px h-5 bg-zinc-300/80 dark:bg-zinc-600 mx-0.5" />

        <ToolButton
          active={activeTool === 'text'}
          tool="text"
          title={labels.text}
          shortcut="T"
          onClick={() => onToolChange('text')}
        >
          <Type size={16} strokeWidth={2.25} />
        </ToolButton>
      </div>

      {/* Context options */}
      <div className="px-1.5 flex items-center justify-start gap-2 min-w-0 overflow-x-auto custom-scrollbar">
        {activeTool === 'text' ? (
          <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200 px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <div className="flex flex-col px-1">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em] mb-0.5">
                {labels.font}
              </span>
              <select
                value={activeFont}
                onChange={(e) => onFontChange(e.target.value)}
                className="bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {FONTS.map((font) => (
                  <option
                    key={font}
                    value={font}
                    style={{ fontFamily: font }}
                    className="dark:bg-zinc-800"
                  >
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex flex-col px-1">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em] mb-0.5">
                {labels.size}
              </span>
              <select
                value={activeFontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {SIZES.map((size) => (
                  <option key={size} value={size} className="dark:bg-zinc-800">
                    {size}px
                  </option>
                ))}
              </select>
            </div>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex flex-col gap-1 px-0.5">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em]">
                {labels.ink}
              </span>
              <ColorWells
                activeColor={activeColor}
                onColorChange={onColorChange}
              />
            </div>
          </div>
        ) : activeTool === 'pen' || activeTool === 'highlighter' ? (
          <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200 px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <StrokePreview
              width={strokeWidth}
              color={activeColor}
              highlighter={activeTool === 'highlighter'}
            />
            <div className="flex flex-col gap-1 min-w-[7.5rem]">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em]">
                {labels.thickness}
              </span>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                className="w-28 accent-sky-600 dark:accent-sky-400"
              />
            </div>
            <div className="w-px h-7 bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em]">
                {labels.ink}
              </span>
              <ColorWells
                activeColor={activeColor}
                onColorChange={onColorChange}
              />
            </div>
          </div>
        ) : activeTool === 'eraser' ? (
          <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200 px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <StrokePreview width={Math.min(20, strokeWidth / 2)} color="#a1a1aa" />
            <div className="flex flex-col gap-1 min-w-[7.5rem]">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em]">
                {labels.eraserSize}
              </span>
              <input
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                className="w-28 accent-emerald-600 dark:accent-emerald-400"
              />
            </div>
          </div>
        ) : (
          <span className="hidden md:inline text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wide truncate px-1">
            {labels.panHint}
          </span>
        )}
      </div>

      {/* Modules + clear */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-900/70 shrink-0">
        <button
          type="button"
          onClick={onImageClick}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ImageIcon size={14} /> {labels.image}
        </button>
        <button
          type="button"
          onClick={onWidgetClick}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Blocks size={14} /> {labels.widget}
        </button>
        <button
          type="button"
          onClick={onLinkClick}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Link2 size={14} /> {labels.link}
        </button>
        <div className="hidden sm:block w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
        <button
          type="button"
          onClick={onClear}
          disabled={isReadonly || isBoardEmpty}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Trash2 size={14} />
          <span className="hidden lg:inline">{labels.clear}</span>
        </button>
      </div>
    </div>
  );
}
