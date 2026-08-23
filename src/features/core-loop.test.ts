import { describe, expect, it } from 'vitest';
import { allQuestions } from '@/lib/grading';
import { coachService } from '@/services/coach.service';
import { dashboardService } from '@/services/dashboard.service';
import { mistakesService } from '@/services/mistakes.service';
import { profileService } from '@/services/profile.service';
import { readingService } from '@/services/reading.service';
import { recommendationService } from '@/services/recommendation.service';
import { writingService } from '@/services/writing.service';

/**
 * The product loop, exercised end to end through the service layer:
 *
 *   Diagnose -> detect weakness -> practice -> analyse -> measure -> adapt
 *
 * These tests are about the *loop closing*, not about any single screen. If the
 * loop breaks, the product has no reason to exist, so this is the suite that
 * must never be allowed to go red.
 */
describe('core loop: diagnostic to adapted practice', () => {
  it('walks onboarding, diagnostic, result and the recommendation that follows', async () => {
    // 1. Onboarding sets the goal the whole product paces to.
    const profile = await profileService.updateGoal({
      targetBand: 7,
      examDate: '2026-10-18',
      minutesPerDay: 45,
    });
    expect(profile.goal.targetBand).toBe(7);
    expect(profile.weeksToExam).not.toBeNull();

    // 2. The diagnostic is a real attempt, not a special case.
    const test = await readingService.getTest('test_diagnostic');
    const attempt = await readingService.startAttempt({
      testId: test.id,
      mode: 'diagnostic',
    });
    expect(attempt.status).toBe('in_progress');

    // 3. Answer imperfectly, the way a Band 6 learner would.
    const questions = allQuestions(test.groups);
    const answers: Record<string, string | null> = {};
    questions.forEach((question, index) => {
      answers[question.id] = index % 3 === 0 ? 'wrong' : (question.acceptedAnswers[0] ?? null);
    });

    const result = await readingService.submitAttempt(attempt.id, {
      attemptId: attempt.id,
      answers,
      flagged: [],
      highlights: [],
      notes: [],
      elapsedSeconds: 1_500,
      updatedAt: new Date().toISOString(),
    });

    // 4. The result must diagnose, not merely score.
    expect(result.rawScore).toBeGreaterThan(0);
    expect(result.rawScore).toBeLessThan(result.totalQuestions);
    expect(result.estimatedBand).toBeGreaterThan(0);
    expect(result.weakness).not.toBeNull();
    expect(result.weakness?.diagnosis.length).toBeGreaterThan(30);
    expect(result.questionTypes.length).toBeGreaterThan(0);
    expect(result.skills.length).toBeGreaterThan(0);

    // 5. The result is reachable again — a learner can come back to it.
    const reloaded = await readingService.getResult(attempt.id);
    expect(reloaded.estimatedBand).toBe(result.estimatedBand);

    // 6. And it leads somewhere: a next step with a reason attached.
    const recommendations = await recommendationService.getRecommendations(3);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0]?.href).toMatch(/^\//);
    expect(recommendations[0]?.reason.length).toBeGreaterThan(10);
  });

  it('surfaces the band gap, the weakness and today’s plan on the dashboard', async () => {
    const dashboard = await dashboardService.getDashboard();

    // Can the learner see where they are, and how far they have to go?
    expect(dashboard.bandGap.current).toBeGreaterThan(0);
    expect(dashboard.bandGap.target).toBeGreaterThan(dashboard.bandGap.current);
    expect(dashboard.bandGap.progress).toBeGreaterThanOrEqual(0);
    expect(dashboard.bandGap.progress).toBeLessThanOrEqual(1);
    expect(dashboard.bandGap.narrative.length).toBeGreaterThan(20);

    // Can they see their biggest weakness, with evidence?
    expect(dashboard.weakness).not.toBeNull();
    expect(dashboard.weakness?.relatedMistakeCount).toBeGreaterThan(0);
    expect(dashboard.weakness?.diagnosis).toContain(
      String(dashboard.weakness?.relatedMistakeCount),
    );

    // Can they see what to do next, and does each item explain itself?
    expect(dashboard.plan.tasks.length).toBeGreaterThan(0);
    for (const task of dashboard.plan.tasks) {
      expect(task.href).toMatch(/^\//);
      expect(task.rationale.length).toBeGreaterThan(10);
    }

    // Can they see improvement over time?
    expect(dashboard.recentProgress.length).toBeGreaterThan(0);
    expect(dashboard.skills.some((s) => s.isWeakest)).toBe(true);
  });

  it('marks the weakest skill tile as weakest, not an arbitrary one', async () => {
    const dashboard = await dashboardService.getDashboard();
    const weakest = [...dashboard.skills].sort((a, b) => a.band - b.band)[0];
    const flagged = dashboard.skills.find((s) => s.isWeakest);

    expect(flagged?.skillId).toBe(weakest?.skillId);
  });
});

