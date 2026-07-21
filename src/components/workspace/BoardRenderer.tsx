'use client';

import React from 'react';
import StaticKanbanBoard from '@/components/kanban/StaticKanbanBoard';
import NotepadBoard from '@/components/notepad/NotepadBoard';
import TimelineBoard from '@/components/timeline/TimelineBoard';
import DatabaseBoard from '@/components/database/DatabaseBoard';
import WhiteboardBoard from '@/components/whiteboard/WhiteBoard';
import MindMapBoard from '@/components/mindmap/MindMapBoard';
import RetrospectiveBoard from '@/components/retrospective/RetrospectiveBoard';
import {
  normalizeProjectTemplate,
  pageTypeToBoardKey,
  projectTemplateToBoardKey,
} from '@/lib/templates';

type BoardRendererProps = {
  /** Board key: kanban | document | whiteboard | … */
  boardKey: string;
  projectId: string;
};

/**
 * Single switch for standalone project templates and Blank canvas pages.
 */
export function BoardRenderer({ boardKey, projectId }: BoardRendererProps) {
  switch (boardKey) {
    case 'kanban':
      return <StaticKanbanBoard projectId={projectId} />;
    case 'document':
    case 'notes':
    case 'notepad':
      return <NotepadBoard projectId={projectId} />;
    case 'whiteboard':
      return <WhiteboardBoard projectId={projectId} />;
    case 'mindmap':
      return <MindMapBoard projectId={projectId} />;
    case 'timeline':
      return <TimelineBoard projectId={projectId} />;
    case 'database':
      return <DatabaseBoard projectId={projectId} />;
    case 'retrospective':
      return <RetrospectiveBoard projectId={projectId} />;
    default:
      return null;
  }
}

export function BoardFromProjectTemplate({
  template,
  projectId,
}: {
  template: string;
  projectId: string;
}) {
  const key = projectTemplateToBoardKey(normalizeProjectTemplate(template));
  if (!key) return null;
  return <BoardRenderer boardKey={key} projectId={projectId} />;
}

export function BoardFromPageType({
  pageType,
  projectId,
}: {
  pageType: string;
  projectId: string;
}) {
  const key = pageTypeToBoardKey(pageType);
  if (!key) return null;
  return <BoardRenderer boardKey={key} projectId={projectId} />;
}
