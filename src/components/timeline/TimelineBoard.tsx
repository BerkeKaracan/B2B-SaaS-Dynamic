'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/services/api';
// EKLENDİ: Mağazayı sadece gerekli parçalarla çekmek için import
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  MapPin,
  Clock,
  FileText,
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  BookmarkPlus,
  LayoutDashboard,
  X,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit2,
  Loader2,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NO PRIORITY';

const PRIORITIES: Record<TaskPriority, string> = {
  URGENT: '#E3123B',
  HIGH: '#7B323D',
  MEDIUM: '#93B27D',
  LOW: '#BEF109',
  'NO PRIORITY': '#B2BAAE',
};

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  URGENT: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  'NO PRIORITY': 1,
};

export interface TimelineEvent {
  id: string;
  monthKey: string;
  title: string;
  description?: string;
  place?: string;
  time?: string;
  notes?: string;
  assignee?: string;
  priority: TaskPriority;
  isDetailed: boolean;
}

export interface TimelineSavedView {
  id: string;
  name: string;
  filterQuery: string;
  filterPriority: TaskPriority | 'ALL';
  sortBy: 'manual' | 'priority';
}

const generateNextDays = (daysCount = 30) => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const current = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i
    );
    const dayName = current.toLocaleString('en-US', { weekday: 'short' });
    const monthName = current.toLocaleString('en-US', { month: 'short' });
    const dayNum = String(current.getDate()).padStart(2, '0');
    const monthNum = String(current.getMonth() + 1).padStart(2, '0');
    const year = current.getFullYear();

    days.push({
      key: `${year}-${monthNum}-${dayNum}`,
      year: year,
      dayNum: dayNum,
      dayName: dayName,
      monthName: monthName,
      isToday: i === 0,
    });
  }
  return days;
};

