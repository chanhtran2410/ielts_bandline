import type {
  Attempt,
  AttemptDraft,
  AttemptResult,
  AttemptWeakness,
  Test,
  TestMode,
} from '@/types/attempt';
import type { QuestionTypeMastery, SkillMastery } from '@/types/skill';
import { QUESTION_TYPE_LABELS, SKILL_LABELS } from '@/constants/labels';
import { bandFromAccuracy, readingBandFromRaw, toDelta } from '@/lib/band';
import { accuracy, allQuestions, byQuestionType, bySkill, gradeAll, rawScore } from '@/lib/grading';
import { ALL_TESTS, findTest } from '@/mocks/tests.mock';
import { clone, delay, ServiceError } from './http';

export interface StartAttemptInput {
  testId: string;
  mode: TestMode;
}

export interface ReadingService {
  /** Tests available to practise, newest-relevant first. */
  listTests(mode: TestMode): Promise<Test[]>;
  getTest(testId: string): Promise<Test>;
  startAttempt(input: StartAttemptInput): Promise<Attempt>;
  getAttempt(attemptId: string): Promise<Attempt>;
  /** Restores in-flight work so a refresh mid-exam loses nothing. */
  getDraft(attemptId: string): Promise<AttemptDraft | null>;
  saveDraft(draft: AttemptDraft): Promise<void>;
  submitAttempt(attemptId: string, draft: AttemptDraft): Promise<AttemptResult>;
  getResult(attemptId: string): Promise<AttemptResult>;
}

const attempts = new Map<string, Attempt>();
const drafts = new Map<string, AttemptDraft>();
const results = new Map<string, AttemptResult>();

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return prefix + '_' + Date.now().toString(36) + '_' + sequence;
}

/** Why the weakest question type is weak, in terms of the habit behind it. */
const WEAKNESS_DIAGNOSES: Record<string, string> = {
  matching_headings:
    "You often select answers based on keyword matching instead of identifying the paragraph's main idea. In this test, 4 of your 5 wrong headings contained a word copied directly from the paragraph.",
  true_false_not_given:
    'Your errors cluster on NOT GIVEN. You are marking a statement FALSE when the passage is simply silent about it, rather than contradicting it.',
  yes_no_not_given:
    "You are treating an unstated view as one the writer rejects. NO requires the writer to argue the opposite, not merely to omit the point.",
  summary_completion:
    'Most losses come from grammatical fit rather than comprehension — the word you chose was the right idea in the wrong form.',
  multiple_choice:
    'The distractors that catch you restate a detail from the passage accurately but do not answer the question asked.',
  sentence_completion:
    'You are exceeding the word limit. Answers over the stated maximum score zero even when the meaning is right.',
};

function diagnoseWeakness(
  type: string,
  label: string,
  wrong: number,
  total: number,
): AttemptWeakness {
  return {
    title: label,
    skillId: type,
    diagnosis:
      WEAKNESS_DIAGNOSES[type] ??
      'You lost ' +
        wrong +
        ' of ' +
        total +
        ' marks on this type. Review the explanations to find the pattern behind them.',
    accuracy: accuracy(total - wrong, total),
  };
}

function summarise(band: number, weakestLabel: string | null): string {
  if (!weakestLabel) return 'A clean result — no single question type is holding you back.';
  if (band >= 7) {
    return (
      'Your strongest reading result so far. One question type is holding you below Band ' +
      (band + 0.5).toFixed(1) +
      ' — details below.'
    );
  }
  return (
    'Solid comprehension overall. ' + weakestLabel + ' is the type costing you the most marks right now.'
  );
}

