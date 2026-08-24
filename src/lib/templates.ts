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
  CalendarDays,
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
  | 'retrospective'
  | 'calendar';

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
  /** Icon / label accent (Tailwind text-* classes). */
  color: string;
  /** Left rail on project cards when status is active. */
  rail: string;
  /** Soft header wash on project cards (light + dark). */
  headerBg: string;
  /** Radial glow overlay for the card header (CSS backgroundImage). */
  glow: string;
  /** Icon tile on the project chrome (not the Blank sky chip). */
  chip: string;
  /** Full-bleed board (not infinite canvas). */
  isStandaloneBoard: boolean;
};

/** Canonical project templates shown in create UI. */
export const PROJECT_TEMPLATES: ProjectTemplateMeta[] = [
  {
    id: 'blank',
    label: 'Blank',
    icon: LayoutTemplate,
    color: 'text-sky-600 dark:text-sky-400',
    rail: 'bg-sky-400/80 group-hover:bg-sky-500',
    headerBg:
      'bg-[linear-gradient(135deg,#f0f9ff_0%,#e0f2fe_45%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#0c4a6e_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(56,189,248,0.38), transparent 42%), radial-gradient(circle at 80% 70%, rgba(14,165,233,0.16), transparent 36%)',
    chip: 'bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20',
    isStandaloneBoard: false,
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: KanbanSquare,
    color: 'text-indigo-500 dark:text-indigo-400',
    rail: 'bg-indigo-400/80 group-hover:bg-indigo-500',
    headerBg:
      'bg-[linear-gradient(135deg,#eef2ff_0%,#e0e7ff_45%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#312e81_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.36), transparent 42%), radial-gradient(circle at 80% 70%, rgba(129,140,248,0.16), transparent 36%)',
    chip: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20',
    isStandaloneBoard: true,
  },
  {
    id: 'document',
    aliases: ['notepad'],
    label: 'Document',
    icon: FileText,
    color: 'text-amber-600 dark:text-amber-400',
    rail: 'bg-amber-400/80 group-hover:bg-amber-500',
    headerBg:
      'bg-[linear-gradient(135deg,#fffbeb_0%,#fef3c7_45%,#fafaf9_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#78350f_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(245,158,11,0.34), transparent 42%), radial-gradient(circle at 80% 70%, rgba(251,191,36,0.14), transparent 36%)',
    chip: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
    isStandaloneBoard: true,
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    icon: PenTool,
    color: 'text-emerald-600 dark:text-emerald-400',
    rail: 'bg-emerald-400/80 group-hover:bg-emerald-500',
    headerBg:
      'bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_45%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#064e3b_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(16,185,129,0.34), transparent 42%), radial-gradient(circle at 80% 70%, rgba(52,211,153,0.14), transparent 36%)',
    chip: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
    isStandaloneBoard: true,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
    color: 'text-violet-600 dark:text-violet-400',
    rail: 'bg-violet-400/80 group-hover:bg-violet-500',
    headerBg:
      'bg-[linear-gradient(135deg,#f5f3ff_0%,#ede9fe_45%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#4c1d95_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(139,92,246,0.34), transparent 42%), radial-gradient(circle at 80% 70%, rgba(167,139,250,0.14), transparent 36%)',
    chip: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20',
    isStandaloneBoard: true,
  },
  {
    id: 'database',
    label: 'Database',
    icon: Database,
    color: 'text-teal-600 dark:text-teal-400',
    rail: 'bg-teal-400/80 group-hover:bg-teal-500',
    headerBg:
      'bg-[linear-gradient(135deg,#f0fdfa_0%,#ccfbf1_45%,#f8fafc_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#134e4a_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(20,184,166,0.34), transparent 42%), radial-gradient(circle at 80% 70%, rgba(45,212,191,0.14), transparent 36%)',
    chip: 'bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20',
    isStandaloneBoard: true,
  },
  {
    id: 'mindmap',
    label: 'Mindmap',
    icon: Network,
    color: 'text-orange-600 dark:text-orange-400',
    rail: 'bg-orange-400/80 group-hover:bg-orange-500',
    headerBg:
      'bg-[linear-gradient(135deg,#fff7ed_0%,#ffedd5_45%,#fafaf9_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#7c2d12_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(249,115,22,0.34), transparent 42%), radial-gradient(circle at 80% 70%, rgba(251,146,60,0.14), transparent 36%)',
    chip: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20',
    isStandaloneBoard: true,
  },
  {
    id: 'retrospective',
    label: 'Retrospective',
    icon: MessageSquare,
    color: 'text-rose-500 dark:text-rose-400',
    rail: 'bg-rose-400/80 group-hover:bg-rose-500',
    headerBg:
      'bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_45%,#fafaf9_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#881337_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(244,63,94,0.32), transparent 42%), radial-gradient(circle at 80% 70%, rgba(251,113,133,0.14), transparent 36%)',
    chip: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
    isStandaloneBoard: true,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: CalendarDays,
    color: 'text-red-500 dark:text-red-400',
    rail: 'bg-red-400/80 group-hover:bg-red-500',
    headerBg:
      'bg-[linear-gradient(135deg,#fef2f2_0%,#fee2e2_45%,#fafafa_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#7f1d1d_50%,#09090b_100%)]',
    glow: 'radial-gradient(circle at 20% 30%, rgba(239,68,68,0.34), transparent 42%), radial-gradient(circle at 80% 70%, rgba(248,113,113,0.14), transparent 36%)',
    chip: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20',
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
  'calendar',
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
  'calendar',
];

const PAGE_DEFAULTS: Record<PageTypeId, PageFrameDefaults> = {
  empty: {
    width: 800,
    height: 1131,
    title: 'New Frame',
    backgroundColor: '#fafafa',
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
  calendar: {
    width: 1200,
    height: 800,
    title: 'Calendar',
    backgroundColor: '#fafafa',
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
  calendar: 'Calendar',
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
