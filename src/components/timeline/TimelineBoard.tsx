'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { fetchAPI } from '@/services/api';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useBoardPersistence } from '@/hooks/useBoardPersistence';
import {
  useHasProjectToolbarSlot,
  useProjectToolbarPortal,
} from '@/components/workspace/ProjectToolbarSlot';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  BookmarkPlus,
  LayoutDashboard,
  X,
  Loader2,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TimelineColumn from './TimelineColumn';
import {
  PRIORITIES,
  PRIORITY_WEIGHTS,
  SURFACE,
} from './timelineStyles';
import type {
  TaskPriority,
  TimelineDayColumn,
  TimelineEvent,
  TimelineSavedView,
} from './types';

export type { TaskPriority, TimelineEvent, TimelineSavedView };

const generateNextDays = (
  daysCount = 30,
  locale = 'en-US'
): TimelineDayColumn[] => {
  const days: TimelineDayColumn[] = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const current = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i
    );
    const dayName = current.toLocaleString(locale, { weekday: 'short' });
    const monthName = current.toLocaleString(locale, { month: 'short' });
    const dayNum = String(current.getDate()).padStart(2, '0');
    const monthNum = String(current.getMonth() + 1).padStart(2, '0');
    const year = current.getFullYear();
    const dow = current.getDay();

    days.push({
      key: `${year}-${monthNum}-${dayNum}`,
      year,
      dayNum,
      dayName,
      monthName,
      isToday: i === 0,
      isWeekend: dow === 0 || dow === 6,
    });
  }
  return days;
};

