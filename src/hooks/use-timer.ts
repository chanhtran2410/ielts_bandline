'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TimerState, TimerUrgency } from '@/lib/timer';
import {
  advance,
  elapsedFraction,
  isExpired,
  remainingSeconds,
  timerLabel,
  urgencyOf,
} from '@/lib/timer';

export interface UseTimerOptions {
  /**
   * Total allowance in seconds, or null to count up. May arrive as null on the
   * first render and settle once the test loads — the timer picks it up.
   */
  durationSeconds: number | null;
  /** Resume point, so a restored attempt does not gain free time. */
  initialElapsedSeconds?: number;
  autoStart?: boolean;
  /** Fired once, when a timed session reaches zero. */
  onExpire?: () => void;
}

export interface UseTimerResult {
  state: TimerState;
  /** Pre-formatted for display: counts down when timed, up when not. */
  label: string;
  remaining: number | null;
  elapsed: number;
  fraction: number;
  urgency: TimerUrgency;
  expired: boolean;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * Drives the pure timer in lib/timer.ts on a one-second interval.
 *
 * Only `elapsedSeconds` and `running` are held in state; the allowance is read
 * from props on every render. That matters because the caller usually does not
 * know the duration on first render — it arrives with the test — and a duration
 * captured into initial state would leave the clock counting up forever.
 *
 * Ticks are measured against a wall-clock anchor rather than accumulated, so a
 * throttled background tab or a slow frame cannot hand the learner extra time.
 */
export function useTimer({
  durationSeconds,
  initialElapsedSeconds = 0,
  autoStart = false,
  onExpire,
}: UseTimerOptions): UseTimerResult {
  /**
   * State holds only the time accrued *in this session*. The resume point stays
   * a prop, so a draft that loads a second late is still honoured rather than
   * captured as zero.
   */
  const [accrued, setAccrued] = useState(0);
  const [running, setRunning] = useState(autoStart);

  const baseline = Math.max(0, initialElapsedSeconds);
  const elapsedSeconds =
    durationSeconds === null ? baseline + accrued : Math.min(durationSeconds, baseline + accrued);

  const state: TimerState = useMemo(
    () => ({ durationSeconds, elapsedSeconds, running }),
    [durationSeconds, elapsedSeconds, running],
  );

  /** Wall-clock anchor: when the current run started, and at what elapsed value. */
  const anchor = useRef<{ at: number; elapsed: number } | null>(null);
  const expiredNotified = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!running) {
      anchor.current = null;
      return;
    }

    const id = window.setInterval(() => {
      setAccrued((prev) => {
        if (!anchor.current) anchor.current = { at: Date.now(), elapsed: prev };
        const wallAccrued = anchor.current.elapsed + (Date.now() - anchor.current.at) / 1000;
        const next = advance(
          { durationSeconds, elapsedSeconds: baseline + prev, running: true },
          Math.max(0, wallAccrued - prev),
        );
        if (!next.running) setRunning(false);
        return Math.max(0, next.elapsedSeconds - baseline);
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [running, durationSeconds, baseline]);

  useEffect(() => {
    if (expiredNotified.current || !isExpired(state)) return;
    expiredNotified.current = true;
    onExpireRef.current?.();
  }, [state]);

  const start = useCallback(() => {
    setRunning((wasRunning) => {
      if (wasRunning) return wasRunning;
      anchor.current = null; // Re-anchored on the next tick.
      return true;
    });
  }, []);

  const pause = useCallback(() => {
    anchor.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    expiredNotified.current = false;
    anchor.current = null;
    setRunning(false);
    setAccrued(0);
  }, []);

  return {
    state,
    label: timerLabel(state),
    remaining: remainingSeconds(state),
    elapsed: Math.floor(elapsedSeconds),
    fraction: elapsedFraction(state),
    urgency: urgencyOf(state),
    expired: isExpired(state),
    running,
    start,
    pause,
    reset,
  };
}
