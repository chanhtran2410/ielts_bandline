import { describe, expect, it } from 'vitest';
import {
  advance,
  createTimer,
  elapsedFraction,
  formatClock,
  isExpired,
  minutesToSeconds,
  remainingSeconds,
  timerLabel,
  urgencyOf,
} from './timer';

describe('createTimer', () => {
  it('starts paused with a floor of zero elapsed', () => {
    expect(createTimer(600)).toEqual({ durationSeconds: 600, elapsedSeconds: 0, running: false });
    expect(createTimer(600, -5).elapsedSeconds).toBe(0);
  });

  it('restores a resumed attempt at its saved elapsed time', () => {
    expect(createTimer(600, 120).elapsedSeconds).toBe(120);
  });
});

describe('remainingSeconds', () => {
  it('counts down from the allowance', () => {
    expect(remainingSeconds(createTimer(600, 128))).toBe(472);
  });

  it('never goes negative', () => {
    expect(remainingSeconds(createTimer(600, 900))).toBe(0);
  });

  it('is null for an untimed session', () => {
    expect(remainingSeconds(createTimer(null, 90))).toBeNull();
  });
});

describe('isExpired', () => {
  it('is true only once the allowance is used up', () => {
    expect(isExpired(createTimer(600, 599))).toBe(false);
    expect(isExpired(createTimer(600, 600))).toBe(true);
  });

  it('is never true for an untimed session', () => {
    expect(isExpired(createTimer(null, 99999))).toBe(false);
  });
});

describe('elapsedFraction', () => {
  it('reports the share of the allowance consumed', () => {
    expect(elapsedFraction(createTimer(600, 150))).toBe(0.25);
  });

  it('caps at one and stays zero when untimed', () => {
    expect(elapsedFraction(createTimer(600, 1200))).toBe(1);
    expect(elapsedFraction(createTimer(null, 1200))).toBe(0);
    expect(elapsedFraction(createTimer(0, 10))).toBe(0);
  });
});

describe('urgencyOf', () => {
  it('escalates as time runs out', () => {
    expect(urgencyOf(createTimer(3600, 0))).toBe('normal');
    expect(urgencyOf(createTimer(3600, 3600 - 300))).toBe('warning');
    expect(urgencyOf(createTimer(3600, 3600 - 60))).toBe('critical');
    expect(urgencyOf(createTimer(3600, 3600))).toBe('critical');
  });

  it('stays normal when untimed', () => {
    expect(urgencyOf(createTimer(null, 99999))).toBe('normal');
  });
});

describe('advance', () => {
  it('does nothing while paused', () => {
    const paused = createTimer(600, 10);
    expect(advance(paused, 5)).toBe(paused);
  });

  it('accumulates while running', () => {
    const running = { ...createTimer(600, 10), running: true };
    expect(advance(running, 5).elapsedSeconds).toBe(15);
  });

  it('stops itself at the allowance instead of overrunning', () => {
    const running = { ...createTimer(600, 598), running: true };
    const next = advance(running, 5);
    expect(next.elapsedSeconds).toBe(600);
    expect(next.running).toBe(false);
  });

  it('keeps counting up past any point when untimed', () => {
    const running = { ...createTimer(null, 10), running: true };
    const next = advance(running, 5);
    expect(next.elapsedSeconds).toBe(15);
    expect(next.running).toBe(true);
  });

  it('ignores negative ticks', () => {
    const running = { ...createTimer(600, 10), running: true };
    expect(advance(running, -30).elapsedSeconds).toBe(10);
  });
});

describe('formatClock', () => {
  it('formats mm:ss with zero padding', () => {
    expect(formatClock(872)).toBe('14:32');
    expect(formatClock(9)).toBe('00:09');
    expect(formatClock(0)).toBe('00:00');
  });

  it('adds an hours segment past an hour', () => {
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3661)).toBe('1:01:01');
  });

  it('never renders a negative clock', () => {
    expect(formatClock(-30)).toBe('00:00');
  });
});

describe('timerLabel', () => {
  it('counts down when timed and up when not', () => {
    expect(timerLabel(createTimer(1200, 328))).toBe('14:32');
    expect(timerLabel(createTimer(null, 328))).toBe('05:28');
  });
});

describe('minutesToSeconds', () => {
  it('converts minutes, preserving null for untimed', () => {
    expect(minutesToSeconds(20)).toBe(1200);
    expect(minutesToSeconds(null)).toBeNull();
  });
});
