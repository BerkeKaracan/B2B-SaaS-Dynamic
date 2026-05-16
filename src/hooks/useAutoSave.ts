"use client";
import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";

export function useAutoSave(tenantId: string, moduleName: string) {
  const { title, description, date, blocks, saveProject } = useCanvasStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveProject(tenantId, moduleName);
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [title, description, date, blocks, saveProject, tenantId, moduleName]);
}
