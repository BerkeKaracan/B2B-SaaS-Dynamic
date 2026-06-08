"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `Error caught in ${this.props.moduleName || "Component"} Boundary:`,
      error,
      errorInfo,
    );
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 bg-red-50/30 border border-red-100 rounded-lg">
          <div className="text-red-500 mb-3">
            <svg
              className="w-10 h-10 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {this.props.moduleName
              ? `Failed to load ${this.props.moduleName}`
              : "Component Error"}
          </h2>
          <p className="text-sm text-gray-500 mb-5 text-center max-w-sm">
            We encountered an issue loading this module. Other features are
            still working.
          </p>
          <button
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reload Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
