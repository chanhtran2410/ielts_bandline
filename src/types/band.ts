/** IELTS bands move in half steps from 0 to 9. */
export type Band = number;

/** A band measurement at a point in time, used to draw the band journey. */
export interface BandPoint {
  band: Band;
  date: string;
  label: string;
  kind: 'diagnostic' | 'mock' | 'current' | 'projected' | 'target';
}

export type Trend = 'up' | 'down' | 'flat';

export interface Delta {
  value: number;
  trend: Trend;
  /** Human window the delta was measured over, e.g. "2 weeks". */
  period?: string;
}
