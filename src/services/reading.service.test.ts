import { describe, expect, it } from 'vitest';
import { allQuestions } from '@/lib/grading';
import { readingService } from './reading.service';

async function startAndAnswer(testId: string, pick: (accepted: string[]) => string | null) {
  const test = await readingService.getTest(testId);
  const attempt = await readingService.startAttempt({ testId, mode: 'practice' });
  const questions = allQuestions(test.groups);

  const answers: Record<string, string | null> = {};
  for (const question of questions) {
    answers[question.id] = pick(question.acceptedAnswers);
  }

  const result = await readingService.submitAttempt(attempt.id, {
    attemptId: attempt.id,
    answers,
    flagged: [],
    highlights: [],
    notes: [],
    elapsedSeconds: 120,
    updatedAt: new Date().toISOString(),
  });

  return { test, attempt, questions, result };
}

describe('readingService — attempt lifecycle', () => {
  it('scores a perfect attempt at the top band', async () => {
    const { result, questions } = await startAndAnswer(
      'test_practice_trees',
      (accepted) => accepted[0] ?? null,
    );

    expect(result.rawScore).toBe(questions.length);
    expect(result.totalQuestions).toBe(questions.length);
    expect(result.estimatedBand).toBe(9);
    // With nothing wrong there is no weakness to name.
    expect(result.weakness).toBeNull();
  });

  it('scores an empty attempt at zero without crashing', async () => {
    const { result } = await startAndAnswer('test_practice_trees', () => null);

    expect(result.rawScore).toBe(0);
    expect(result.estimatedBand).toBe(0);
    expect(result.weakness).not.toBeNull();
  });

  it('records a response for every question, answered or not', async () => {
    const { result, questions } = await startAndAnswer('test_practice_trees', () => null);
    expect(result.responses).toHaveLength(questions.length);
    expect(result.responses.every((r) => r.isCorrect === false)).toBe(true);
  });

  it('names the weakest question type and diagnoses the habit behind it', async () => {
    const test = await readingService.getTest('test_practice_trees');
    const attempt = await readingService.startAttempt({
      testId: 'test_practice_trees',
      mode: 'practice',
    });
    const questions = allQuestions(test.groups);

    // Get everything right except Matching Headings.
    const answers: Record<string, string | null> = {};
    for (const question of questions) {
      answers[question.id] =
        question.type === 'matching_headings' ? 'wrong' : (question.acceptedAnswers[0] ?? null);
    }

    const result = await readingService.submitAttempt(attempt.id, {
      attemptId: attempt.id,
      answers,
      flagged: [],
      highlights: [],
      notes: [],
      elapsedSeconds: 300,
      updatedAt: new Date().toISOString(),
    });

    expect(result.weakness?.title).toBe('Matching Headings');
    expect(result.weakness?.accuracy).toBe(0);
    // The diagnosis must explain the habit, not restate the score.
    expect(result.weakness?.diagnosis).toMatch(/keyword matching/i);
  });

  it('breaks the result down by question type and by skill', async () => {
    const { result } = await startAndAnswer(
      'test_practice_trees',
      (accepted) => accepted[0] ?? null,
    );

    expect(result.questionTypes.length).toBeGreaterThan(1);
    expect(result.skills.length).toBeGreaterThan(1);
    for (const type of result.questionTypes) {
      expect(type.correct).toBeLessThanOrEqual(type.total);
      expect(type.label).not.toBe(type.type);
    }
  });

  it('persists a draft and restores it', async () => {
    const attempt = await readingService.startAttempt({
      testId: 'test_practice_trees',
      mode: 'practice',
    });

    await readingService.saveDraft({
      attemptId: attempt.id,
      answers: { q14: 'iii' },
      flagged: ['q16'],
      highlights: [],
      notes: [],
      elapsedSeconds: 45,
      updatedAt: new Date().toISOString(),
    });

    const draft = await readingService.getDraft(attempt.id);
    expect(draft?.answers.q14).toBe('iii');
    expect(draft?.flagged).toEqual(['q16']);
    expect(draft?.elapsedSeconds).toBe(45);
  });

  it('carries flags through to the result', async () => {
    const attempt = await readingService.startAttempt({
      testId: 'test_drill_headings',
      mode: 'practice',
    });

    const result = await readingService.submitAttempt(attempt.id, {
      attemptId: attempt.id,
      answers: {},
      flagged: ['q16'],
      highlights: [],
      notes: [],
      elapsedSeconds: 10,
      updatedAt: new Date().toISOString(),
    });

    expect(result.responses.find((r) => r.questionId === 'q16')?.flagged).toBe(true);
  });

  it('reports the mode it was started in, so mock results stay distinguishable', async () => {
    const attempt = await readingService.startAttempt({ testId: 'test_mock_mini', mode: 'mock' });
    const result = await readingService.submitAttempt(attempt.id, {
      attemptId: attempt.id,
      answers: {},
      flagged: [],
      highlights: [],
      notes: [],
      elapsedSeconds: 0,
      updatedAt: new Date().toISOString(),
    });

    expect(result.mode).toBe('mock');
  });

  it('rejects an unknown test and an expired attempt', async () => {
    await expect(readingService.getTest('nope')).rejects.toThrow(/could not find/i);
    await expect(readingService.getResult('nope')).rejects.toThrow(/could not find/i);
    await expect(readingService.getAttempt('nope')).rejects.toThrow(/expired/i);
  });

  it('lists only the tests belonging to the requested mode', async () => {
    const practice = await readingService.listTests('practice');
    const mock = await readingService.listTests('mock');

    expect(practice.length).toBeGreaterThan(0);
    expect(practice.every((t) => t.mode === 'practice')).toBe(true);
    expect(mock.every((t) => t.mode === 'mock')).toBe(true);
  });
});

