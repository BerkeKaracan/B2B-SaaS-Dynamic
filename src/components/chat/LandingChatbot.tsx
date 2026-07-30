'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Send, Bot, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getApiBaseUrl } from '@/lib/apiBase';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { LoadingDots } from '@/components/ui/loading';

/** Landing marketing chatbot only — not the workspace AiChatbot. */
const FREE_QUESTION_LIMIT = 10;
const GUEST_ID_KEY = 'wsos-public-ai-guest-id';
const LIMIT_REACHED_KEY = 'wsos-public-ai-limit-reached';
const QUESTION_COUNT_KEY = 'wsos-public-ai-question-count';

function ensureGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id || id.length < 8) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return `ephemeral-${Date.now()}`;
  }
}

function readStoredLimitReached(): boolean {
  try {
    if (localStorage.getItem(LIMIT_REACHED_KEY) === '1') return true;
    const count = Number(localStorage.getItem(QUESTION_COUNT_KEY) || '0');
    return Number.isFinite(count) && count >= FREE_QUESTION_LIMIT;
  } catch {
    return false;
  }
}

function readQuestionCount(): number {
  try {
    const count = Number(localStorage.getItem(QUESTION_COUNT_KEY) || '0');
    return Number.isFinite(count) && count > 0 ? count : 0;
  } catch {
    return 0;
  }
}

function persistLimitReached() {
  try {
    localStorage.setItem(LIMIT_REACHED_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

function persistQuestionCount(count: number) {
  try {
    localStorage.setItem(QUESTION_COUNT_KEY, String(count));
    if (count >= FREE_QUESTION_LIMIT) {
      localStorage.setItem(LIMIT_REACHED_KEY, '1');
    }
  } catch {
    /* ignore */
  }
}

function subscribeStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

export default function LandingChatbot() {
  const [messages, setMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [localLimitLocked, setLocalLimitLocked] = useState(false);
  const [localQuestionCount, setLocalQuestionCount] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const guestIdRef = useRef('');

  const storedLimitReached = useSyncExternalStore(
    subscribeStorage,
    readStoredLimitReached,
    () => false
  );
  const storedQuestionCount = useSyncExternalStore(
    subscribeStorage,
    readQuestionCount,
    () => 0
  );

  const questionCount = localQuestionCount ?? storedQuestionCount;
  const isLimitReached =
    localLimitLocked ||
    storedLimitReached ||
    questionCount >= FREE_QUESTION_LIMIT;

  const t = useTranslations('chatbot');

  const markLimitReached = useCallback(() => {
    setLocalLimitLocked(true);
    persistLimitReached();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLimitReached || isLoading) return;
    if (questionCount >= FREE_QUESTION_LIMIT) {
      markLimitReached();
      return;
    }

    if (!guestIdRef.current) {
      guestIdRef.current = ensureGuestId();
    }
    const guestId = guestIdRef.current;

    const userMessage = input;
    const chatHistory = [...messages];

    setMessages([...chatHistory, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/public-ai/public-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(guestId ? { 'X-WSOS-Guest-Id': guestId } : {}),
          },
          body: JSON.stringify({
            message: userMessage,
            history: chatHistory,
          }),
        }
      );

      if (response.status === 429) {
        markLimitReached();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();
      const nextCount = questionCount + 1;
      setLocalQuestionCount(nextCount);
      persistQuestionCount(nextCount);
      if (nextCount >= FREE_QUESTION_LIMIT) {
        setLocalLimitLocked(true);
      }
      setMessages((prev) => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      console.error('Chatbot API Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: t('error'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-[2rem] border border-zinc-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row group">
        <div className="w-full md:w-5/12 bg-zinc-950 p-8 md:p-10 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.15),transparent_50%)]"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-500">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight leading-tight">
              {t('title')}
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">
              {t('desc')}
            </p>
            <div className="mt-auto pt-6 border-t border-zinc-800/50">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                {t('poweredBy')}
              </span>
              <div className="font-bold flex items-center gap-2 text-zinc-200">
                <Bot className="w-4 h-4 text-indigo-400" />
                {t('engine')}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-7/12 flex flex-col h-[550px] bg-[#fafafb] relative">
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-center px-6">
                <p className="text-zinc-500 font-medium text-sm leading-relaxed bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm">
                  {t('emptyState')}
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-[13px] md:text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 text-white rounded-br-sm font-medium'
                      : 'bg-white border border-zinc-200/80 text-zinc-700 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'ai' ? (
                    <MarkdownContent variant="compact" className="text-zinc-700">
                      {msg.text}
                    </MarkdownContent>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="px-5 py-3.5 rounded-2xl bg-white border border-zinc-200/80 text-zinc-500 rounded-bl-sm shadow-sm flex items-center gap-3 text-[13px] font-medium ws-load-enter">
                  <LoadingDots tone="indigo" />
                  <span>{t('thinking')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-zinc-200/60">
            {isLimitReached ? (
              <div className="flex flex-col items-center justify-center p-5 bg-red-50/50 border border-red-100 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-[13px] font-bold text-red-900 mb-3 text-center">
                  {t('limitTitle')}
                </p>
                <Link
                  href="/register"
                  className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95 transform-gpu"
                >
                  {t('limitButton')}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('placeholder')}
                  className="flex-1 bg-zinc-50 border border-zinc-200/80 focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl pl-5 pr-12 py-3.5 text-sm transition-all text-zinc-900 placeholder:text-zinc-400 outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
