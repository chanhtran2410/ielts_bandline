import type { Band } from './band';
import type { Recommendation } from './plan';

export type ChatRole = 'user' | 'coach';

/**
 * A coach turn. Structured blocks let us render plans as real UI instead of
 * dumping raw model text (§18).
 */
export interface CoachMessage {
  id: string;
  role: ChatRole;
  /** Paragraphs of prose, in order. */
  paragraphs: string[];
  /** Actionable items rendered as tappable rows between the paragraphs. */
  recommendations: Recommendation[];
  /** Index in `paragraphs` after which recommendations are inserted. */
  recommendationsAfter: number;
  createdAt: string;
  status: 'complete' | 'pending' | 'failed';
}

/**
 * The learning context the frontend sends with every coach message. The
 * frontend assembles it from services; it never derives weaknesses itself.
 */
export interface CoachContext {
  currentBand: Band;
  targetBand: Band;
  examDate: string | null;
  weeksToExam: number | null;
  minutesPerDay: number;
  weakSkills: { skillId: string; name: string; band: Band; accuracy: number }[];
  recentMistakes: { patternId: string; title: string; count: number }[];
  recentAttempts: { attemptId: string; title: string; band: Band; submittedAt: string }[];
  studyMinutesLast7Days: number;
}

export interface CoachSession {
  id: string;
  messages: CoachMessage[];
  /** Chips offered under the composer, driven by the learner's actual data. */
  suggestedPrompts: string[];
  /** e.g. "Knows your last 12 tests, 8 essays and 90 mistakes". */
  contextSummary: string;
}
