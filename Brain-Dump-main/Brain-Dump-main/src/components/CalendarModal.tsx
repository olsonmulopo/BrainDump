import React, { useState, useMemo } from 'react';
import {
  WorkspaceData,
  CalendarEvent,
  CalendarEventCategory,
  CalendarCardItem,
  TodoCardItem,
  CanvasItem,
} from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ArrowRight,
  Folder,
  Trash2,
  CalendarDays,
  ListTodo,
  Download,
  Bell,
  Flame,
  LayoutList,
} from 'lucide-react';
import { exportToIcs } from '../utils/icalExport';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceData;
  onAddEventToCard?: (cardId: string, event: CalendarEvent) => void;
  onAddCalendarCardToBoard?: () => void;
  onNavigateBoard?: (boardId: string) => void;
  onNavigateToItem?: (boardId: string, cardId: string) => void;
  onUpdateWorkspace?: (updater: (prev: WorkspaceData) => WorkspaceData) => void;
}

const CATEGORY_COLORS: Record<CalendarEventCategory, { bg: string; text: string; dot: string }> = {
  Deadline: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  Milestone: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  Meeting: { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
  Task: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Review: { bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  Personal: { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
};

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onAddCalendarCardToBoard,
  onNavigateBoard,
  onNavigateToItem,
  onUpdateWorkspace,
}) => {
  const isDark = workspace.settings?.theme === 'dark';
  const todayIso = formatIso(new Date());

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda' | 'day'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(todayIso);
  const [eventTime, setEventTime] = useState('');
  const [eventCategory, setEventCategory] = useState<CalendarEventCategory>('Deadline');
  const [eventNotes, setEventNotes] = useState('');
  const [eventReminder, setEventReminder] = useState<number>(0);
  const [eventPriority, setEventPriority] = useState<'low' | 'medium' | 'high'>('medium');

  if (!isOpen) return null;

  // Aggregate all events from all CalendarCardItems across workspace
  const calendarCards = Object.values(workspace.items).filter(
    (it): it is CalendarCardItem => it.type === 'calendar'
  );

  // Aggregate all deadlines from all TodoCardItems across workspace
  const allDeadlines: Array<{
    id: string;
    boardId: string;
    boardTitle: string;
    cardId: string;
    cardTitle: string;
    text: string;
    date: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
  }> = [];

  Object.values(workspace.items).forEach((item) => {
    if (item.type === 'todo') {
      const todoCard = item as TodoCardItem;
      const bTitle = workspace.boards[item.boardId]?.title || 'Board';
      (todoCard.todos || []).forEach((t) => {
        if (t.dueDate) {
          allDeadlines.push({
            id: `td-${todoCard.id}-${t.id}`,
            boardId: item.boardId,
            boardTitle: bTitle,
            cardId: todoCard.id,
            cardTitle: todoCard.title || 'Tasks',
            text: t.text,
            date: t.dueDate,
            completed: t.completed,
            priority: t.priority,
          });
        }
      });
    }
  });

  // Collect all events from calendar cards
  const allCardEvents: Array<{
    id: string;
    boardId: string;
    boardTitle: string;
    cardId: string;
    title: string;
    date: string;
    time?: string;
    category: CalendarEventCategory;
    completed?: boolean;
    notes?: string;
  }> = [];

  calendarCards.forEach((card) => {
    const bTitle = workspace.boards[card.boardId]?.title || 'Board';
    (card.events || []).forEach((ev) => {
      allCardEvents.push({
        id: ev.id,
        boardId: card.boardId,
        boardTitle: bTitle,
        cardId: card.id,
        title: ev.title,
        date: ev.date,
        time: ev.time,
        category: ev.category || 'Deadline',
        completed: ev.completed,
        notes: ev.notes,
      });
    });
  });

  // Filter items
  const filteredEvents = allCardEvents.filter((ev) => {
    if (selectedCategory !== 'All' && ev.category !== selectedCategory) return false;
    if (selectedBoardId !== 'all' && ev.boardId !== selectedBoardId) return false;
    return true;
  });

  const filteredDeadlines = allDeadlines.filter((dl) => {
    if (selectedCategory !== 'All' && selectedCategory !== 'Deadline' && selectedCategory !== 'Task') return false;
    if (selectedBoardId !== 'all' && dl.boardId !== selectedBoardId) return false;
    return true;
  });

  // Map events and deadlines by date
  const eventsByDate: Record<
    string,
    Array<{
      id: string;
      title: string;
      time?: string;
      category: CalendarEventCategory;
      completed?: boolean;
      boardId: string;
      boardTitle: string;
      cardId: string;
      isDeadline?: boolean;
    }>
  > = {};

  filteredEvents.forEach((ev) => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push({
      id: ev.id,
      title: ev.title,
      time: ev.time,
      category: ev.category,
      completed: ev.completed,
      boardId: ev.boardId,
      boardTitle: ev.boardTitle,
      cardId: ev.cardId,
      isDeadline: false,
    });
  });

  filteredDeadlines.forEach((dl) => {
    if (!eventsByDate[dl.date]) eventsByDate[dl.date] = [];
    eventsByDate[dl.date].push({
      id: dl.id,
      title: dl.text,
      category: 'Deadline',
      completed: dl.completed,
      boardId: dl.boardId,
      boardTitle: dl.boardTitle,
      cardId: dl.cardId,
      isDeadline: true,
    });
  });

  // Month data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const days: Array<{ date: Date; iso: string; isCurrentMonth: boolean; isToday: boolean }> = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const iso = formatIso(d);
    days.push({ date: d, iso, isCurrentMonth: false, isToday: iso === todayIso });
  }

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    const iso = formatIso(d);
    days.push({ date: d, iso, isCurrentMonth: true, isToday: iso === todayIso });
  }

  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const iso = formatIso(d);
    days.push({ date: d, iso, isCurrentMonth: false, isToday: iso === todayIso });
  }

  // Handle adding an event to a calendar card or creating one
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: eventTitle.trim(),
      date: eventDate,
      time: eventTime || undefined,
      category: eventCategory,
      notes: eventNotes.trim() || undefined,
      reminderMinutesBefore: eventReminder > 0 ? eventReminder : undefined,
      priority: eventPriority,
      completed: false,
    };

    if (onUpdateWorkspace) {
      onUpdateWorkspace((prev) => {
        // Find first calendar card on current board, or on any board
        const existingCard = Object.values(prev.items).find(
          (it): it is CalendarCardItem => it.type === 'calendar' && it.boardId === prev.currentBoardId
        ) || Object.values(prev.items).find(
          (it): it is CalendarCardItem => it.type === 'calendar'
        );

        if (existingCard) {
          return {
            ...prev,
            items: {
              ...prev.items,
              [existingCard.id]: {
                ...existingCard,
                events: [...(existingCard.events || []), newEv],
                updatedAt: Date.now(),
              },
            },
          };
        } else {
          // Create a new calendar card on current board!
          const newCardId = `calendar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const newCalendarCard: CalendarCardItem = {
            id: newCardId,
            boardId: prev.currentBoardId,
            type: 'calendar',
            x: 200,
            y: 160,
            width: 440,
            title: 'Workspace Calendar',
            viewMode: 'month',
            currentDate: eventDate,
            events: [newEv],
            showConnectedDeadlines: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          return {
            ...prev,
            items: {
              ...prev.items,
              [newCardId]: newCalendarCard,
            },
          };
        }
      });
    }

    setEventTitle('');
    setEventTime('');
    setEventNotes('');
    setShowAddModal(false);
  };

  const handleToggleEvent = (cardId: string, eventId: string, isDeadline?: boolean) => {
    if (!onUpdateWorkspace) return;
    onUpdateWorkspace((prev) => {
      if (isDeadline) {
        const todoCard = prev.items[cardId] as TodoCardItem | undefined;
        if (!todoCard || todoCard.type !== 'todo') return prev;
        const tId = eventId.replace(`td-${todoCard.id}-`, '');
        return {
          ...prev,
          items: {
            ...prev.items,
            [cardId]: {
              ...todoCard,
              todos: (todoCard.todos || []).map((t) =>
                t.id === tId ? { ...t, completed: !t.completed } : t
              ),
              updatedAt: Date.now(),
            },
          },
        };
      }

      const card = prev.items[cardId] as CalendarCardItem | undefined;
      if (!card || card.type !== 'calendar') return prev;
      return {
        ...prev,
        items: {
          ...prev.items,
          [cardId]: {
            ...card,
            events: (card.events || []).map((ev) =>
              ev.id === eventId ? { ...ev, completed: !ev.completed } : ev
            ),
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  const handleDeleteCalendarEvent = (cardId: string, eventId: string) => {
    if (!onUpdateWorkspace) return;
    onUpdateWorkspace((prev) => {
      const card = prev.items[cardId] as CalendarCardItem | undefined;
      if (!card || card.type !== 'calendar') return prev;
      return {
        ...prev,
        items: {
          ...prev.items,
          [cardId]: {
            ...card,
            events: (card.events || []).filter((ev) => ev.id !== eventId),
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl h-[88vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
              <CalendarIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Calendar & Deadline Planner</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {Object.keys(eventsByDate).length} active dates
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Unified workspace schedule: milestones, meetings, deadlines & card tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export to .ics */}
            <button
              type="button"
              onClick={() => {
                const exportList = [
                  ...allCardEvents.map((e) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    time: e.time,
                    category: e.category,
                    notes: e.notes,
                    boardTitle: e.boardTitle,
                  })),
                  ...allDeadlines.map((d) => ({
                    id: d.id,
                    title: d.text,
                    date: d.date,
                    category: 'Deadline',
                    notes: `Task from card "${d.cardTitle}"`,
                    boardTitle: d.boardTitle,
                  })),
                ];
                exportToIcs(exportList, 'Brain-Dump-Schedule');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shadow-2xs"
              title="Export workspace events and deadlines to .ics for Google/Apple Calendar"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Export .ics</span>
            </button>

            {/* Add Calendar Card to Canvas */}
            {onAddCalendarCardToBoard && (
              <button
                type="button"
                onClick={() => {
                  onAddCalendarCardToBoard();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Calendar Card to Canvas</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Navigation Toolbar */}
        <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() - 1);
                setCurrentDate(d);
              }}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold min-w-[130px] text-center select-none">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>

            <button
              type="button"
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() + 1);
                setCurrentDate(d);
              }}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Agenda
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'day'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                Day Schedule
              </button>
            </div>

            {/* Quick Add Event */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Categories Bar & Board Filter */}
        <div className="px-6 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1">
            {['All', 'Deadline', 'Milestone', 'Meeting', 'Task', 'Review', 'Personal'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Board:</span>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className={`px-2 py-1 rounded-lg border outline-none text-xs ${
                isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
              }`}
            >
              <option value="all">All Boards</option>
              {Object.values(workspace.boards).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'month' ? (
            <div className="h-full flex flex-col">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                <span>Monday</span>
                <span>Tuesday</span>
                <span>Wednesday</span>
                <span>Thursday</span>
                <span>Friday</span>
                <span>Saturday</span>
                <span>Sunday</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                {days.map((day) => {
                  const dayEvents = eventsByDate[day.iso] || [];

                  return (
                    <div
                      key={day.iso}
                      onClick={() => {
                        setEventDate(day.iso);
                        setShowAddModal(true);
                      }}
                      className={`p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer min-h-[90px] ${
                        day.isToday
                          ? isDark
                            ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/50'
                            : 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/50'
                          : isDark
                          ? day.isCurrentMonth
                            ? 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-700'
                            : 'border-neutral-900/50 bg-neutral-950/20 opacity-30'
                          : day.isCurrentMonth
                          ? 'border-neutral-200/80 bg-white hover:bg-neutral-50/80 hover:border-neutral-300'
                          : 'border-neutral-100 bg-neutral-50/30 opacity-30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            day.isToday
                              ? 'bg-indigo-600 text-white'
                              : day.isCurrentMonth
                              ? isDark
                                ? 'text-neutral-200'
                                : 'text-neutral-800'
                              : 'text-neutral-400'
                          }`}
                        >
                          {day.date.getDate()}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1 mt-1.5 overflow-hidden flex-1">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const catStyle = CATEGORY_COLORS[ev.category];

                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (ev.boardId && onNavigateBoard) {
                                  onNavigateBoard(ev.boardId);
                                  onClose();
                                }
                              }}
                              className={`p-1 rounded-md text-[10px] font-medium truncate flex items-center justify-between gap-1 group/chip transition-all ${
                                catStyle.bg
                              } ${catStyle.text} hover:scale-[1.02]`}
                              title={`${ev.title} (${ev.boardTitle})`}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catStyle.dot}`} />
                                <span className={`truncate ${ev.completed ? 'line-through opacity-50' : ''}`}>
                                  {ev.title}
                                </span>
                              </div>
                              <span className="text-[8px] opacity-60 shrink-0 uppercase">{ev.category.slice(0, 4)}</span>
                            </div>
                          );
                        })}

                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-neutral-400 block text-right font-medium">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'agenda' ? (
            /* Agenda List View */
            <div className="max-w-2xl mx-auto space-y-4">
              {Object.keys(eventsByDate).length === 0 ? (
                <div className="py-16 text-center text-neutral-400">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No events or deadlines match the current filter.</p>
                  <p className="text-xs mt-1">Click "New Event" to add a milestone or due date.</p>
                </div>
              ) : (
                Object.entries(eventsByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateIso, evList]) => {
                    const d = new Date(dateIso + 'T00:00:00');
                    const isToday = dateIso === todayIso;

                    return (
                      <div
                        key={dateIso}
                        className={`rounded-2xl border p-4 transition-all ${
                          isToday
                            ? isDark
                              ? 'bg-indigo-950/20 border-indigo-500/50'
                              : 'bg-indigo-50/40 border-indigo-300'
                            : isDark
                            ? 'bg-neutral-800/40 border-neutral-800'
                            : 'bg-white border-neutral-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold ${
                                isToday ? 'text-indigo-600 dark:text-indigo-400' : ''
                              }`}
                            >
                              {d.toLocaleDateString('default', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">{dateIso}</span>
                        </div>

                        <div className="space-y-2">
                          {evList.map((ev) => {
                            const catStyle = CATEGORY_COLORS[ev.category];

                            return (
                              <div
                                key={ev.id}
                                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border text-xs transition-colors ${
                                  isDark ? 'bg-neutral-900 border-neutral-700/80' : 'bg-neutral-50/70 border-neutral-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEvent(ev.cardId, ev.id, ev.isDeadline)}
                                    className="text-neutral-400 hover:text-emerald-500 cursor-pointer shrink-0 transition-colors"
                                    title={ev.completed ? 'Mark incomplete' : 'Mark complete'}
                                  >
                                    {ev.completed ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <span
                                      className={`font-semibold text-xs block truncate ${
                                        ev.completed ? 'line-through opacity-50' : ''
                                      }`}
                                    >
                                      {ev.title}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                                      <span className="flex items-center gap-0.5">
                                        <Folder className="w-3 h-3" />
                                        {ev.boardTitle}
                                      </span>
                                      {ev.time && (
                                        <span className="flex items-center gap-0.5">
                                          <Clock className="w-3 h-3" />
                                          {ev.time}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                 <div className="flex items-center gap-2 shrink-0">
                                   <span
                                     className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${catStyle.bg} ${catStyle.text}`}
                                   >
                                     {ev.category}
                                   </span>

                                   {onNavigateToItem ? (
                                     <button
                                       type="button"
                                       onClick={() => {
                                         onNavigateToItem(ev.boardId, ev.cardId);
                                         onClose();
                                       }}
                                       className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                       title="Jump to this card on canvas"
                                     >
                                       <ArrowRight className="w-3.5 h-3.5" />
                                     </button>
                                   ) : onNavigateBoard ? (
                                     <button
                                       type="button"
                                       onClick={() => {
                                         onNavigateBoard(ev.boardId);
                                         onClose();
                                       }}
                                       className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                       title="Jump to board"
                                     >
                                       <ArrowRight className="w-3.5 h-3.5" />
                                     </button>
                                   ) : null}

                                   {!ev.isDeadline && (
                                     <button
                                       type="button"
                                       onClick={() => handleDeleteCalendarEvent(ev.cardId, ev.id)}
                                       className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                       title="Delete event"
                                     >
                                       <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                   )}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     );
                   })
               )}
             </div>
           ) : (
             /* Day Schedule Timeline View */
             <div className="max-w-2xl mx-auto space-y-4">
               {/* Day Header */}
               <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                 <div>
                   <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                     Day Planner Timeline
                   </span>
                   <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                     {currentDate.toLocaleDateString('default', {
                       weekday: 'long',
                       month: 'long',
                       day: 'numeric',
                       year: 'numeric',
                     })}
                   </h3>
                 </div>
                 <button
                   type="button"
                   onClick={() => {
                     setEventDate(formatIso(currentDate));
                     setShowAddModal(true);
                   }}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-xs"
                 >
                   <Plus className="w-3.5 h-3.5" />
                   <span>Add to this Day</span>
                 </button>
               </div>

               {/* Hourly Breakdown (08:00 to 20:00) */}
               <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                 {/* All Day / Untimed items for this day */}
                 {(() => {
                   const currIso = formatIso(currentDate);
                   const todayItems = eventsByDate[currIso] || [];
                   const allDayItems = todayItems.filter((i) => !i.time);

                   if (allDayItems.length === 0) return null;

                   return (
                     <div className="p-3 bg-neutral-50/80 dark:bg-neutral-800/40">
                       <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                         All Day / Anytime
                       </span>
                       <div className="space-y-1.5">
                         {allDayItems.map((item) => {
                           const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Task;
                           return (
                             <div
                               key={item.id}
                               className={`p-2 rounded-xl border flex items-center justify-between text-xs ${catStyle.bg} ${catStyle.text}`}
                             >
                               <div className="flex items-center gap-2">
                                 <button
                                   type="button"
                                   onClick={() => handleToggleEvent(item.cardId, item.id, item.isDeadline)}
                                   className="cursor-pointer"
                                 >
                                   {item.completed ? (
                                     <CheckSquare className="w-4 h-4 text-emerald-500" />
                                   ) : (
                                     <Square className="w-4 h-4" />
                                   )}
                                 </button>
                                 <span className={`font-semibold ${item.completed ? 'line-through opacity-50' : ''}`}>
                                   {item.title}
                                 </span>
                               </div>
                               {onNavigateToItem && (
                                 <button
                                   type="button"
                                   onClick={() => {
                                     onNavigateToItem(item.boardId, item.cardId);
                                     onClose();
                                   }}
                                   className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                   title="Jump to card"
                                 >
                                   <ArrowRight className="w-3.5 h-3.5" />
                                 </button>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   );
                 })()}

                 {/* Hourly rows */}
                 {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => {
                   const currIso = formatIso(currentDate);
                   const hourPrefix = String(hour).padStart(2, '0') + ':';
                   const hourItems = (eventsByDate[currIso] || []).filter((i) => i.time && i.time.startsWith(hourPrefix));
                   const timeLabel = hour === 12 ? '12:00 PM' : hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;

                   return (
                     <div
                       key={hour}
                       className="flex items-start gap-3 p-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group"
                     >
                       <span className="w-16 text-right font-mono text-[11px] font-semibold text-neutral-400 pt-0.5 shrink-0">
                         {timeLabel}
                       </span>

                       <div className="flex-1 min-w-0">
                         {hourItems.length === 0 ? (
                           <button
                             type="button"
                             onClick={() => {
                               setEventDate(currIso);
                               setEventTime(String(hour).padStart(2, '0') + ':00');
                               setShowAddModal(true);
                             }}
                             className="opacity-0 group-hover:opacity-100 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium transition-opacity flex items-center gap-1 cursor-pointer"
                           >
                             <Plus className="w-3 h-3" />
                             <span>Add event at {timeLabel}</span>
                           </button>
                         ) : (
                           <div className="space-y-1.5">
                             {hourItems.map((item) => {
                               const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Task;
                               return (
                                 <div
                                   key={item.id}
                                   className={`p-2 rounded-xl border flex items-center justify-between text-xs ${catStyle.bg} ${catStyle.text}`}
                                 >
                                   <div className="flex items-center gap-2">
                                     <button
                                       type="button"
                                       onClick={() => handleToggleEvent(item.cardId, item.id, item.isDeadline)}
                                       className="cursor-pointer"
                                     >
                                       {item.completed ? (
                                         <CheckSquare className="w-4 h-4 text-emerald-500" />
                                       ) : (
                                         <Square className="w-4 h-4" />
                                       )}
                                     </button>
                                     <span className={`font-semibold ${item.completed ? 'line-through opacity-50' : ''}`}>
                                       {item.title}
                                     </span>
                                     <span className="font-mono text-[10px] opacity-75">
                                       ({item.time})
                                     </span>
                                   </div>
                                   {onNavigateToItem && (
                                     <button
                                       type="button"
                                       onClick={() => {
                                         onNavigateToItem(item.boardId, item.cardId);
                                         onClose();
                                       }}
                                       className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                       title="Jump to card"
                                     >
                                       <ArrowRight className="w-3.5 h-3.5" />
                                     </button>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
         </div>

         {/* Quick Add Event Dialog Overlay */}
         {showAddModal && (
           <div
             className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in"
             onClick={() => setShowAddModal(false)}
           >
             <form
               onSubmit={handleSaveEvent}
               onClick={(e) => e.stopPropagation()}
               className={`w-full max-w-md p-5 rounded-2xl border shadow-2xl space-y-3 ${
                 isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
               }`}
             >
               <div className="flex items-center justify-between">
                 <h3 className="text-sm font-bold flex items-center gap-1.5">
                   <Sparkles className="w-4 h-4 text-indigo-500" />
                   Add Event / Milestone
                 </h3>
                 <button
                   type="button"
                   onClick={() => setShowAddModal(false)}
                   className="p-1 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>

               <div>
                 <label className="text-xs font-semibold text-neutral-500 block mb-1">Title</label>
                 <input
                   type="text"
                   value={eventTitle}
                   onChange={(e) => setEventTitle(e.target.value)}
                   placeholder="e.g. Video 1 Deadline, Final Product Review..."
                   autoFocus
                   className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                     isDark
                       ? 'bg-neutral-800 border-neutral-700 text-white focus:border-indigo-500'
                       : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500'
                   }`}
                 />
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-xs font-semibold text-neutral-500 block mb-1">Date</label>
                   <input
                     type="date"
                     value={eventDate}
                     onChange={(e) => setEventDate(e.target.value)}
                     className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                       isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200'
                     }`}
                   />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-neutral-500 block mb-1">Time (Optional)</label>
                   <input
                     type="time"
                     value={eventTime}
                     onChange={(e) => setEventTime(e.target.value)}
                     className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                       isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200'
                     }`}
                   />
                 </div>
               </div>

               {/* Reminders & Priority */}
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-xs font-semibold text-neutral-500 block mb-1 flex items-center gap-1">
                     <Bell className="w-3 h-3 text-indigo-500" />
                     <span>Reminder</span>
                   </label>
                   <select
                     value={eventReminder}
                     onChange={(e) => setEventReminder(parseInt(e.target.value, 10))}
                     className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none ${
                       isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200'
                     }`}
                   >
                     <option value={0}>At event time</option>
                     <option value={15}>15 minutes before</option>
                     <option value={60}>1 hour before</option>
                     <option value={1440}>1 day before</option>
                     <option value={-1}>No reminder</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-neutral-500 block mb-1">Priority</label>
                   <select
                     value={eventPriority}
                     onChange={(e) => setEventPriority(e.target.value as 'low' | 'medium' | 'high')}
                     className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none ${
                       isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200'
                     }`}
                   >
                     <option value="high">High Priority</option>
                     <option value="medium">Medium</option>
                     <option value="low">Low</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="text-xs font-semibold text-neutral-500 block mb-1">Category</label>
                 <div className="flex items-center gap-1.5 flex-wrap">
                   {(['Deadline', 'Milestone', 'Meeting', 'Task', 'Review', 'Personal'] as CalendarEventCategory[]).map(
                     (cat) => (
                       <button
                         key={cat}
                         type="button"
                         onClick={() => setEventCategory(cat)}
                         className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                           eventCategory === cat
                             ? 'bg-indigo-600 text-white font-bold'
                             : isDark
                             ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                             : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                         }`}
                       >
                         {cat}
                       </button>
                     )
                   )}
                 </div>
               </div>

               <div>
                 <label className="text-xs font-semibold text-neutral-500 block mb-1">Notes (Optional)</label>
                 <textarea
                   value={eventNotes}
                   onChange={(e) => setEventNotes(e.target.value)}
                   placeholder="Additional context or links..."
                   rows={2}
                   className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none resize-none ${
                     isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200'
                   }`}
                 />
               </div>

               <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/10">
                 <button
                   type="button"
                   onClick={() => setShowAddModal(false)}
                   className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 cursor-pointer"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer shadow-xs"
                 >
                   Save to Calendar
                 </button>
               </div>
             </form>
           </div>
         )}
      </div>
    </div>
  );
};
