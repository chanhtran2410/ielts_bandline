import type { Band, BandPoint, Delta } from './band';
import type { StudyPlan } from './plan';

export interface BandGap {
  current: Band;
  target: Band;
  /** Where the learner started, so the bar can show ground already covered. */
  baseline: Band;
  /** Fraction 0–1 of the journey completed. */
  progress: number;
  examDate: string | null;
  /** e.g. "You've closed 0.5 of the 1.5 bands to your target." */
  narrative: string;
}

export interface Weakness {
  skillId: string;
  title: string;
  band: Band;
  /** Evidence-backed explanation of the habit behind the weakness. */
  diagnosis: string;
  relatedMistakeCount: number;
  /** Where "fix this" leads. */
  href: string;
}

export interface SkillSnapshot {
  skillId: string;
  label: string;
  band: Band;
  delta: Delta;
  isWeakest: boolean;
  href: string | null;
}

/** A metric that shows real movement, not a vanity streak (§17). */
export interface ImprovementMetric {
  id: string;
  label: string;
  before: number;
  now: number;
  period: string;
}

export interface DashboardData {
  greeting: string;
  date: string;
  bandGap: BandGap;
  weakness: Weakness | null;
  plan: StudyPlan;
  skills: SkillSnapshot[];
  recentProgress: ImprovementMetric[];
  bandJourney: BandPoint[];
}
