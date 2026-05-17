"use client";
import React from "react";
import ProjectCardsGrid from "@/components/workspace/ProjectCardsGrid";

export default function ProjectsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-10 h-full w-full">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Active Workspaces</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Select a live record to load into the engine canvas framework.</p>
        </div>

        <ProjectCardsGrid />
      </div>
    </div>
  );
}