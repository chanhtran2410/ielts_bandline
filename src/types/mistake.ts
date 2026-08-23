import type { Trend } from './band';

/** Error Bank taxonomy (§16). */
export type MistakeCategory =
  | 'grammar'
  | 'vocabulary'
  | 'collocation'
  | 'coherence'
  | 'task_response'
  | 'reading_strategy';

export type MasteryState = 'new' | 'practising' | 'nearly_resolved' | 'mastered';

/** A single wrong answer or flagged sentence, kept as evidence. */
export interface Mistake {
  id: string;
  patternId: string;
  category: MistakeCategory;
  /** What the learner wrote or chose. */
  original: string;
  /** What it should have been. */
  correction: string;
  /** Where it came from, e.g. "Writing Task 2 · Draft 2". */
  source: string;
  sourceHref: string | null;
  occurredAt: string;
}

/**
 * A recurring habit, aggregated from many `Mistake`s. This — not the raw
 * mistake — is what the learner practises against.
 */
export interface MistakePattern {
  id: string;
  category: MistakeCategory;
  title: string;
  /** Plain-language rule the learner keeps breaking. */
  rule: string;
  count: number;
  accuracy: number;
  accuracyTrend: Trend;
  /** Accuracy when the pattern was first detected, for before/now framing. */
  baselineAccuracy: number;
  mastery: MasteryState;
  lastSeenAt: string;
  examples: Mistake[];
}

export interface MistakeCategorySummary {
  category: MistakeCategory;
  label: string;
  /** e.g. "3 recurring patterns" or "Mostly collocations". */
  note: string;
  count: number;
  patternCount: number;
}

export interface MistakeFilter {
  category: MistakeCategory | 'all';
  mastery: MasteryState | 'all';
  query: string;
}

export const MISTAKE_CATEGORY_LABELS: Record<MistakeCategory, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  collocation: 'Collocation',
  coherence: 'Coherence',
  task_response: 'Task Response',
  reading_strategy: 'Reading Strategy',
};

export const MASTERY_LABELS: Record<MasteryState, string> = {
  new: 'new',
  practising: 'practising',
  nearly_resolved: 'nearly resolved',
  mastered: 'mastered',
};
