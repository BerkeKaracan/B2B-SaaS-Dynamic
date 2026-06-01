"use client";
import { useState, useEffect } from "react";

export default function ColdStartAlert() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sadece oturumun ilk açılışında göstermek için sessionStorage kontrolü yapıyoruz
    const hasSeenAlert = sessionStorage.getItem("hasSeenColdStartAlert");

    if (!hasSeenAlert) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      sessionStorage.setItem("hasSeenColdStartAlert", "true");

      const timer = setTimeout(() => setIsVisible(false), 35000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 flex items-start gap-4 transition-all animate-fade-in-up">
      <div className="mt-1 w-5 h-5 border-2 border-gray-200 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin shrink-0"></div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Waking up the server...
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          The initial load might take around 30 seconds. Thank you for your
          patience!
        </p>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Close"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
