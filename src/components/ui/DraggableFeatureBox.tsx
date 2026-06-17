"use client";

import { useState } from "react";

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
      className={`bg-white p-6 rounded-3xl border shadow-sm transition-all duration-500 select-none ${
        isOpen ? "border-indigo-300 shadow-xl" : "border-zinc-200"
      }`}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateY(${offsetY}px)` }}
        className="w-12 h-12 bg-zinc-950 text-white rounded-2xl flex items-center justify-center mb-5 cursor-grab active:cursor-grabbing transition-transform duration-75 relative z-10 mx-auto sm:mx-0 touch-none"
        title="Yukarı doğru çekerek açın"
      >
        {icon}
        {!isOpen && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-indigo-500/70 animate-bounce flex flex-col items-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </div>
        )}
      </div>

      <h4 className="text-lg font-bold text-zinc-900 mb-2">{title}</h4>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>

      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-xs font-semibold text-zinc-700 leading-relaxed flex gap-2">
              <span className="text-indigo-600 font-black tracking-widest uppercase">
                Deep Dive:
              </span>
              {deepDive}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
