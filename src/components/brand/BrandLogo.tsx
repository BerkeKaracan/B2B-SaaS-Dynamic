'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND_TAGLINE } from '@/lib/brand';

type BrandSize = 'sm' | 'md' | 'lg';

const MARK_SIZE: Record<BrandSize, string> = {
  sm: 'w-7 h-7 rounded-lg',
  md: 'w-9 h-9 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
};

const WORDMARK_TEXT: Record<BrandSize, string> = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

export type BrandMarkProps = {
  size?: BrandSize;
  /** Light mark for dark backgrounds (auth panels). */
  inverted?: boolean;
  className?: string;
};

/** Clear stroke W over soft workspace blocks — matches /public/logo.svg */
export function BrandMark({
  size = 'md',
  inverted = false,
  className = '',
}: BrandMarkProps) {
  const ink = inverted ? '#09090b' : '#fafafa';
  const block = inverted ? '#d4d4d8' : '#3f3f46';

  return (
    <div
      className={`relative ${MARK_SIZE[size]} flex items-center justify-center shadow-sm border overflow-hidden shrink-0 ${
        inverted ? 'bg-white border-white/80' : 'bg-zinc-950 border-zinc-800'
      } ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft blocks behind */}
        <rect
          x="3.5"
          y="4"
          width="7.5"
          height="5.5"
          rx="1.2"
          fill={block}
          opacity="0.45"
        />
        <rect
          x="21"
          y="3.5"
          width="6.5"
          height="6.5"
          rx="1.3"
          fill={block}
          opacity="0.45"
        />
        <rect
          x="4"
          y="22.5"
          width="6"
          height="4.5"
          rx="1.1"
          fill={block}
          opacity="0.4"
        />
        <rect
          x="22"
          y="22"
          width="5.5"
          height="5.5"
          rx="1.2"
          fill={block}
          opacity="0.4"
        />
        <rect
          x="18.5"
          y="18.5"
          width="4.2"
          height="4.2"
          rx="0.9"
          fill="#38bdf8"
          opacity={inverted ? 0.85 : 0.7}
        />

        {/* Stroke W — peaks at top, clearly not an M */}
        <path
          d="M6 7.5 L10.5 24.5 L16 11 L21.5 24.5 L26 7.5"
          fill="none"
          stroke={ink}
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export type BrandLogoProps = {
  size?: BrandSize;
  inverted?: boolean;
  showWordmark?: boolean;
  showTagline?: boolean;
  /** Defaults to `/`. Pass `false` to render without a link. */
  href?: string | false;
  className?: string;
  markClassName?: string;
  onClick?: () => void;
};

/** Brand mark + WORKSPACE OS wordmark (optional portfolio tagline). */
export default function BrandLogo({
  size = 'md',
  inverted = false,
  showWordmark = true,
  showTagline = false,
  href = '/',
  className = '',
  markClassName = '',
  onClick,
}: BrandLogoProps) {
  const content = (
    <>
      <BrandMark size={size} inverted={inverted} className={markClassName} />
      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <span
            className={`block font-black tracking-tight ${WORDMARK_TEXT[size]} ${
              inverted ? 'text-white' : 'text-zinc-950'
            }`}
          >
            WORKSPACE{' '}
            <span className={inverted ? 'text-sky-300' : 'text-sky-600'}>
              OS
            </span>
          </span>
          {showTagline && (
            <span
              className={`hidden sm:block text-[10px] font-bold uppercase tracking-widest text-zinc-400`}
            >
              {BRAND_TAGLINE}
            </span>
          )}
        </div>
      )}
    </>
  );

  const sharedClass = `inline-flex items-center gap-2.5 shrink-0 group ${className}`;

  if (href === false) {
    return (
      <div className={sharedClass} onClick={onClick}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${sharedClass} active:scale-95 transition-transform`}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}
