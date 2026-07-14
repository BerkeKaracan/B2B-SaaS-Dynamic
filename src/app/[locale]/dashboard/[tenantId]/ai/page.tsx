"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { fetchAPI } from "@/services/api";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  Copy,
  CheckCheck,
  Lightbulb,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hello! I'm your dedicated **Workspace AI Assistant**. \n\nI don't need any specific data. You can use me to brainstorm ideas, plan your next project, write marketing copies, or just have a general chat. How can I help you today?",
};

const QUICK_ACTIONS = [
  "Draft a 30-60-90 day product launch plan.",
  "Brainstorm 5 B2B marketing strategies.",
  "Write a cold email template for SaaS sales.",
  "Create a standard API documentation structure.",
];

export default function AIPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: "user", content: textToSend.trim() };
    setMessages((prev) => [...prev, userMessage]);
    if (!textOverride) setInput("");
    setIsLoading(true);

    try {
      const res = await fetchAPI("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMessage],
          workspace_context:
            "You are a highly intelligent, general-purpose B2B SaaS AI assistant. The user is in a dedicated, full-screen AI planning area. Help them brainstorm, create project plans, write content, or answer general questions. Use Markdown extensively for structuring your answers (lists, bold text, headers). If they ask to create a task, use the create_task tool.",
          tenant_id: tenantId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantText =
          data.message || data.reply || "Done — how else can I help?";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantText },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Sorry, I encountered a server error while thinking.",
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Connection failed. Please check your internet.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([INITIAL_MESSAGE]);
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-[#FAFAFA] overflow-hidden">
      <header className="shrink-0 px-8 py-6 border-b border-zinc-200/60 bg-white shadow-sm z-10 relative">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              AI Planning & Assistant
            </h1>
            <p className="text-sm font-medium text-zinc-500">
              Brainstorm, structure ideas, and generate content effortlessly.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8 relative scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 sm:gap-6 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div className="shrink-0 mt-1">
                {msg.role === "assistant" ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div
                className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}
              >
                <div
                  className={`rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm w-full ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white rounded-tr-sm"
                      : "bg-white border border-zinc-200/80 text-zinc-800 rounded-tl-sm"
                  }`}
                >
                  <div className="prose prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-50 prose-indigo">
                    <ReactMarkdown
                      components={{
                        strong: ({ node, ...props }) => (
                          <span className="font-bold" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc ml-4 my-2 space-y-1"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal ml-4 my-2 space-y-1"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="mt-0.5" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-lg font-bold mt-4 mb-2"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-3 last:mb-0" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopyMessage(msg.content, i)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors px-1"
                  >
                    {copiedIndex === i ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Response
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {messages.length === 1 && !isLoading && (
            <div className="pl-12 sm:pl-14">
              <div className="flex flex-wrap gap-2 mt-4">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(action)}
                    className="flex items-center gap-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200/80 px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-4 sm:gap-6">
              <div className="shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-sm font-medium text-zinc-500">
                  AI is crafting a response...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-zinc-200/60 p-4 z-10 relative">
        <div className="max-w-4xl mx-auto relative flex items-end shadow-sm">
          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            className="absolute left-2.5 bottom-2.5 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything, press Enter to send, Shift + Enter for new line..."
            className="w-full min-h-[52px] max-h-32 resize-none bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl pl-12 pr-14 py-3.5 text-[15px] font-medium transition-all outline-none scrollbar-hide"
            rows={1}
          />

          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2.5 bottom-2.5 w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors active:scale-95"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 text-center">
          <p className="text-[11px] font-medium text-zinc-400">
            AI can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
    </div>
  );
}
