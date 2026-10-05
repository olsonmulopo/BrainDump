import React, { useState, useMemo } from 'react';
import { WorkspaceData, TimeLogEntry, TimerCardItem } from '../types';
import { 
  X, 
  Clock, 
  Calendar, 
  Download, 
  Trash2, 
  Play, 
  Pause, 
  Plus, 
  Search, 
  BarChart3, 
  FileSpreadsheet, 
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface TimeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceData;
  onAddLog: (entry: Omit<TimeLogEntry, 'id'>) => void;
  onDeleteLog: (id: string) => void;
  onClearLogs: () => void;
  onNavigateBoard: (boardId: string) => void;
  onNavigateToItem?: (boardId: string, cardId: string) => void;
  onAddTimerPreset?: (preset: 'pomodoro_25' | 'deep_work_50' | 'short_break_5' | 'long_break_15' | 'stopwatch') => void;
  onUpdateTimerItem: (itemId: string, updates: Partial<TimerCardItem>) => void;
}

const CATEGORIES = [
  'Storyboard',
  'Design',
  'Development',
  'Planning',
  'Review',
  'Writing',
  'Meeting',
  'Other',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Storyboard: '#8b5cf6', // Purple
  Design: '#ec4899',     // Pink
  Development: '#3b82f6',// Blue
  Planning: '#f59e0b',   // Amber
  Review: '#10b981',     // Emerald
  Writing: '#06b6d4',    // Cyan
  Meeting: '#f97316',    // Orange
  Other: '#6b7280',      // Gray
};

