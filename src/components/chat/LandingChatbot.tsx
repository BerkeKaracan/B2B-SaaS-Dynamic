"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Bot, AlertCircle, Loader2 } from "lucide-react";

export default function LandingChatbot() {
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLimitReached || isLoading) return;

    const userMessage = input;
    const chatHistory = [...messages];

    setMessages([...chatHistory, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${apiUrl}/api/public-ai/public-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
        }),
      });

      if (response.status === 429) {
        setIsLimitReached(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch AI response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I'm having trouble connecting to my servers right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseMarkdown = (text: string) => {
    if (!text) return null;

    let parsed = text
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-bold text-black">$1</strong>',
      )
      .replace(/\n/g, '<br class="my-2" />');
    parsed = parsed.replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>');

    return (
      <div className="space-y-2" dangerouslySetInnerHTML={{ __html: parsed }} />
    );
  };

  return (
    <section className="py-24 px-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 bg-zinc-950 p-8 text-white flex flex-col justify-center">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Ask AI Anything</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Curious about how SaaS Engine works? Our AI is trained on all our
            documentation. Ask up to 10 questions for free before creating your
            account!
          </p>
          <div className="mt-auto">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Powered by
            </span>
            <div className="font-bold">Llama 3.3 Engine</div>
          </div>
        </div>

        <div className="w-full md:w-2/3 flex flex-col h-[500px] bg-zinc-50">
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-center px-4">
                <p className="text-zinc-500 font-medium">
                  Hello! Ask me about features, pricing, or how to get started.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[90%] text-sm ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white rounded-br-sm"
                      : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <div className="prose prose-sm max-w-none text-zinc-800">
                      {parseMarkdown(msg.text)}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-white border border-zinc-200 text-zinc-500 rounded-bl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-zinc-200">
            {isLimitReached ? (
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-sm font-bold text-red-900 mb-3 text-center">
                  You have reached your free monthly question limit.
                </p>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors"
                >
                  Create Free Account to Continue
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Does the canvas support realtime collaboration?"
                  className="flex-1 bg-zinc-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
