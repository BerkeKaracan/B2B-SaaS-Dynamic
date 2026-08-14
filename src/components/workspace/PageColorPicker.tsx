'use client';

import React from 'react';
import { PAGE_THEME_COLORS, normalizePageColor } from '@/lib/pageTheme';

type PageColorPickerProps = {
  value?: string | null;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export default function PageColorPicker({
  value,
  onChange,
  disabled = false,
}: PageColorPickerProps) {
  const current = normalizePageColor(value);

  return (
    <div
      tabIndex={disabled ? undefined : 0}
      className="relative group flex items-center justify-center focus:outline-none"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={`w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm transition-transform ${
          disabled
            ? 'cursor-default'
            : 'cursor-pointer hover:scale-105 group-focus:ring-2 group-focus:ring-zinc-400/50'
        }`}
        style={{ backgroundColor: current }}
        title={current}
      />

      {!disabled && (
        <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-2 grid grid-cols-5 gap-1.5 w-max">
            {PAGE_THEME_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(color);
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  current === color
                    ? 'border-zinc-900 dark:border-white scale-110 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