describe('core loop: writing to Error Bank', () => {
  it('walks draft, submission, feedback, and the mistake it feeds', async () => {
    // 1. Start a fresh draft for a real task.
    const tasks = await writingService.listTasks();
    const task = tasks.find((t) => t.task === 2);
    expect(task).toBeDefined();

    const draft = await writingService.createDraft(task!.id);
    expect(draft.status).toBe('draft');
    expect(draft.wordCount).toBe(0);

    // 2. An essay too short to score is refused, rather than silently graded.
    await writingService.saveDraft(draft.id, 'Only a few words here.', 30);
    await expect(writingService.submitForAnalysis(draft.id)).rejects.toThrow(/not enough writing/i);

    // 3. A real-length essay is accepted and analysed.
    const essay = Array.from({ length: 60 }, () => 'Technology has changed daily life.').join(' ');
    const saved = await writingService.saveDraft(draft.id, essay, 900);
    expect(saved.wordCount).toBeGreaterThanOrEqual(task!.minWords);

    const feedback = await writingService.submitForAnalysis(draft.id);

    // 4. Feedback must be structured across all four criteria.
    expect(feedback.submissionId).toBe(draft.id);
    expect(feedback.overallBand).toBeGreaterThan(0);
    for (const criterion of [
      feedback.taskResponse,
      feedback.coherence,
      feedback.lexicalResource,
      feedback.grammar,
    ]) {
      expect(criterion.band).toBeGreaterThan(0);
      expect(criterion.comment.length).toBeGreaterThan(20);
      expect(criterion.improvements.length).toBeGreaterThan(0);
    }

    // 5. Sentence issues must teach, and must point at a real offset.
    expect(feedback.issues.length).toBeGreaterThan(0);
    for (const issue of feedback.issues) {
      expect(issue.why.length).toBeGreaterThan(15);
      expect(issue.suggestion).not.toBe(issue.original);
      expect(issue.end).toBeGreaterThan(issue.start);
    }

    // 6. The ladder shows the same idea rising through the bands.
    expect(feedback.ladders.length).toBeGreaterThan(0);
    const ladder = feedback.ladders[0]!;
    expect(ladder.corrected.band).toBeGreaterThan(ladder.original.band);
    expect(ladder.elevated.band).toBeGreaterThan(ladder.corrected.band);

    // 7. The submission reflects that it was analysed, and is re-readable.
    const after = await writingService.getSubmission(draft.id);
    expect(after.status).toBe('analyzed');
    expect(await writingService.getFeedback(draft.id)).toMatchObject({ submissionId: draft.id });

    // 8. Every issue that names a pattern must resolve to a real Error Bank entry.
    for (const issue of feedback.issues) {
      if (!issue.mistakePatternId) continue;
      const pattern = await mistakesService.getPattern(issue.mistakePatternId);
      expect(pattern.id).toBe(issue.mistakePatternId);
      expect(pattern.rule.length).toBeGreaterThan(20);
      expect(pattern.examples.length).toBeGreaterThan(0);
    }
  });

  it('practises a mistake and moves its measured accuracy', async () => {
    const before = await mistakesService.getPattern('pat_underdeveloped');
    const after = await mistakesService.recordPractice('pat_underdeveloped', 4, 5);

    expect(after.accuracy).not.toBe(before.accuracy);
    expect(after.lastSeenAt).not.toBe(before.lastSeenAt);
  });

  it('keeps every mistake example traceable to where it came from', async () => {
    const patterns = await mistakesService.getPatterns({
      category: 'all',
      mastery: 'all',
      query: '',
    });

    for (const pattern of patterns) {
      for (const example of pattern.examples) {
        expect(example.source.length).toBeGreaterThan(0);
        expect(example.original).not.toBe(example.correction);
        if (example.sourceHref !== null) expect(example.sourceHref).toMatch(/^\//);
      }
    }
  });
});

describe('core loop: the coach consumes context rather than deriving it', () => {
  it('assembles learning context from the learner’s real data', async () => {
    const context = await coachService.getContext();

    expect(context.currentBand).toBeGreaterThan(0);
    expect(context.targetBand).toBeGreaterThanOrEqual(context.currentBand);
    expect(context.weakSkills.length).toBeGreaterThan(0);
    expect(context.recentMistakes.length).toBeGreaterThan(0);
    expect(context.recentAttempts.length).toBeGreaterThan(0);
    expect(context.minutesPerDay).toBeGreaterThan(0);

    // Weakest first — the ordering is the coach's prioritisation signal.
    const accuracies = context.weakSkills.map((s) => s.accuracy);
    expect([...accuracies].sort((a, b) => a - b)).toEqual(accuracies);
  });

  it('answers with prose plus actionable recommendations, not just text', async () => {
    const context = await coachService.getContext();
    const reply = await coachService.sendMessage('Why is my writing stuck at 5.5?', context);

    expect(reply.role).toBe('coach');
    expect(reply.status).toBe('complete');
    expect(reply.paragraphs.length).toBeGreaterThan(0);
    expect(reply.recommendations.length).toBeGreaterThan(0);
    // The insertion point must be inside the prose it is anchored to.
    expect(reply.recommendationsAfter).toBeLessThan(reply.paragraphs.length);
  });

  it('grounds its answer in the learner’s actual weakest skill', async () => {
    const context = await coachService.getContext();
    const reply = await coachService.sendMessage('Why am I stuck?', context);
    const weakest = context.weakSkills[0];

    expect(reply.paragraphs.join(' ')).toContain(weakest?.name ?? '');
  });

  it('opens with a session the learner can act on immediately', async () => {
    const session = await coachService.getSession();

    expect(session.messages.length).toBeGreaterThan(0);
    expect(session.suggestedPrompts.length).toBeGreaterThan(0);
    expect(session.contextSummary.length).toBeGreaterThan(10);
  });
});

describe('mock mode is isolated from practice mode (§19)', () => {
  it('offers mock tests that are distinct from practice tests', async () => {
    const practice = await readingService.listTests('practice');
    const mock = await readingService.listTests('mock');

    expect(practice.length).toBeGreaterThan(0);
    expect(mock.length).toBeGreaterThan(0);
    expect(practice.every((t) => t.mode === 'practice')).toBe(true);
    expect(mock.every((t) => t.mode === 'mock')).toBe(true);
  });

  it('times every mock test, since exam conditions are the point', async () => {
    const mock = await readingService.listTests('mock');
    for (const test of mock) {
      expect(test.durationMinutes).not.toBeNull();
      expect(test.durationMinutes).toBeGreaterThan(0);
    }
  });

  it('still produces a full analysis after a mock submission', async () => {
    const attempt = await readingService.startAttempt({
      testId: 'test_mock_mini',
      mode: 'mock',
    });
    const test = await readingService.getTest('test_mock_mini');
    const questions = allQuestions(test.groups);

    const answers: Record<string, string | null> = {};
    questions.forEach((q, i) => {
      answers[q.id] = i % 2 === 0 ? (q.acceptedAnswers[0] ?? null) : 'wrong';
    });

    const result = await readingService.submitAttempt(attempt.id, {
      attemptId: attempt.id,
      answers,
      flagged: [],
      highlights: [],
      notes: [],
      elapsedSeconds: 1_200,
      updatedAt: new Date().toISOString(),
    });

    expect(result.mode).toBe('mock');
    expect(result.questionTypes.length).toBeGreaterThan(0);
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.weakness).not.toBeNull();
  });
});
