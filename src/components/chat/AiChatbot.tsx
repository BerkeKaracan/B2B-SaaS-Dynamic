"use client";
import React, { useState, useRef, useEffect } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";
import { fetchAPI } from "@/services/api";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I can read your canvas. What do you want to know about your workspace?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pages = useCanvasStore((s) => s.pages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildCanvasContext = () => {
    if (!pages || pages.length === 0) return "The canvas is completely empty.";

    let context = "";
    pages.forEach((page, i) => {
      context += `[Frame ${i + 1}: ${page.title}]\n`;
      page.blocks.forEach((block) => {
        if (
          block.type === "text" &&
          typeof block.value === "string" &&
          block.value.trim() !== ""
        ) {
          context += `- ${block.value}\n`;
        } else if (block.type === "checkbox") {
          context += `- Checkbox (Status: ${block.value ? "Checked" : "Unchecked"})\n`;
        }
      });
      context += "\n";
    });
    return context;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const canvasContext = buildCanvasContext();

    try {
      const res = await fetchAPI("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMessage],
          canvas_context: canvasContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Sorry, I encountered a server error.",
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection failed." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl w-80 sm:w-96 h-[30rem] mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-200" />
              Workspace AI
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm shadow-sm"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-200 text-zinc-500 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-zinc-100 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Ask about your workspace..."
                className="w-full bg-zinc-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl pl-4 pr-10 py-2.5 text-sm transition-all outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? "bg-zinc-800 text-white rotate-90"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
