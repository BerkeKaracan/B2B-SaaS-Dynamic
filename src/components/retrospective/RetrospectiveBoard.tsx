"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ThumbsUp, Plus, Trash2, MessageSquareHeart } from "lucide-react";

type RetroCard = {
  id: string;
  columnId: "glad" | "sad" | "mad";
  content: string;
  votedBy?: string[];
  author: string;
  createdAt: number;
};

export default function RetrospectiveBoard({
  projectId,
}: {
  projectId: string;
}) {
  const t = useTranslations("RetrospectiveBoard");
  const { metadata, updateMetadata } = useCanvasStore();
  const { user } = useAuthStore();

  const [cards, setCards] = useState<RetroCard[]>(
    (metadata.retrospectiveCards as RetroCard[]) || [],
  );

  const [newCardContent, setNewCardContent] = useState<{
    [key: string]: string;
  }>({
    glad: "",
    sad: "",
    mad: "",
  });

  const currentUserIdentifier = user?.email || user?.id || "anonymous";
  const currentUserName = user?.email
    ? user.email.split("@")[0]
    : t("anonymous");

  const saveCards = (newCards: RetroCard[]) => {
    setCards(newCards);
    updateMetadata({ retrospectiveCards: newCards });
  };

  const addCard = (columnId: "glad" | "sad" | "mad") => {
    const content = newCardContent[columnId]?.trim();
    if (!content) return;

    const newCard: RetroCard = {
      // eslint-disable-next-line react-hooks/purity
      id: `retro-${Date.now()}`,
      columnId,
      content,
      votedBy: [],
      author: currentUserName,
      // eslint-disable-next-line react-hooks/purity
      createdAt: Date.now(),
    };

    saveCards([...cards, newCard]);
    setNewCardContent({ ...newCardContent, [columnId]: "" });
  };

  const deleteCard = (id: string) => {
    saveCards(cards.filter((c) => c.id !== id));
  };

  const toggleVote = (id: string) => {
    saveCards(
      cards.map((card) => {
        if (card.id === id) {
          const currentVotes = card.votedBy || [];
          const hasVoted = currentVotes.includes(currentUserIdentifier);
          return {
            ...card,
            votedBy: hasVoted
              ? currentVotes.filter((uid) => uid !== currentUserIdentifier)
              : [...currentVotes, currentUserIdentifier],
          };
        }
        return card;
      }),
    );
  };

  const columns: Array<{
    id: "glad" | "sad" | "mad";
    title: string;
    desc: string;
    bg: string;
    border: string;
    header: string;
    postit: string;
  }> = [
    {
      id: "glad",
      title: t("glad"),
      desc: t("gladDesc"),
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-900",
      header:
        "bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400",
      postit:
        "bg-emerald-100/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "sad",
      title: t("sad"),
      desc: t("sadDesc"),
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-900",
      header:
        "bg-amber-100/50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400",
      postit:
        "bg-amber-100/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
    },
    {
      id: "mad",
      title: t("mad"),
      desc: t("madDesc"),
      bg: "bg-rose-50 dark:bg-rose-950/20",
      border: "border-rose-200 dark:border-rose-900",
      header:
        "bg-rose-100/50 dark:bg-rose-900/40 text-rose-800 dark:text-rose-400",
      postit:
        "bg-rose-100/80 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800",
    },
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent transition-colors duration-300 overflow-hidden">
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 flex items-center shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
              {t("title")}
            </h1>
            <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              Glad · Sad · Mad Format
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-6">
        <div className="flex gap-6 h-full min-w-[900px] max-w-7xl mx-auto">
          {columns.map((col) => {
            const colCards = cards
              .filter((c) => c.columnId === col.id)
              .sort(
                (a, b) =>
                  (b.votedBy || []).length - (a.votedBy || []).length ||
                  a.createdAt - b.createdAt,
              );

            return (
              <div
                key={col.id}
                className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                <div className={`p-4 border-b ${col.border} ${col.header}`}>
                  <h2 className="text-lg font-black tracking-tight">
                    {col.title}
                  </h2>
                  <p className="text-xs font-semibold opacity-80 mt-0.5">
                    {col.desc}
                  </p>
                </div>

                <div
                  className={`flex-1 overflow-y-auto p-4 space-y-3 ${col.bg}`}
                >
                  {colCards.map((card) => {
                    const currentVotes = card.votedBy || [];
                    const hasVoted = currentVotes.includes(
                      currentUserIdentifier,
                    );
                    const isOwnCard = card.author === currentUserName;

                    return (
                      <div
                        key={card.id}
                        className={`group relative p-4 rounded-xl shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 border ${col.postit}`}
                      >
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap leading-relaxed pr-6">
                          {card.content}
                        </p>

                        <div className="mt-3 flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10">
                          <div className="flex items-center gap-1.5 opacity-60">
                            <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[9px] font-black uppercase text-zinc-700 dark:text-zinc-300">
                              {card.author?.charAt(0) || "?"}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]">
                              {card.author}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isOwnCard && (
                              <button
                                onClick={() => deleteCard(card.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-all"
                                title="Delete your card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => toggleVote(card.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95 ${
                                hasVoted
                                  ? "bg-indigo-500 text-white border border-indigo-600"
                                  : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                              }`}
                            >
                              <ThumbsUp
                                className={`w-3.5 h-3.5 ${hasVoted ? "fill-white" : ""}`}
                              />
                              {currentVotes.length}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`p-3 border-t ${col.border} bg-white dark:bg-zinc-900`}
                >
                  <div className="relative">
                    <textarea
                      value={newCardContent[col.id] || ""}
                      onChange={(e) =>
                        setNewCardContent({
                          ...newCardContent,
                          [col.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addCard(col.id);
                        }
                      }}
                      placeholder={t("addCard")}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      rows={2}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-zinc-400 hidden lg:block pointer-events-none">
                        {t("typeAndEnter")}
                      </span>
                      <button
                        onClick={() => addCard(col.id)}
                        disabled={!newCardContent[col.id]?.trim()}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
