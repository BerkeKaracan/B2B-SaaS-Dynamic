import { useEffect } from 'react';

/** Blur focused editable controls (inputs/textarea/select) in the document. */
export function blurActiveEditable(
  root: ParentNode | null | undefined = typeof document !== 'undefined'
    ? document
    : null
): void {
  if (!root || typeof document === 'undefined') return;
  const active = document.activeElement as HTMLElement | null;
  if (!active) return;
  if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
  if (root !== document && !root.contains(active)) return;
  active.blur();
}

/** Close a settings panel and blur any focused field. */
export function closeSettingsPanel(setOpen: (open: boolean) => void): void {
  blurActiveEditable();
  setOpen(false);
}

/**
 * When a canvas block loses selection (`isActive` → false), close local UI
 * during render (React-approved prop→state sync) and blur any focused field.
 * Avoids `setState` inside `useEffect` (react-hooks/set-state-in-effect).
 */
export function useCloseOnInactive(
  isActive: boolean,
  isOpen: boolean,
  setOpen: (open: boolean) => void
): void {
  if (!isActive && isOpen) {
    setOpen(false);
  }

  useEffect(() => {
    if (!isActive) blurActiveEditable();
  }, [isActive]);
}
