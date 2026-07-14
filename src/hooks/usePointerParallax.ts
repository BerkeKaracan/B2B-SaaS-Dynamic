'use client';

import { useEffect, useState } from 'react';

/** Soft pointer-driven offset for parallax layers (desktop). */
export function usePointerParallax(strength = 18) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        setOffset({ x: nx * strength, y: ny * strength });
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [strength]);

  return offset;
}
