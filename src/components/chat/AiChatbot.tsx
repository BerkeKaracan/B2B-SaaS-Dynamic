'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCanvasStore } from '@/store/useCanvasStore';
import { fetchAPI } from '@/services/api';
import { Send, Loader2, Database, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatbot() {
  const params = useParams();
  const tenantId = params?.tenantId as string;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I can read your active canvas. What do you want to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [hasProjectAccess, setHasProjectAccess] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [projectContext, setProjectContext] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pages = useCanvasStore((s) => s.pages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildCanvasContext = () => {
    if (!pages || pages.length === 0)
      return 'The active canvas is completely empty.';

    let context = '--- ACTIVE CANVAS BLOCKS ---\n';
    pages.forEach((page, i) => {
      context += `[Page/Frame ${i + 1}: ${page.title}]\n`;
      page.blocks.forEach((block) => {
        if (
          block.type === 'text' &&
          typeof block.value === 'string' &&
          block.value.trim() !== ''
        ) {
          context += `- ${block.value}\n`;
        } else if (block.type === 'checkbox') {
          context += `- Checkbox (Status: ${block.value ? 'Checked' : 'Unchecked'})\n`;
        }
      });
      context += '\n';
    });
    return context.substring(0, 3000);
  };

  const handleGrantAccess = async () => {
    if (!tenantId) return;
    setIsLoadingAccess(true);

    try {
      const res = await fetchAPI(`/api/records?tenant_id=${tenantId}`);
      if (res.ok) {
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.warn('API did not return an array for projects.');
          setIsLoadingAccess(false);
          return;
        }

        type ProjectItem = {
          module_name: string;
          record_data?: {
            name?: string;
            description?: string;
            isPrivate?: boolean;
            visibility?: string;
          };
        };

        const publicProjects = data.filter((item: ProjectItem) => {
          const isConfig = item.module_name === 'workspace_modules';
          const isPrivate =
            item.record_data?.isPrivate === true ||
            item.record_data?.visibility === 'private';
          return !isConfig && !isPrivate;
        });

        let pContext = '--- WORKSPACE PUBLIC PROJECTS ---\n';
        if (publicProjects.length === 0) {
          pContext += 'No public projects found in this workspace.\n';
        } else {
          publicProjects.forEach((p: ProjectItem) => {
            pContext += `- Project Name: ${p.record_data?.name || 'Untitled'} (Module Type: ${p.module_name})\n`;
            if (p.record_data?.description) {
              pContext += `  Description: ${p.record_data.description}\n`;
            }
          });
        }

        setProjectContext(pContext);
        setHasProjectAccess(true);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              '✅ Access granted! I have loaded your public projects into my memory. You can ask me anything about them.',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load project context', error);
    } finally {
      setIsLoadingAccess(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const canvasContext = buildCanvasContext();
    const finalContext = hasProjectAccess
      ? `${canvasContext}\n\n${projectContext}`
      : canvasContext;

    try {
      const res = await fetchAPI('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [...messages, userMessage],
          workspace_context: finalContext,
        }),
      });

      if (!res.ok) throw new Error('API Error');
      if (!res.body) throw new Error('No body returned');

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setIsLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          aiText += chunk;
          setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = aiText;
            return newMsgs;
          });
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Connection error occurred. Please try again.',
        },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50/50 dark:bg-[#121212]">
      {!hasProjectAccess && tenantId && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 border-b border-indigo-100 dark:border-indigo-500/20 flex flex-col gap-2 shrink-0 animate-in fade-in duration-300">
          <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium leading-tight flex items-start gap-1.5">
            <Database className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Want me to analyze your workspace projects too? (Private projects
            will be excluded).
          </p>
          <button
            onClick={handleGrantAccess}
            disabled={isLoadingAccess}
            className="bg-indigo-600 text-white text-[10px] uppercase tracking-wider font-bold py-1.5 px-3 rounded-md w-fit hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingAccess ? 'Loading...' : 'Allow Access'}
          </button>
        </div>
      )}

      {hasProjectAccess && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1.5 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
            Project Access Active
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-[#1E1E20] text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800 rounded-bl-sm'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    strong: ({ node, ...props }) => (
                      <span className="font-bold" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc ml-4 mt-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal ml-4 mt-1" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mt-0.5" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-2 last:mb-0" {...props} />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#1E1E20] border border-zinc-200/60 dark:border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 p-3 bg-white dark:bg-[#161616] border-t border-zinc-200 dark:border-zinc-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask about your workspace..."
            className="w-full bg-zinc-100 dark:bg-[#222222] border border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#1E1E20] rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
