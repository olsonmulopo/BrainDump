import {
  WorkspaceData,
  AppNotification,
  TimerCardItem,
  TodoCardItem,
  CalendarCardItem,
} from '../types';

export interface NotificationStats {
  total: number;
  urgentCount: number;
  todayCount: number;
  activeTimersCount: number;
  upcomingCount: number;
  unreadCount: number;
}

function getTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getSevenDaysAheadIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcDaysDifference(dateIso: string, todayIso: string): number {
  const target = new Date(dateIso + 'T00:00:00').getTime();
  const today = new Date(todayIso + 'T00:00:00').getTime();
  const diffMs = today - target;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function computeWorkspaceNotifications(workspace: WorkspaceData): {
  notifications: AppNotification[];
  stats: NotificationStats;
  activeTimers: TimerCardItem[];
} {
  const todayIso = getTodayIso();
  const tomorrowIso = getTomorrowIso();
  const weekAheadIso = getSevenDaysAheadIso();

  const dismissedSet = new Set(workspace.settings?.dismissedNotificationIds || []);
  const readSet = new Set(workspace.settings?.readNotificationIds || []);

  const notifications: AppNotification[] = [];
  const activeTimers: TimerCardItem[] = [];

  const boards = workspace.boards || {};

  // 1. Scan Timer Cards
  Object.values(workspace.items || {}).forEach((item) => {
    if (item.type !== 'timer') return;
    const timer = item as TimerCardItem;
    const boardTitle = boards[timer.boardId]?.title || 'Board';

    if (timer.isRunning) {
      activeTimers.push(timer);
      const notifId = `timer-running-${timer.id}`;
      if (!dismissedSet.has(notifId)) {
        const remaining = timer.remainingSeconds;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
        notifications.push({
          id: notifId,
          type: 'timer_running',
          title: `Clock Active: ${timer.title || 'Timer'}`,
          message:
            timer.mode === 'stopwatch'
              ? `Elapsed: ${Math.floor(timer.elapsedSeconds / 60)}m ${timer.elapsedSeconds % 60}s`
              : `Countdown: ${timeStr} remaining in ${boardTitle}`,
          timestamp: timer.lastStartedAt || Date.now(),
          read: readSet.has(notifId),
          priority: 'high',
          boardId: timer.boardId,
          boardTitle,
          cardId: timer.id,
          cardTitle: timer.title || 'Timer',
          itemId: timer.id,
          itemType: 'timer',
          timerRemainingSeconds: timer.remainingSeconds,
          timerTotalSeconds: timer.totalDurationSeconds,
          timerIsRunning: true,
        });
      }
    } else if (timer.isCompleted || (timer.remainingSeconds === 0 && (timer.elapsedSeconds || 0) > 0 && !timer.isTaskDone)) {
      const notifId = `timer-done-${timer.id}`;
      if (!dismissedSet.has(notifId)) {
        notifications.push({
          id: notifId,
          type: 'timer_completed',
          title: `Focus Time Reached: ${timer.title || 'Timer'}`,
          message: `Timer completed in ${boardTitle}. Great job!`,
          timestamp: timer.updatedAt || Date.now(),
          read: readSet.has(notifId),
          priority: 'urgent',
          boardId: timer.boardId,
          boardTitle,
          cardId: timer.id,
          cardTitle: timer.title || 'Timer',
          itemId: timer.id,
          itemType: 'timer',
          timerRemainingSeconds: 0,
          timerTotalSeconds: timer.totalDurationSeconds,
          timerIsRunning: false,
        });
      }
    }
  });

  // 2. Scan Todo Cards for Deadlines & Overdue Tasks
  Object.values(workspace.items || {}).forEach((item) => {
    if (item.type !== 'todo') return;
    const todoCard = item as TodoCardItem;
    const boardTitle = boards[todoCard.boardId]?.title || 'Board';

    (todoCard.todos || []).forEach((t) => {
      if (!t.dueDate || t.completed) return;

      const notifId = `todo-${todoCard.id}-${t.id}`;
      if (dismissedSet.has(notifId)) return;

      if (t.dueDate < todayIso) {
        // Overdue!
        const daysOverdue = Math.max(1, calcDaysDifference(t.dueDate, todayIso));
        notifications.push({
          id: notifId,
          type: 'deadline_overdue',
          title: `Overdue (${daysOverdue}d ago): ${t.text}`,
          message: `Due on ${t.dueDate} in card "${todoCard.title || 'Tasks'}" (${boardTitle})`,
          timestamp: t.createdAt || Date.now(),
          read: readSet.has(notifId),
          priority: 'urgent',
          boardId: todoCard.boardId,
          boardTitle,
          cardId: todoCard.id,
          cardTitle: todoCard.title || 'Tasks',
          itemId: t.id,
          itemType: 'todo',
          dueDate: t.dueDate,
          daysOverdue,
          isOverdue: true,
        });
      } else if (t.dueDate === todayIso) {
        // Due today!
        notifications.push({
          id: notifId,
          type: 'deadline_today',
          title: `Due Today: ${t.text}`,
          message: `Scheduled for today in "${todoCard.title || 'Tasks'}" (${boardTitle})`,
          timestamp: t.createdAt || Date.now(),
          read: readSet.has(notifId),
          priority: 'high',
          boardId: todoCard.boardId,
          boardTitle,
          cardId: todoCard.id,
          cardTitle: todoCard.title || 'Tasks',
          itemId: t.id,
          itemType: 'todo',
          dueDate: t.dueDate,
        });
      } else if (t.dueDate <= weekAheadIso) {
        // Upcoming within 7 days
        const isTomorrow = t.dueDate === tomorrowIso;
        notifications.push({
          id: notifId,
          type: 'event_upcoming',
          title: `${isTomorrow ? 'Due Tomorrow' : `Due on ${t.dueDate}`}: ${t.text}`,
          message: `Upcoming task in "${todoCard.title || 'Tasks'}" (${boardTitle})`,
          timestamp: t.createdAt || Date.now(),
          read: readSet.has(notifId),
          priority: isTomorrow ? 'normal' : 'low',
          boardId: todoCard.boardId,
          boardTitle,
          cardId: todoCard.id,
          cardTitle: todoCard.title || 'Tasks',
          itemId: t.id,
          itemType: 'todo',
          dueDate: t.dueDate,
        });
      }
    });
  });

  // 3. Scan Calendar Cards for Events
  Object.values(workspace.items || {}).forEach((item) => {
    if (item.type !== 'calendar') return;
    const calCard = item as CalendarCardItem;
    const boardTitle = boards[calCard.boardId]?.title || 'Board';

    (calCard.events || []).forEach((ev) => {
      if (ev.completed) return;

      const notifId = `cal-ev-${calCard.id}-${ev.id}`;
      if (dismissedSet.has(notifId)) return;

      if (ev.date < todayIso) {
        // Past event not marked done
        const daysPast = Math.max(1, calcDaysDifference(ev.date, todayIso));
        notifications.push({
          id: notifId,
          type: 'deadline_overdue',
          title: `Past Event (${daysPast}d ago): ${ev.title}`,
          message: `${ev.category || 'Event'} from ${ev.date} in "${calCard.title || 'Calendar'}"`,
          timestamp: Date.now(),
          read: readSet.has(notifId),
          priority: 'urgent',
          boardId: calCard.boardId,
          boardTitle,
          cardId: calCard.id,
          cardTitle: calCard.title || 'Calendar',
          itemId: ev.id,
          itemType: 'calendar',
          dueDate: ev.date,
          time: ev.time,
          daysOverdue: daysPast,
          isOverdue: true,
        });
      } else if (ev.date === todayIso) {
        // Happening today!
        notifications.push({
          id: notifId,
          type: 'event_today',
          title: `Today: ${ev.title} ${ev.time ? `at ${ev.time}` : ''}`,
          message: `${ev.category || 'Event'} scheduled for today in "${calCard.title || 'Calendar'}" (${boardTitle})`,
          timestamp: Date.now(),
          read: readSet.has(notifId),
          priority: 'high',
          boardId: calCard.boardId,
          boardTitle,
          cardId: calCard.id,
          cardTitle: calCard.title || 'Calendar',
          itemId: ev.id,
          itemType: 'calendar',
          dueDate: ev.date,
          time: ev.time,
        });
      } else if (ev.date <= weekAheadIso) {
        // Upcoming in next 7 days
        const isTomorrow = ev.date === tomorrowIso;
        notifications.push({
          id: notifId,
          type: 'event_upcoming',
          title: `${isTomorrow ? 'Tomorrow' : ev.date}: ${ev.title} ${ev.time ? `(${ev.time})` : ''}`,
          message: `${ev.category || 'Event'} in "${calCard.title || 'Calendar'}" (${boardTitle})`,
          timestamp: Date.now(),
          read: readSet.has(notifId),
          priority: isTomorrow ? 'normal' : 'low',
          boardId: calCard.boardId,
          boardTitle,
          cardId: calCard.id,
          cardTitle: calCard.title || 'Calendar',
          itemId: ev.id,
          itemType: 'calendar',
          dueDate: ev.date,
          time: ev.time,
        });
      }
    });
  });

  // Sort: Urgent first, then High, then Normal, then Low
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  notifications.sort((a, b) => {
    const diff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });

  const stats: NotificationStats = {
    total: notifications.length,
    urgentCount: notifications.filter((n) => n.priority === 'urgent').length,
    todayCount: notifications.filter((n) => n.type === 'deadline_today' || n.type === 'event_today').length,
    activeTimersCount: activeTimers.length,
    upcomingCount: notifications.filter((n) => n.type === 'event_upcoming').length,
    unreadCount: notifications.filter((n) => !n.read).length,
  };

  return { notifications, stats, activeTimers };
}