function TimelineBoard({ projectId }: { projectId: string }) {
  const t = useTranslations('TimelineBoard');
  const locale = useLocale();
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { isReadonly, dataSource, persist } = useBoardPersistence(projectId);

  const metadataName = useCanvasStore((state) => state.metadata.name);
  const scopedEvents = dataSource.timelineEvents as TimelineEvent[] | undefined;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [savedViews, setSavedViews] = useState<TimelineSavedView[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [timelineRecordId, setTimelineRecordId] = useState<string | null>(null);

  const [daysCount, setDaysCount] = useState(30);
  const columns = useMemo(
    () => generateNextDays(daysCount, dateLocale),
    [daysCount, dateLocale]
  );

  // Column windowing: 30-60 day lanes are 1,500-3,000 DOM nodes even empty.
  // Only lanes near the horizontal scroll window render fully; the rest are
  // same-width placeholders. During a dnd drag everything mounts (droppables
  // must be registered before capture).
  const COL_OVERSCAN = 3;
  const colScrollRef = useRef<HTMLDivElement>(null);
  const colWindowRafRef = useRef<number | null>(null);
  const [colWindow, setColWindow] = useState({ start: 0, end: 10 });
  const [isDraggingEvent, setIsDraggingEvent] = useState(false);

  const updateColWindow = useCallback(() => {
    const el = colScrollRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>('[data-timeline-col]');
    const colWidth = (first?.offsetWidth || 320) + 16; // + gap-4
    const start = Math.max(
      0,
      Math.floor(el.scrollLeft / colWidth) - COL_OVERSCAN
    );
    const end =
      Math.ceil((el.scrollLeft + el.clientWidth) / colWidth) + COL_OVERSCAN;
    setColWindow((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end }
    );
  }, []);

  const handleColScroll = useCallback(() => {
    if (colWindowRafRef.current != null) return;
    colWindowRafRef.current = requestAnimationFrame(() => {
      colWindowRafRef.current = null;
      updateColWindow();
    });
  }, [updateColWindow]);

  useEffect(() => {
    updateColWindow();
    window.addEventListener('resize', updateColWindow);
    return () => {
      window.removeEventListener('resize', updateColWindow);
      if (colWindowRafRef.current != null) {
        cancelAnimationFrame(colWindowRafRef.current);
        colWindowRafRef.current = null;
      }
    };
  }, [updateColWindow, daysCount]);

  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [openEventMenu, setOpenEventMenu] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<TimelineEvent>>({
    title: '',
    priority: 'NO PRIORITY',
    isDetailed: false,
  });
  const [activeMonthKey, setActiveMonthKey] = useState<string>('');

  const [filterQuery, setFilterQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>(
    'ALL'
  );
  const [sortBy, setSortBy] = useState<'manual' | 'priority'>('manual');

  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const isInternalUpdate = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const fetchTimelineData = async () => {
      if (!tenantId || !projectId) return;
      try {
        const res = await fetchAPI(
          `/api/records?tenant_id=${tenantId}&module_name=timeline_data_${projectId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const record = data[0];
            setTimelineRecordId(record.id);
            setEvents(record.record_data.events || []);
            setSavedViews(record.record_data.savedViews || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch timeline data', err);
        toast.error(t('toastLoadFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimelineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, projectId]);

  // AI / store push path — page-scoped on Infinite, metadata on standalone
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (scopedEvents) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvents(scopedEvents);

      if (scopedEvents.length > 0) {
        const sortedDates = scopedEvents
          .map((e) => new Date(e.monthKey).getTime())
          .sort((a, b) => b - a);
        const furthestDate = new Date(sortedDates[0]);
        const today = new Date();
        const diffTime = Math.abs(furthestDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > daysCount) {
          setDaysCount(Math.min(diffDays + 15, 60));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedEvents]);

  const syncDataToDB = async (
    newEvents: TimelineEvent[],
    newViews: TimelineSavedView[]
  ) => {
    const payload = {
      tenant_id: tenantId,
      module_name: `timeline_data_${projectId}`,
      record_data: {
        projectId,
        events: newEvents,
        savedViews: newViews,
      },
    };

    try {
      if (timelineRecordId) {
        await fetchAPI(`/api/records/${timelineRecordId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetchAPI(`/api/records`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newRecord = await res.json();
          setTimelineRecordId(newRecord.id);
        }
      }
    } catch (err) {
      console.error('Failed to sync timeline data', err);
      toast.error(t('toastSyncFailed'));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (filterRef.current && !filterRef.current.contains(target as Node))
        setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(target as Node))
        setIsSortOpen(false);

      if (target && typeof target.closest === 'function') {
        if (
          !target.closest('.event-dropdown-menu') &&
          !target.closest('.event-menu-trigger')
        ) {
          setOpenEventMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateEvents = (newEvents: TimelineEvent[]) => {
    if (isReadonly) return;
    setEvents(newEvents);
    isInternalUpdate.current = true;
    persist({ timelineEvents: newEvents });
    syncDataToDB(newEvents, savedViews);
  };

  const updateSavedViews = (newViews: TimelineSavedView[]) => {
    if (isReadonly) return;
    setSavedViews(newViews);
    syncDataToDB(events, newViews);
  };

  const handleDragEnd = (result: DropResult) => {
    if (isReadonly) return;
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (sortBy !== 'manual') {
      setSortBy('manual');
      setActiveViewId(null);
      toast(t('toastSortReset'), { icon: 'ℹ️' });
    }

    const draggedEvent = events.find((e) => e.id === draggableId);
    if (!draggedEvent) return;

    const newEvents = events.filter((e) => e.id !== draggableId);
    const updatedEvent = { ...draggedEvent, monthKey: destination.droppableId };

    const destColEvents = newEvents.filter(
      (e) => e.monthKey === destination.droppableId
    );
    destColEvents.splice(destination.index, 0, updatedEvent);

    const finalEvents = [
      ...newEvents.filter((e) => e.monthKey !== destination.droppableId),
      ...destColEvents,
    ];

    updateEvents(finalEvents);
  };

  const openModal = (monthKey: string, eventToEdit?: TimelineEvent) => {
    if (isReadonly) return;
    setActiveMonthKey(monthKey);
    if (eventToEdit) {
      setEditingEventId(eventToEdit.id);
      setFormData(eventToEdit);
    } else {
      setEditingEventId(null);
      setFormData({
        title: '',
        description: '',
        place: '',
        time: '',
        notes: '',
        assignee: '',
        priority: 'NO PRIORITY',
        isDetailed: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleDuplicateEvent = (eventToDuplicate: TimelineEvent) => {
    if (isReadonly) return;
    const duplicatedEvent: TimelineEvent = {
      ...eventToDuplicate,
      id: 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: `${eventToDuplicate.title} (Copy)`,
    };
    const updatedEvents = [...events, duplicatedEvent];
    updateEvents(updatedEvents);
    toast.success(t('toastDuplicated'));
    setOpenEventMenu(null);
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (isReadonly) return;
    if (window.confirm(t('confirmDeleteEvent', { title: eventTitle }))) {
      const updatedEvents = events.filter((e) => e.id !== eventId);
      updateEvents(updatedEvents);
      toast.success(t('toastDeleted'));
    }
    setOpenEventMenu(null);
  };

  const processSubmit = (addAnother: boolean = false) => {
    if (isReadonly) return;
    if (!formData.title?.trim()) {
      toast.error(t('toastTitleRequired'));
      return;
    }

    let updatedEvents = [...events];
    if (editingEventId) {
      updatedEvents = updatedEvents.map((ev) =>
        ev.id === editingEventId
          ? {
              ...(formData as TimelineEvent),
              id: editingEventId,
              monthKey: activeMonthKey,
            }
          : ev
      );
      toast.success(t('toastUpdated'));
    } else {
      updatedEvents.push({
        ...(formData as TimelineEvent),
        id: 'evt-' + Date.now(),
        monthKey: activeMonthKey,
      });
      toast.success(t('toastAdded'));
    }

    updateEvents(updatedEvents);

    if (addAnother) {
      setEditingEventId(null);
      setFormData({
        ...formData,
        title: '',
        description: '',
        place: '',
        time: '',
        notes: '',
        assignee: '',
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const handleSaveView = () => {
    if (isReadonly) return;
    const viewName = prompt(t('promptViewName'));
    if (!viewName?.trim()) return;

    const newView: TimelineSavedView = {
      id: 'view-tl-' + Date.now(),
      name: viewName,
      filterQuery,
      filterPriority,
      sortBy,
    };
    const updatedViews = [...savedViews, newView];
    updateSavedViews(updatedViews);
    setActiveViewId(newView.id);
    setIsFilterOpen(false);
    toast.success(t('toastViewSaved', { name: viewName }));
  };

  const applyView = (viewId: string | null) => {
    setActiveViewId(viewId);
    if (viewId === null) {
      setFilterQuery('');
      setFilterPriority('ALL');
      setSortBy('manual');
      return;
    }
    const view = savedViews.find((v) => v.id === viewId);
    if (view) {
      setFilterQuery(view.filterQuery);
      setFilterPriority(view.filterPriority);
      setSortBy(view.sortBy);
    }
  };

  const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
    if (isReadonly) return;
    e.stopPropagation();
    if (window.confirm(t('confirmDeleteView'))) {
      const updatedViews = savedViews.filter((v) => v.id !== viewId);
      updateSavedViews(updatedViews);
      if (activeViewId === viewId) applyView(null);
      toast.success(t('toastViewDeleted'));
    }
  };

  const hasToolbarSlot = useHasProjectToolbarSlot();

  const filterActive = Boolean(filterQuery || filterPriority !== 'ALL');

  const viewsControl = (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar hide-scrollbar-y max-w-[40vw] md:max-w-none">
      <button
        type="button"
        onClick={() => applyView(null)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
          activeViewId === null
            ? SURFACE.toolbarActive
            : SURFACE.toolbarIdle
        }`}
      >
        <LayoutDashboard className="w-3.5 h-3.5" /> {t('defaultView')}
      </button>
      {savedViews.map((view) => (
        <div key={view.id} className="flex items-center group relative shrink-0">
          <button
            type="button"
            onClick={() => applyView(view.id)}
            className={`flex items-center pr-6 pl-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeViewId === view.id
                ? SURFACE.toolbarActive
                : SURFACE.toolbarIdle
            }`}
          >
            {view.name}
          </button>
          <button
            type="button"
            onClick={(e) => handleDeleteView(e, view.id)}
            className={`absolute right-1 w-4 h-4 rounded-md flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${
              activeViewId === view.id
                ? 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500'
            }`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
    </div>
  );

  const filterControl = (
    <div className="relative overflow-visible" ref={filterRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSortOpen(false);
          setIsFilterOpen((open) => !open);
        }}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
          isFilterOpen || filterActive
            ? SURFACE.toolbarActive
            : SURFACE.toolbarIdle
        }`}
      >
        <Filter className="w-3.5 h-3.5" /> {t('filter')}
        {filterActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-0.5" />
        )}
      </button>
      {isFilterOpen && (
        <div
          className={`absolute top-full mt-2 right-0 w-64 ${SURFACE.panel} p-3 z-120 animate-in fade-in slide-in-from-top-2 duration-150`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
                {t('searchContent')}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => {
                    setFilterQuery(e.target.value);
                    setActiveViewId(null);
                  }}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 dark:focus:border-sky-600 transition-colors placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
                {t('priorityFilter')}
              </label>
              <select
                value={filterPriority}
                onChange={(e) => {
                  setFilterPriority(e.target.value as TaskPriority | 'ALL');
                  setActiveViewId(null);
                }}
                className="w-full px-2 py-1.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              >
                <option value="ALL">{t('allPriorities')}</option>
                {Object.keys(PRIORITIES).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleSaveView}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/50 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-950/60 transition-colors"
              >
                <BookmarkPlus className="w-3 h-3" /> {t('saveView')}
              </button>
              {filterActive && (
                <button
                  type="button"
                  onClick={() => applyView(null)}
                  className="w-full py-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const sortControl = (
    <div className="relative overflow-visible" ref={sortRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsFilterOpen(false);
          setIsSortOpen((open) => !open);
        }}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
          isSortOpen || sortBy !== 'manual'
            ? SURFACE.toolbarActive
            : SURFACE.toolbarIdle
        }`}
      >
        <ArrowUpDown className="w-3.5 h-3.5" /> {t('sort')}
        {sortBy !== 'manual' && (
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-0.5" />
        )}
      </button>
      {isSortOpen && (
        <div
          className={`absolute top-full mt-2 right-0 w-48 ${SURFACE.panel} p-1.5 z-120 animate-in fade-in slide-in-from-top-2 duration-150`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                setSortBy('manual');
                setActiveViewId(null);
                setIsSortOpen(false);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${
                sortBy === 'manual'
                  ? SURFACE.toolbarActive
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {t('sortManual')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSortBy('priority');
                setActiveViewId(null);
                setIsSortOpen(false);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${
                sortBy === 'priority'
                  ? SURFACE.toolbarActive
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {t('sortPriority')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const toolbarActions = (
    <div className="flex items-center gap-1.5 shrink-0 overflow-visible">
      {viewsControl}
      <div className="hidden sm:block w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
      {filterControl}
      {sortControl}
    </div>
  );

  const portaledToolbar = useProjectToolbarPortal(toolbarActions);

  if (!isClient) return null;

  if (isLoading) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center ${SURFACE.stage} z-50`}
      >
        <div className="flex flex-col items-center gap-3 text-zinc-400 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-md animate-pulse" />
            <Loader2 className="relative w-7 h-7 animate-spin text-sky-600 dark:text-sky-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('loading')}
          </span>
        </div>
      </div>
    );
  }

  const cardLabels = {
    for: t('for'),
    edit: t('edit'),
    duplicate: t('duplicate'),
    delete: t('delete'),
    addEvent: t('addEvent'),
    emptyDay: t('emptyDay'),
    emptyDayHint: t('emptyDayHint'),
    today: t('today'),
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col ${SURFACE.stage} overflow-hidden select-none transition-colors duration-300`}
    >
      {portaledToolbar}
      {!hasToolbarSlot && (
        <div className={`flex flex-col ${SURFACE.chrome} shrink-0 z-10`}>
          <div className="flex items-center justify-between px-4 md:px-5 h-14 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200/70 dark:border-sky-800/50 shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                  {typeof metadataName === 'string' && metadataName
                    ? metadataName
                    : t('title')}
                </h2>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                  {t('subtitle', {
                    days: columns.length,
                    events: events.length,
                  })}
                </p>
              </div>
            </div>
            {toolbarActions}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative w-full min-h-0">
        <div
          ref={colScrollRef}
          onScroll={handleColScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar h-full min-h-0"
        >
          <DragDropContext
            onBeforeCapture={() => setIsDraggingEvent(true)}
            onDragEnd={(result) => {
              setIsDraggingEvent(false);
              handleDragEnd(result);
            }}
          >
            <div className="flex gap-3.5 md:gap-4 p-3.5 md:p-5 items-stretch h-full w-max min-h-0">
              {columns.map((col, colIndex) => {
                if (
                  !isDraggingEvent &&
                  (colIndex < colWindow.start || colIndex >= colWindow.end)
                ) {
                  return (
                    <div
                      key={col.key}
                      data-timeline-col
                      className="w-[85vw] sm:w-[320px] shrink-0 h-full rounded-2xl"
                    />
                  );
                }

                const colEvents = events
                  .filter((e) => e.monthKey === col.key)
                  .filter((e) => {
                    if (filterQuery) {
                      const q = filterQuery.toLowerCase();
                      if (
                        !e.title.toLowerCase().includes(q) &&
                        !(e.assignee || '').toLowerCase().includes(q)
                      )
                        return false;
                    }
                    if (
                      filterPriority !== 'ALL' &&
                      e.priority !== filterPriority
                    )
                      return false;
                    return true;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'priority')
                      return (
                        PRIORITY_WEIGHTS[b.priority] -
                        PRIORITY_WEIGHTS[a.priority]
                      );
                    return 0;
                  });

                return (
                  <TimelineColumn
                    key={col.key}
                    column={col}
                    events={colEvents}
                    isReadonly={isReadonly}
                    openEventMenu={openEventMenu}
                    labels={cardLabels}
                    onAddEvent={(monthKey) => openModal(monthKey)}
                    onToggleMenu={(eventId) =>
                      setOpenEventMenu(
                        openEventMenu === eventId ? null : eventId
                      )
                    }
                    onCloseMenu={() => setOpenEventMenu(null)}
                    onEdit={(monthKey, event) => openModal(monthKey, event)}
                    onDuplicate={handleDuplicateEvent}
                    onDelete={handleDeleteEvent}
                  />
                );
              })}

              <div className="w-28 shrink-0 flex items-center justify-center h-full pb-8">
                <button
                  type="button"
                  onClick={() => setDaysCount((prev) => prev + 30)}
                  className="group flex flex-col items-center justify-center gap-2.5 p-4 text-zinc-400 dark:text-zinc-500 hover:text-sky-700 dark:hover:text-sky-300 bg-white/50 dark:bg-zinc-900/40 hover:bg-sky-50/80 dark:hover:bg-sky-950/30 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-200 h-52 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/50 border border-zinc-200 dark:border-zinc-700 group-hover:border-sky-300 dark:group-hover:border-sky-700 flex items-center justify-center transition-colors">
                    <ChevronRight
                      size={22}
                      strokeWidth={2.25}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
                    {t('loadMoreDays')}
                  </span>
                </button>
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>

      {isModalOpen && isClient && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-99999 flex items-end sm:items-center justify-center bg-zinc-950/50 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)] w-full max-w-md flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] border border-zinc-200/80 dark:border-zinc-700/80 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-sky-50/80 via-zinc-50/80 to-zinc-50/80 dark:from-sky-950/30 dark:via-zinc-900/80 dark:to-zinc-900/80 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800/50 shrink-0">
                      <CalendarDays className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                      {editingEventId ? t('modalEdit') : t('modalAdd')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar pb-8 sm:pb-5">
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-xl">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 px-2">
                      {t('cardStyle')}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isDetailed: false })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                          !formData.isDetailed
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100 border border-sky-200/80 dark:border-sky-700/60 ring-1 ring-sky-500/15'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {t('simpleBlock')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isDetailed: true })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                          formData.isDetailed
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100 border border-sky-200/80 dark:border-sky-700/60 ring-1 ring-sky-500/15'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {t('detailedCard')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                      {t('targetDate')}
                    </label>
                    <select
                      value={activeMonthKey}
                      onChange={(e) => setActiveMonthKey(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 cursor-pointer bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                    >
                      {columns.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.dayNum} {col.monthName} {col.year} ({col.dayName}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                      {t('modalTitle')}
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                      placeholder={t('titlePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                      {t('modalPriority')}
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 cursor-pointer bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                    >
                      {Object.keys(PRIORITIES).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.isDetailed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                          {t('modalAssignee')}
                        </label>
                        <input
                          type="text"
                          value={formData.assignee}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              assignee: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          placeholder={t('assigneePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                          {t('modalDesc')}
                        </label>
                        <textarea
                          rows={2}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 resize-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          placeholder={t('descPlaceholder')}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                            {t('modalPlace')}
                          </label>
                          <input
                            type="text"
                            value={formData.place}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                place: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                            placeholder={t('placePlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                            {t('modalTime')}
                          </label>
                          <input
                            type="text"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({ ...formData, time: e.target.value })
                            }
                            className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                            placeholder={t('timePlaceholder')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                          {t('modalNotes')}
                        </label>
                        <textarea
                          rows={2}
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 resize-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          placeholder={t('notesPlaceholder')}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2 shrink-0 mt-4 sticky bottom-0 bg-white dark:bg-zinc-900">
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={() => {
                          updateEvents(
                            events.filter((e) => e.id !== editingEventId)
                          );
                          setIsModalOpen(false);
                          toast.success(t('toastDeleted'));
                        }}
                        className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg mr-auto transition-colors"
                      >
                        {t('delete')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      {t('cancel')}
                    </button>

                    {!editingEventId && (
                      <button
                        type="button"
                        onClick={() => processSubmit(true)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-semibold rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors hidden sm:inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('saveAddAnother')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => processSubmit(false)}
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/25 transition-colors"
                    >
                      {editingEventId ? t('saveChanges') : t('saveClose')}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

// Memo: props are just a stable projectId — renderedPages recomputes in
// CanvasArea must not re-render every mounted board.
export default React.memo(TimelineBoard);
