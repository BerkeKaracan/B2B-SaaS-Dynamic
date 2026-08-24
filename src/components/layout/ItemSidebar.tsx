'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCanvasStore } from '@/store/useCanvasStore';
import { BlockType, PageContent } from '@/types/record';
import { fetchAPI } from '@/services/api';
import { toast } from 'sonner';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { AI_CANVAS_GENERATOR } from '@/lib/featureGate';
import { FRAME_PAGE_TYPES } from '@/lib/templates';
import { useLayoutStore } from '@/store/useLayoutStore';
import {
  Search,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  GripVertical,
  X,
} from 'lucide-react';
import { AI, RAIL, ROW, SECTION, SURFACE } from './itemSidebarStyles';

/** Default top clears the project toolbar (~3.5rem) + padding. */
const DEFAULT_PANEL_X = 16;
const DEFAULT_PANEL_Y = 72;
const PANEL_MAX_H = 'min(560px, calc(100% - 5.5rem))';
/** Rail tooltip geometry — matches RAIL.tooltip max width + offset. */
const TOOLTIP_W = 208;
const TOOLTIP_GAP = 10;
interface SidebarItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface TemplateItem {
  type: PageContent['type'];
  label: string;
  description: string;
  icon: React.ReactNode;
}

/** Collapsible group header shared by the AI, blocks and frames sections. */
function SectionHeader({
  label,
  count,
  isOpen,
  onToggle,
  tone = 'default',
}: {
  label: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  tone?: 'default' | 'ai';
}) {
  const isAi = tone === 'ai';
  const Chevron = isOpen ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={SECTION.toggle}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {isAi && (
          <Sparkles className="w-3 h-3 shrink-0 text-indigo-500 dark:text-indigo-400" />
        )}
        <span className={isAi ? SECTION.labelAi : SECTION.label}>{label}</span>
        {typeof count === 'number' && (
          <span className={SECTION.chip}>{count}</span>
        )}
      </span>
      <Chevron className={isAi ? SECTION.chevronAi : SECTION.chevron} />
    </button>
  );
}

