import React, { useState } from 'react';
import {
  AppNotification,
  WorkspaceData,
  TimerCardItem,
} from '../types';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  AlertTriangle,
  Flame,
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { playChime } from '../utils/sound';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceData;
  notifications: AppNotification[];
  unreadCount: number;
  onNavigateToItem?: (boardId: string, cardId: string) => void;
  onCompleteTask?: (cardId: string, todoId: string) => void;
  onCompleteEvent?: (cardId: string, eventId: string) => void;
  onSnoozeTask?: (cardId: string, todoId: string, daysToAdd: number) => void;
  onUpdateTimer?: (timerId: string, updates: Partial<TimerCardItem>) => void;
  onDismissNotification?: (notifId: string) => void;
  onMarkAllAsRead?: () => void;
  onToggleSound?: () => void;
  onOpenCalendar?: () => void;
  onOpenTimeTracker?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  workspace,
  notifications,
  unreadCount,
  onNavigateToItem,
  onCompleteTask,
  onCompleteEvent,
  onSnoozeTask,
  onUpdateTimer,
  onDismissNotification,
  onMarkAllAsRead,
  onToggleSound,
  onOpenCalendar,
  onOpenTimeTracker,
}) => {
  const isDark = workspace.settings?.theme === 'dark';
  const soundEnabled = workspace.settings?.soundEnabled !== false;

  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'timers' | 'today' | 'upcoming'>('all');

  if (!isOpen) return null;

  const urgentList = notifications.filter((n) => n.priority === 'urgent');
  const timersList = notifications.filter((n) => n.type === 'timer_running' || n.type === 'timer_completed');
  const todayList = notifications.filter((n) => n.type === 'deadline_today' || n.type === 'event_today');
  const upcomingList = notifications.filter((n) => n.type === 'event_upcoming');

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'urgent') return n.priority === 'urgent';
    if (activeFilter === 'timers') return n.type === 'timer_running' || n.type === 'timer_completed';
    if (activeFilter === 'today') return n.type === 'deadline_today' || n.type === 'event_today';
    if (activeFilter === 'upcoming') return n.type === 'event_upcoming';
    return true;
  });

  const getPriorityBadge = (notif: AppNotification) => {
    if (notif.type === 'timer_running') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <Clock className="w-3 h-3 animate-pulse" />
          Running Clock
        </span>
      );
    }
    if (notif.type === 'timer_completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Timer Finished
        </span>
      );
    }
    if (notif.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <Flame className="w-3 h-3" />
          {notif.daysOverdue ? `${notif.daysOverdue}d Overdue` : 'Overdue'}
        </span>
      );
    }
    if (notif.type === 'deadline_today' || notif.type === 'event_today') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <CalendarIcon className="w-3 h-3" />
          Happening Today
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-500/10 text-neutral-600 dark:text-neutral-400">
        <CalendarDays className="w-3 h-3" />
        Upcoming
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-2 sm:p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <aside
        className={`w-full max-w-md h-[92vh] max-h-[840px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-200 animate-in slide-in-from-right-4 ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-neutral-950/80'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-neutral-300/60'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 text-white shadow-xs">
              <Bell className="w-5 h-5 stroke-[2.2]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">What's Happening</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {notifications.length} active
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Live clocks, today's schedule, deadlines & alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                onToggleSound?.();
                if (!soundEnabled) playChime('alert');
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-600'
              }`}
              title={soundEnabled ? 'Chime sound is ON. Click to mute.' : 'Chime sound is MUTED. Click to enable.'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
            }`}
          >
            All ({notifications.length})
          </button>

          {urgentList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('urgent')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
                activeFilter === 'urgent'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Flame className="w-3 h-3" />
              Urgent ({urgentList.length})
            </button>
          )}

          {timersList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('timers')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
                activeFilter === 'timers'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              <Clock className="w-3 h-3" />
              Clocks ({timersList.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveFilter('today')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
              activeFilter === 'today'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
            }`}
          >
            <CalendarIcon className="w-3 h-3" />
            Today ({todayList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('upcoming')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
              activeFilter === 'upcoming'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
            }`}
          >
            Upcoming ({upcomingList.length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-neutral-400 dark:text-neutral-500">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                You're completely caught up!
              </h3>
              <p className="text-xs max-w-xs mt-1">
                No pending deadlines, overdue tasks, or completed timers in this view.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUrgent = notif.priority === 'urgent';
              const isTimer = notif.type === 'timer_running' || notif.type === 'timer_completed';

              return (
                <div
                  key={notif.id}
                  className={`group relative p-3 rounded-xl border transition-all text-xs ${
                    isUrgent
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : isTimer
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60'
                      : isDark
                      ? 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700/80'
                      : 'bg-white hover:bg-neutral-50 border-neutral-200 shadow-2xs'
                  }`}
                >
                  {/* Top row: Priority Badge + Board Tag + Dismiss */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getPriorityBadge(notif)}
                      {notif.boardTitle && (
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                          in <span className="font-semibold text-neutral-700 dark:text-neutral-300">{notif.boardTitle}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissNotification?.(notif.id)}
                      className="opacity-60 hover:opacity-100 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-md transition-opacity cursor-pointer"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title and Message */}
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-xs tracking-tight line-clamp-2">
                    {notif.title}
                  </h4>
                  {notif.message && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between gap-2 flex-wrap">
                    {/* Primary inline actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Mark Done for Tasks */}
                      {notif.itemType === 'todo' && notif.cardId && notif.itemId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (soundEnabled) playChime('complete');
                            onCompleteTask?.(notif.cardId!, notif.itemId!);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Mark Done</span>
                        </button>
                      )}

                      {/* Mark Done for Calendar Events */}
                      {notif.itemType === 'calendar' && notif.cardId && notif.itemId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (soundEnabled) playChime('complete');
                            onCompleteEvent?.(notif.cardId!, notif.itemId!);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Mark Done</span>
                        </button>
                      )}

                      {/* Snooze task */}
                      {notif.itemType === 'todo' && notif.cardId && notif.itemId && (
                        <button
                          type="button"
                          onClick={() => onSnoozeTask?.(notif.cardId!, notif.itemId!, 1)}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                          title="Postpone deadline by 1 day"
                        >
                          +1 Day
                        </button>
                      )}

                      {/* Timer controls for active clock */}
                      {notif.itemType === 'timer' && notif.cardId && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateTimer?.(notif.cardId!, { isRunning: !notif.timerIsRunning });
                            if (soundEnabled) playChime('click');
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            notif.timerIsRunning
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {notif.timerIsRunning ? (
                            <>
                              <Pause className="w-3 h-3" />
                              <span>Pause Clock</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Resume Clock</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Jump to Card */}
                    {notif.boardId && notif.cardId && onNavigateToItem && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToItem(notif.boardId!, notif.cardId!);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-auto"
                      >
                        <span>Jump to Card</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {onOpenCalendar && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCalendar();
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Calendar Planner</span>
              </button>
            )}

            {onOpenTimeTracker && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTimeTracker();
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Time Tracker</span>
              </button>
            )}
          </div>

          {onMarkAllAsRead && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