describe('test fixtures', () => {
  it('assembles a full 40-question mock with three passages', async () => {
    const test = await readingService.getTest('test_mock_full');

    expect(test.questionCount).toBe(40);
    expect(test.passages).toHaveLength(3);
    expect(test.durationMinutes).toBe(60);
  });

  it('numbers every question uniquely and consecutively from 1', async () => {
    const test = await readingService.getTest('test_mock_full');
    const numbers = allQuestions(test.groups).map((q) => q.number);

    expect(new Set(numbers).size).toBe(numbers.length);
    expect(numbers[0]).toBe(1);
    expect(numbers[numbers.length - 1]).toBe(40);
  });

  it('covers every reading question type across the catalogue', async () => {
    const test = await readingService.getTest('test_mock_full');
    const types = new Set(test.groups.map((g) => g.type));

    // Each renderer path in the engine needs at least one real fixture.
    expect(types.size).toBeGreaterThanOrEqual(13);
  });

  it('gives every question an accepted answer, a skill and an explanation', async () => {
    const test = await readingService.getTest('test_mock_full');

    for (const question of allQuestions(test.groups)) {
      expect(question.acceptedAnswers.length).toBeGreaterThan(0);
      expect(question.acceptedAnswers.every((a) => a.trim() !== '')).toBe(true);
      expect(question.skillIds.length).toBeGreaterThan(0);
      expect(question.explanation.length).toBeGreaterThan(10);
    }
  });

  it('keeps every matching answer inside its group option pool', async () => {
    const test = await readingService.getTest('test_mock_full');

    for (const group of test.groups) {
      if (!group.options) continue;
      const pool = new Set(group.options.map((o) => o.value));
      for (const question of group.questions) {
        if (question.options) continue;
        for (const accepted of question.acceptedAnswers) {
          expect(pool.has(accepted)).toBe(true);
        }
      }
    }
  });

  it('offers at least one within-limit answer for every completion question', async () => {
    const test = await readingService.getTest('test_mock_full');

    // A learner obeying "NO MORE THAN N WORDS" must be able to score. Longer
    // alternates are allowed to exist — graders ignore a leading article — but
    // the canonical answer has to fit the stated limit.
    for (const group of test.groups) {
      if (group.maxWords === undefined) continue;
      for (const question of group.questions) {
        const withinLimit = question.acceptedAnswers.filter(
          (a) => a.trim().split(/\s+/).length <= (group.maxWords as number),
        );
        expect(
          withinLimit.length,
          'question ' + question.number + ' has no answer within ' + group.maxWords + ' words',
        ).toBeGreaterThan(0);
        expect(question.acceptedAnswers[0]).toBe(withinLimit[0]);
      }
    }
  });
});
