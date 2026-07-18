'use client';

import React, { useSyncExternalStore, type ReactNode } from 'react';
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

const subscribeNoop = () => () => {};

function getToolbarSlot(): HTMLElement | null {
  return document.getElementById(PROJECT_TOOLBAR_SLOT_ID);
}

/**
 * When the project toolbar slot exists, portal children into it.
 * Returns null when no slot (caller should render an in-board fallback).
 */
export function useProjectToolbarPortal(children: ReactNode): ReactNode {
  const slot = useSyncExternalStore(subscribeNoop, getToolbarSlot, () => null);
  if (!slot) return null;
  return createPortal(children, slot);
}

/** True when project page exposes the toolbar slot (standalone template view). */
export function useHasProjectToolbarSlot(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => !!getToolbarSlot(),
    () => false
  );
}
