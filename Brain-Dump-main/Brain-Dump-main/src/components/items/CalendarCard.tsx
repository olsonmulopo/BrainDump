import React, { useState, useMemo } from 'react';
import {
  CalendarCardItem,
  CalendarEvent,
  CalendarEventCategory,
  CalendarViewMode,
  CanvasItem,
  LineConnectorItem,
  ItemColor,
  TodoCardItem,
} from '../../types';
import { getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Palette,
  Maximize2,
  Check,
  CheckSquare,
  Square,
  Clock,
  Flag,
  CalendarDays,
  X,
  ListTodo,
  Sparkles,
  Link2,
} from 'lucide-react';

interface CalendarCardProps {
  item: CalendarCardItem;
  allItems?: Record<string, CanvasItem>;
  lineConnectors?: LineConnectorItem[];
  onUpdate: (updates: Partial<CalendarCardItem>) => void;
  onDelete: () => void;
  onOpenModal?: (cardId?: string) => void;
  onStartConnecting?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  isInsideColumn?: boolean;
}

const CATEGORY_COLORS: Record<CalendarEventCategory, { bg: string; text: string; dot: string }> = {
  Deadline: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  Milestone: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  Meeting: { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
  Task: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Review: { bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  Personal: { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
};

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string): Date {
  const parts = iso.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date();
}

export const CalendarCard: React.FC<CalendarCardProps> = ({
  item,
  allItems = {},
  lineConnectors = [],
  onUpdate,
  onDelete,
  onOpenModal,
  onStartConnecting,
  isSelected,
  isInsideColumn,
}) => {
  const colorStyles = getItemColorStyles(item.color || 'default', item.customColor);
  const isDark = colorStyles.isDark;

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => item.currentDate || formatIsoDate(new Date()));
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState<CalendarEventCategory>('Deadline');
  const [newNotes, setNewNotes] = useState('');

  // Selected date cursor for month/week navigation
  const activeDate = useMemo(() => {
    return parseIsoDate(item.currentDate || formatIsoDate(new Date()));
  }, [item.currentDate]);

  const viewMode: CalendarViewMode = item.viewMode || 'month';
  const showConnectedDeadlines = item.showConnectedDeadlines !== false;

  // Extract connected or board deadlines from TodoCardItems
  const boardDeadlines = useMemo(() => {
    if (!showConnectedDeadlines) return [];

    const deadlines: Array<{
      id: string;
      cardId: string;
      cardTitle: string;
      text: string;
      date: string;
      completed: boolean;
      priority?: 'low' | 'medium' | 'high';
      isConnected: boolean;
    }> = [];

    // Find cards connected to this calendar item via lines
    const connectedCardIds = new Set<string>();
    lineConnectors.forEach((line) => {
      if (line.fromId === item.id) connectedCardIds.add(line.toId);
      if (line.toId === item.id) connectedCardIds.add(line.fromId);
    });

    Object.values(allItems).forEach((canvasItem) => {
      if (canvasItem.boardId !== item.boardId) return;

      if (canvasItem.type === 'todo') {
        const todoCard = canvasItem as TodoCardItem;
        const isConnected = connectedCardIds.has(todoCard.id);
        (todoCard.todos || []).forEach((t) => {
          if (t.dueDate) {
            deadlines.push({
              id: `${todoCard.id}-${t.id}`,
              cardId: todoCard.id,
              cardTitle: todoCard.title || 'To-Do List',
              text: t.text,
              date: t.dueDate,
              completed: t.completed,
              priority: t.priority,
              isConnected,
            });
          }
        });
      }
    });

    return deadlines;
  }, [showConnectedDeadlines, item.id, item.boardId, allItems, lineConnectors]);

  // Combined events + deadlines mapped by date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<
      string,
      Array<{
        id: string;
        title: string;
        time?: string;
        category?: CalendarEventCategory;
        completed?: boolean;
        isDeadline?: boolean;
        cardId?: string;
        cardTitle?: string;
      }>
    > = {};

    (item.events || []).forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push({
        id: ev.id,
        title: ev.title,
        time: ev.time,
        category: ev.category || 'Deadline',
        completed: ev.completed,
        isDeadline: false,
      });
    });

    boardDeadlines.forEach((bd) => {
      if (!map[bd.date]) map[bd.date] = [];
      map[bd.date].push({
        id: bd.id,
        title: bd.text,
        category: 'Deadline',
        completed: bd.completed,
        isDeadline: true,
        cardId: bd.cardId,
        cardTitle: bd.cardTitle,
      });
    });

    return map;
  }, [item.events, boardDeadlines]);

  // Navigation handlers
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date(activeDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    onUpdate({ currentDate: formatIsoDate(d) });
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date(activeDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    onUpdate({ currentDate: formatIsoDate(d) });
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ currentDate: formatIsoDate(new Date()) });
  };

  // Add event handler
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      date: newDate,
      time: newTime || undefined,
      category: newCategory,
      notes: newNotes.trim() || undefined,
      completed: false,
    };

    onUpdate({
      events: [...(item.events || []), newEv],
    });

    setNewTitle('');
    setNewTime('');
    setNewNotes('');
    setShowAddForm(false);
  };

  const toggleEventComplete = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = (item.events || []).map((ev) =>
      ev.id === eventId ? { ...ev, completed: !ev.completed } : ev
    );
    onUpdate({ events: updated });
  };

  const deleteEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = (item.events || []).filter((ev) => ev.id !== eventId);
    onUpdate({ events: updated });
  };

  // Month Grid Calculation
  const monthData = useMemo(() => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as first day of week (0=Mon, 6=Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      date: Date;
      iso: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayIso = formatIsoDate(new Date());

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const iso = formatIsoDate(d);
      days.push({ date: d, iso, isCurrentMonth: false, isToday: iso === todayIso });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      const iso = formatIsoDate(d);
      days.push({ date: d, iso, isCurrentMonth: true, isToday: iso === todayIso });
    }

    // Trailing days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const iso = formatIsoDate(d);
      days.push({ date: d, iso, isCurrentMonth: false, isToday: iso === todayIso });
    }

    return {
      year,
      monthName: activeDate.toLocaleString('default', { month: 'long' }),
      days,
    };
  }, [activeDate]);

  // Week Grid Calculation
  const weekDays = useMemo(() => {
    const curr = new Date(activeDate);
    let dayOfWeek = curr.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6;
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const todayIso = formatIsoDate(new Date());
    const days: Array<{ date: Date; iso: string; isToday: boolean; dayName: string }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = formatIsoDate(d);
      days.push({
        date: d,
        iso,
        isToday: iso === todayIso,
        dayName: d.toLocaleString('default', { weekday: 'short' }),
      });
    }
    return days;
  }, [activeDate]);

  // Total events & deadlines count
  const allEventsCount = (item.events || []).length + boardDeadlines.length;
  const todayIso = formatIsoDate(new Date());
  const todayEvents = eventsByDate[todayIso] || [];

  return (
    <div
      id={`item-${item.id}`}
      className={`group relative w-full max-w-full box-border rounded-2xl border overflow-hidden transition-all ${
        !item.customColor ? colorStyles.className : ''
      } ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-2xs hover:shadow-xs'}`}
      style={item.customColor ? colorStyles.style : undefined}
    >
      {/* Top Accent Stripe */}
      <div className="w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />

      {/* Card Header */}
      <div className="p-3 pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          {/* Icon & Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                isDark ? 'bg-white/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              <CalendarIcon className="w-4 h-4 stroke-[2]" />
            </div>

            <input
              type="text"
              value={item.title || 'Project Calendar'}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className={`font-semibold text-xs tracking-tight bg-transparent outline-none flex-1 min-w-0 ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
              placeholder="Calendar Title..."
            />

            {todayEvents.length > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shrink-0"
                title={`${todayEvents.length} event(s) today`}
              >
                {todayEvents.length} today
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 no-drag">
            {/* View Mode Switcher */}
            <div
              className={`flex items-center p-0.5 rounded-lg border text-[10px] font-medium ${
                isDark
                  ? 'bg-neutral-800/80 border-neutral-700 text-neutral-300'
                  : 'bg-neutral-100/90 border-neutral-200 text-neutral-600'
              }`}
            >
              <button
                type="button"
                onClick={() => onUpdate({ viewMode: 'month' })}
                className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Month view"
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ viewMode: 'week' })}
                className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Week view"
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ viewMode: 'agenda' })}
                className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Agenda list view"
              >
                Agenda
              </button>
            </div>

            {/* Expand / Maximize to Workspace Calendar Modal */}
            <button
              type="button"
              onClick={() => onOpenModal?.(item.id)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-neutral-400 hover:text-neutral-800 hover:bg-black/5'
              }`}
              title="Expand to Full Workspace Calendar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                  isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-black/5'
                }`}
                title="Color theme"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {showColorPicker && (
                <ColorPickerPopover
                  currentColor={item.color}
                  customColor={item.customColor}
                  onChangeColor={(color: ItemColor, customHex?: string) => {
                    onUpdate({ color, customColor: customHex });
                    setShowColorPicker(false);
                  }}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </div>

            {/* Delete Card */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                isDark
                  ? 'text-white/70 hover:text-rose-400 hover:bg-rose-500/20'
                  : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Delete calendar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Calendar Navigation Bar (< Month Year > & Today & + Event) */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center gap-1.5 no-drag">
            <button
              type="button"
              onClick={handlePrev}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-black/5 text-neutral-600'
              }`}
              title="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className={`text-xs font-bold px-1 select-none ${isDark ? 'text-white' : 'text-neutral-800'}`}>
              {monthData.monthName} {monthData.year}
            </span>

            <button
              type="button"
              onClick={handleNext}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-black/5 text-neutral-600'
              }`}
              title="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ml-1 ${
                isDark
                  ? 'border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1 no-drag">
            {/* Toggle show connected deadlines */}
            <button
              type="button"
              onClick={() => onUpdate({ showConnectedDeadlines: !showConnectedDeadlines })}
              className={`p-1 rounded-md transition-colors cursor-pointer text-[10px] flex items-center gap-1 ${
                showConnectedDeadlines
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-neutral-400 opacity-60'
              }`}
              title={
                showConnectedDeadlines
                  ? 'Showing board task deadlines (click to hide)'
                  : 'Hiding board task deadlines (click to show)'
              }
            >
              <Link2 className="w-3 h-3" />
              <span>Deadlines</span>
            </button>

            {/* Add Event Button */}
            <button
              type="button"
              onClick={() => {
                setNewDate(selectedDayIso || formatIsoDate(new Date()));
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Add Event Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddEvent}
          className={`p-3 border-b border-black/5 dark:border-white/10 space-y-2 no-drag text-xs ${
            isDark ? 'bg-neutral-800/50' : 'bg-neutral-50/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[11px] text-indigo-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Add Event / Milestone
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Event or milestone title (e.g. Video 1 Deadline)..."
            autoFocus
            className={`w-full px-2.5 py-1.5 rounded-lg border outline-none text-xs transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-700 text-white focus:border-indigo-500'
                : 'bg-white border-neutral-200 text-neutral-900 focus:border-indigo-500'
            }`}
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-500 block mb-0.5">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={`w-full px-2 py-1 rounded-md border text-[11px] outline-none ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700 text-white'
                    : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 block mb-0.5">Time (Optional)</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className={`w-full px-2 py-1 rounded-md border text-[11px] outline-none ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700 text-white'
                    : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['Deadline', 'Milestone', 'Meeting', 'Task', 'Review', 'Personal'] as CalendarEventCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                    newCategory === cat
                      ? 'bg-indigo-600 text-white font-bold'
                      : isDark
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer shadow-2xs"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      {/* Main View Area */}
      <div className="p-3 select-none">
        {/* Month View Grid */}
        {viewMode === 'month' && (
          <div className="space-y-1.5">
            {/* Weekday Labels Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthData.days.map((dayItem) => {
                const dayEvents = eventsByDate[dayItem.iso] || [];
                const isSelectedDay = selectedDayIso === dayItem.iso;

                return (
                  <div
                    key={dayItem.iso}
                    onClick={() => {
                      setSelectedDayIso(isSelectedDay ? null : dayItem.iso);
                    }}
                    onDoubleClick={() => {
                      setNewDate(dayItem.iso);
                      setShowAddForm(true);
                    }}
                    className={`relative min-h-[44px] p-1 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      dayItem.isToday
                        ? isDark
                          ? 'border-indigo-500 bg-indigo-950/30'
                          : 'border-indigo-500 bg-indigo-50/40'
                        : isSelectedDay
                        ? isDark
                          ? 'border-indigo-400 bg-neutral-800'
                          : 'border-indigo-400 bg-white shadow-xs'
                        : isDark
                        ? dayItem.isCurrentMonth
                          ? 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800/80'
                          : 'border-transparent bg-transparent opacity-30 hover:opacity-70'
                        : dayItem.isCurrentMonth
                        ? 'border-neutral-100 bg-white/70 hover:bg-white hover:border-neutral-200'
                        : 'border-transparent bg-transparent opacity-30 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between leading-none">
                      <span
                        className={`text-[10px] font-semibold inline-flex items-center justify-center w-4 h-4 rounded-full ${
                          dayItem.isToday
                            ? 'bg-indigo-600 text-white font-bold'
                            : dayItem.isCurrentMonth
                            ? isDark
                              ? 'text-neutral-200'
                              : 'text-neutral-700'
                            : 'text-neutral-400'
                        }`}
                      >
                        {dayItem.date.getDate()}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[8px] font-bold px-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Micro Event Indicators */}
                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const catStyle = CATEGORY_COLORS[ev.category || 'Deadline'];
                        return (
                          <div
                            key={ev.id}
                            className={`text-[8.5px] px-1 py-0.5 rounded truncate font-medium flex items-center gap-1 ${
                              ev.completed
                                ? 'opacity-40 line-through bg-black/5 dark:bg-white/5'
                                : `${catStyle.bg} ${catStyle.text}`
                            }`}
                            title={`${ev.time ? ev.time + ' - ' : ''}${ev.title}`}
                          >
                            <span className={`w-1 h-1 rounded-full shrink-0 ${catStyle.dot}`} />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <span className="text-[7.5px] text-neutral-400 block text-right">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View Grid */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => {
              const dayEvents = eventsByDate[day.iso] || [];

              return (
                <div
                  key={day.iso}
                  className={`p-1.5 rounded-xl border flex flex-col min-h-[140px] ${
                    day.isToday
                      ? isDark
                        ? 'border-indigo-500 bg-indigo-950/20'
                        : 'border-indigo-500 bg-indigo-50/50'
                      : isDark
                      ? 'border-neutral-800 bg-neutral-900/40'
                      : 'border-neutral-200/80 bg-white'
                  }`}
                >
                  <div className="text-center pb-1.5 border-b border-black/5 dark:border-white/10 mb-1">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase block">
                      {day.dayName}
                    </span>
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-5 h-5 rounded-full mt-0.5 ${
                        day.isToday ? 'bg-indigo-600 text-white' : isDark ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                    {dayEvents.length === 0 ? (
                      <span className="text-[9px] text-neutral-400 text-center block pt-2 opacity-50">
                        —
                      </span>
                    ) : (
                      dayEvents.map((ev) => {
                        const catStyle = CATEGORY_COLORS[ev.category || 'Deadline'];
                        return (
                          <div
                            key={ev.id}
                            className={`p-1 rounded-md text-[9px] border leading-tight ${catStyle.bg} ${catStyle.text} border-transparent`}
                            title={ev.title}
                          >
                            {ev.time && <span className="font-mono text-[8px] opacity-75 block">{ev.time}</span>}
                            <span className={`block font-medium truncate ${ev.completed ? 'line-through opacity-50' : ''}`}>
                              {ev.title}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewDate(day.iso);
                      setShowAddForm(true);
                    }}
                    className="mt-1 w-full py-0.5 text-[9px] rounded text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-neutral-800 transition-colors text-center cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Agenda View */}
        {viewMode === 'agenda' && (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {allEventsCount === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                <CalendarDays className="w-6 h-6 mx-auto mb-1 opacity-40" />
                No events or deadlines scheduled.
              </div>
            ) : (
              Object.entries(eventsByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateIso, evList]) => {
                  const d = parseIsoDate(dateIso);
                  const isPast = dateIso < todayIso;
                  const isCurrent = dateIso === todayIso;

                  return (
                    <div key={dateIso} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider sticky top-0 bg-inherit py-0.5">
                        <span className={isCurrent ? 'text-indigo-600 dark:text-indigo-400' : ''}>
                          {isCurrent ? 'Today' : d.toLocaleDateString('default', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                        <span className="text-[9px] font-normal opacity-60">({dateIso})</span>
                        <div className="flex-1 h-px bg-black/5 dark:bg-white/10" />
                      </div>

                      {evList.map((ev) => {
                        const catStyle = CATEGORY_COLORS[ev.category || 'Deadline'];
                        return (
                          <div
                            key={ev.id}
                            className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border text-xs transition-colors ${
                              isDark
                                ? 'bg-neutral-900/60 border-neutral-800'
                                : 'bg-white border-neutral-200/80 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {!ev.isDeadline && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleEventComplete(ev.id, e)}
                                  className="text-neutral-400 hover:text-emerald-500 cursor-pointer"
                                >
                                  {ev.completed ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-medium truncate ${
                                      ev.completed ? 'line-through opacity-50' : isDark ? 'text-white' : 'text-neutral-900'
                                    }`}
                                  >
                                    {ev.title}
                                  </span>
                                  {ev.cardTitle && (
                                    <span className="text-[9px] text-neutral-400 truncate">
                                      ({ev.cardTitle})
                                    </span>
                                  )}
                                </div>
                                {ev.time && (
                                  <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" /> {ev.time}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${catStyle.bg} ${catStyle.text}`}>
                                {ev.category}
                              </span>

                              {!ev.isDeadline && (
                                <button
                                  type="button"
                                  onClick={(e) => deleteEvent(ev.id, e)}
                                  className="p-1 rounded text-neutral-400 hover:text-rose-500 cursor-pointer opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* Selected Day Agenda Drawer if clicked in Month view */}
        {viewMode === 'month' && selectedDayIso && eventsByDate[selectedDayIso] && (
          <div
            className={`mt-2 p-2 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-100 ${
              isDark ? 'bg-neutral-800/80 border-neutral-700' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-indigo-500">
                {selectedDayIso} Schedule ({eventsByDate[selectedDayIso].length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewDate(selectedDayIso);
                  setShowAddForm(true);
                }}
                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                + Add to {selectedDayIso}
              </button>
            </div>

            <div className="space-y-1">
              {eventsByDate[selectedDayIso].map((ev) => {
                const catStyle = CATEGORY_COLORS[ev.category || 'Deadline'];
                return (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-1 rounded bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catStyle.dot}`} />
                      <span className={`truncate text-[11px] ${ev.completed ? 'line-through opacity-50' : ''}`}>
                        {ev.title}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${catStyle.bg} ${catStyle.text}`}>
                      {ev.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Summary of Events & Deadlines */}
      <div
        className={`px-3 py-1.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[10px] text-neutral-400 ${
          isDark ? 'bg-black/10' : 'bg-neutral-50/50'
        }`}
      >
        <span>
          {allEventsCount} total event{allEventsCount === 1 ? '' : 's'}
          {boardDeadlines.length > 0 && ` (${boardDeadlines.length} card deadline${boardDeadlines.length === 1 ? '' : 's'})`}
        </span>
        <button
          type="button"
          onClick={() => onOpenModal?.(item.id)}
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
        >
          Open Planner →
        </button>
      </div>
    </div>
  );
};
