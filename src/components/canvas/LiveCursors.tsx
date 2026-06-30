'use client';
import React from 'react';
import { CursorState } from '@/hooks/useCanvasCollaboration';

interface LiveCursorsProps {
  cursors: Record<string, CursorState>;
  currentUserKey: string;
}

export function LiveCursors({ cursors, currentUserKey }: LiveCursorsProps) {
  if (Object.keys(cursors).length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[100] overflow-visible">
      {Object.entries(cursors).map(([key, data]) => {
        if (key === currentUserKey || !data.cursor) return null;

        return (
          <div
            key={key}
            className="absolute top-0 left-0 transition-all duration-100 ease-linear pointer-events-none flex flex-col items-start"
            style={{
              transform: `translate(${data.cursor.x}px, ${data.cursor.y}px)`,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={data.color || '#6366f1'}
              stroke="white"
              strokeWidth="2"
              className="drop-shadow-md -translate-x-1 -translate-y-1"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>

            <div
              className="px-2 py-0.5 mt-1 text-[10px] font-bold text-white whitespace-nowrap rounded-md shadow-md animate-in fade-in duration-200"
              style={{ backgroundColor: data.color || '#6366f1' }}
            >
              {data.user}
            </div>
          </div>
        );
      })}
    </div>
  );
}
