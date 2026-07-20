'use client';
import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Send } from 'lucide-react';
import { createAuthedSupabaseClient } from '@/lib/supabaseAuthedClient';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';

interface TeamMessage {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  content: string;
  created_at: string;
}

export default function TeamChat({ tenantId }: { tenantId: string }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!tenantId) return;
    const fetchHistory = async () => {
      try {
        const res = await fetchAPI(`/api/chat/${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;

    let cancelled = false;
    let client: ReturnType<typeof createAuthedSupabaseClient> = null;
    let channel: { unsubscribe?: () => void } | null = null;

    void (async () => {
      const token = await fetchRealtimeAccessToken();
      if (cancelled || !token) return;
      client = createAuthedSupabaseClient(token);
      if (!client) return;

      const ch = client
        .channel(`room_${tenantId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'team_messages',
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            const newMessage = payload.new as TeamMessage;
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe();

      channel = ch;
    })();

    return () => {
      cancelled = true;
      if (client && channel) {
        client.removeChannel(channel as Parameters<typeof client.removeChannel>[0]);
      }
    };
  }, [tenantId]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const textToSend = input.trim();
    setInput('');
    setIsSending(true);

    try {
      const optimisticMsg: TeamMessage = {
        id: 'temp-' + Date.now(),
        user_id: user?.id || '',
        user_email: user?.email || '',
        user_name: user?.full_name || 'Me',
        content: textToSend,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const res = await fetchAPI(`/api/chat/${tenantId}`, {
        method: 'POST',
        body: JSON.stringify({ content: textToSend }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? savedMsg : m))
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50 dark:bg-[#121212]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_email === user?.email;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium mb-1 px-1">
                  {isMe ? 'You' : msg.user_name}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-[#1E1E20] text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 p-3 bg-white dark:bg-[#161616] border-t border-zinc-200 dark:border-zinc-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message team..."
            className="w-full bg-zinc-100 dark:bg-[#222222] border border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#1E1E20] rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="absolute right-1.5 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
