import type { Band, Delta } from './band';
import type { Passage, QuestionGroup, QuestionType } from './question';
import type { QuestionTypeMastery, SkillMastery } from './skill';

export type TestMode = 'practice' | 'mock' | 'diagnostic';

export type TestKind = 'reading_passage' | 'reading_full' | 'skill_drill' | 'mistake_drill';

export interface Test {
  id: string;
  title: string;
  kind: TestKind;
  mode: TestMode;
  /** Total allowed minutes. Null means untimed. */
  durationMinutes: number | null;
  passages: Passage[];
  groups: QuestionGroup[];
  questionCount: number;
  /** Set when the test was assembled to target a weakness. */
  targetedSkillId?: string;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'abandoned';

export interface Attempt {
  id: string;
  testId: string;
  mode: TestMode;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  /** Seconds of exam time already consumed, so a resumed attempt stays honest. */
  elapsedSeconds: number;
}

/** One learner response. `answer` is null while unanswered. */
export interface QuestionAttempt {
  questionId: string;
  answer: string | null;
  isCorrect: boolean | null;
  flagged: boolean;
  /** Seconds spent with this question focused. */
  timeSpentSeconds: number;
}

/** The learner's in-flight work on an attempt, safe to persist and restore. */
export interface AttemptDraft {
  attemptId: string;
  answers: Record<string, string | null>;
  flagged: string[];
  highlights: PassageHighlight[];
  notes: PassageNote[];
  elapsedSeconds: number;
  updatedAt: string;
}

export interface PassageHighlight {
  id: string;
  passageId: string;
  paragraphLetter: string;
  /** Character offsets within the paragraph text. */
  start: number;
  end: number;
  text: string;
}

export interface PassageNote {
  id: string;
  highlightId: string;
  body: string;
}

export interface QuestionTypeResult {
  type: QuestionType;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
}

/**
 * Everything the result screen needs. Assembled by the service layer, never
 * computed inside a component (§24).
 */
export interface AttemptResult {
  attemptId: string;
  testId: string;
  testTitle: string;
  mode: TestMode;
  submittedAt: string;
  rawScore: number;
  totalQuestions: number;
  estimatedBand: Band;
  bandDelta: Delta | null;
  /** One-sentence plain-language read on the result. */
  summary: string;
  questionTypes: QuestionTypeResult[];
  skills: SkillMastery[];
  questionTypeMastery: QuestionTypeMastery[];
  /** The single thing most worth fixing, with the reason why. */
  weakness: AttemptWeakness | null;
  responses: QuestionAttempt[];
}

export interface AttemptWeakness {
  title: string;
  skillId: string;
  /** Explains the *habit* behind the errors, not just the count. */
  diagnosis: string;
  accuracy: number;
}
