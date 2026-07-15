/**
 * Shared visual language for empty-frame canvas blocks.
 * Zinc/neutral surfaces — keep padding/radius close so layout footprints stay stable.
 */

export const blockRoot =
  'relative w-full h-full flex flex-col justify-center group/block';

export const blockFieldStack = 'flex flex-col gap-1.5 w-full';

export const blockLabel =
  'text-[11px] font-semibold text-zinc-500 tracking-wide px-0.5';

const fieldBase =
  'w-full bg-white border px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors outline-none text-zinc-900 placeholder:text-zinc-400';

const fieldIdle = 'border-zinc-200 shadow-sm hover:border-zinc-300';

const fieldActive = 'border-zinc-400 ring-2 ring-zinc-900/10 shadow-sm';

/** Primary interactive field / trigger surface. */
export function blockField(isActive: boolean, extra = ''): string {
  return `${fieldBase} ${isActive ? fieldActive : fieldIdle}${extra ? ` ${extra}` : ''}`;
}

/** Toggle / card-like control (checkbox block). */
export function blockControlSurface(isActive: boolean): string {
  return `flex items-center justify-between w-full bg-white border p-3 rounded-lg transition-colors cursor-pointer ${
    isActive ? fieldActive : fieldIdle
  }`;
}

/** Asset drop zone / media well. */
export function blockAssetWell(
  isActive: boolean,
  isDragging: boolean
): string {
  const base =
    'relative flex-1 w-full flex flex-col items-center justify-center rounded-lg transition-colors overflow-hidden bg-zinc-50 border-2';
  if (isDragging) {
    return `${base} border-zinc-500 border-dashed bg-zinc-100`;
  }
  if (isActive) {
    return `${base} border-zinc-400 border-solid ring-2 ring-zinc-900/10 shadow-sm`;
  }
  return `${base} border-zinc-200 border-dashed hover:border-zinc-300 hover:bg-zinc-100/60`;
}

export function blockSettingsButton(
  isActive: boolean,
  isOpen: boolean
): string {
  return [
    'absolute -right-2.5 -top-4 z-20 flex items-center justify-center w-7 h-7',
    'bg-white border border-zinc-200 rounded-md shadow-sm',
    'hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150',
    isActive ? 'opacity-100' : 'opacity-0 pointer-events-none',
    isOpen
      ? 'text-zinc-900 border-zinc-300 bg-zinc-50'
      : 'text-zinc-400',
  ].join(' ');
}

export const blockSettingsPanel =
  'absolute top-0 -right-4 translate-x-full w-[260px] bg-white border border-zinc-200 rounded-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-3.5 z-[100] animate-in slide-in-from-left-2 fade-in duration-200 cursor-default';

export const blockSettingsHeader =
  'flex justify-between items-center pb-2 border-b border-zinc-100';

export const blockSettingsTitle =
  'text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5';

export const blockSettingsClose =
  'text-zinc-400 hover:text-zinc-800 transition-colors p-1 rounded-md hover:bg-zinc-100';

export const blockSettingsFieldLabel =
  'text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5';

export const blockSettingsInput =
  'w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors placeholder:text-zinc-300';

export const blockSettingsTextarea = `${blockSettingsInput} resize-none`;

export const blockSettingsSelect = `${blockSettingsInput} font-medium cursor-pointer appearance-none`;

export const blockPopover =
  'z-[100] bg-white border border-zinc-200 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95';

export function blockMenuItem(selected: boolean): string {
  return [
    'flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg transition-colors outline-none',
    selected
      ? 'bg-zinc-100 text-zinc-900 font-semibold'
      : 'text-zinc-700 hover:bg-zinc-50 font-medium',
  ].join(' ');
}
