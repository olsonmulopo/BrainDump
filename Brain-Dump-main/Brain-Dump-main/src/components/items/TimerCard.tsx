import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerCardItem, DiskColorTheme } from '../../types';
import { createTimerWorker } from '../../utils/timerWorker';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Check,
  Pencil,
  X,
  Volume2,
  VolumeX,
  Coffee,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface TimerCardProps {
  item: TimerCardItem;
  isSelected?: boolean;
  onUpdate: (updates: Partial<TimerCardItem>) => void;
  onDelete: () => void;
  onSelect: () => void;
  onStartConnecting?: (e: React.MouseEvent) => void;
  onLogTime?: (entry: {
    cardId: string;
    cardTitle: string;
    durationSeconds: number;
    category: 'Design' | 'Development' | 'Planning' | 'Review' | 'Storyboard' | 'Meeting' | 'Writing' | 'Other';
    notes?: string;
  }) => void;
}

// Gentle, calming ADHD disk color themes
const DISK_THEMES: Record<
  DiskColorTheme,
  {
    name: string;
    diskFill: string;
    diskBorder: string;
    buttonBg: string;
    ringColor: string;
  }
> = {
  coral: {
    name: 'Sunset Coral',
    diskFill: 'rgba(244, 114, 82, 0.85)',
    diskBorder: '#e11d48',
    buttonBg: 'bg-rose-500 hover:bg-rose-600 text-white',
    ringColor: 'ring-rose-400',
  },
  teal: {
    name: 'Calm Sage & Teal',
    diskFill: 'rgba(20, 184, 166, 0.85)',
    diskBorder: '#0d9488',
    buttonBg: 'bg-teal-600 hover:bg-teal-700 text-white',
    ringColor: 'ring-teal-400',
  },
  indigo: {
    name: 'Gentle Iris Blue',
    diskFill: 'rgba(99, 102, 241, 0.85)',
    diskBorder: '#6366f1',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    ringColor: 'ring-indigo-400',
  },
  amber: {
    name: 'Warm Honey Amber',
    diskFill: 'rgba(245, 158, 11, 0.85)',
    diskBorder: '#d97706',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    ringColor: 'ring-amber-400',
  },
  lavender: {
    name: 'Dreamy Lavender',
    diskFill: 'rgba(168, 85, 247, 0.85)',
    diskBorder: '#9333ea',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    ringColor: 'ring-purple-400',
  },
};

// Play a soft, gentle two-tone chime
const playGentleChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };
    playTone(587.33, now, 0.6); // D5
    playTone(880, now + 0.16, 1.1); // A5
  } catch {
    // Ignore audio autoplay restrictions
  }
};

const pad2 = (n: number) => Math.max(0, n).toString().padStart(2, '0');

const formatClockDigits = (totalSecs: number, forceHours = false) => {
  const s = Math.max(0, Math.floor(totalSecs));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0 || forceHours) {
    return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
  }
  return `${pad2(mins)}:${pad2(secs)}`;
};

