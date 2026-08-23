import type { Band } from '@/types/band';
import type { ExamHorizon, SkillId, StudyMinutesPerDay } from '@/types/user';

export type OnboardingStepId = 'target' | 'exam_date' | 'daily_time' | 'skills' | 'diagnostic';

export interface OnboardingStep {
  id: OnboardingStepId;
  /** Small uppercase label above the question. */
  eyebrow: string;
  question: string;
  /** Why the question is being asked — earns the answer. */
  rationale: string;
  /** Short label for the step tracker. */
  short: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'target',
    eyebrow: 'Your goal',
    question: 'What band do you need?',
    rationale:
      'Most universities ask for 6.5 or 7.0. Your target sets the gap we work to close, not just a number on a chart.',
    short: 'Target band',
  },
  {
    id: 'exam_date',
    eyebrow: 'Your goal',
    question: 'When is your exam?',
    rationale:
      "We'll pace your study plan so you peak at the right time — not two weeks late.",
    short: 'Exam date',
  },
  {
    id: 'daily_time',
    eyebrow: 'Your schedule',
    question: 'How long can you study each day?',
    rationale:
      'Be honest. A 20-minute plan you finish beats a 90-minute plan you abandon, and we size every daily plan to this number.',
    short: 'Daily time',
  },
  {
    id: 'skills',
    eyebrow: 'Your starting point',
    question: 'Where do you think you are weakest?',
    rationale:
      'Your answer only sets the first session. After the diagnostic, we use what you actually scored rather than what you guessed.',
    short: 'Skills',
  },
  {
    id: 'diagnostic',
    eyebrow: 'Almost there',
    question: 'Ready for your diagnostic?',
    rationale:
      'Thirty minutes of reading and writing gives us your starting band and a skill map. Everything after this is built from it.',
    short: 'Diagnostic',
  },
];

export interface Choice<T> {
  value: T;
  label: string;
  note: string;
  /** Marks the option most learners pick. */
  common?: boolean;
}

export const TARGET_BAND_CHOICES: readonly Choice<Band>[] = [
  { value: 6, label: 'Band 6.0', note: 'Many undergraduate courses' },
  { value: 6.5, label: 'Band 6.5', note: 'Most universities', common: true },
  { value: 7, label: 'Band 7.0', note: 'Competitive programmes and visas' },
  { value: 7.5, label: 'Band 7.5+', note: 'Medicine, law, PhD' },
];

export const EXAM_HORIZON_CHOICES: readonly Choice<ExamHorizon>[] = [
  { value: 'within_4_weeks', label: 'Within 4 weeks', note: 'Intensive plan' },
  { value: 'about_8_weeks', label: 'In about 8 weeks', note: 'Balanced plan', common: true },
  { value: 'three_months_plus', label: 'In 3+ months', note: 'Steady plan' },
  { value: 'not_booked', label: 'Not booked yet', note: "We'll suggest a date" },
];

export const DAILY_TIME_CHOICES: readonly Choice<StudyMinutesPerDay>[] = [
  { value: 15, label: '15 minutes', note: 'One focused drill' },
  { value: 30, label: '30 minutes', note: 'A drill and a review' },
  { value: 45, label: '45 minutes', note: 'Full daily plan', common: true },
  { value: 90, label: '90 minutes', note: 'Intensive preparation' },
];

export const FOCUS_SKILL_CHOICES: readonly Choice<SkillId>[] = [
  { value: 'reading', label: 'Reading', note: 'Speed, question types, accuracy' },
  { value: 'writing', label: 'Writing', note: 'Structure, ideas, register' },
  { value: 'grammar', label: 'Grammar', note: 'Accuracy and range' },
  { value: 'vocabulary', label: 'Vocabulary', note: 'Precision and collocation' },
];

/** Turns an horizon into a concrete date, so the plan has something to pace to. */
export function estimateExamDate(horizon: ExamHorizon, from = new Date()): string | null {
  const weeks = { within_4_weeks: 4, about_8_weeks: 8, three_months_plus: 14, not_booked: 0 }[horizon];
  if (weeks === 0) return null;
  const date = new Date(from.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}
