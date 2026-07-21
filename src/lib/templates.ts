import type { LucideIcon } from 'lucide-react';
import {
  Clock,
  Database,
  FileText,
  KanbanSquare,
  LayoutTemplate,
  MessageSquare,
  Network,
  PenTool,
} from 'lucide-react';
import type { PageContent } from '@/types/record';

/** Project-level `record_data.template` ids (create / routing). */
export type ProjectTemplateId =
  | 'blank'
  | 'kanban'
  | 'document'
  | 'whiteboard'
  | 'timeline'
  | 'database'
  | 'mindmap'
  | 'retrospective';

/** Page frame types inside Blank canvas (`PageContent.type`). */
export type PageTypeId = PageContent['type'];

export type PageFrameDefaults = {
  width: number;
  height: number;
  title: string;
  backgroundColor: string;
};

export type ProjectTemplateMeta = {
  id: ProjectTemplateId;
  /** Legacy ids that normalize to this template. */
  aliases?: string[];
  label: string;
  icon: LucideIcon;
  color: string;
  /** Full-bleed board (not infinite canvas). */
  isStandaloneBoard: boolean;
};

/** Canonical project templates shown in create UI. */
export const PROJECT_TEMPLATES: ProjectTemplateMeta[] = [
  {
    id: 'blank',
    label: 'Blank',
    icon: LayoutTemplate,
    color: 'text-zinc-500 dark:text-zinc-400',
    isStandaloneBoard: false,
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: KanbanSquare,
    color: 'text-blue-500',
    isStandaloneBoard: true,
  },
  {
    id: 'document',
    aliases: ['notepad'],
    label: 'Document',
    icon: FileText,
    color: 'text-amber-500',
    isStandaloneBoard: true,
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    icon: PenTool,
    color: 'text-emerald-500',
    isStandaloneBoard: true,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
    color: 'text-sky-600',
    isStandaloneBoard: true,
  },
  {
    id: 'database',
    label: 'Database',
    icon: Database,
    color: 'text-teal-600',
    isStandaloneBoard: true,
  },
  {
    id: 'mindmap',
    label: 'Mindmap',
    icon: Network,
    color: 'text-cyan-600',
    isStandaloneBoard: true,
  },
  {
    id: 'retrospective',
    label: 'Retrospective',
    icon: MessageSquare,
    color: 'text-rose-500',
    isStandaloneBoard: true,
  },
];

/** Page types that host a board component (not freeform blocks). */
export const BOARD_PAGE_TYPES = new Set<PageTypeId>([
  'kanban',
  'notes',
  'document',
  'whiteboard',
  'mindmap',
  'timeline',
  'database',
  'retrospective',
]);

/** Frame palette order for ItemSidebar (i18n keys stay `frames.<id>`). */
export const FRAME_PAGE_TYPES: PageTypeId[] = [
  'empty',
  'kanban',
  'notes',
  'timeline',
  'database',
  'whiteboard',
  'mindmap',
  'retrospective',
];

const PAGE_DEFAULTS: Record<PageTypeId, PageFrameDefaults> = {
  empty: {
    width: 800,
    height: 1131,
    title: 'New Frame',
    backgroundColor: '#ffffff',
  },
  kanban: {
    width: 1200,
    height: 800,
    title: 'Kanban Board',
    backgroundColor: '#f4f4f5',
  },
  notes: {
    width: 800,
    height: 1000,
    title: 'Notes Workspace',
    backgroundColor: '#fffdf0',
  },
  document: {
    width: 800,
    height: 1000,
    title: 'Document',
    backgroundColor: '#fffdf0',
  },
  timeline: {
    width: 1000,
    height: 600,
    title: 'Timeline',
    backgroundColor: '#ffffff',
  },
  database: {
    width: 1200,
    height: 800,
    title: 'Structured Database',
    backgroundColor: '#f8fafc',
  },
  whiteboard: {
    width: 1200,
    height: 800,
    title: 'Whiteboard',
    backgroundColor: '#ffffff',
  },
  mindmap: {
    width: 1200,
    height: 800,
    title: 'Mindmap',
    backgroundColor: '#ffffff',
  },
  retrospective: {
    width: 1200,
    height: 800,
    title: 'Retrospective',
    backgroundColor: '#ffffff',
  },
};

const TEMPLATE_BY_ID = new Map<string, ProjectTemplateMeta>();
for (const meta of PROJECT_TEMPLATES) {
  TEMPLATE_BY_ID.set(meta.id, meta);
  for (const alias of meta.aliases ?? []) {
    TEMPLATE_BY_ID.set(alias, meta);
  }
}

/** Normalize legacy project template ids (`notepad` → `document`). */
export function normalizeProjectTemplate(
  raw: string | null | undefined
): ProjectTemplateId | string {
  const key = String(raw || 'blank').toLowerCase().trim();
  return TEMPLATE_BY_ID.get(key)?.id ?? key;
}

export function getProjectTemplateMeta(
  raw: string | null | undefined
): ProjectTemplateMeta | undefined {
  const key = String(raw || 'blank').toLowerCase().trim();
  return TEMPLATE_BY_ID.get(key);
}

export function isStandaloneBoardTemplate(
  raw: string | null | undefined
): boolean {
  return getProjectTemplateMeta(raw)?.isStandaloneBoard === true;
}

export function isBoardPageType(type: string | null | undefined): boolean {
  return BOARD_PAGE_TYPES.has(type as PageTypeId);
}

export function getPageFrameDefaults(type: PageTypeId): PageFrameDefaults {
  return PAGE_DEFAULTS[type] ?? PAGE_DEFAULTS.empty;
}

/** Labels for analytics / filters (includes legacy aliases). */
export const TEMPLATE_LABELS: Record<string, string> = {
  blank: 'Blank',
  kanban: 'Kanban',
  document: 'Document',
  notepad: 'Document',
  notes: 'Document',
  whiteboard: 'Whiteboard',
  timeline: 'Timeline',
  database: 'Database',
  mindmap: 'Mindmap',
  retrospective: 'Retrospective',
};

/** Map project template → board component key used by BoardRenderer. */
export function projectTemplateToBoardKey(
  raw: string | null | undefined
): string | null {
  const id = normalizeProjectTemplate(raw);
  if (id === 'blank' || !isStandaloneBoardTemplate(id)) return null;
  return id;
}

/** Map page type → board component key. */
export function pageTypeToBoardKey(type: string | null | undefined): string | null {
  if (!type || type === 'empty') return null;
  if (type === 'notes' || type === 'document') return 'document';
  if (isBoardPageType(type)) return type;
  return null;
}
