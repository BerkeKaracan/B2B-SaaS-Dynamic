'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Animated RAG chat mock — messages enter in sequence with a typing beat.
 */
export default function AiChatMock() {
  const t = useTranslations('LandingPage');
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(3);
      return;
    }

    const timers = [
      window.setTimeout(() => setStep(1), 400),
      window.setTimeout(() => setStep(2), 1100),
      window.setTimeout(() => setStep(3), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex-1 w-full bg-zinc-950 rounded-3xl md:rounded-4xl p-2 md:p-3 shadow-2xl lp-ai-frame">
      <div className="bg-zinc-900 rounded-[20px] md:rounded-3xl border border-zinc-800 p-4 md:p-6 flex flex-col h-auto md:h-[400px] overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(14,165,233,0.10),_transparent_45%)]" />

        <div className="relative flex items-center gap-2 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-zinc-800/80">
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            RAG_Engine_Active
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
            </span>
          </span>
        </div>

        <div className="relative flex flex-col gap-4 md:gap-5 flex-1 overflow-hidden font-sans">
          {step >= 1 && (
            <div className="self-end bg-gradient-to-br from-teal-500 to-sky-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-2xl rounded-tr-sm text-xs md:text-[13px] shadow-sm max-w-[85%] font-medium lp-chat-in-right">
              {t('ai.chatQ')}
            </div>
          )}

          {step === 2 && (
            <div className="self-start flex gap-2 md:gap-3 max-w-[95%] lp-chat-in-left">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-sky-500 shrink-0 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="bg-zinc-800 text-zinc-400 px-4 py-3 rounded-2xl rounded-tl-sm border border-zinc-700/50 flex items-center gap-1.5">
                <span className="lp-typing-dot" />
                <span className="lp-typing-dot" style={{ animationDelay: '0.15s' }} />
                <span className="lp-typing-dot" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}

          {step >= 3 && (
            <div className="self-start flex gap-2 md:gap-3 max-w-[95%] md:max-w-[90%] lp-chat-in-left">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-sky-500 shrink-0 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="bg-zinc-800 text-zinc-300 px-3 md:px-4 py-3 rounded-2xl rounded-tl-sm text-xs md:text-[13px] shadow-sm border border-zinc-700/50 leading-relaxed">
                {t('ai.chatA1')}
                <br />
                <br />
                <span className="text-white font-bold">{t('ai.chatA2')}</span>
                <br />
                <span className="text-white font-bold">{t('ai.chatA3')}</span>
                <br />
                <span className="text-white font-bold">{t('ai.chatA4')}</span>
                <br />
                <br />
                {t('ai.chatA5')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
