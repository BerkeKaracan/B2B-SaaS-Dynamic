import React from "react";
import CanvasArea from "@/components/canvas/renderers/CanvasArea";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      <div className="flex-1 px-12 py-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <CanvasArea />
        </div>
      </div>
    </div>
  );
}
