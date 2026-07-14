'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fade-up' | 'fade' | 'scale' | 'slide-left' | 'slide-right';
  once?: boolean;
};

export function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'fade-up',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const visible = prefersReducedMotion || inView;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={`lp-reveal lp-reveal--${variant} ${visible ? 'lp-reveal--in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
