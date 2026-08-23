import type { Band, Delta } from './band';

export interface Skill {
  id: string;
  name: string;
  /** Which part of the product this skill is measured by. */
  domain: 'reading' | 'writing' | 'language';
}

/**
 * How well the learner has mastered one skill. `accuracy` is the measured
 * signal; `band` is its conversion onto the IELTS scale.
 */
export interface SkillMastery {
  skillId: string;
  name: string;
  accuracy: number;
  band: Band;
  delta: Delta;
  /** Number of graded observations behind `accuracy`. Low counts are unreliable. */
  sampleSize: number;
  /** Sparkline history, oldest first, as accuracy percentages. */
  history: number[];
}

export interface QuestionTypeMastery {
  type: string;
  label: string;
  accuracy: number;
  delta: Delta;
  sampleSize: number;
}
