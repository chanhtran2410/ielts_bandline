'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { AttemptDraft, PassageHighlight, Test } from '@/types/attempt';
import { allQuestions, answeredCount } from '@/lib/grading';
import { minutesToSeconds } from '@/lib/timer';
import { queryKeys } from '@/lib/query-client';
import { track } from '@/lib/analytics';
import { createLocalId } from '@/utils/id';
import { readingService } from '@/services/reading.service';
import { useAutosave } from '@/hooks/use-autosave';
import { useTimer } from '@/hooks/use-timer';
import type { NavigatorEntry } from '@/components/reading/question-navigator';

/** Stable empty fallbacks, so a memo dependency never changes identity. */
const EMPTY_IDS: readonly string[] = [];
const EMPTY_HIGHLIGHTS: readonly PassageHighlight[] = [];

export interface UseAttemptOptions {
  attemptId: string;
  testId: string;
  /** Mock mode locks out annotation and any feedback. */
  mode: 'practice' | 'mock' | 'diagnostic';
  /** Where to send the learner after submitting. */
  resultHref: string;
}

/**
 * Owns everything about an in-flight reading attempt: the test, the answers,
 * flags, highlights, the timer, autosave, and submission.
 *
 * The screen below it stays presentational. Answers live here as local UI
 * state and are mirrored to the service by autosave — they are not round-tripped
 * through the query cache on every keystroke (§23).
 */
