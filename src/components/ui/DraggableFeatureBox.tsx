'use client';

import { useState } from 'react';

interface DraggableFeatureBoxProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  deepDive: string;
}

export default function DraggableFeatureBox({
  icon,
  title,
  desc,
  deepDive,
}: DraggableFeatureBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const currentY = e.clientY;
    const diff = currentY - startY;

    if (!isOpen && diff < 0) {
      setOffsetY(Math.max(diff, -40));

      if (diff < -30) {
        setIsOpen(true);
        setOffsetY(0);
        setIsDragging(false);
      }
    } else if (isOpen && diff > 0) {
      setOffsetY(Math.min(diff, 40));

      if (diff > 30) {
        setIsOpen(false);
        setOffsetY(0);
        setIsDragging(false);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setOffsetY(0);
  };

  return (
    <div
      className={`relative bg-white p-6 sm:p-8 rounded-[2rem] border transition-all duration-500 select-none overflow-hidden group ${
        isOpen
          ? 'border-indigo-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-gradient-to-b from-white to-indigo-50/40'
          : 'border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10 transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      ></div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateY(${offsetY}px)` }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 cursor-grab active:cursor-grabbing transition-colors duration-300 relative z-10 mx-auto sm:mx-0 touch-none shadow-sm border ${
          isOpen
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-200'
            : 'bg-zinc-900 border-zinc-800 text-white'
        }`}
        title="Yukarı veya aşağı sürükleyin"
      >
        {icon}

        {!isOpen && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-zinc-400 animate-bounce flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </div>
        )}

        {isOpen && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-indigo-400 animate-bounce flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        )}
      </div>

      <h4 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">
        {title}
      </h4>
      <p className="text-sm md:text-[15px] text-zinc-500 leading-relaxed font-medium">
        {desc}
      </p>

      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen
            ? 'grid-rows-[1fr] opacity-100 mt-6'
            : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-zinc-50/80 border border-zinc-100 rounded-2xl p-5 relative shadow-inner">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl"></div>

            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md">
                Deep Dive
              </span>
            </div>
            <p className="text-[13px] md:text-[15px] font-medium text-zinc-700 leading-relaxed">
              {deepDive}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
