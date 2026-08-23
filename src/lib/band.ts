import type { Band, Delta, Trend } from '@/types/band';

export const MIN_BAND = 0;
export const MAX_BAND = 9;

/** Bands are reported in half steps. */
export function roundToBand(value: number): Band {
  const clamped = Math.min(MAX_BAND, Math.max(MIN_BAND, value));
  return Math.round(clamped * 2) / 2;
}

export function formatBand(band: Band): string {
  return band.toFixed(1);
}

/**
 * Official IELTS Academic Reading raw-score band table (40 questions).
 * Indexed by raw score, so READING_BAND_TABLE[32] is band 7.
 */
const READING_BAND_TABLE: readonly Band[] = [
  /* 0     */ 0,
  /* 1     */ 1,
  /* 2     */ 1.5,
  /* 3     */ 2,
  /* 4-5   */ 2.5, 2.5,
  /* 6-7   */ 3, 3,
  /* 8-9   */ 3.5, 3.5,
  /* 10-12 */ 4, 4, 4,
  /* 13-15 */ 4.5, 4.5, 4.5,
  /* 16-19 */ 5, 5, 5, 5,
  /* 20-22 */ 5.5, 5.5, 5.5,
  /* 23-26 */ 6, 6, 6, 6,
  /* 27-29 */ 6.5, 6.5, 6.5,
  /* 30-32 */ 7, 7, 7,
  /* 33-34 */ 7.5, 7.5,
  /* 35-36 */ 8, 8,
  /* 37-38 */ 8.5, 8.5,
  /* 39-40 */ 9, 9,
];

/**
 * Converts a Reading raw score to a band. Tests shorter than 40 questions are
 * scaled up proportionally first, so a 10-question drill still reports a band.
 */
export function readingBandFromRaw(correct: number, total: number): Band {
  if (total <= 0) return 0;
  const bounded = Math.min(Math.max(correct, 0), total);
  const scaled = Math.round((bounded / total) * 40);
  return READING_BAND_TABLE[scaled] ?? 0;
}

/** Maps an accuracy percentage onto the band scale for skill-level reporting. */
export function bandFromAccuracy(accuracy: number): Band {
  return readingBandFromRaw(Math.round((accuracy / 100) * 40), 40);
}

/**
 * Overall band from the component bands. IELTS rounds the mean to the nearest
 * half band: below .25 rounds down, .25 to .74 rounds to the half, .75 rounds up.
 */
export function overallBand(components: readonly Band[]): Band {
  if (components.length === 0) return 0;
  const mean = components.reduce((sum, b) => sum + b, 0) / components.length;
  const whole = Math.floor(mean);
  const fraction = mean - whole;
  if (fraction < 0.25) return whole;
  if (fraction < 0.75) return whole + 0.5;
  return whole + 1;
}

export function trendOf(delta: number, epsilon = 0.001): Trend {
  if (delta > epsilon) return 'up';
  if (delta < -epsilon) return 'down';
  return 'flat';
}

export function toDelta(value: number, period?: string): Delta {
  return period === undefined
    ? { value, trend: trendOf(value) }
    : { value, trend: trendOf(value), period };
}

/** Arrow-and-figure band delta, or an em dash when unchanged. */
export function formatBandDelta(delta: Delta | null): string {
  if (!delta || delta.trend === 'flat') return '—';
  const sign = delta.trend === 'up' ? '\u25B2' : '\u25BC';
  return sign + ' ' + Math.abs(delta.value).toFixed(1);
}

export function formatPercentDelta(delta: Delta): string {
  if (delta.trend === 'flat') return '—';
  const sign = delta.trend === 'up' ? '+' : '\u2212';
  const period = delta.period ? ' in ' + delta.period : '';
  return sign + Math.abs(Math.round(delta.value)) + '%' + period;
}

/** Fraction 0 to 1 of the journey from baseline to target already covered. */
export function bandGapProgress(baseline: Band, current: Band, target: Band): number {
  const span = target - baseline;
  if (span <= 0) return current >= target ? 1 : 0;
  return Math.min(1, Math.max(0, (current - baseline) / span));
}
