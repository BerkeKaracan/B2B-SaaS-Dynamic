'use client';

import React from 'react';
import { BrandMark } from '@/components/brand/BrandLogo';

type LoadSize = 'sm' | 'md' | 'lg';

const RING_BOX: Record<LoadSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-[3.75rem] h-[3.75rem]',
  lg: 'w-[4.75rem] h-[4.75rem]',
};

const MARK_SIZE: Record<LoadSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export type LoadingMarkProps = {
  size?: LoadSize;
  className?: string;
  /** Soft sky wash behind the mark (default on). */
  glow?: boolean;
};

/** Brand mark with dual orbit rings ÔÇö primary ambient loader. */
export function LoadingMark({
  size = 'md',
  className = '',
  glow = true,
}: LoadingMarkProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${RING_BOX[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      {glow ? (
        <div className="pointer-events-none absolute inset-0 rounded-full bg-sky-400/20 blur-xl ws-load-glow" />
      ) : null}
      <div className="absolute inset-0 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 ws-load-ring" />
      <div className="absolute inset-[3px] rounded-full border border-transparent border-t-sky-500 border-r-sky-400/40 ws-load-spin" />
      <div className="absolute inset-[7px] rounded-full border border-transparent border-b-emerald-500/70 border-l-emerald-400/30 ws-load-spin-rev" />
      <div className="relative z-10 ws-load-mark">
        <BrandMark size={MARK_SIZE[size]} />
      </div>
    </div>
  );
}

export type LoadingSpinnerProps = {
  size?: LoadSize;
  text?: string;
  className?: string;
  /** Prefer brand mark (default) or compact ring for tight UI. */
  variant?: 'mark' | 'ring';
};

export function LoadingSpinner({
  size = 'md',
  text,
  className = '',
  variant = 'mark',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}
    >
      {variant === 'mark' ? (
        <LoadingMark size={size} />
      ) : (
        <InlineRing size={size} />
      )}
      {text ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 ws-load-label">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function InlineRing({ size }: { size: LoadSize }) {
  const box =
    size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-8 h-8 border-[3px]' : 'w-6 h-6 border-2';
  return (
    <span
      className={`${box} rounded-full border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white ws-load-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

export type LoadingScreenProps = {
  label?: string;
  className?: string;
  /** Full viewport vs fill parent. */
  fullScreen?: boolean;
};

/** Auth / dashboard / canvas full-area loader. */
export function LoadingScreen({
  label = 'Loading',
  className = '',
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[#F7F9FB] dark:bg-zinc-950 ${
        fullScreen ? 'h-screen w-full min-h-[100dvh]' : 'absolute inset-0 z-50'
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_75%,rgba(16,185,129,0.08),transparent_45%)]" />
      <div className="relative z-10 flex flex-col items-center gap-5 ws-load-enter">
        <LoadingMark size="lg" />
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          <LoadingDots />
        </div>
      </div>
    </div>
  );
}

export type LoadingDotsProps = {
  className?: string;
  tone?: 'neutral' | 'sky' | 'indigo' | 'teal';
};

/** Chat / thinking indicator. */
export function LoadingDots({
  className = '',
  tone = 'neutral',
}: LoadingDotsProps) {
  const dot =
    tone === 'sky'
      ? 'bg-sky-500'
      : tone === 'indigo'
        ? 'bg-indigo-500'
        : tone === 'teal'
          ? 'bg-teal-500'
          : 'bg-zinc-400 dark:bg-zinc-500';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className={`ws-load-dot ${dot}`} />
      <span className={`ws-load-dot ws-load-dot-d2 ${dot}`} />
      <span className={`ws-load-dot ws-load-dot-d3 ${dot}`} />
    </span>
  );
}

export type LoadingSkeletonProps = {
  className?: string;
  /** Number of shimmer cards in a grid. */
  count?: number;
  /** Card height class */
  heightClassName?: string;
  /** Tailwind grid cols for large screens */
  colsClassName?: string;
};

/** Shimmer grid for list/gallery loading. */
export function LoadingSkeletonGrid({
  count = 8,
  className = '',
  heightClassName = 'h-64',
  colsClassName = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}: LoadingSkeletonProps) {
  return (
    <div className={`grid ${colsClassName} gap-5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 ${heightClassName} ws-load-enter`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="absolute inset-0 ws-load-shimmer" />
          <div className="absolute top-0 inset-x-0 h-24 bg-zinc-100/80 dark:bg-zinc-800/50" />
          <div className="absolute bottom-5 left-4 right-4 space-y-2">
            <div className="h-3 w-2/5 rounded-full bg-zinc-200/90 dark:bg-zinc-700" />
            <div className="h-2.5 w-4/5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2.5 w-3/5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
