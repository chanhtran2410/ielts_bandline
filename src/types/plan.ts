import type { SkillId } from './user';

export type StudyTaskKind = 'reading_drill' | 'writing_drill' | 'mistake_review' | 'mock' | 'vocabulary';

export interface StudyTask {
  id: string;
  title: string;
  kind: StudyTaskKind;
  minutes: number;
  completed: boolean;
  /** Where "start" takes the learner. */
  href: string;
  /** Which weakness this task exists to close. */
  targetSkillId: SkillId | null;
  /** One line on why this task is in today's plan. */
  rationale: string;
}

export interface StudyPlan {
  date: string;
  totalMinutes: number;
  tasks: StudyTask[];
}

export function planProgress(plan: StudyPlan): { done: number; total: number } {
  return { done: plan.tasks.filter((t) => t.completed).length, total: plan.tasks.length };
}

/** A next-step suggestion produced by the recommendation service (§13). */
export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  minutes: number;
  href: string;
  targetSkillId: SkillId | null;
  /** Higher means more urgent. Ordering is decided by the service, not the UI. */
  priority: number;
}