const mockReadingService: ReadingService = {
  async listTests(mode) {
    return delay(clone(ALL_TESTS.filter((t) => t.mode === mode)));
  },

  async getTest(testId) {
    const test = findTest(testId);
    if (!test) throw new ServiceError('We could not find that test.', { retryable: false });
    return delay(clone(test));
  },

  async startAttempt({ testId, mode }) {
    const test = findTest(testId);
    if (!test) throw new ServiceError('We could not find that test.', { retryable: false });

    const attempt: Attempt = {
      id: nextId('attempt'),
      testId,
      mode,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      submittedAt: null,
      elapsedSeconds: 0,
    };
    attempts.set(attempt.id, attempt);
    drafts.set(attempt.id, {
      attemptId: attempt.id,
      answers: {},
      flagged: [],
      highlights: [],
      notes: [],
      elapsedSeconds: 0,
      updatedAt: attempt.startedAt,
    });
    return delay(clone(attempt));
  },

  async getAttempt(attemptId) {
    const attempt = attempts.get(attemptId);
    if (!attempt) throw new ServiceError('That attempt has expired.', { retryable: false });
    return delay(clone(attempt));
  },

  async getDraft(attemptId) {
    const draft = drafts.get(attemptId);
    return delay(draft ? clone(draft) : null);
  },

  async saveDraft(draft) {
    drafts.set(draft.attemptId, clone({ ...draft, updatedAt: new Date().toISOString() }));
    const attempt = attempts.get(draft.attemptId);
    if (attempt) {
      attempts.set(attempt.id, { ...attempt, elapsedSeconds: draft.elapsedSeconds });
    }
    await delay(undefined, 140);
  },

  async submitAttempt(attemptId, draft) {
    const attempt = attempts.get(attemptId);
    if (!attempt) throw new ServiceError('That attempt has expired.', { retryable: false });

    const test = findTest(attempt.testId);
    if (!test) throw new ServiceError('We could not load the test for this attempt.');

    const questions = allQuestions(test.groups);
    const graded = gradeAll(questions, draft.answers);
    const correct = rawScore(graded);
    const total = questions.length;

    const questionTypes = byQuestionType(graded, QUESTION_TYPE_LABELS);
    const weakestType = [...questionTypes].sort((a, b) => a.accuracy - b.accuracy)[0];

    const skillBuckets = bySkill(graded);
    const skills: SkillMastery[] = [...skillBuckets.entries()]
      .map(([skillId, bucket]) => {
        const acc = accuracy(bucket.correct, bucket.total);
        return {
          skillId,
          name: SKILL_LABELS[skillId] ?? skillId,
          accuracy: acc,
          band: bandFromAccuracy(acc),
          delta: toDelta(0),
          sampleSize: bucket.total,
          history: [acc],
        } satisfies SkillMastery;
      })
      .sort((a, b) => b.accuracy - a.accuracy);

    const questionTypeMastery: QuestionTypeMastery[] = questionTypes.map((qt) => ({
      type: qt.type,
      label: qt.label,
      accuracy: qt.accuracy,
      delta: toDelta(0),
      sampleSize: qt.total,
    }));

    const band = readingBandFromRaw(correct, total);

    const result: AttemptResult = {
      attemptId,
      testId: test.id,
      testTitle: test.title,
      mode: attempt.mode,
      submittedAt: new Date().toISOString(),
      rawScore: correct,
      totalQuestions: total,
      estimatedBand: band,
      bandDelta: toDelta(0.5),
      summary: summarise(band, weakestType?.label ?? null),
      questionTypes,
      skills,
      questionTypeMastery,
      weakness:
        weakestType && weakestType.accuracy < 100
          ? diagnoseWeakness(
              weakestType.type,
              weakestType.label,
              weakestType.total - weakestType.correct,
              weakestType.total,
            )
          : null,
      responses: graded.map((g) => ({
        questionId: g.questionId,
        answer: g.answer,
        isCorrect: g.isCorrect,
        flagged: draft.flagged.includes(g.questionId),
        timeSpentSeconds: 0,
      })),
    };

    attempts.set(attemptId, {
      ...attempt,
      status: 'submitted',
      submittedAt: result.submittedAt,
      elapsedSeconds: draft.elapsedSeconds,
    });
    results.set(attemptId, result);
    drafts.set(attemptId, clone(draft));

    return delay(clone(result), 420);
  },

  async getResult(attemptId) {
    const result = results.get(attemptId);
    if (!result) {
      throw new ServiceError('We could not find a result for that attempt.', { retryable: false });
    }
    return delay(clone(result));
  },
};

export const readingService: ReadingService = mockReadingService;
