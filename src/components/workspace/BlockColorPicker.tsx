'use client';

import React from 'react';
import {
  BLOCK_BACKGROUND_DEFAULT,
  BLOCK_BACKGROUND_TRANSPARENT,
  BLOCK_THEME_COLORS,
  normalizeBlockBackground,
} from '@/lib/blockTheme';

const CHECKER: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
};

type BlockColorPickerProps = {
  value?: string | null;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export default function BlockColorPicker({
  value,
  onChange,
  disabled = false,
}: BlockColorPickerProps) {
  const current = normalizeBlockBackground(value);
  const triggerIsClear = current === BLOCK_BACKGROUND_TRANSPARENT;

  return (
    <div
      tabIndex={disabled ? undefined : 0}
      className="relative group flex items-center justify-center focus:outline-none"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full border shadow-md transition-transform ${
          disabled
            ? 'cursor-default border-zinc-200 dark:border-zinc-700'
            : 'cursor-pointer border-zinc-200 dark:border-zinc-700 hover:scale-105 group-focus:ring-2 group-focus:ring-zinc-400/50'
        }`}
        style={
          triggerIsClear
            ? CHECKER
            : { backgroundColor: current === BLOCK_BACKGROUND_DEFAULT ? '#ffffff' : current }
        }
        title={current === BLOCK_BACKGROUND_DEFAULT ? 'Block color' : current}
      />

      {!disabled && (
        <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-2 grid grid-cols-6 gap-1.5 w-max">
            {BLOCK_THEME_COLORS.map((color) => {
              const selected = current === color;
              const isClear = color === BLOCK_BACKGROUND_TRANSPARENT;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(color);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    selected
                      ? 'border-zinc-900 dark:border-white scale-110 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                  style={isClear ? CHECKER : { backgroundColor: color }}
                  title={color}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
