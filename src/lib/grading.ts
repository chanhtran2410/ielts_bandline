import type { Question, QuestionGroup, QuestionType } from '@/types/question';
import { isFreeTextQuestion } from '@/types/question';
import type { QuestionTypeResult } from '@/types/attempt';

/**
 * Normalises a free-text answer for comparison. IELTS marking ignores case,
 * surrounding whitespace, and the leading article on gap-fills; it does not
 * ignore spelling.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^(?:a|an|the)\s+/u, '')
    .replace(/[.,;:!?]+$/u, '');
}

/** Choice answers are compared as exact tokens, case-insensitively. */
export function normalizeChoice(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isAnswerCorrect(question: Question, answer: string | null): boolean {
  if (answer === null || answer.trim() === '') return false;
  const normalize = isFreeTextQuestion(question.type) ? normalizeAnswer : normalizeChoice;
  const given = normalize(answer);
  if (given === '') return false;
  return question.acceptedAnswers.some((accepted) => normalize(accepted) === given);
}

export interface GradedResponse {
  questionId: string;
  answer: string | null;
  isCorrect: boolean;
  type: QuestionType;
  skillIds: string[];
}

export function gradeAll(
  questions: readonly Question[],
  answers: Readonly<Record<string, string | null>>,
): GradedResponse[] {
  return questions.map((question) => {
    const answer = answers[question.id] ?? null;
    return {
      questionId: question.id,
      answer,
      isCorrect: isAnswerCorrect(question, answer),
      type: question.type,
      skillIds: question.skillIds,
    };
  });
}

export function rawScore(graded: readonly GradedResponse[]): number {
  return graded.filter((g) => g.isCorrect).length;
}

export function accuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Aggregates graded responses per question type, strongest first. */
export function byQuestionType(
  graded: readonly GradedResponse[],
  labels: Readonly<Record<string, string>>,
): QuestionTypeResult[] {
  const buckets = new Map<QuestionType, { correct: number; total: number }>();
  for (const g of graded) {
    const bucket = buckets.get(g.type) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (g.isCorrect) bucket.correct += 1;
    buckets.set(g.type, bucket);
  }
  return [...buckets.entries()]
    .map(([type, { correct, total }]) => ({
      type,
      label: labels[type] ?? type,
      correct,
      total,
      accuracy: accuracy(correct, total),
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
}

/** Aggregates graded responses per skill, so mastery can be updated. */
export function bySkill(graded: readonly GradedResponse[]): Map<string, { correct: number; total: number }> {
  const buckets = new Map<string, { correct: number; total: number }>();
  for (const g of graded) {
    for (const skillId of g.skillIds) {
      const bucket = buckets.get(skillId) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (g.isCorrect) bucket.correct += 1;
      buckets.set(skillId, bucket);
    }
  }
  return buckets;
}

export function allQuestions(groups: readonly QuestionGroup[]): Question[] {
  return groups.flatMap((group) => group.questions).sort((a, b) => a.number - b.number);
}

export function answeredCount(
  questions: readonly Question[],
  answers: Readonly<Record<string, string | null>>,
): number {
  return questions.filter((q) => {
    const a = answers[q.id];
    return a !== null && a !== undefined && a.trim() !== '';
  }).length;
}
