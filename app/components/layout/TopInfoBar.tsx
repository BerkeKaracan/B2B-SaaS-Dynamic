"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import {
  PanelRightClose,
  PanelRightOpen,
  HardDriveDownload,
} from "lucide-react";

/**
 * Top contextual information area.
 * Displays details about the currently active dataset.
 */
export default function TopInfoBar() {
  const { isInfoAreaOpen, toggleInfoArea } = useLayoutStore();

  return (
    <div className="relative w-full flex-shrink-0 z-10">
      <div
        className={`bg-white dark:bg-black transition-all duration-300 ease-in-out grid border-slate-200 dark:border-slate-800 ${
          isInfoAreaOpen
            ? "grid-rows-[1fr] border-b opacity-100"
            : "grid-rows-[0fr] border-0 opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Active Fleet Registry
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                  Live DB
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Managing license plates, driver assignments, and insurance
                dates. Total records: 1,248.
              </p>
              <span className="text-xs text-slate-400 mt-2 block">
                Last synced: May 15, 2026 - 13:15
              </span>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors">
                <HardDriveDownload size={16} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={toggleInfoArea}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                title="Hide Context Header"
              >
                <PanelRightClose size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {!isInfoAreaOpen && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleInfoArea}
            className="p-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md text-slate-500 hover:text-slate-700 transition-colors"
            title="Show Context Header"
          >
            <PanelRightOpen size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