export const TimeManagementModal: React.FC<TimeManagementModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onAddLog,
  onDeleteLog,
  onClearLogs,
  onNavigateBoard,
  onNavigateToItem,
  onAddTimerPreset,
  onUpdateTimerItem,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'addManual'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');

  // Manual entry form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualBoardId, setManualBoardId] = useState(workspace.currentBoardId);
  const [manualHours, setManualHours] = useState('0');
  const [manualMinutes, setManualMinutes] = useState('30');
  const [manualCategory, setManualCategory] = useState<typeof CATEGORIES[number]>('Storyboard');
  const [manualNotes, setManualNotes] = useState('');

  const timeLogs = useMemo(() => workspace.timeLogs || [], [workspace.timeLogs]);

  // Find all active timer items across workspace
  const activeTimers = useMemo(() => {
    return Object.values(workspace.items).filter(
      (item): item is TimerCardItem => item.type === 'timer'
    );
  }, [workspace.items]);

  const runningTimersCount = useMemo(() => {
    return activeTimers.filter((t) => t.isRunning).length;
  }, [activeTimers]);

  // Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    let totalSecondsToday = 0;
    let totalSecondsWeek = 0;
    let totalSecondsAll = 0;
    const categoryTotals: Record<string, number> = {};

    timeLogs.forEach((log) => {
      totalSecondsAll += log.durationSeconds;
      if (log.startedAt >= todayStart) {
        totalSecondsToday += log.durationSeconds;
      }
      if (log.startedAt >= weekStart) {
        totalSecondsWeek += log.durationSeconds;
      }
      const cat = log.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + log.durationSeconds;
    });

    // Also factor in current running timers
    activeTimers.forEach((timer) => {
      if (timer.isRunning && timer.elapsedSeconds > 0) {
        totalSecondsToday += timer.elapsedSeconds;
        totalSecondsAll += timer.elapsedSeconds;
      }
    });

    return {
      today: totalSecondsToday,
      week: totalSecondsWeek,
      allTime: totalSecondsAll,
      categoryTotals,
    };
  }, [timeLogs, activeTimers]);

  const formatSeconds = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (h === 0 && m === 0) return `${totalSecs % 60}s`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return timeLogs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.cardTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.boardTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === 'all' || log.category === selectedCategoryFilter;

      const matchesBoard =
        selectedBoardFilter === 'all' || log.boardId === selectedBoardFilter;

      return matchesSearch && matchesCat && matchesBoard;
    });
  }, [timeLogs, searchQuery, selectedCategoryFilter, selectedBoardFilter]);

  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(manualHours, 10) || 0;
    const m = parseInt(manualMinutes, 10) || 0;
    const totalSecs = h * 3600 + m * 60;
    if (totalSecs <= 0) return;

    const board = workspace.boards[manualBoardId] || { title: 'General Board' };
    const now = Date.now();

    onAddLog({
      boardId: manualBoardId,
      boardTitle: board.title,
      cardTitle: manualTitle.trim() || 'Manual Session',
      durationSeconds: totalSecs,
      startedAt: now - totalSecs * 1000,
      endedAt: now,
      category: manualCategory,
      notes: manualNotes.trim() || undefined,
    });

    setManualTitle('');
    setManualNotes('');
    setActiveTab('logs');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Task / Card', 'Board', 'Category', 'Duration (Minutes)', 'Duration (Formatted)', 'Notes'];
    const rows = timeLogs.map((log) => {
      const dateStr = new Date(log.startedAt).toLocaleDateString();
      const mins = (log.durationSeconds / 60).toFixed(1);
      const formatted = formatSeconds(log.durationSeconds);
      const notes = (log.notes || '').replace(/"/g, '""');
      return `"${dateStr}","${log.cardTitle}","${log.boardTitle}","${log.category}","${mins}","${formatted}","${notes}"`;
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `work-time-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-neutral-900 flex items-center gap-2">
                Advanced Time Management System
                {runningTimersCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-semibold bg-indigo-100 text-indigo-700 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    {runningTimersCount} active {runningTimersCount === 1 ? 'timer' : 'timers'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-500">
                Track time spent across storyboards, manage timers, and analyze your productivity logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={timeLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 disabled:opacity-40 transition-colors shadow-2xs"
              title="Export report to CSV for Excel / Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Overview & Timers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Work Logs History ({timeLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('addManual')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'addManual'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            Log Offline Session
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/40">
          
          {/* TAB 1: OVERVIEW & ACTIVE TIMERS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
                    <span>Logged Today</span>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-900">
                    {formatSeconds(stats.today)}
                  </div>
                  <span className="text-[11px] text-neutral-400">Current work day</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
                    <span>This Week</span>
                    <Calendar className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-900">
                    {formatSeconds(stats.week)}
                  </div>
                  <span className="text-[11px] text-neutral-400">Past 7 days activity</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
                    <span>Total All-Time</span>
                    <BarChart3 className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-900">
                    {formatSeconds(stats.allTime)}
                  </div>
                  <span className="text-[11px] text-neutral-400">{timeLogs.length} total logged sessions</span>
                </div>
              </div>

              {/* Category Time Distribution Bar */}
              {stats.allTime > 0 && (
                <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
                    Time Distribution by Category
                  </h3>
                  {/* Progress Bar */}
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-neutral-100 mb-3">
                    {CATEGORIES.map((cat) => {
                      const secs = stats.categoryTotals[cat] || 0;
                      if (secs <= 0) return null;
                      const pct = (secs / stats.allTime) * 100;
                      return (
                        <div
                          key={cat}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CATEGORY_COLORS[cat] || '#6b7280',
                          }}
                          className="h-full transition-all"
                          title={`${cat}: ${formatSeconds(secs)} (${pct.toFixed(0)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const secs = stats.categoryTotals[cat] || 0;
                      if (secs <= 0) return null;
                      return (
                        <div
                          key={cat}
                          className="flex items-center gap-1.5 px-2 py-1 bg-neutral-50 rounded-md border border-neutral-200/80 text-[11px]"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6b7280' }}
                          />
                          <span className="font-medium text-neutral-700">{cat}</span>
                          <span className="font-mono text-neutral-500">{formatSeconds(secs)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Focus & Pomodoro Launcher */}
              <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-rose-50/80 p-4 rounded-xl border border-indigo-100 shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-indigo-600 text-white">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Quick Focus & Pomodoro Launcher
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    Instantly start a focus session on current board
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAddTimerPreset?.('pomodoro_25');
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-indigo-50/80 border border-neutral-200/90 hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs hover:scale-[1.02]"
                  >
                    <span className="text-base font-bold font-mono text-indigo-600 group-hover:scale-105 transition-transform">
                      25m
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-700 mt-0.5">Focus Sprint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddTimerPreset?.('deep_work_50');
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-purple-50/80 border border-neutral-200/90 hover:border-purple-300 transition-all cursor-pointer group shadow-2xs hover:scale-[1.02]"
                  >
                    <span className="text-base font-bold font-mono text-purple-600 group-hover:scale-105 transition-transform">
                      50m
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-700 mt-0.5">Deep Work</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddTimerPreset?.('short_break_5');
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-neutral-200/90 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs hover:scale-[1.02]"
                  >
                    <span className="text-base font-bold font-mono text-emerald-600 group-hover:scale-105 transition-transform">
                      5m
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-700 mt-0.5">Short Break</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddTimerPreset?.('long_break_15');
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-amber-50/80 border border-neutral-200/90 hover:border-amber-300 transition-all cursor-pointer group shadow-2xs hover:scale-[1.02]"
                  >
                    <span className="text-base font-bold font-mono text-amber-600 group-hover:scale-105 transition-transform">
                      15m
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-700 mt-0.5">Long Rest</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddTimerPreset?.('stopwatch');
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-sky-50/80 border border-neutral-200/90 hover:border-sky-300 transition-all cursor-pointer group shadow-2xs hover:scale-[1.02]"
                  >
                    <span className="text-base font-bold font-mono text-sky-600 group-hover:scale-105 transition-transform">
                      ⏱️
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-700 mt-0.5">Stopwatch</span>
                  </button>
                </div>
              </div>

              {/* Storyboard Visual Timers Live Center */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">
                      Active Visual Timers on Storyboards
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-neutral-100 rounded-full text-neutral-600">
                      {activeTimers.length} {activeTimers.length === 1 ? 'timer' : 'timers'} placed
                    </span>
                  </div>
                </div>

                {activeTimers.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                    <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-600 font-medium">
                      No visual timers placed on your boards yet.
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Use the Quick Focus Launcher above or click "Timer" in the canvas toolbar to drop a clock onto your board!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTimers.map((timer) => {
                      const board = workspace.boards[timer.boardId] || { title: 'Unknown Board' };
                      const displaySecs = timer.mode === 'countdown' ? timer.remainingSeconds : timer.elapsedSeconds;
                      const m = Math.floor(displaySecs / 60);
                      const s = displaySecs % 60;
                      const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

                      return (
                        <div
                          key={timer.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="min-w-0 mr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-neutral-900 truncate">
                                {timer.title || 'Visual Timer'}
                              </span>
                              {timer.isRunning && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                              {onNavigateToItem ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateToItem(timer.boardId, timer.id);
                                    onClose();
                                  }}
                                  className="flex items-center gap-1 hover:text-indigo-600 hover:underline cursor-pointer"
                                  title="Jump directly to clock card on canvas"
                                >
                                  <span>{board.title}</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateBoard(timer.boardId);
                                    onClose();
                                  }}
                                  className="flex items-center gap-1 hover:text-indigo-600 hover:underline"
                                  title="Go to board"
                                >
                                  <span>{board.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                              <span>•</span>
                              <span className="capitalize">{timer.mode}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono font-bold text-sm text-neutral-800 mr-1">
                              {formatted}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateTimerItem(timer.id, {
                                  isRunning: !timer.isRunning,
                                })
                              }
                              className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${
                                timer.isRunning
                                  ? 'bg-amber-500 hover:bg-amber-600'
                                  : 'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                              title={timer.isRunning ? 'Pause' : 'Start'}
                            >
                              {timer.isRunning ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateTimerItem(timer.id, {
                                  isRunning: false,
                                  remainingSeconds: timer.totalDurationSeconds || 600,
                                  elapsedSeconds: 0,
                                  isCompleted: false,
                                })
                              }
                              className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-500 transition-colors cursor-pointer"
                              title="Reset"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WORK LOGS HISTORY */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by task or keyword..."
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Filter by Category */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium">Category:</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg font-medium text-neutral-700 text-xs focus:outline-hidden"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Board */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium">Board:</span>
                  <select
                    value={selectedBoardFilter}
                    onChange={(e) => setSelectedBoardFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg font-medium text-neutral-700 text-xs focus:outline-hidden max-w-[160px] truncate"
                  >
                    <option value="all">All Boards</option>
                    {Object.values(workspace.boards).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                {timeLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all work logs? This cannot be undone.')) {
                        onClearLogs();
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-neutral-800">No time logs found</h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      {timeLogs.length === 0
                        ? 'Use the "Log Time" button on any storyboard timer card or log a manual session.'
                        : 'No logs match your current filter settings.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5">Date & Time</th>
                          <th className="px-4 py-2.5">Task / Session</th>
                          <th className="px-4 py-2.5">Board</th>
                          <th className="px-4 py-2.5">Category</th>
                          <th className="px-4 py-2.5 text-right">Duration</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {filteredLogs.map((log) => {
                          const date = new Date(log.startedAt);
                          const dateFormatted = date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          });
                          const timeFormatted = date.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                                <span className="font-medium text-neutral-800">{dateFormatted}</span>{' '}
                                <span className="text-[11px]">{timeFormatted}</span>
                              </td>
                              <td className="px-4 py-3 font-medium text-neutral-900 max-w-[200px] truncate">
                                <div>{log.cardTitle}</div>
                                {log.notes && (
                                  <div className="text-[11px] text-neutral-400 truncate max-w-[240px]">
                                    {log.notes}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                                {log.boardTitle}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                                  style={{
                                    backgroundColor: CATEGORY_COLORS[log.category] || '#6b7280',
                                  }}
                                >
                                  {log.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-neutral-900">
                                {formatSeconds(log.durationSeconds)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={() => onDeleteLog(log.id)}
                                  className="p-1 text-neutral-400 hover:text-red-600 rounded hover:bg-neutral-100 transition-colors"
                                  title="Delete log entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LOG OFFLINE / MANUAL SESSION */}
          {activeTab === 'addManual' && (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">
                Log an Offline or Unrecorded Work Session
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Enter details for work completed away from the live visual timer.
              </p>

              <form onSubmit={handleCreateManualLog} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Task / Storyboard Element Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. Scene 3 Storyboard Concept Sketch"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Board Target
                    </label>
                    <select
                      value={manualBoardId}
                      onChange={(e) => setManualBoardId(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.values(workspace.boards).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Category
                    </label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value as typeof CATEGORIES[number])}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Key accomplishments or client notes..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Save Work Entry
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-white flex items-center justify-between text-xs text-neutral-500">
          <span>
            Offline-first: All timers and time logs are saved to your local workspace & sync to Google Drive.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