export default function TimelineBoard({ projectId }: { projectId: string }) {
  const params = useParams();
  const tenantId = params.tenantId as string;

  // EKLENDİ: Performans için tüm metadata yerine sadece gerekli verileri seçiyoruz
  const updateMetadata = useCanvasStore((state) => state.updateMetadata);
  const metadataEvents = useCanvasStore(
    (state) => state.metadata.timelineEvents as TimelineEvent[]
  );
  const metadataName = useCanvasStore((state) => state.metadata.name);

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [savedViews, setSavedViews] = useState<TimelineSavedView[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [timelineRecordId, setTimelineRecordId] = useState<string | null>(null);

  // EKLENDİ: İstenilene kadar gün sayısını artırabilmek için dinamik state
  const [daysCount, setDaysCount] = useState(30);
  const columns = useMemo(() => generateNextDays(daysCount), [daysCount]);

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

  // EKLENDİ: Sonsuz render döngüsünü kıran güvenlik kilidi
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
        toast.error('Failed to load timeline events from database.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimelineData();
  }, [tenantId, projectId]);

  // EKLENDİ: Yapay zekadan veya başka bir yerden veri geldiğinde çalışır
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return; // Biz sürükle-bırak yaptıysak kodu çalıştırma (FPS kurtarıcı)
    }

    if (metadataEvents) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvents(metadataEvents);

      if (metadataEvents.length > 0) {
        const sortedDates = metadataEvents
          .map((e) => new Date(e.monthKey).getTime())
          .sort((a, b) => b - a);
        const furthestDate = new Date(sortedDates[0]);
        const today = new Date();
        const diffTime = Math.abs(furthestDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > daysCount) {
          // Maksimum 60 güne kadar otomatik genişlet (Tarayıcı çökmesini engeller)
          setDaysCount(Math.min(diffDays + 15, 60));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadataEvents]);

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
      toast.error('Failed to sync with database.');
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
    setEvents(newEvents);
    isInternalUpdate.current = true; // Kilit devreye girer
    updateMetadata({ timelineEvents: newEvents }); // Mağazayı sorunsuzca günceller
    syncDataToDB(newEvents, savedViews);
  };

  const updateSavedViews = (newViews: TimelineSavedView[]) => {
    setSavedViews(newViews);
    syncDataToDB(events, newViews);
  };

  const handleDragEnd = (result: DropResult) => {
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
      toast('Sort automatically reset to Manual for Drag & Drop', {
        icon: 'ℹ️',
      });
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
    const duplicatedEvent: TimelineEvent = {
      ...eventToDuplicate,
      id: 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: `${eventToDuplicate.title} (Copy)`,
    };
    const updatedEvents = [...events, duplicatedEvent];
    updateEvents(updatedEvents);
    toast.success('Event duplicated successfully!');
    setOpenEventMenu(null);
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      const updatedEvents = events.filter((e) => e.id !== eventId);
      updateEvents(updatedEvents);
      toast.success('Event deleted!');
    }
    setOpenEventMenu(null);
  };

  const processSubmit = (addAnother: boolean = false) => {
    if (!formData.title?.trim()) {
      toast.error('Event title is required!');
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
      toast.success('Event updated!');
    } else {
      updatedEvents.push({
        ...(formData as TimelineEvent),
        id: 'evt-' + Date.now(),
        monthKey: activeMonthKey,
      });
      toast.success('Event added!');
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
    const viewName = prompt('Enter a name for this timeline view:');
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
    toast.success(`View "${viewName}" saved!`);
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
    e.stopPropagation();
    if (window.confirm('Delete this view?')) {
      const updatedViews = savedViews.filter((v) => v.id !== viewId);
      updateSavedViews(updatedViews);
      if (activeViewId === viewId) applyView(null);
      toast.success('View deleted.');
    }
  };

  if (!isClient) return null;

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-50">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="w-7 h-7 animate-spin text-zinc-500" />
          <span className="text-xs font-semibold tracking-wide">
            Loading Timeline...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent overflow-hidden select-none transition-colors duration-300">
      <div className="flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shrink-0 z-10">
        <div className="flex items-center justify-between px-4 md:px-5 h-14">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                {typeof metadataName === 'string' && metadataName
                  ? metadataName
                  : 'Timeline Planning'}
              </h2>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                Day lanes · Events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${isFilterOpen || filterQuery || filterPriority !== 'ALL' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <Filter className="w-3.5 h-3.5" /> Filter
                {(filterQuery || filterPriority !== 'ALL') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 ml-0.5" />
                )}
              </button>
              {isFilterOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
                        Search Content
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
                          placeholder="Title or Assignee..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
                        Priority Filter
                      </label>
                      <select
                        value={filterPriority}
                        onChange={(e) => {
                          setFilterPriority(
                            e.target.value as TaskPriority | 'ALL'
                          );
                          setActiveViewId(null);
                        }}
                        className="w-full px-2 py-1.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                      >
                        <option value="ALL">All Priorities</option>
                        {Object.keys(PRIORITIES).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
                      <button
                        onClick={handleSaveView}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <BookmarkPlus className="w-3 h-3" /> Save as Custom View
                      </button>
                      {(filterQuery || filterPriority !== 'ALL') && (
                        <button
                          onClick={() => applyView(null)}
                          className="w-full py-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${isSortOpen || sortBy !== 'manual' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort
                {sortBy !== 'manual' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 ml-0.5" />
                )}
              </button>
              {isSortOpen && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setSortBy('manual');
                        setActiveViewId(null);
                        setIsSortOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${sortBy === 'manual' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                    >
                      Manual (Drag & Drop)
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('priority');
                        setActiveViewId(null);
                        setIsSortOpen(false);
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${sortBy === 'priority' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                    >
                      Priority (High to Low)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 md:px-5 pb-2.5 overflow-x-auto custom-scrollbar hide-scrollbar-y">
          <button
            onClick={() => applyView(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${activeViewId === null ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Default View
          </button>

          {savedViews.map((view) => (
            <div key={view.id} className="flex items-center group relative shrink-0">
              <button
                onClick={() => applyView(view.id)}
                className={`flex items-center pr-6 pl-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${activeViewId === view.id ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
              >
                {view.name}
              </button>
              <button
                onClick={(e) => handleDeleteView(e, view.id)}
                className={`absolute right-1 w-4 h-4 rounded-md flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${activeViewId === view.id ? 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300' : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500'}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative w-full">
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar h-full">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 p-4 md:p-5 items-start h-full w-max">
              {columns.map((col) => {
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
                  <div
                    key={col.key}
                    className="w-[85vw] sm:w-[320px] shrink-0 flex flex-col max-h-full"
                  >
                    <div
                      className={`flex items-center justify-between p-3 mb-3 rounded-xl border shadow-sm shrink-0 transition-colors ${col.isToday ? 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-600 ring-1 ring-zinc-900/5 dark:ring-zinc-100/5' : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider ${col.isToday ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}
                        >
                          {col.monthName} {col.year}
                        </span>
                        <div className="flex items-end gap-1.5 mt-0.5">
                          <span
                            className={`text-2xl font-semibold leading-none tabular-nums tracking-tight ${col.isToday ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}
                          >
                            {col.dayNum}
                          </span>
                          <span
                            className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${col.isToday ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}
                          >
                            {col.dayName}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {col.isToday && (
                          <span className="px-2 py-0.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-semibold rounded-md uppercase tracking-wider">
                            Today
                          </span>
                        )}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold tabular-nums ${col.isToday ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80'}`}
                        >
                          {colEvents.length}
                        </div>
                      </div>
                    </div>

                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <div
                          className={`flex-1 overflow-y-auto p-2 flex flex-col gap-2.5 custom-scrollbar rounded-xl transition-colors min-h-[150px] ${snapshot.isDraggingOver ? 'bg-zinc-100/80 dark:bg-zinc-800/40 ring-1 ring-inset ring-zinc-300/60 dark:ring-zinc-600/40' : 'bg-transparent'}`}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {colEvents.length === 0 && (
                            <div className="flex flex-col items-center justify-center gap-1.5 py-6 px-3 text-center pointer-events-none">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center">
                                <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                              </div>
                              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                No events yet
                              </p>
                            </div>
                          )}
                          {colEvents.map((event, index) => {
                            const isDarkBg = [
                              'URGENT',
                              'HIGH',
                              'MEDIUM',
                            ].includes(event.priority);
                            const textColor = isDarkBg
                              ? 'text-white'
                              : 'text-zinc-900';
                            const mutedColor = isDarkBg
                              ? 'text-white/70'
                              : 'text-zinc-600';
                            const borderColor = isDarkBg
                              ? 'border-white/20'
                              : 'border-zinc-300';

                            return (
                              <Draggable
                                key={event.id}
                                draggableId={event.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => openModal(col.key, event)}
                                    className={`rounded-lg shadow-sm border border-black/5 flex flex-col cursor-grab active:cursor-grabbing hover:shadow transition-shadow ${snapshot.isDragging ? 'shadow-lg z-50 ring-2 ring-zinc-900/15' : ''} ${textColor}`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      backgroundColor:
                                        PRIORITIES[event.priority],
                                    }}
                                  >
                                    {!event.isDetailed ? (
                                      <div className="p-3 font-semibold text-sm text-center tracking-wide relative">
                                        <div className="absolute top-1.5 right-1.5">
                                          <button
                                            onMouseDown={(e) =>
                                              e.stopPropagation()
                                            }
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setOpenEventMenu(
                                                openEventMenu === event.id
                                                  ? null
                                                  : event.id
                                              );
                                            }}
                                            className={`event-menu-trigger p-1 rounded-md transition-colors ${isDarkBg ? 'hover:bg-white/20 text-white' : 'hover:bg-zinc-200/50 text-zinc-500'}`}
                                          >
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                          </button>
                                          {openEventMenu === event.id && (
                                            <div
                                              onMouseDown={(e) =>
                                                e.stopPropagation()
                                              }
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className="event-dropdown-menu absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 z-[70] animate-in fade-in zoom-in-95 cursor-default text-zinc-900 dark:text-zinc-100"
                                            >
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  openModal(col.key, event);
                                                  setOpenEventMenu(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />{' '}
                                                Edit
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDuplicateEvent(event);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                              >
                                                <Copy className="w-3.5 h-3.5" />{' '}
                                                Duplicate
                                              </button>
                                              <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDeleteEvent(
                                                    event.id,
                                                    event.title
                                                  );
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />{' '}
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        <span className="pr-4">
                                          {event.title}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="p-3.5 flex flex-col gap-2 relative">
                                        <div className="absolute top-2 right-2">
                                          <button
                                            onMouseDown={(e) =>
                                              e.stopPropagation()
                                            }
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setOpenEventMenu(
                                                openEventMenu === event.id
                                                  ? null
                                                  : event.id
                                              );
                                            }}
                                            className={`event-menu-trigger p-1.5 rounded-md transition-colors ${isDarkBg ? 'hover:bg-white/20 text-white' : 'hover:bg-zinc-200/50 text-zinc-500'}`}
                                          >
                                            <MoreHorizontal className="w-4 h-4" />
                                          </button>
                                          {openEventMenu === event.id && (
                                            <div
                                              onMouseDown={(e) =>
                                                e.stopPropagation()
                                              }
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className="event-dropdown-menu absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 z-[70] animate-in fade-in zoom-in-95 cursor-default text-zinc-900 dark:text-zinc-100"
                                            >
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  openModal(col.key, event);
                                                  setOpenEventMenu(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />{' '}
                                                Edit
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDuplicateEvent(event);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                              >
                                                <Copy className="w-3.5 h-3.5" />{' '}
                                                Duplicate
                                              </button>
                                              <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDeleteEvent(
                                                    event.id,
                                                    event.title
                                                  );
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />{' '}
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {event.assignee && (
                                          <div
                                            className={`text-[10px] font-semibold px-2 py-1 w-max rounded-md mb-1 ${isDarkBg ? 'bg-black/20' : 'bg-white/50 border border-zinc-300'} ${textColor}`}
                                          >
                                            For: {event.assignee}
                                          </div>
                                        )}
                                        <h4 className="text-sm font-semibold uppercase tracking-tight pr-6">
                                          {event.title}
                                        </h4>
                                        {event.description && (
                                          <p
                                            className={`text-xs font-medium line-clamp-2 ${mutedColor}`}
                                          >
                                            {event.description}
                                          </p>
                                        )}
                                        <div
                                          className={`w-full h-px my-1 ${borderColor}`}
                                        />
                                        <div className="flex flex-col gap-1.5 mt-1">
                                          {event.place && (
                                            <div
                                              className={`flex items-center gap-1.5 text-[11px] font-medium ${mutedColor}`}
                                            >
                                              <MapPin size={12} /> {event.place}
                                            </div>
                                          )}
                                          {event.time && (
                                            <div
                                              className={`flex items-center gap-1.5 text-[11px] font-medium ${mutedColor}`}
                                            >
                                              <Clock size={12} /> {event.time}
                                            </div>
                                          )}
                                          {event.notes && (
                                            <div
                                              className={`flex items-start gap-1.5 text-[11px] font-medium ${mutedColor}`}
                                            >
                                              <FileText
                                                size={12}
                                                className="shrink-0 mt-0.5"
                                              />{' '}
                                              <span className="line-clamp-2">
                                                {event.notes}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          <button
                            onClick={() => openModal(col.key)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-lg text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                          >
                            <Plus size={14} strokeWidth={2.5} /> Add Event
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}

              <div className="w-[120px] shrink-0 flex items-center justify-center h-full pb-10">
                <button
                  onClick={() => setDaysCount((prev) => prev + 30)}
                  className="flex flex-col items-center justify-center gap-2 p-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors h-[200px]"
                >
                  <ChevronRight size={28} strokeWidth={2} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-center">
                    Load
                    <br />
                    More
                    <br />
                    Days
                  </span>
                </button>
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>

      {isModalOpen && isClient && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-zinc-950/50 backdrop-blur-sm sm:p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-t-[24px] sm:rounded-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)] w-full max-w-md flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] border border-zinc-200/80 dark:border-zinc-700/80 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {editingEventId ? 'Edit Event' : 'Add Timeline Event'}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar pb-8 sm:pb-5">
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-xl">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 px-2">
                      Card Style
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isDetailed: false })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!formData.isDetailed ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700'}`}
                      >
                        Simple Block
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isDetailed: true })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${formData.isDetailed ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700'}`}
                      >
                        Detailed Card
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Target Date
                    </label>
                    <select
                      value={activeMonthKey}
                      onChange={(e) => setActiveMonthKey(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 cursor-pointer bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
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
                      Title
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                      placeholder="e.g. FUAR or MEETING"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Color / Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 cursor-pointer bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
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
                          Assignee / Connection
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
                          className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          placeholder="e.g. Mrs. John"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Description
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
                          className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 resize-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          placeholder="Event details..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Place
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
                            className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                            placeholder="Location..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Time
                          </label>
                          <input
                            type="text"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({ ...formData, time: e.target.value })
                            }
                            className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                            placeholder="e.g. 14:00 - 16:00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="w-full px-3 py-2.5 sm:py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 resize-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          placeholder="Extra informations..."
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
                          toast.success('Event deleted!');
                        }}
                        className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg mr-auto transition-colors"
                      >
                        Delete
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      Cancel
                    </button>

                    {!editingEventId && (
                      <button
                        type="button"
                        onClick={() => processSubmit(true)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-semibold rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors hidden sm:block"
                      >
                        Save & Add Another
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => processSubmit(false)}
                      className="px-5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                    >
                      {editingEventId ? 'Save Changes' : 'Save & Close'}
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
