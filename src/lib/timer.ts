/**
 * Timer domain logic, deliberately free of React and of any rendering concern
 * (§11). The hook in hooks/use-timer.ts drives this; components only read it.
 */

export interface TimerState {
  /** Total allowance in seconds. Null means the timer counts up, untimed. */
  durationSeconds: number | null;
  elapsedSeconds: number;
  running: boolean;
}

export function createTimer(durationSeconds: number | null, elapsedSeconds = 0): TimerState {
  return { durationSeconds, elapsedSeconds: Math.max(0, elapsedSeconds), running: false };
}

export function remainingSeconds(state: TimerState): number | null {
  if (state.durationSeconds === null) return null;
  return Math.max(0, state.durationSeconds - state.elapsedSeconds);
}

export function isExpired(state: TimerState): boolean {
  const remaining = remainingSeconds(state);
  return remaining !== null && remaining <= 0;
}

/** Fraction 0 to 1 of the allowance consumed. Always 0 for untimed sessions. */
export function elapsedFraction(state: TimerState): number {
  if (state.durationSeconds === null || state.durationSeconds <= 0) return 0;
  return Math.min(1, state.elapsedSeconds / state.durationSeconds);
}

export type TimerUrgency = 'normal' | 'warning' | 'critical';

/**
 * Escalates as the allowance runs out, so the UI can change treatment without
 * hardcoding thresholds at the call site.
 */
export function urgencyOf(state: TimerState): TimerUrgency {
  const remaining = remainingSeconds(state);
  if (remaining === null) return 'normal';
  if (remaining <= 60) return 'critical';
  if (remaining <= 300) return 'warning';
  return 'normal';
}

export function advance(state: TimerState, bySeconds: number): TimerState {
  if (!state.running) return state;
  const elapsedSeconds = state.elapsedSeconds + Math.max(0, bySeconds);
  const capped =
    state.durationSeconds === null ? elapsedSeconds : Math.min(state.durationSeconds, elapsedSeconds);
  return { ...state, elapsedSeconds: capped, running: capped === state.durationSeconds ? false : state.running };
}

/** mm:ss, or h:mm:ss once past an hour. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? hours + ':' + pad(minutes) + ':' + pad(seconds) : pad(minutes) + ':' + pad(seconds);
}

/** The label shown in exam chrome: counts down when timed, up when not. */
export function timerLabel(state: TimerState): string {
  const remaining = remainingSeconds(state);
  return remaining === null ? formatClock(state.elapsedSeconds) : formatClock(remaining);
}

export function minutesToSeconds(minutes: number | null): number | null {
  return minutes === null ? null : Math.round(minutes * 60);
}
