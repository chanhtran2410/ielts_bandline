import type { Band } from './band';

export type ExamHorizon = 'within_4_weeks' | 'about_8_weeks' | 'three_months_plus' | 'not_booked';

export type StudyMinutesPerDay = 15 | 30 | 45 | 60 | 90;

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface StudyGoal {
  targetBand: Band;
  examHorizon: ExamHorizon;
  /** ISO date. Null when the user has not booked an exam yet. */
  examDate: string | null;
  minutesPerDay: StudyMinutesPerDay;
  focusSkills: SkillId[];
}

export interface UserProfile {
  user: User;
  goal: StudyGoal;
  currentBand: Band;
  /** Whole weeks remaining until the exam; null when no date is set. */
  weeksToExam: number | null;
  diagnosticCompletedAt: string | null;
}

export type SkillId =
  | 'reading'
  | 'writing'
  | 'vocabulary'
  | 'grammar'
  | 'task_response'
  | 'coherence'
  | 'lexical_resource'
  | 'scanning'
  | 'inference'
  | 'paraphrasing'
  | 'main_idea';
