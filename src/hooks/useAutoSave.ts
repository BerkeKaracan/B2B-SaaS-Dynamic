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

  const notepadStrokes = metadata?.notepadStrokes;
  const notepadTexts = metadata?.notepadTexts;
  const notepadTitle = metadata?.notepadTitle;

  const tasks = metadata?.tasks;
  const timelineEvents = metadata?.timelineEvents;

  const databaseProperties = metadata?.databaseProperties;
  const databaseRows = metadata?.databaseRows;
  const databaseTitle = metadata?.databaseTitle;

  const whiteboardStrokes = metadata?.whiteboardStrokes;
  const whiteboardTexts = metadata?.whiteboardTexts;
  const whiteboardTitle = metadata?.whiteboardTitle;

  const mindmapNodes = metadata?.mindmapNodes;
  const retrospectiveCards = metadata?.retrospectiveCards;

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
    notepadStrokes,
    notepadTexts,
    notepadTitle,
    tasks,
    timelineEvents,
    databaseProperties,
    databaseRows,
    databaseTitle,
    whiteboardStrokes,
    whiteboardTexts,
    whiteboardTitle,
    mindmapNodes,
    retrospectiveCards,
  ]);

  useEffect(() => {
    isFirstRender.current = true;
  }, [recordId]);
}
