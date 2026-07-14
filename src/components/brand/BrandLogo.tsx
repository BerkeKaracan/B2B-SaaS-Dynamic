'use client';

import React from 'react';
import Link from 'next/link';

type BrandSize = 'sm' | 'md' | 'lg';

const MARK_SIZE: Record<BrandSize, string> = {
  sm: 'w-7 h-7 rounded-lg',
  md: 'w-9 h-9 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
};

const MARK_TEXT: Record<BrandSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-base',
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

/** Symbol only — sky-tinted B2 mark from the landing navbar. */
export function BrandMark({
  size = 'md',
  inverted = false,
  className = '',
}: BrandMarkProps) {
  return (
    <div
      className={`relative ${MARK_SIZE[size]} flex items-center justify-center shadow-sm border overflow-hidden shrink-0 ${
        inverted
          ? 'bg-white border-white/80'
          : 'bg-zinc-950 border-zinc-800'
      } ${className}`}
    >
      <div
        className={`absolute inset-0 opacity-80 ${
          inverted
            ? 'bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.45),transparent_55%)]'
            : 'bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_55%)]'
        }`}
      />
      <span
        className={`relative font-black font-mono tracking-tighter ${MARK_TEXT[size]} ${
          inverted ? 'text-zinc-950' : 'text-white'
        }`}
      >
        B2
      </span>
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

/** Brand mark + optional wordmark / “Workspace OS” tagline. */
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
            SaaS Engine
          </span>
          {showTagline && (
            <span
              className={`hidden sm:block text-[10px] font-bold uppercase tracking-widest ${
                inverted ? 'text-sky-300/90' : 'text-sky-600/80'
              }`}
            >
              Workspace OS
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