export default function ItemSidebar() {
  const t = useTranslations('EngineToolkit');
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  const { enabled: canUseAiGenerator, isLoading: isFlagLoading } =
    useFeatureFlag(AI_CANVAS_GENERATOR, tenantId);
  const showEngineToolkit = useLayoutStore((s) => s.showEngineToolkit);
  const { addPage, addBlockToPage, setActivePage } = useCanvasStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isBlocksOpen, setIsBlocksOpen] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelPos, setPanelPos] = useState({
    x: DEFAULT_PANEL_X,
    y: DEFAULT_PANEL_Y,
  });
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [railTip, setRailTip] = useState<{
    label: string;
    description?: string;
    x: number;
    y: number;
    flip: boolean;
  } | null>(null);
  const panelDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [activeDrag, setActiveDrag] = useState<{
    itemType: string;
    isBlock: boolean;
    label: string;
    icon: React.ReactNode;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        if (!canUseAiGenerator) return;
        e.preventDefault();
        setIsAiModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUseAiGenerator]);

  // Keep panel on-screen after collapse width change / window resize.
  useEffect(() => {
    const reclamp = () => {
      const el = panelRef.current;
      const parent = el?.offsetParent as HTMLElement | null;
      if (!el || !parent) return;
      const maxX = Math.max(8, parent.clientWidth - el.offsetWidth - 8);
      const maxY = Math.max(8, parent.clientHeight - el.offsetHeight - 8);
      setPanelPos((prev) => ({
        x: Math.min(Math.max(8, prev.x), maxX),
        y: Math.min(Math.max(8, prev.y), maxY),
      }));
    };
    const t = window.setTimeout(reclamp, 320);
    window.addEventListener('resize', reclamp);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', reclamp);
    };
  }, [isCollapsed]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || !canUseAiGenerator || !tenantId) return;
    setIsAiGenerating(true);

    const state = useCanvasStore.getState();

    const canvasContainer = document.querySelector('.canvas-bg');
    const rect = canvasContainer
      ? canvasContainer.getBoundingClientRect()
      : { width: 1000, height: 800, left: 0, top: 0 };

    const currentZoom = (state.zoom ?? 100) / 100;

    const cx = (rect.width / 2 - (state.panX ?? 0)) / currentZoom - 500;
    const cy = (rect.height / 2 - (state.panY ?? 0)) / currentZoom - 400;

    try {
      const res = await fetchAPI('/api/ai/generate-canvas', {
        method: 'POST',
        body: JSON.stringify({
          prompt: aiPrompt,
          x: cx,
          y: cy,
          tenant_id: tenantId,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as
          | { detail?: string | Array<{ msg?: string }> }
          | null;
        const detail = Array.isArray(errBody?.detail)
          ? errBody.detail[0]?.msg
          : errBody?.detail;
        toast.error(detail || t('generateFailed'));
        return;
      }

      const data = await res.json();
      const finalData = data.page || data;

      if (finalData && finalData.type) {
        const store = useCanvasStore.getState();

        if (store.addGeneratedPage) {
          store.addGeneratedPage({
            ...finalData,
            x: cx,
            y: cy,
          });

          setTimeout(() => {
            const ns = useCanvasStore.getState();
            if (ns.pages.length > 0) {
              ns.setActivePage(ns.pages[ns.pages.length - 1].id);
            }
          }, 50);

          setIsAiModalOpen(false);
          setAiPrompt('');
        }
      } else {
        toast.error(t('generateInvalid'));
      }
    } catch (e: unknown) {
      console.error('AI Canvas Generation Error:', e);
      toast.error(t('generateFailed'));
    } finally {
      setIsAiGenerating(false);
    }
  };

  const menuItems: SidebarItem[] = [
    {
      type: 'text',
      label: t('blocks.text.label'),
      description: t('blocks.text.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
    },
    {
      type: 'form',
      label: t('blocks.form.label'),
      description: t('blocks.form.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <line x1="7" y1="12" x2="11" y2="12" />
        </svg>
      ),
    },
    {
      type: 'date',
      label: t('blocks.date.label'),
      description: t('blocks.date.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      type: 'dropdown',
      label: t('blocks.dropdown.label'),
      description: t('blocks.dropdown.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      type: 'checkbox',
      label: t('blocks.toggle.label'),
      description: t('blocks.toggle.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      type: 'badge_selector',
      label: t('blocks.badge.label'),
      description: t('blocks.badge.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      type: 'asset_stream',
      label: t('blocks.asset.label'),
      description: t('blocks.asset.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  const templateItems: TemplateItem[] = [
    {
      type: 'empty',
      label: t('frames.empty.label'),
      description: t('frames.empty.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      type: 'kanban',
      label: t('frames.kanban.label'),
      description: t('frames.kanban.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      ),
    },
    {
      type: 'notes',
      label: t('frames.notes.label'),
      description: t('frames.notes.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
          <polyline points="14 3 14 9 20 9" />
        </svg>
      ),
    },
    {
      type: 'timeline' as PageContent['type'],
      label: t('frames.timeline.label'),
      description: t('frames.timeline.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <circle cx="7" cy="12" r="3" />
          <circle cx="17" cy="12" r="3" />
        </svg>
      ),
    },
    {
      type: 'database',
      label: t('frames.database.label'),
      description: t('frames.database.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      ),
    },
    {
      type: 'whiteboard' as PageContent['type'],
      label: t('frames.whiteboard.label'),
      description: t('frames.whiteboard.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      type: 'mindmap' as PageContent['type'],
      label: t('frames.mindmap.label'),
      description: t('frames.mindmap.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M6.5 10v4" />
          <path d="M17.5 10v4" />
          <path d="M10 6.5h4" />
          <path d="M10 17.5h4" />
        </svg>
      ),
    },
    {
      type: 'retrospective' as PageContent['type'],
      label: t('frames.retrospective.label'),
      description: t('frames.retrospective.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      type: 'calendar' as PageContent['type'],
      label: t('frames.calendar.label'),
      description: t('frames.calendar.desc'),
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  const handleTapToAddBlock = (type: BlockType) => {
    const state = useCanvasStore.getState();
    const targetPageId = state.activePageId || state.pages[0]?.id;

    if (!targetPageId) {
      const canvasContainer = document.querySelector('.canvas-bg');
      const rect = canvasContainer
        ? canvasContainer.getBoundingClientRect()
        : {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
      const currentZoom = (state.zoom ?? 100) / 100;
      const cx = (-(state.panX ?? 0) + rect.width / 2 - 200) / currentZoom;
      const cy = (-(state.panY ?? 0) + rect.height / 2 - 200) / currentZoom;

      addPage('empty', cx, cy);
      setTimeout(() => {
        const newState = useCanvasStore.getState();
        if (newState.activePageId) {
          newState.addBlockToPage(newState.activePageId, type, 40, 40);
          setActivePage(newState.activePageId);
        }
      }, 50);
      return;
    }

    const targetPage = state.pages.find((p) => p.id === targetPageId);
    const offsetY = targetPage ? targetPage.blocks.length * 110 + 40 : 40;
    addBlockToPage(targetPageId, type, 40, offsetY);
    setActivePage(targetPageId);
  };

  const handleTapToAddPage = (type: PageContent['type']) => {
    const state = useCanvasStore.getState();
    const canvasContainer = document.querySelector('.canvas-bg');
    const rect = canvasContainer
      ? canvasContainer.getBoundingClientRect()
      : {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
    const currentZoom = (state.zoom ?? 100) / 100;
    const cx = (-(state.panX ?? 0) + rect.width / 2 - 400) / currentZoom;
    const cy = (-(state.panY ?? 0) + rect.height / 2 - 400) / currentZoom;

    addPage(type, cx, cy);
    setTimeout(() => {
      const newState = useCanvasStore.getState();
      if (newState.activePageId) setActivePage(newState.activePageId);
    }, 50);
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    item: SidebarItem | TemplateItem,
    isBlock: boolean
  ) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true;
      }

      if (isDragging) {
        setActiveDrag({
          itemType: item.type,
          isBlock,
          label: item.label,
          icon: item.icon,
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      setActiveDrag(null);
      setTimeout(() => {
        if (isDragging) {
          processDrop(item.type, isBlock, upEvent.clientX, upEvent.clientY);
        } else {
          if (isBlock) handleTapToAddBlock(item.type as BlockType);
          else handleTapToAddPage(item.type as PageContent['type']);
        }
      }, 0);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const processDrop = (
    type: string,
    isBlock: boolean,
    clientX: number,
    clientY: number
  ) => {
    const state = useCanvasStore.getState();
    const sidebarRect = document
      .getElementById('item-sidebar')
      ?.getBoundingClientRect();

    if (
      sidebarRect &&
      clientX >= sidebarRect.left &&
      clientX <= sidebarRect.right &&
      clientY >= sidebarRect.top &&
      clientY <= sidebarRect.bottom
    )
      return;

    const canvasContainer = document.querySelector('.canvas-bg');
    const rect = canvasContainer
      ? canvasContainer.getBoundingClientRect()
      : { left: 0, top: 0 };

    const currentZoom = (state.zoom ?? 100) / 100;
    const dropCanvasX = (clientX - rect.left - (state.panX ?? 0)) / currentZoom;
    const dropCanvasY = (clientY - rect.top - (state.panY ?? 0)) / currentZoom;

    if (!isBlock) {
      state.addPage(type as PageContent['type'], dropCanvasX, dropCanvasY);
      setTimeout(() => {
        const ns = useCanvasStore.getState();
        if (ns.activePageId) setActivePage(ns.activePageId);
      }, 50);
    } else {
      const pages = state.pages;
      let targetPage = null;

      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        if (
          dropCanvasX >= p.x &&
          dropCanvasX <= p.x + p.width &&
          dropCanvasY >= p.y &&
          dropCanvasY <= p.y + p.height
        ) {
          targetPage = p;
          break;
        }
      }

      if (targetPage) {
        state.addBlockToPage(
          targetPage.id,
          type as BlockType,
          dropCanvasX - targetPage.x - 50,
          dropCanvasY - targetPage.y - 20
        );
        setActivePage(targetPage.id);
      } else {
        state.addPage('empty', dropCanvasX - 200, dropCanvasY - 50);
        setTimeout(() => {
          const newState = useCanvasStore.getState();
          if (newState.activePageId) {
            newState.addBlockToPage(
              newState.activePageId,
              type as BlockType,
              20,
              20
            );
            setActivePage(newState.activePageId);
          }
        }, 50);
      }
    }
  };

  const filteredBlocks = menuItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTemplates = templateItems.filter(
    (item) =>
      FRAME_PAGE_TYPES.includes(item.type) &&
      (item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isSearching = searchQuery.trim().length > 0;
  const hasResults = filteredBlocks.length > 0 || filteredTemplates.length > 0;

  const collapsePanel = () => {
    setSearchQuery('');
    setRailTip(null);
    setIsCollapsed(true);
  };

  const expandPanel = (focusSearch = false) => {
    setRailTip(null);
    setIsCollapsed(false);
    if (focusSearch) {
      window.setTimeout(() => searchInputRef.current?.focus(), 240);
    }
  };

  /**
   * Rail tooltips render outside the clipped panel, so they are anchored in the
   * panel's own coordinate space (its offset parent) instead of the viewport.
   */
  const showRailTip = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    label: string,
    description?: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = panelRef.current?.offsetParent as HTMLElement | null;
    const base = parent?.getBoundingClientRect();
    const left = rect.left - (base?.left ?? 0);
    const right = rect.right - (base?.left ?? 0);
    const flip = base ? right + TOOLTIP_GAP + TOOLTIP_W > base.width : false;
    setRailTip({
      label,
      description,
      x: flip ? left - TOOLTIP_GAP : right + TOOLTIP_GAP,
      y: rect.top - (base?.top ?? 0) + rect.height / 2,
      flip,
    });
  };

  const renderRailTile = (
    item: SidebarItem | TemplateItem,
    isBlock: boolean
  ) => (
    <button
      key={`${isBlock ? 'block' : 'frame'}-${item.type}`}
      type="button"
      onPointerDown={(e) => handlePointerDown(e, item, isBlock)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isBlock) handleTapToAddBlock(item.type as BlockType);
          else handleTapToAddPage(item.type as PageContent['type']);
        }
      }}
      onMouseEnter={(e) => showRailTip(e, item.label, item.description)}
      onMouseLeave={() => setRailTip(null)}
      onFocus={(e) => showRailTip(e, item.label, item.description)}
      onBlur={() => setRailTip(null)}
      aria-label={item.label}
      className={RAIL.tile}
    >
      {item.icon}
    </button>
  );

  const clampPanelPos = (x: number, y: number) => {
    const el = panelRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return { x, y };
    const maxX = Math.max(8, parent.clientWidth - el.offsetWidth - 8);
    const maxY = Math.max(8, parent.clientHeight - el.offsetHeight - 8);
    return {
      x: Math.min(Math.max(8, x), maxX),
      y: Math.min(Math.max(8, y), maxY),
    };
  };

  const handlePanelDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    panelDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: panelPos.x,
      originY: panelPos.y,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const drag = panelDragRef.current;
      if (!drag) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
      setPanelPos(clampPanelPos(drag.originX + dx, drag.originY + dy));
    };
    const onUp = () => {
      panelDragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      {/*
        Floating, draggable toolkit — collapses to a slim icon rail so the
        canvas stays clear while blocks and frames remain one click away.
      */}
      <div
        ref={panelRef}
        id="item-sidebar"
        style={{
          left: panelPos.x,
          top: panelPos.y,
          height: isCollapsed ? undefined : PANEL_MAX_H,
          maxHeight: 'calc(100% - 5.5rem)',
        }}
        className={`absolute flex flex-col overflow-hidden ${SURFACE.panel} transition-[width] duration-300 ease-out ${
          showEngineToolkit ? 'pointer-events-auto' : 'pointer-events-none'
        } ${isCollapsed ? 'w-16' : 'w-72'}`}
      >
        {isCollapsed ? (
          <div className="flex min-h-0 w-16 flex-1 flex-col">
            <div
              className={`shrink-0 flex items-center justify-center gap-0.5 px-1 py-1.5 ${SURFACE.header}`}
            >
              <button
                type="button"
                onPointerDown={handlePanelDragStart}
                className={`w-7 h-7 shrink-0 touch-none cursor-grab active:cursor-grabbing ${SURFACE.iconButton}`}
                aria-label={t('dragHandle')}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => expandPanel()}
                onMouseEnter={(e) => showRailTip(e, t('expand'))}
                onMouseLeave={() => setRailTip(null)}
                onFocus={(e) => showRailTip(e, t('expand'))}
                onBlur={() => setRailTip(null)}
                className={`w-7 h-7 shrink-0 ${SURFACE.iconButton} text-zinc-700 dark:text-zinc-200 bg-zinc-100/80 dark:bg-zinc-800/80`}
                aria-label={t('expand')}
                aria-expanded={false}
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col items-center gap-1 overflow-y-auto overflow-x-hidden no-scrollbar px-1.5 py-1.5 select-none touch-pan-y">
              <button
                type="button"
                onClick={() => expandPanel(true)}
                onMouseEnter={(e) => showRailTip(e, t('search'))}
                onMouseLeave={() => setRailTip(null)}
                onFocus={(e) => showRailTip(e, t('search'))}
                onBlur={() => setRailTip(null)}
                className={RAIL.action}
                aria-label={t('search')}
              >
                <Search className="w-4 h-4" />
              </button>

              {!isFlagLoading && canUseAiGenerator && (
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  onMouseEnter={(e) =>
                    showRailTip(e, t('aiGenerator'), t('generatePrompt'))
                  }
                  onMouseLeave={() => setRailTip(null)}
                  onFocus={(e) =>
                    showRailTip(e, t('aiGenerator'), t('generatePrompt'))
                  }
                  onBlur={() => setRailTip(null)}
                  className={AI.railTile}
                  aria-label={t('aiGenerator')}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}

              <span className={RAIL.divider} aria-hidden="true" />
              {filteredBlocks.map((item) => renderRailTile(item, true))}
              <span className={RAIL.divider} aria-hidden="true" />
              {filteredTemplates.map((template) =>
                renderRailTile(template, false)
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-72 flex-col">
            <div className={`shrink-0 ${SURFACE.header}`}>
              <div className="flex items-center gap-1.5 px-2.5 pt-2">
                <button
                  type="button"
                  onPointerDown={handlePanelDragStart}
                  className={`w-7 h-7 shrink-0 touch-none cursor-grab active:cursor-grabbing ${SURFACE.iconButton}`}
                  aria-label={t('dragHandle')}
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <span className={`${SURFACE.title} truncate`}>
                  {t('title')}
                </span>
                <button
                  type="button"
                  onClick={collapsePanel}
                  className={`w-7 h-7 shrink-0 ml-auto ${SURFACE.iconButton}`}
                  aria-label={t('collapse')}
                  aria-expanded={true}
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              <div className="relative flex items-center px-2.5 pt-2 pb-2.5">
                <Search className="w-3.5 h-3.5 absolute left-5.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search')}
                  className={SURFACE.search}
                />
                {isSearching && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-4 w-6 h-6 ${SURFACE.iconButton}`}
                    aria-label={t('clearSearch')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1.5 select-none custom-scrollbar touch-pan-y">
              {!isFlagLoading && canUseAiGenerator && (
                <>
                  <div className="space-y-1">
                    <SectionHeader
                      tone="ai"
                      label={t('intelligence')}
                      isOpen={isAiOpen}
                      onToggle={() => setIsAiOpen(!isAiOpen)}
                    />

                    {isAiOpen && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setIsAiModalOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsAiModalOpen(true);
                          }
                        }}
                        className={AI.card}
                      >
                        <div className={AI.icon}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 pointer-events-none">
                          <div className="flex items-center gap-2">
                            <p className={AI.title}>{t('aiGenerator')}</p>
                            <span className={`ml-auto ${AI.kbd}`}>⌘J</span>
                          </div>
                          <p className={AI.desc}>{t('generatePrompt')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`mx-2 ${SURFACE.divider}`} />
                </>
              )}

              {/* Building Blocks */}
              {(!isSearching || filteredBlocks.length > 0) && (
                <div className="space-y-1">
                  <SectionHeader
                    label={t('buildingBlocks')}
                    count={filteredBlocks.length}
                    isOpen={isBlocksOpen}
                    onToggle={() => setIsBlocksOpen(!isBlocksOpen)}
                  />

                  {isBlocksOpen && (
                    <div className="space-y-0.5">
                      {filteredBlocks.map((item) => (
                        <div
                          key={item.type}
                          role="button"
                          tabIndex={0}
                          aria-label={item.label}
                          onPointerDown={(e) =>
                            handlePointerDown(e, item, true)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleTapToAddBlock(item.type);
                            }
                          }}
                          className={ROW.base}
                        >
                          <div className={ROW.icon}>{item.icon}</div>
                          <div className="min-w-0 flex-1 pointer-events-none">
                            <p className={ROW.title}>{item.label}</p>
                            <p className={ROW.desc}>{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isSearching && <div className={`mx-2 ${SURFACE.divider}`} />}

              {/* Page Frames */}
              {(!isSearching || filteredTemplates.length > 0) && (
                <div className="space-y-1">
                  <SectionHeader
                    label={t('pageFrames')}
                    count={filteredTemplates.length}
                    isOpen={isTemplatesOpen}
                    onToggle={() => setIsTemplatesOpen(!isTemplatesOpen)}
                  />

                  {isTemplatesOpen && (
                    <div className="space-y-0.5">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.type}
                          role="button"
                          tabIndex={0}
                          aria-label={template.label}
                          onPointerDown={(e) =>
                            handlePointerDown(e, template, false)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleTapToAddPage(template.type);
                            }
                          }}
                          className={ROW.base}
                        >
                          <div className={ROW.icon}>{template.icon}</div>
                          <div className="min-w-0 flex-1 pointer-events-none">
                            <p className={ROW.title}>{template.label}</p>
                            <p className={ROW.desc}>{template.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isSearching && !hasResults && (
                <div className="px-3 py-10 text-center space-y-1">
                  <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {t('noResults')}
                  </p>
                  <p className={SURFACE.hint}>{t('noResultsHint')}</p>
                </div>
              )}
            </div>

            <div className={`shrink-0 px-3 py-2 ${SURFACE.footer}`}>
              <p className={`${SURFACE.hint} truncate`}>{t('dragHint')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rail tooltip — rendered outside the clipped panel */}
      {isCollapsed && railTip && !activeDrag && (
        <div
          className={`${RAIL.tooltip} ${railTip.flip ? '-translate-x-full' : ''}`}
          style={{ left: railTip.x, top: railTip.y }}
          role="tooltip"
        >
          <p className={RAIL.tooltipTitle}>{railTip.label}</p>
          {railTip.description && (
            <p className={RAIL.tooltipDesc}>{railTip.description}</p>
          )}
        </div>
      )}

      {/* AI Modal */}
      {canUseAiGenerator && isAiModalOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center pointer-events-auto bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 w-96 animate-in zoom-in-95 fade-in">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider px-1">
              <Sparkles className="w-4 h-4" /> {t('aiGenerator')}
            </div>
            <textarea
              autoFocus
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                t('aiPlaceholder') || 'Describe what you want to build...'
              }
              className="w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-indigo-500/50 shadow-inner"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAiGenerate();
                }
                if (e.key === 'Escape') setIsAiModalOpen(false);
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono pl-1">
                {t('pressEnter') || 'Press Enter to generate'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-2 rounded-lg transition-colors"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all shadow-lg flex items-center gap-2"
                >
                  {isAiGenerating
                    ? t('building') || 'Building...'
                    : t('generate') || 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag Indicator */}
      {activeDrag && (
        <div
          className="fixed z-99999 pointer-events-none flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-900 border-2 border-blue-500 dark:border-blue-400 rounded-xl shadow-2xl scale-105"
          style={{ left: activeDrag.x + 15, top: activeDrag.y + 15 }}
        >
          <div className="p-1.5 bg-zinc-950 dark:bg-white rounded-lg text-white dark:text-zinc-950">
            {activeDrag.icon}
          </div>
          <div className="space-y-0.5 whitespace-nowrap pr-2">
            <p className="text-[12px] font-bold text-zinc-950 dark:text-white">
              {activeDrag.label}
            </p>
            <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              {t('dropToCanvas')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
