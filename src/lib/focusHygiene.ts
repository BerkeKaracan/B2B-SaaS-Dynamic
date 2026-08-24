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
