"use client";
import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/store/useCanvasStore";

export function useAutoSave(tenantId: string, recordId: string | null) {
  const {
    title,
    description,
    date,
    pages,
    connections,
    saveProject,
    metadata,
  } = useCanvasStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!recordId) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveProject(tenantId);
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    title,
    description,
    date,
    pages,
    connections,
    saveProject,
    tenantId,
    recordId,
    metadata, 
  ]);

  useEffect(() => {
    isFirstRender.current = true;
  }, [recordId]);
}
