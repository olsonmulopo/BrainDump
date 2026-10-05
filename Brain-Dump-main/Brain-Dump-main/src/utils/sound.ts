/**
 * Browser Web Audio API sound synthesis.
 * Provides pleasant, gentle notification and alarm chimes without external audio dependencies.
 */

export type SoundEffectType = 'timer_complete' | 'alarm' | 'alert' | 'complete' | 'click';

export function playChime(type: SoundEffectType = 'complete'): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, dur: number, peakGain = 0.12) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    if (type === 'timer_complete') {
      // Pleasant celebratory ascending 4-tone chime (D5 -> F#5 -> A5 -> D6)
      playTone(587.33, now, 0.45, 0.14); // D5
      playTone(739.99, now + 0.11, 0.45, 0.13); // F#5
      playTone(880.0, now + 0.22, 0.55, 0.15); // A5
      playTone(1174.66, now + 0.35, 1.1, 0.16); // D6
    } else if (type === 'alarm') {
      // Two-pulse attention chime (A5 -> E6 -> A5 -> E6)
      playTone(880.0, now, 0.35, 0.15);
      playTone(1318.51, now + 0.14, 0.5, 0.16);
      playTone(880.0, now + 0.45, 0.35, 0.15);
      playTone(1318.51, now + 0.59, 0.9, 0.16);
    } else if (type === 'alert') {
      // Gentle notification double ping
      playTone(659.25, now, 0.25, 0.12); // E5
      playTone(783.99, now + 0.12, 0.5, 0.13); // G5
    } else if (type === 'complete') {
      // Soft pleasant task done marimba chord
      playTone(523.25, now, 0.3, 0.12); // C5
      playTone(659.25, now + 0.08, 0.4, 0.13); // E5
      playTone(783.99, now + 0.16, 0.8, 0.14); // G5
    } else {
      // Subtle click
      playTone(987.77, now, 0.1, 0.08); // B5
    }
  } catch {
    // Autoplay restrictions before user interaction - fail gracefully
  }
}
