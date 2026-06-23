"use client";

import React from "react";
import { useTranslations } from "next-intl";
import ProjectCardsGrid from "@/components/workspace/ProjectCardsGrid";

export default function ProjectsPage() {
  const t = useTranslations("ProjectsPage");

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-10 h-full w-full transition-colors duration-300">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            {t("description")}
          </p>
        </div>
        <ProjectCardsGrid />
      </div>
    </div>
  );
}
