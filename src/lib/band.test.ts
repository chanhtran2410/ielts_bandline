import { describe, expect, it } from 'vitest';
import {
  bandFromAccuracy,
  bandGapProgress,
  formatBand,
  formatBandDelta,
  formatPercentDelta,
  overallBand,
  readingBandFromRaw,
  roundToBand,
  toDelta,
  trendOf,
} from './band';

describe('roundToBand', () => {
  it('snaps to the nearest half band', () => {
    expect(roundToBand(6.2)).toBe(6);
    expect(roundToBand(6.3)).toBe(6.5);
    expect(roundToBand(6.74)).toBe(6.5);
    expect(roundToBand(6.75)).toBe(7);
  });

  it('clamps to the 0 to 9 scale', () => {
    expect(roundToBand(-3)).toBe(0);
    expect(roundToBand(12)).toBe(9);
  });
});

describe('readingBandFromRaw', () => {
  it('matches the official Academic Reading table at key thresholds', () => {
    expect(readingBandFromRaw(40, 40)).toBe(9);
    expect(readingBandFromRaw(39, 40)).toBe(9);
    expect(readingBandFromRaw(37, 40)).toBe(8.5);
    expect(readingBandFromRaw(35, 40)).toBe(8);
    expect(readingBandFromRaw(32, 40)).toBe(7);
    expect(readingBandFromRaw(30, 40)).toBe(7);
    expect(readingBandFromRaw(23, 40)).toBe(6);
    expect(readingBandFromRaw(16, 40)).toBe(5);
    expect(readingBandFromRaw(15, 40)).toBe(4.5);
    expect(readingBandFromRaw(0, 40)).toBe(0);
  });

  it('scales short drills up to the 40 question table', () => {
    expect(readingBandFromRaw(8, 10)).toBe(7);
    expect(readingBandFromRaw(4, 5)).toBe(7);
  });

  it('guards against out of range input', () => {
    expect(readingBandFromRaw(5, 0)).toBe(0);
    expect(readingBandFromRaw(-1, 40)).toBe(0);
    expect(readingBandFromRaw(99, 40)).toBe(9);
  });
});

describe('bandFromAccuracy', () => {
  it('converts percentages onto the band scale', () => {
    expect(bandFromAccuracy(100)).toBe(9);
    expect(bandFromAccuracy(80)).toBe(7);
    expect(bandFromAccuracy(0)).toBe(0);
  });
});

describe('overallBand', () => {
  it('rounds a .25 mean up to the next half band', () => {
    expect(overallBand([6, 6, 6.5, 6.5])).toBe(6.5);
  });

  it('rounds a mean below .25 down to the whole band', () => {
    expect(overallBand([6, 6, 6, 6.5])).toBe(6);
  });

  it('rounds a .75 mean up to the next whole band', () => {
    expect(overallBand([6.5, 6.5, 7, 7])).toBe(7);
  });

  it('handles an empty set', () => {
    expect(overallBand([])).toBe(0);
  });
});

describe('trendOf', () => {
  it('classifies direction with a tolerance around zero', () => {
    expect(trendOf(0.5)).toBe('up');
    expect(trendOf(-0.5)).toBe('down');
    expect(trendOf(0)).toBe('flat');
    expect(trendOf(0.0001)).toBe('flat');
  });
});

describe('formatting', () => {
  it('formats bands to one decimal', () => {
    expect(formatBand(7)).toBe('7.0');
    expect(formatBand(6.5)).toBe('6.5');
  });

  it('formats band deltas with arrows and an em dash when flat', () => {
    expect(formatBandDelta(toDelta(0.5))).toBe('\u25B2 0.5');
    expect(formatBandDelta(toDelta(-0.5))).toBe('\u25BC 0.5');
    expect(formatBandDelta(toDelta(0))).toBe('—');
    expect(formatBandDelta(null)).toBe('—');
  });

  it('formats percent deltas with a period suffix', () => {
    expect(formatPercentDelta(toDelta(23, '2 weeks'))).toBe('+23% in 2 weeks');
    expect(formatPercentDelta(toDelta(-4, '2 weeks'))).toBe('\u22124% in 2 weeks');
    expect(formatPercentDelta(toDelta(12))).toBe('+12%');
  });
});

describe('bandGapProgress', () => {
  it('measures ground covered from baseline to target', () => {
    expect(bandGapProgress(5.5, 6, 7)).toBeCloseTo(1 / 3, 5);
  });

  it('clamps outside the journey', () => {
    expect(bandGapProgress(5.5, 5, 7)).toBe(0);
    expect(bandGapProgress(5.5, 8, 7)).toBe(1);
  });

  it('handles a target at or below the baseline', () => {
    expect(bandGapProgress(7, 7, 7)).toBe(1);
    expect(bandGapProgress(7, 6, 6)).toBe(1);
  });
});
