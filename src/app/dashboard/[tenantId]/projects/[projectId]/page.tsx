"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import CanvasArea from "@/components/canvas/renderers/CanvasArea";
import { fetchAPI } from "@/services/api";
import { useCanvasStore } from "@/store/useCanvasStore";

type RecordDataProps = {
  name?: string;
  is_global_public?: boolean | string;
  [key: string]: unknown;
};

export default function ProjectDesignPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [recordData, setRecordData] = useState<RecordDataProps | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState<boolean>(false);

  const updateMetadata = useCanvasStore((state) => state.updateMetadata);

  const openShareModal = async () => {
    setIsModalOpen(true);
    setIsLoadingRecord(true);
    try {
      const res = await fetchAPI(`/api/records/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setRecordData(data.record_data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const handleCopy = async () => {
    try {
      const shareLink = `${window.location.origin}/share/${projectId}`;
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleGlobalToggle = async () => {
    if (!recordData) return;
    setIsUpdating(true);

    const isCurrentlyGlobal = String(recordData.is_global_public) === "true";
    const nextGlobalState = !isCurrentlyGlobal;

    try {
      const updatedData = { ...recordData, is_global_public: nextGlobalState };
      const res = await fetchAPI(`/api/records/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ record_data: updatedData }),
      });

      if (res.ok) {
        setRecordData(updatedData);
        updateMetadata({ is_global_public: nextGlobalState });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isGlobal = String(recordData?.is_global_public) === "true";

  return (
    <div className="flex flex-col h-full w-full bg-[#fafafb] relative selection:bg-zinc-200">
      <div className="h-14 border-b border-zinc-200/80 bg-white px-6 flex items-center justify-between shrink-0 shadow-xs relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200/50">
            Design Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openShareModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm active:scale-95"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Web Share Options
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-0">
        <CanvasArea />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-zinc-950/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-black text-zinc-950 tracking-tight">
                  Internet Sharing
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                  Global Access Settings
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 transition-colors p-1"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {isLoadingRecord ? (
              <div className="p-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-6 space-y-8 bg-white">
                <div
                  className={`space-y-3 transition-opacity ${!isGlobal ? "opacity-40 pointer-events-none grayscale" : "opacity-100"}`}
                >
                  <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest">
                    Public Web Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${projectId}`}
                      className="flex-1 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isCopied ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}
                    >
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-amber-600">
                    Anyone on the internet with this link can view the canvas.
                  </p>
                </div>

                <div className="h-px bg-zinc-100 w-full"></div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950 mb-1">
                        Publish to Global Gallery
                      </h4>
                      <p className="text-[11px] font-medium text-zinc-500 leading-relaxed max-w-[250px]">
                        Enable this to generate a public link and feature your
                        workspace in the SaaS Engine community landing page.
                      </p>
                    </div>

                    <button
                      onClick={handleGlobalToggle}
                      disabled={isUpdating}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors mt-1 ${isGlobal ? "bg-zinc-950" : "bg-zinc-200"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGlobal ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
