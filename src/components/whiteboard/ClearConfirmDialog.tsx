'use client';

import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

type ClearConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ClearConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ClearConfirmDialogProps) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/45 dark:bg-black/65 backdrop-blur-[3px] p-4 animate-in fade-in duration-200"
      onMouseDown={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="whiteboard-clear-title"
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-rose-50 dark:bg-rose-950/45 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2
            id="whiteboard-clear-title"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            {title}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="px-6 py-4 bg-zinc-50/90 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm shadow-rose-600/20 bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