// Compact duration using letters (e.g. 1h, 2h 30m, 35s, 15m)
const formatCompactDuration = (totalSecs: number) => {
  const s = Math.max(0, Math.floor(totalSecs));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    if (mins === 0 && secs === 0) return `${hrs}h`;
    if (mins === 0) return `${hrs}h ${secs}s`;
    if (secs === 0) return `${hrs}h ${mins}m`;
    return `${hrs}h ${mins}m`; // When hours & minutes are present, seconds are not needed
  }
  if (mins > 0) {
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

// Formats the main clock display with unit letters (e.g. 2h 27m 25s, 14m 30s, 45s)
const renderTimeWithLetters = (totalSecs: number, isOvertime = false) => {
  const s = Math.max(0, Math.floor(totalSecs));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  return (
    <span className="inline-flex items-baseline justify-center font-mono font-bold tracking-tight select-none drop-shadow-xs">
      {isOvertime && (
        <span className="mr-0.5 text-rose-500 font-extrabold text-[24px] leading-none">+</span>
      )}
      {hrs > 0 && (
        <>
          <span className="text-[24px] leading-none font-bold text-neutral-900 dark:text-neutral-50 drop-shadow-xs">
            {hrs}
          </span>
          <span className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-200 mr-1.5 ml-0.5">
            h
          </span>
        </>
      )}
      {(hrs > 0 || mins > 0) && (
        <>
          <span className="text-[24px] leading-none font-bold text-neutral-900 dark:text-neutral-50 drop-shadow-xs">
            {hrs > 0 ? pad2(mins) : mins}
          </span>
          <span className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-200 mr-1.5 ml-0.5">
            m
          </span>
        </>
      )}
      <span className="text-[24px] leading-none font-bold text-neutral-900 dark:text-neutral-50 drop-shadow-xs">
        {hrs > 0 || mins > 0 ? pad2(secs) : secs}
      </span>
      <span className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-200 ml-0.5">
        s
      </span>
    </span>
  );
};

const formatPrettyDuration = (totalSecs: number) => {
  const abs = Math.abs(totalSecs);
  const hrs = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  if (hrs > 0) return `${hrs}h ${m}m ${s}s`;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
};

export const TimerCard: React.FC<TimerCardProps> = ({
  item,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
  onLogTime,
}) => {
  const clockPurpose = item.clockPurpose || (item.mode === 'stopwatch' ? 'stopwatch' : 'task');
  const isStopwatch = clockPurpose === 'stopwatch';
  const isTaskClock = clockPurpose === 'task';
  const isFocus = clockPurpose === 'focus';

  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Samsung Clock-style time state
  const totalSecs = item.totalDurationSeconds || 600;
  const [hours, setHours] = useState(() => Math.floor(totalSecs / 3600));
  const [minutes, setMinutes] = useState(() => Math.floor((totalSecs % 3600) / 60));
  const [seconds, setSeconds] = useState(() => totalSecs % 60);

  // Sync inputs when total duration changes from outside
  useEffect(() => {
    const s = item.totalDurationSeconds || 600;
    setHours(Math.floor(s / 3600));
    setMinutes(Math.floor((s % 3600) / 60));
    setSeconds(s % 60);
  }, [item.totalDurationSeconds]);

  // Strict Wall-Clock Refs (prevents background tab throttling / freeze)
  const startTimeRef = useRef<number | null>(item.isRunning ? (item.lastStartedAt ?? Date.now()) : null);
  const baseElapsedRef = useRef<number>(item.elapsedSeconds || 0);
  const chimePlayedRef = useRef<boolean>(
    Boolean(item.remainingSeconds === 0 && (item.elapsedSeconds || 0) >= (item.totalDurationSeconds || 600))
  );

  // Interval & Web Worker refs
  const timerRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const itemRef = useRef(item);
  itemRef.current = item;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const diskThemeKey = (item.diskColor || 'coral') as DiskColorTheme;
  const diskTheme = DISK_THEMES[diskThemeKey] || DISK_THEMES.coral;

  // Recalculates time using wall-clock delta (Date.now() - startTimeRef.current)
  const recalculateTime = useCallback(() => {
    const curItem = itemRef.current;
    const updateFn = onUpdateRef.current;
    if (!curItem.isRunning || startTimeRef.current === null) return;

    const now = Date.now();
    const sessionDelta = Math.max(0, Math.floor((now - startTimeRef.current) / 1000));
    const currentElapsed = baseElapsedRef.current + sessionDelta;
    const purpose = curItem.clockPurpose || (curItem.mode === 'stopwatch' ? 'stopwatch' : 'task');

    // 1. Stopwatch: counts UP continuously
    if (purpose === 'stopwatch') {
      updateFn({
        elapsedSeconds: currentElapsed,
      });
      return;
    }

    // 2. Countdown / Task / Focus Clocks
    const totalDuration = curItem.totalDurationSeconds || 600;
    const currentRemaining = Math.max(0, totalDuration - currentElapsed);
    const currentOvertime = currentElapsed > totalDuration ? currentElapsed - totalDuration : 0;

    // Check if countdown just reached zero
    if (currentRemaining === 0 && !chimePlayedRef.current) {
      chimePlayedRef.current = true;
      if (!isMuted) {
        playGentleChime();
      }
      if (purpose === 'focus') {
        // Focus timer ended: Prompt to take a break!
        updateFn({
          remainingSeconds: 0,
          elapsedSeconds: totalDuration,
          overtimeSeconds: 0,
          isRunning: false,
          isCompleted: true,
          lastStartedAt: undefined,
        });
        return;
      }
    }

    updateFn({
      remainingSeconds: currentRemaining,
      elapsedSeconds: currentElapsed,
      overtimeSeconds: currentOvertime,
    });
  }, [isMuted]);

  // 3. Visibility Syncing: Snap to the exact wall-clock time the millisecond tab becomes visible
  useEffect(() => {
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible' && itemRef.current.isRunning) {
        recalculateTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('focus', handleVisibilitySync);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('focus', handleVisibilitySync);
    };
  }, [recalculateTime]);

  // 4. Running tick loop: uses Web Worker (exempt from browser timer throttling) + backup setInterval
  useEffect(() => {
    if (!item.isRunning) {
      if (workerRef.current) {
        workerRef.current.postMessage({ action: 'stop' });
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Ensure startTimeRef is initialized
    if (startTimeRef.current === null) {
      const now = Date.now();
      startTimeRef.current = item.lastStartedAt || now;
      baseElapsedRef.current = item.elapsedSeconds || 0;
      chimePlayedRef.current = Boolean(
        item.remainingSeconds === 0 && (item.elapsedSeconds || 0) >= (item.totalDurationSeconds || 600)
      );
    }

    // Run initial recalculation
    recalculateTime();

    // Start background Web Worker (unthrottled even when tab is backgrounded)
    let worker = workerRef.current;
    if (!worker) {
      worker = createTimerWorker();
      if (worker) {
        workerRef.current = worker;
        worker.onmessage = (e) => {
          if (e.data?.type === 'tick') {
            recalculateTime();
          }
        };
      }
    }

    if (worker) {
      worker.postMessage({ action: 'start', interval: 1000 });
    }

    // Fallback interval on main thread
    timerRef.current = window.setInterval(() => {
      recalculateTime();
    }, 1000);

    return () => {
      if (worker) {
        worker.postMessage({ action: 'stop' });
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [item.isRunning, recalculateTime]);

  // Cleanup Web Worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Toggle run / pause
  const toggleRun = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // If task was already completed or focus done, restarting resets and starts fresh
    if (item.isTaskDone || (item.isCompleted && item.clockPurpose === 'focus')) {
      handleReset();
      const now = Date.now();
      startTimeRef.current = now;
      baseElapsedRef.current = 0;
      chimePlayedRef.current = false;
      onUpdate({ isRunning: true, lastStartedAt: now });
      return;
    }

    const nextRunning = !item.isRunning;
    if (nextRunning) {
      // Starting / Resuming
      const now = Date.now();
      startTimeRef.current = now;
      baseElapsedRef.current = item.elapsedSeconds || 0;
      chimePlayedRef.current = Boolean(
        item.remainingSeconds === 0 && (item.elapsedSeconds || 0) >= (item.totalDurationSeconds || 600)
      );
      onUpdate({ isRunning: true, lastStartedAt: now });
    } else {
      // Pausing: perform final delta calculation
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const sessionDelta = Math.max(0, Math.floor((now - startTimeRef.current) / 1000));
        const finalElapsed = baseElapsedRef.current + sessionDelta;
        const totalDuration = item.totalDurationSeconds || 600;
        const finalRemaining = Math.max(0, totalDuration - finalElapsed);
        const finalOvertime = finalElapsed > totalDuration ? finalElapsed - totalDuration : 0;

        baseElapsedRef.current = finalElapsed;
        startTimeRef.current = null;

        onUpdate({
          isRunning: false,
          lastStartedAt: undefined,
          elapsedSeconds: finalElapsed,
          remainingSeconds: finalRemaining,
          overtimeSeconds: finalOvertime,
        });
      } else {
        onUpdate({ isRunning: false, lastStartedAt: undefined });
      }
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    chimePlayedRef.current = false;
    onUpdate({
      remainingSeconds: item.totalDurationSeconds || 600,
      elapsedSeconds: 0,
      overtimeSeconds: 0,
      isRunning: false,
      isCompleted: false,
      isTaskDone: false,
      lastStartedAt: undefined,
      taskStats: undefined,
    });
  };

  // Mark task completed (for Task Clock & Stopwatch)
  const handleMarkTaskDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const totalDuration = item.totalDurationSeconds || 600;
    const elapsed = item.elapsedSeconds || 0;
    const timeSaved = isStopwatch ? 0 : totalDuration - elapsed;

    onUpdate({
      isRunning: false,
      isTaskDone: true,
      taskStats: {
        totalDurationSeconds: totalDuration,
        timeTakenSeconds: elapsed,
        timeSavedSeconds: timeSaved,
      },
    });

    if (onLogTime) {
      onLogTime({
        cardId: item.id,
        cardTitle: item.title || (isStopwatch ? 'Stopwatch' : 'Task Clock'),
        durationSeconds: elapsed,
        category: (item.category as 'Storyboard') || 'Storyboard',
        notes: isStopwatch
          ? `Stopwatch recorded ${formatPrettyDuration(elapsed)}.`
          : `Task completed in ${formatPrettyDuration(elapsed)}. ${
              timeSaved > 0
                ? `Saved ${formatPrettyDuration(timeSaved)}!`
                : `Overtime: ${formatPrettyDuration(-timeSaved)}`
            }`,
      });
    }
  };

  // Start 5-minute break (for Focus Clock)
  const handleStartBreak = (mins = 5, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const breakSecs = mins * 60;
    onUpdate({
      title: 'Coffee Break',
      totalDurationSeconds: breakSecs,
      remainingSeconds: breakSecs,
      elapsedSeconds: 0,
      overtimeSeconds: 0,
      isRunning: true,
      isCompleted: false,
      isTaskDone: false,
    });
  };

  // Commit duration update to item
  const commitDuration = (h: number, m: number, s: number) => {
    const safeH = Math.max(0, Math.min(23, h));
    const safeM = Math.max(0, Math.min(59, m));
    const safeS = Math.max(0, Math.min(59, s));
    const total = safeH * 3600 + safeM * 60 + safeS;
    const safeTotal = total > 0 ? total : 60; // minimum 1 min if 0 entered

    setHours(safeH);
    setMinutes(safeM);
    setSeconds(safeS);

    onUpdate({
      totalDurationSeconds: safeTotal,
      remainingSeconds: safeTotal,
      elapsedSeconds: 0,
      overtimeSeconds: 0,
      isRunning: false,
      isCompleted: false,
      isTaskDone: false,
      taskStats: undefined,
    });
  };

  // Quick Preset Click (like Samsung Clock preset bubbles)
  const applyPreset = (h: number, m: number, s: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    commitDuration(h, m, s);
  };

  // Steppers for quick duration adjustments
  const addMinutes = (delta: number) => {
    const currentMins = Math.round((item.totalDurationSeconds || 600) / 60);
    const nextMins = Math.max(1, Math.min(180, currentMins + delta));
    const h = Math.floor(nextMins / 60);
    const m = nextMins % 60;
    commitDuration(h, m, 0);
  };

  const stepHours = (delta: number) => {
    const next = (hours + delta + 24) % 24;
    commitDuration(next, minutes, seconds);
  };

  const stepMinutes = (delta: number) => {
    const next = (minutes + delta + 60) % 60;
    commitDuration(hours, next, seconds);
  };

  const stepSeconds = (delta: number) => {
    const next = (seconds + delta + 60) % 60;
    commitDuration(hours, minutes, next);
  };

  // Visual disk calculations
  const duration = item.totalDurationSeconds || 600;
  const isOvertime = isTaskClock && (item.overtimeSeconds || 0) > 0;
  const remainingFraction = Math.max(0, Math.min(1, (item.remainingSeconds || 0) / duration));

  // Geometry: center (80, 80), radius 62 in SVG viewBox
  const cx = 80;
  const cy = 80;
  const r = 62;

  // Countdown timer wedge
  const sweepAngle = remainingFraction * 360;
  let wedgePath = '';
  if (sweepAngle >= 359.9) {
    wedgePath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  } else if (sweepAngle > 0.5) {
    const endRad = (sweepAngle - 90) * (Math.PI / 180);
    const endX = cx + r * Math.cos(endRad);
    const endY = cy + r * Math.sin(endRad);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    wedgePath = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }

  // Stopwatch second sweep wedge
  const stopwatchSecs = (item.elapsedSeconds || 0) % 60;
  const stopwatchSweep = (stopwatchSecs / 60) * 360;
  let stopwatchWedgePath = '';
  if (stopwatchSweep > 0.5) {
    const endRad = (stopwatchSweep - 90) * (Math.PI / 180);
    const endX = cx + r * Math.cos(endRad);
    const endY = cy + r * Math.sin(endRad);
    const largeArc = stopwatchSweep > 180 ? 1 : 0;
    stopwatchWedgePath = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }

  // Dial ticks (12 hour marks)
  const clockTicks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    const r1 = 66;
    const r2 = isMajor ? 73 : 70;
    return {
      x1: cx + r1 * Math.cos(angle),
      y1: cy + r1 * Math.sin(angle),
      x2: cx + r2 * Math.cos(angle),
      y2: cy + r2 * Math.sin(angle),
      isMajor,
    };
  });

  // Display strings
  const formattedTotal = formatClockDigits(item.totalDurationSeconds || 600);
  const formattedElapsed = formatClockDigits(item.elapsedSeconds || 0);
  const formattedRemaining = formatClockDigits(item.remainingSeconds || 0);
  const formattedOvertime = `+${formatClockDigits(item.overtimeSeconds || 0)}`;
  const compactTotal = formatCompactDuration(item.totalDurationSeconds || 600);
  const compactElapsed = formatCompactDuration(item.elapsedSeconds || 0);

  const isPaused =
    !item.isRunning &&
    (item.elapsedSeconds || 0) > 0 &&
    !item.isTaskDone &&
    !item.isCompleted;

  const canToggleRun =
    (!item.isTaskDone || !item.taskStats) &&
    !(item.isCompleted && (item.remainingSeconds || 0) <= 0 && !isTaskClock && !isStopwatch);

  // Orbital button coordinates: Floating along circular perimeter with clear spacing (R = 126)
  // Right arc grouped together: Reset (-22°), Edit (8°), Delete (38°), Done (68°).
  const getOrbitalPos = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const clockCenter = 92;
    const orbitalRadius = 126;
    const buttonHalfSize = 16;
    return {
      left: `${clockCenter + orbitalRadius * Math.cos(rad) - buttonHalfSize}px`,
      top: `${clockCenter + orbitalRadius * Math.sin(rad) - buttonHalfSize}px`,
    };
  };

  // Dedicated Play / Pause button in the lower clock area (compact icon button as drawn in Image 1)
  const renderPlayPauseButton = () => {
    if (!canToggleRun) return null;

    if (item.isRunning) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleRun();
          }}
          className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs hover:shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto"
          title="Pause timer"
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
        </button>
      );
    }

    if (isPaused) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleRun();
          }}
          className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs ring-2 ring-emerald-400/60 hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto animate-pulse"
          title="Resume timer"
        >
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        </button>
      );
    }

    // Initial state (not started yet)
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleRun();
        }}
        className={`w-7 h-7 rounded-full ${diskTheme.buttonBg} hover:opacity-95 text-white flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer pointer-events-auto`}
        title="Start timer"
      >
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </button>
    );
  };

  return (
    <div
      id={`item-${item.id}`}
      onClick={onSelect}
      className={`relative select-none group/timer w-[250px] h-[244px] ${
        isSelected ? 'z-30' : 'z-10'
      }`}
    >
      {/* Top Callout Tag: Mode & Time Passed / Time Given - floats with equal 12px clearance from clock rim */}
      <div className="absolute -top-[20px] left-[21px] -translate-x-full z-20 pointer-events-none select-none whitespace-nowrap">
        <div
          className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 dark:bg-neutral-800/95 border shadow-2xs text-[10px] font-semibold backdrop-blur-xs transition-colors pointer-events-auto ${
            isPaused
              ? 'border-amber-400/90 dark:border-amber-500/90 shadow-amber-500/10'
              : 'border-neutral-200/90 dark:border-neutral-700'
          }`}
          title={`Type: ${isStopwatch ? 'Stopwatch' : isFocus ? 'Focus' : 'Task'} • Passed: ${compactElapsed} • Total: ${compactTotal}`}
        >
          {/* Type Tag (unified with the Focus indicator teal color) */}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-[9.5px] border bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border-teal-200/80 dark:border-teal-800">
            {isStopwatch ? '⏱️ Stopwatch' : isFocus ? '🎯 Focus' : '📋 Task'}
          </span>

          {/* Time Passed / Time Given (Outside the clock block) - with mini pause indicator when paused */}
          <div className="flex items-center gap-1 font-mono text-[10.5px] font-semibold whitespace-nowrap">
            {isPaused && (
              <Pause className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400 fill-current animate-pulse mr-0.5" />
            )}
            <span
              className={
                isPaused
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300'
              }
            >
              {isStopwatch
                ? compactElapsed
                : (item.elapsedSeconds || 0) > 0
                ? `${compactElapsed} / ${compactTotal}`
                : compactTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Circular Clock Face */}
      <div
        onClick={toggleRun}
        className={`group/clock relative absolute left-0 top-0 w-[184px] h-[184px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
          item.isRunning
            ? `ring-4 ring-offset-2 ring-offset-transparent shadow-lg ${
                isStopwatch
                  ? 'ring-indigo-400'
                  : isOvertime
                  ? 'ring-rose-500 animate-pulse'
                  : diskTheme.ringColor
              }`
            : isPaused
            ? 'ring-4 ring-offset-2 ring-offset-transparent ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-500/20'
            : 'shadow-md hover:shadow-lg'
        } ${
          isSelected
            ? 'ring-2 ring-indigo-500 shadow-xl'
            : 'border border-neutral-200/80 dark:border-neutral-700/80'
        }`}
        style={{
          backgroundColor: '#ffffff',
        }}
        title={item.isRunning ? 'Click to Pause' : isPaused ? 'Click to Resume' : 'Click to Play'}
      >
        {/* SVG Dial & Disk */}
        <svg className="w-full h-full p-1" viewBox="0 0 160 160">
          {/* Outer Dial Plate */}
          <circle
            cx={cx}
            cy={cy}
            r="76"
            className="fill-neutral-50/90 dark:fill-neutral-900/90 stroke-neutral-200/90 dark:stroke-neutral-700/80"
            strokeWidth="2"
          />

          {/* Inner Recessed Face */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            className="fill-white dark:fill-neutral-800/80 stroke-neutral-200/50 dark:stroke-neutral-700/50"
            strokeWidth="1"
          />

          {/* 12 Minute Tick Marks */}
          {clockTicks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.isMajor ? '#64748b' : '#cbd5e1'}
              strokeWidth={tick.isMajor ? '2' : '1.2'}
              strokeLinecap="round"
            />
          ))}

          {/* Countdown Disk Wedge */}
          {!isStopwatch && !isOvertime && remainingFraction > 0.005 && (
            <path
              d={wedgePath}
              fill={diskTheme.diskFill}
              stroke="none"
              className="transition-all duration-300"
            />
          )}

          {/* Stopwatch Seconds Wedge */}
          {isStopwatch && (item.elapsedSeconds || 0) > 0 && (
            <path
              d={stopwatchWedgePath}
              fill="rgba(99, 102, 241, 0.25)"
              stroke="#6366f1"
              strokeWidth="1"
              className="transition-all duration-200"
            />
          )}

          {/* Overtime Pulsing Ring for Task Clock */}
          {isOvertime && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#e11d48"
              strokeWidth="4"
              strokeDasharray="6 4"
              className="animate-spin-slow"
            />
          )}
        </svg>

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-3 text-center">
          {/* State 1: Task / Stopwatch Completed Summary */}
          {item.isTaskDone && item.taskStats ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 pointer-events-auto">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 rounded-full mb-1 shadow-2xs">
                <Check className="w-3 h-3 stroke-[2.5]" /> Done!
              </span>
              <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                Took: {formatPrettyDuration(item.taskStats.timeTakenSeconds)}
              </span>
              {item.taskStats.timeSavedSeconds > 0 ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Saved: {formatPrettyDuration(item.taskStats.timeSavedSeconds)} ⚡
                </span>
              ) : item.taskStats.timeSavedSeconds < 0 ? (
                <span className="text-[10px] font-semibold text-rose-500 mt-0.5">
                  Overtime: +{formatPrettyDuration(-item.taskStats.timeSavedSeconds)}
                </span>
              ) : null}
            </div>
          ) : /* State 2: Focus Clock Finished (Time's up -> "Take a break") */
          !isTaskClock && !isStopwatch && item.isCompleted && item.remainingSeconds <= 0 ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 pointer-events-auto">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 px-2.5 py-0.5 rounded-full mb-1 shadow-2xs">
                <Coffee className="w-3.5 h-3.5" /> Take a break
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-1">
                Time is up! Rest a bit.
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleStartBreak(5, e)}
                  className="px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-medium shadow-2xs transition-colors cursor-pointer"
                >
                  5m Break
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : isStopwatch ? (
            /* State 3: Stopwatch Mode (Clean, spacious, visible time centered in dial "time space" + lower compact play/pause button) */
            <div className="absolute inset-0 flex flex-col items-center pointer-events-none">
              {/* Main Time with unit letters - Centered in dial time space */}
              <div className="absolute top-[64px] inset-x-0 flex justify-center">
                <span className="text-neutral-900 dark:text-neutral-100">
                  {renderTimeWithLetters(item.elapsedSeconds || 0, false)}
                </span>
              </div>

              {/* Pause / Play Button - Lower dial with clean margin from bottom rim */}
              <div className="absolute bottom-[28px] inset-x-0 flex justify-center">
                {renderPlayPauseButton()}
              </div>
            </div>
          ) : (
            /* State 4: Normal Countdown / Overtime Running State */
            <div className="absolute inset-0 flex flex-col items-center pointer-events-none">
              {/* Main Time with unit letters - Centered in dial time space */}
              <div
                className={`absolute ${
                  isOvertime ? 'top-[52px]' : 'top-[64px]'
                } inset-x-0 flex flex-col items-center justify-center`}
              >
                {isOvertime && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/80 px-1.5 py-0.2 rounded mb-1">
                    Overtime
                  </span>
                )}
                <span
                  className={
                    isOvertime ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-neutral-100'
                  }
                >
                  {isOvertime
                    ? renderTimeWithLetters(item.overtimeSeconds || 0, true)
                    : renderTimeWithLetters(item.remainingSeconds || 0, false)}
                </span>
              </div>

              {/* Pause / Play Button - Lower dial with clean margin from bottom rim */}
              <div className="absolute bottom-[28px] inset-x-0 flex justify-center">
                {renderPlayPauseButton()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orbital Action Icons: Symmetrically & gracefully curved around the clock */}
      {/* 1. Reset / Restart Button (At upper-right rim, ~2:00 - Amber when paused/hovered) */}
      <button
        type="button"
        onClick={handleReset}
        style={getOrbitalPos(-24)}
        className={`absolute w-8 h-8 rounded-full border shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer no-drag z-20 ${
          isPaused
            ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-500 text-amber-500 dark:text-amber-400 shadow-xs shadow-amber-500/25 ring-1 ring-amber-400/40'
            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-400/80 dark:hover:border-amber-500/80 hover:bg-amber-50 dark:hover:bg-amber-950/60 opacity-60 hover:opacity-100'
        }`}
        title="Reset timer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* 2. Edit Button (Pencil icon, middle-right rim, ~3:15 - Sky/Cyan when paused/hovered) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowSettings(!showSettings);
        }}
        style={getOrbitalPos(6)}
        className={`absolute w-8 h-8 rounded-full border shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer no-drag z-20 ${
          isPaused
            ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-400 dark:border-sky-500 text-sky-500 dark:text-sky-400 shadow-xs shadow-sky-500/25 ring-1 ring-sky-400/40'
            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-sky-500 dark:hover:text-sky-400 hover:border-sky-400/80 dark:hover:border-sky-500/80 hover:bg-sky-50 dark:hover:bg-sky-950/60 opacity-60 hover:opacity-100'
        }`}
        title="Edit timer settings & colors"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {/* 3. Delete / Trash Button (Lower-right rim, ~4:15 - Rose/Red when paused/hovered) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={getOrbitalPos(36)}
        className={`absolute w-8 h-8 rounded-full border shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer no-drag z-20 ${
          isPaused
            ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 text-rose-500 dark:text-rose-400 shadow-xs shadow-rose-500/25 ring-1 ring-rose-400/40'
            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-400/80 dark:hover:border-rose-500/80 hover:bg-rose-50 dark:hover:bg-rose-950/60 opacity-60 hover:opacity-100'
        }`}
        title="Delete clock"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* 4. Done / Tick Icon Button (Grouped at 66° alongside Reset, Edit, Delete - Emerald when paused/hovered/filled) */}
      <button
        type="button"
        onClick={handleMarkTaskDone}
        style={getOrbitalPos(66)}
        className={`absolute w-8 h-8 rounded-full border shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer no-drag z-20 ${
          item.isTaskDone
            ? 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-xs shadow-emerald-500/20'
            : isPaused
            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 text-emerald-500 dark:text-emerald-400 shadow-xs shadow-emerald-500/25 ring-1 ring-emerald-400/40'
            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-400/80 dark:hover:border-emerald-500/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 opacity-60 hover:opacity-100'
        }`}
        title={isStopwatch ? 'Save & Log stopwatch time' : 'Mark task done (Done tick)'}
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Precise & Clean Settings Popover (Docked cleanly to the left of the clock) */}
      {showSettings && (
        <div
          className="absolute z-50 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-3.5 no-drag text-neutral-800 dark:text-neutral-100 animate-in fade-in zoom-in-95"
          style={{ left: '-300px', top: '18px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-xs tracking-tight">Clock Mode & Time</span>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clock Mode Segmented Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-[11px] font-medium mb-3">
            <button
              type="button"
              onClick={() => onUpdate({ clockPurpose: 'task', mode: 'countdown' })}
              className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                isTaskClock
                  ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              📋 Task
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ clockPurpose: 'focus', mode: 'countdown' })}
              className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                !isTaskClock && !isStopwatch
                  ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              🎯 Focus
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  clockPurpose: 'stopwatch',
                  mode: 'stopwatch',
                  elapsedSeconds: 0,
                  isRunning: false,
                  isTaskDone: false,
                })
              }
              className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                isStopwatch
                  ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              ⏱️ Stopwatch
            </button>
          </div>

          {/* High-Precision 3-Column Time Picker (Hours, Minutes, Seconds) */}
          {!isStopwatch && (
            <div className="mb-3">
              <div className="flex flex-col items-center bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl p-2 mb-2">
                {/* Column Headers */}
                <div className="grid grid-cols-5 w-full text-center text-[9.5px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-0.5">
                  <span className="col-span-1">Hours</span>
                  <span className="col-span-1 opacity-0">:</span>
                  <span className="col-span-1">Minutes</span>
                  <span className="col-span-1 opacity-0">:</span>
                  <span className="col-span-1">Seconds</span>
                </div>

                {/* 3 Columns with Chevrons, Direct Typing & Mouse Wheel Support */}
                <div className="grid grid-cols-5 items-center w-full select-none">
                  {/* Hours */}
                  <div
                    className="flex flex-col items-center"
                    onWheel={(e) => {
                      e.preventDefault();
                      stepHours(e.deltaY < 0 ? 1 : -1);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => stepHours(1)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Add 1 hour"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={pad2(hours)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        commitDuration(val, minutes, seconds);
                      }}
                      className="w-11 py-0.5 text-center text-xl font-bold font-mono text-neutral-900 dark:text-white bg-transparent outline-none focus:bg-white dark:focus:bg-neutral-900 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => stepHours(-1)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Minus 1 hour"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Colon 1 */}
                  <div className="text-center font-mono font-bold text-xl text-neutral-400 dark:text-neutral-500 pb-0.5">
                    :
                  </div>

                  {/* Minutes */}
                  <div
                    className="flex flex-col items-center"
                    onWheel={(e) => {
                      e.preventDefault();
                      stepMinutes(e.deltaY < 0 ? 1 : -1);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => stepMinutes(1)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Add 1 minute"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={pad2(minutes)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        commitDuration(hours, val, seconds);
                      }}
                      className="w-11 py-0.5 text-center text-xl font-bold font-mono text-neutral-900 dark:text-white bg-transparent outline-none focus:bg-white dark:focus:bg-neutral-900 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => stepMinutes(-1)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Minus 1 minute"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Colon 2 */}
                  <div className="text-center font-mono font-bold text-xl text-neutral-400 dark:text-neutral-500 pb-0.5">
                    :
                  </div>

                  {/* Seconds */}
                  <div
                    className="flex flex-col items-center"
                    onWheel={(e) => {
                      e.preventDefault();
                      stepSeconds(e.deltaY < 0 ? 1 : -1);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => stepSeconds(1)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Add 1 second"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={pad2(seconds)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        commitDuration(hours, minutes, val);
                      }}
                      className="w-11 py-0.5 text-center text-xl font-bold font-mono text-neutral-900 dark:text-white bg-transparent outline-none focus:bg-white dark:focus:bg-neutral-900 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => stepSeconds(-1)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      title="Minus 1 second"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Accurate Presets Row */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '05:00', h: 0, m: 5, s: 0 },
                  { label: '10:00', h: 0, m: 10, s: 0 },
                  { label: '30:00', h: 0, m: 30, s: 0 },
                  { label: '01:00:00', h: 1, m: 0, s: 0 },
                ].map((p) => {
                  const isCurrent =
                    item.totalDurationSeconds === p.h * 3600 + p.m * 60 + p.s;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={(e) => applyPreset(p.h, p.m, p.s, e)}
                      className={`py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Theme Color Row */}
          <div className="mb-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center justify-between px-0.5">
              {(['coral', 'teal', 'indigo', 'amber', 'lavender'] as DiskColorTheme[]).map((themeKey) => (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => onUpdate({ diskColor: themeKey })}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    diskThemeKey === themeKey
                      ? 'scale-115 ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-neutral-900 shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: DISK_THEMES[themeKey].diskBorder,
                    borderColor: '#ffffff',
                  }}
                  title={DISK_THEMES[themeKey].name}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" /> Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-teal-600" /> Chime
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
