'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const PROJECT_TOOLBAR_SLOT_ID = 'project-template-toolbar-slot';

/** Mount target in the project Edit/View chrome for template-specific actions. */
export function ProjectToolbarSlot({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      id={PROJECT_TOOLBAR_SLOT_ID}
      className={`min-w-0 flex-1 flex items-center justify-end overflow-visible relative z-30 ${className}`}
    />
  );
}

/**
 * When the project toolbar slot exists, portal children into it.
 * Returns null when no slot (caller should render an in-board fallback).
 */
export function useProjectToolbarPortal(children: ReactNode): ReactNode {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById(PROJECT_TOOLBAR_SLOT_ID);
    setSlot(el);
  }, []);

  if (!slot || typeof document === 'undefined') return null;
  return createPortal(children, slot);
}

/** True when project page exposes the toolbar slot (standalone template view). */
export function useHasProjectToolbarSlot(): boolean {
  const [hasSlot, setHasSlot] = useState(false);

  useEffect(() => {
    setHasSlot(!!document.getElementById(PROJECT_TOOLBAR_SLOT_ID));
  }, []);

  return hasSlot;
}