export function useAttempt({ attemptId, testId, mode, resultHref }: UseAttemptOptions) {
  const router = useRouter();

  const testQuery = useQuery({
    queryKey: queryKeys.test(testId),
    queryFn: () => readingService.getTest(testId),
    staleTime: Infinity,
  });

  const draftQuery = useQuery({
    queryKey: [...queryKeys.attempt(attemptId), 'draft'],
    queryFn: () => readingService.getDraft(attemptId),
    staleTime: Infinity,
  });

  /**
   * Saved work is *derived over*, not copied into state by an effect: local
   * edits layer on top of whatever the service restored. That keeps a restored
   * attempt correct without a render-cascading sync effect, and means the
   * learner's edits always win over a late-arriving draft.
   */
  const [answerEdits, setAnswerEdits] = useState<Record<string, string | null>>({});
  const [flaggedOverride, setFlaggedOverride] = useState<string[] | null>(null);
  const [highlightOverride, setHighlightOverride] = useState<PassageHighlight[] | null>(null);
  const [focusedQuestionId, setFocusedQuestionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const test: Test | undefined = testQuery.data;
  const questions = useMemo(() => (test ? allQuestions(test.groups) : []), [test]);
  const restoredDraft = draftQuery.data;

  const answers = useMemo(
    () => ({ ...(restoredDraft?.answers ?? {}), ...answerEdits }),
    [restoredDraft, answerEdits],
  );
  // Memoised so the fallback empty array keeps a stable identity — otherwise the
  // autosave payload would look changed on every render and save in a loop.
  const flagged = useMemo(
    () => flaggedOverride ?? restoredDraft?.flagged ?? EMPTY_IDS,
    [flaggedOverride, restoredDraft],
  );
  const highlights = useMemo(
    () => highlightOverride ?? restoredDraft?.highlights ?? EMPTY_HIGHLIGHTS,
    [highlightOverride, restoredDraft],
  );

  /** Falls back to the first question rather than syncing it in via an effect. */
  const activeQuestionId = focusedQuestionId ?? questions[0]?.id ?? null;

  const timer = useTimer({
    durationSeconds: minutesToSeconds(test?.durationMinutes ?? null),
    initialElapsedSeconds: draftQuery.data?.elapsedSeconds ?? 0,
    autoStart: false,
    onExpire: () => {
      // Time is up: submit what exists rather than discarding it.
      void submit();
    },
  });

  // Start the clock only once the test and any saved draft are in hand, so the
  // learner is never charged for load time.
  const bothLoaded = Boolean(test) && draftQuery.isFetched;
  const { start: startTimer, running: timerRunning, expired: timerExpired } = timer;
  useEffect(() => {
    if (bothLoaded && !timerRunning && !timerExpired) startTimer();
  }, [bothLoaded, timerRunning, timerExpired, startTimer]);

  const testId_ = test?.id;
  useEffect(() => {
    if (testId_) {
      track({ name: mode === 'mock' ? 'mock_started' : 'practice_started', testId: testId_ });
    }
  }, [testId_, mode]);

  const draft: AttemptDraft = useMemo(
    () => ({
      attemptId,
      answers,
      flagged: [...flagged],
      highlights: [...highlights],
      notes: [],
      elapsedSeconds: timer.elapsed,
      updatedAt: new Date().toISOString(),
    }),
    [attemptId, answers, flagged, highlights, timer.elapsed],
  );

  const autosave = useAutosave({
    value: draft,
    save: (value) => readingService.saveDraft(value),
    debounceMs: 1200,
    enabled: bothLoaded,
  });

  const setAnswer = useCallback(
    (questionId: string, answer: string | null) => {
      setAnswerEdits((prev) => ({ ...prev, [questionId]: answer }));
      const question = questions.find((q) => q.id === questionId);
      if (question && answer) {
        track({ name: 'question_answered', questionId, questionType: question.type });
      }
    },
    [questions],
  );

  const restoredFlags = restoredDraft?.flagged;
  const toggleFlag = useCallback(
    (questionId: string) => {
      setFlaggedOverride((prev) => {
        const current = prev ?? restoredFlags ?? [];
        const next = current.includes(questionId)
          ? current.filter((id) => id !== questionId)
          : [...current, questionId];
        track({ name: 'question_flagged', questionId, flagged: next.includes(questionId) });
        return next;
      });
    },
    [restoredFlags],
  );

  const restoredHighlights = restoredDraft?.highlights;
  const addHighlight = useCallback(
    (highlight: Omit<PassageHighlight, 'id'>) => {
      setHighlightOverride((prev) => [
        ...(prev ?? restoredHighlights ?? []),
        { ...highlight, id: createLocalId('hl') },
      ]);
    },
    [restoredHighlights],
  );

  const removeHighlight = useCallback(
    (highlightId: string) => {
      setHighlightOverride((prev) =>
        (prev ?? restoredHighlights ?? []).filter((h) => h.id !== highlightId),
      );
    },
    [restoredHighlights],
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      timer.pause();
      await autosave.flush();
      return readingService.submitAttempt(attemptId, { ...draft, elapsedSeconds: timer.elapsed });
    },
    onSuccess: (result) => {
      track({
        name: mode === 'mock' ? 'mock_completed' : 'practice_completed',
        attemptId,
        band: result.estimatedBand,
        ...(mode === 'mock' ? {} : { rawScore: result.rawScore }),
      } as Parameters<typeof track>[0]);
      router.push(resultHref);
    },
    onError: (error: unknown) => {
      setSubmitError(
        error instanceof Error ? error.message : 'We could not submit your answers. Try again.',
      );
      if (!timer.expired) timer.start();
    },
  });

  const submit = useCallback(() => {
    setSubmitError(null);
    submitMutation.mutate();
  }, [submitMutation]);

  const navigatorEntries: NavigatorEntry[] = useMemo(
    () =>
      questions.map((question) => {
        const answer = answers[question.id];
        return {
          questionId: question.id,
          number: question.number,
          answered: answer !== null && answer !== undefined && answer.trim() !== '',
          flagged: flagged.includes(question.id),
        };
      }),
    [questions, answers, flagged],
  );

  const focusQuestion = useCallback((questionId: string) => {
    setFocusedQuestionId(questionId);
  }, []);

  /** Scrolls to a question and focuses it, for navigator clicks. */
  const goToQuestion = useCallback(
    (questionId: string) => {
      const question = questions.find((q) => q.id === questionId);
      setFocusedQuestionId(questionId);
      if (!question) return;
      const node = document.getElementById('question-' + question.number);
      node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      node?.querySelector<HTMLElement>('input, select, button')?.focus();
    },
    [questions],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      const index = questions.findIndex((q) => q.id === activeQuestionId);
      const next = questions[Math.min(questions.length - 1, Math.max(0, index + delta))];
      if (next) goToQuestion(next.id);
    },
    [questions, activeQuestionId, goToQuestion],
  );

  return {
    test,
    questions,
    isLoading: testQuery.isPending || draftQuery.isPending,
    isError: testQuery.isError,
    refetch: () => void testQuery.refetch(),

    answers,
    flagged,
    highlights,
    activeQuestionId,
    answeredTotal: answeredCount(questions, answers),

    setAnswer,
    toggleFlag,
    addHighlight,
    removeHighlight,
    focusQuestion,
    goToQuestion,
    next: () => step(1),
    previous: () => step(-1),

    navigatorEntries,
    timer,
    saveStatus: autosave.status,
    lastSavedAt: autosave.lastSavedAt,

    submit,
    isSubmitting: submitMutation.isPending,
    submitError,
    clearSubmitError: () => setSubmitError(null),
  };
}
