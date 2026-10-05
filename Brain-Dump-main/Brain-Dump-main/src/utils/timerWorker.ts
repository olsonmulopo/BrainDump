/**
 * Inline Web Worker for background timers & stopwatch tracking.
 * Chrome, Safari, and Edge aggressively throttle main-thread setInterval to 1 tick per minute
 * (or pause it entirely) when tabs are in the background or minimized.
 * Web Workers run on a background thread and are exempt from timer throttling,
 * guaranteeing accurate 1-second ticks and exact on-time alarms when countdown hits zero.
 */

const workerScript = `
let intervalId = null;

self.onmessage = function(e) {
  const data = e.data || {};
  if (data.action === 'start') {
    if (intervalId !== null) clearInterval(intervalId);
    const ms = typeof data.interval === 'number' ? data.interval : 1000;
    intervalId = setInterval(function() {
      self.postMessage({ type: 'tick', timestamp: Date.now() });
    }, ms);
  } else if (data.action === 'stop') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
`;

let cachedWorkerUrl: string | null = null;

export function getWorkerUrl(): string | null {
  if (typeof window === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
    return null;
  }
  if (!cachedWorkerUrl) {
    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      cachedWorkerUrl = URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }
  return cachedWorkerUrl;
}

export function createTimerWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  try {
    const url = getWorkerUrl();
    if (!url) return null;
    return new Worker(url);
  } catch (err) {
    console.warn('Could not initialize background Timer Web Worker, falling back to window.setInterval:', err);
    return null;
  }
}
