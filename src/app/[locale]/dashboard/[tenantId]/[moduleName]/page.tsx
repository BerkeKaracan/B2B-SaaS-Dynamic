"use client";
import React, { use } from "react";
import ProjectCardsGrid from "@/components/workspace/ProjectCardsGrid";

export default function CustomModulePage({
  params,
}: {
  params: Promise<{ tenantId: string; moduleName: string }>;
}) {
  const resolvedParams = use(params);
  const { moduleName } = resolvedParams;

  const displayName = moduleName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-10 h-full w-full">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            {displayName}
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Manage your records and workflows for this module.
          </p>
        </div>
        <ProjectCardsGrid moduleName={moduleName} />
      </div>
    </div>
  );
}
