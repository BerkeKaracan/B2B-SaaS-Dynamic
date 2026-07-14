'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }

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
  }, [once]);

  return (
    <div
      ref={ref}
      className={`lp-reveal lp-reveal--${variant} ${inView ? 'lp-reveal--in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
