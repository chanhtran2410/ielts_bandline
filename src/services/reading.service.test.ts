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

describe('regressions', () => {
  it('numbers a drill from 1, not from its parent paper (looked like another test)', async () => {
    // test_drill_headings is TREES_GROUPS filtered to one group, whose fixture
    // numbers are 14-18. A standalone drill must not open at question 14.
    const drill = await readingService.getTest('test_drill_headings');
    const numbers = allQuestions(drill.groups).map((q) => q.number);

    expect(numbers[0]).toBe(1);
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('numbers every assembled test contiguously from 1', async () => {
    for (const id of ['test_practice_sleep', 'test_practice_trees', 'test_mock_full']) {
      const test = await readingService.getTest(id);
      const numbers = allQuestions(test.groups).map((q) => q.number);
      expect(numbers, id).toEqual(numbers.map((_, i) => i + 1));
    }
  });

  it('points "practice this skill" at a test that contains the weak type', async () => {
    const test = await readingService.getTest('test_practice_sleep');
    const attempt = await readingService.startAttempt({
      testId: 'test_practice_sleep',
      mode: 'practice',
    });
    const questions = allQuestions(test.groups);

    // Get everything right except True/False/Not Given.
    const answers: Record<string, string | null> = {};
    for (const q of questions) {
      answers[q.id] = q.type === 'true_false_not_given' ? 'wrong' : (q.acceptedAnswers[0] ?? null);
    }

    const result = await readingService.submitAttempt(attempt.id, {
      attemptId: attempt.id,
      answers,
      flagged: [],
      highlights: [],
      notes: [],
      elapsedSeconds: 60,
      updatedAt: new Date().toISOString(),
    });

    const href = result.weakness?.practiceHref;
    expect(href).toBeDefined();
    // Must not be a fixed unrelated drill, and must not re-serve the same test.
    expect(href).not.toBe('/practice/session/test_practice_sleep');

    if (href !== '/practice') {
      const suggestedId = href!.replace('/practice/session/', '');
      const suggested = await readingService.getTest(suggestedId);
      expect(
        suggested.groups.some((g) => g.type === result.weakness?.skillId),
        'suggested test must actually contain ' + result.weakness?.skillId,
      ).toBe(true);
    }
  });
});

describe('group headings agree with the numbers beneath them', () => {
  /** "Questions 6–9 · Summary Completion" -> [6, 9] */
  function rangeFromHeading(heading: string): [number, number] | null {
    const m = /^Questions?\s+(\d+)\s*(?:[–—-]\s*(\d+))?/u.exec(heading);
    if (!m?.[1]) return null;
    const first = Number(m[1]);
    return [first, m[2] ? Number(m[2]) : first];
  }

  it.each([
    'test_drill_headings',
    'test_practice_trees',
    'test_practice_sleep',
    'test_practice_language',
    'test_mock_full',
    'test_mock_mini',
    'test_mock_skill',
    'test_diagnostic',
  ])('%s prints the real range in every group heading', async (testId) => {
    const test = await readingService.getTest(testId);

    for (const group of test.groups) {
      const numbers = group.questions.map((q) => q.number);
      const first = Math.min(...numbers);
      const last = Math.max(...numbers);
      const printed = rangeFromHeading(group.heading);

      expect(printed, `"${group.heading}" states no range`).not.toBeNull();
      expect(printed, `"${group.heading}" contradicts questions ${first}-${last}`).toEqual([
        first,
        last,
      ]);
    }
  });

  it('renumbers a filtered drill heading down from its parent range', async () => {
    // The fixture heading says "Questions 14–18"; the drill has 5 questions.
    const drill = await readingService.getTest('test_drill_headings');
    expect(drill.groups[0]?.heading).toMatch(/^Questions 1–5\b/);
  });
});
