/** Shared class names for auth form controls (login / register / forgot / onboarding). */

export const authLabel =
  'block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-2';

export const authInput =
  'w-full px-4 py-3.5 rounded-xl bg-white/80 border border-zinc-200/90 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 outline-none transition-all duration-200 focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10 focus:bg-white';

export const authInputWithIcon = `${authInput} pl-11`;

export const authPrimaryBtn =
  'w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 text-white py-3.5 text-sm font-semibold tracking-tight transition-all duration-200 hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100';

export const authSecondaryBtn =
  'w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-zinc-800 py-3 text-sm font-semibold transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98]';

export const authOAuthBtn =
  'flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-3 py-3 text-[13px] font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]';

export const authError =
  'mb-5 flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-[13px] font-medium text-red-700';

export const authLink =
  'font-semibold text-sky-700 hover:text-sky-900 underline-offset-4 hover:underline transition-colors';
