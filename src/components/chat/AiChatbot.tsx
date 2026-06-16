"use client";
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCanvasStore } from "@/store/useCanvasStore";
import { fetchAPI } from "@/services/api";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  Database,
  CheckCircle2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatbot() {
  const params = useParams();
  const tenantId = params?.tenantId as string;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I can read your active canvas. What do you want to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [hasProjectAccess, setHasProjectAccess] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [projectContext, setProjectContext] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pages = useCanvasStore((s) => s.pages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildCanvasContext = () => {
    if (!pages || pages.length === 0)
      return "The active canvas is completely empty.";

    let context = "--- ACTIVE CANVAS BLOCKS ---\n";
    pages.forEach((page, i) => {
      context += `[Page/Frame ${i + 1}: ${page.title}]\n`;
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

  const handleGrantAccess = async () => {
    if (!tenantId) return;
    setIsLoadingAccess(true);

    try {
      const res = await fetchAPI(`/api/records?tenant_id=${tenantId}`);
      if (res.ok) {
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.warn("API did not return an array for projects.");
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
          const isConfig = item.module_name === "workspace_modules";
          const isPrivate =
            item.record_data?.isPrivate === true ||
            item.record_data?.visibility === "private";
          return !isConfig && !isPrivate;
        });

        let pContext = "--- WORKSPACE PUBLIC PROJECTS ---\n";
        if (publicProjects.length === 0) {
          pContext += "No public projects found in this workspace.\n";
        } else {
          publicProjects.forEach((p: ProjectItem) => {
            pContext += `- Project Name: ${p.record_data?.name || "Untitled"} (Module Type: ${p.module_name})\n`;
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
            role: "assistant",
            content:
              "✅ Access granted! I have loaded your public projects into my memory. You can ask me anything about them.",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load project context", error);
    } finally {
      setIsLoadingAccess(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const canvasContext = buildCanvasContext();
    const finalContext = hasProjectAccess
      ? `${canvasContext}\n\n${projectContext}`
      : canvasContext;

    try {
      const res = await fetchAPI("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMessage],
          workspace_context: finalContext,
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
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl w-80 sm:w-96 h-[32rem] mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
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

          {!hasProjectAccess && tenantId && (
            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex flex-col gap-2 shrink-0 animate-in fade-in duration-300">
              <p className="text-[11px] text-indigo-800 font-medium leading-tight flex items-start gap-1.5">
                <Database className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Want me to analyze your workspace projects too? (Private
                projects will be excluded).
              </p>
              <button
                onClick={handleGrantAccess}
                disabled={isLoadingAccess}
                className="bg-indigo-600 text-white text-[10px] uppercase tracking-wider font-bold py-1.5 px-3 rounded-md w-fit hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoadingAccess ? "Loading..." : "Allow Access"}
              </button>
            </div>
          )}

          {hasProjectAccess && (
            <div className="bg-emerald-50 px-4 py-1.5 border-b border-emerald-100 flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                Project Access Active
              </span>
            </div>
          )}

          {/* Messages Area */}
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
                >
                  <div className="space-y-1">
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
                <div className="bg-white border border-zinc-200 text-zinc-500 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
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

      {/* Floating Button */}
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
