'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import { countWords } from '@/lib/word-count';
import { minutesToSeconds } from '@/lib/timer';
import { queryKeys } from '@/lib/query-client';
import { writingService } from '@/services/writing.service';
import { useAutosave, saveStatusLabel } from '@/hooks/use-autosave';
import { useTimer } from '@/hooks/use-timer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Drawer } from '@/components/ui/overlay';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TimerDisplay } from '@/components/ui/timer';
import { ExamDivider, ExamShell, ExamTopBar } from '@/components/layout/exam-shell';
import { TaskBrief } from '@/components/writing/task-brief';
import { WordCountBar } from '@/components/writing/word-count-bar';
import { SubmissionHistory } from './submission-history';

export function WritingEditorScreen({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const submissionQuery = useQuery({
    queryKey: queryKeys.writingSubmission(submissionId),
    queryFn: () => writingService.getSubmission(submissionId),
    staleTime: Infinity,
  });

  const submission = submissionQuery.data;

  const taskQuery = useQuery({
    queryKey: ['writing', 'task', submission?.taskId],
    queryFn: () => writingService.getTask(submission?.taskId as string),
    enabled: Boolean(submission?.taskId),
    staleTime: Infinity,
  });

  /**
   * `null` means "not edited yet", so the stored body shows through without an
   * effect copying server data into state. The first keystroke takes ownership.
   */
  const [body, setBody] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const task = taskQuery.data;
  const text = body ?? submission?.body ?? '';
  const wordCount = useMemo(() => countWords(text), [text]);

  const essayRef = useRef<HTMLTextAreaElement>(null);

  // Match the textarea's height to its content so it never scrolls internally.
  // Runs on every text change, including the initial adoption of a saved draft.
  useEffect(() => {
    const node = essayRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = node.scrollHeight + 'px';
  }, [text]);

  const timer = useTimer({
    durationSeconds: minutesToSeconds(task?.recommendedMinutes ?? null),
    initialElapsedSeconds: submission?.timeSpentSeconds ?? 0,
    autoStart: false,
  });

  const ready = Boolean(submission && task);
  const { start: startTimer, running: timerRunning, expired: timerExpired } = timer;
  useEffect(() => {
    if (ready && !timerRunning && !timerExpired) startTimer();
  }, [ready, timerRunning, timerExpired, startTimer]);

  const save = useCallback(
    async (value: { body: string; seconds: number }) => {
      await writingService.saveDraft(submissionId, value.body, value.seconds);
    },
    [submissionId],
  );

  const autosaveValue = useMemo(() => ({ body: text, seconds: timer.elapsed }), [text, timer.elapsed]);
  const autosave = useAutosave({ value: autosaveValue, save, debounceMs: 1000, enabled: ready });

  const analyse = useMutation({
    mutationFn: async () => {
      timer.pause();
      await autosave.flush();
      return writingService.submitForAnalysis(submissionId);
    },
    onSuccess: (feedback) => {
      track({ name: 'writing_submitted', submissionId, wordCount });
      queryClient.setQueryData(queryKeys.writingFeedback(submissionId), feedback);
      void queryClient.invalidateQueries({ queryKey: queryKeys.writingSubmissions });
      router.push('/writing/' + submissionId + '/analysis');
    },
    onError: (error: unknown) => {
      setSubmitError(
        error instanceof Error ? error.message : 'We could not send your essay for analysis.',
      );
      if (!timer.expired) timer.start();
    },
  });

  if (submissionQuery.isPending || taskQuery.isPending || !ready) {
    if (submissionQuery.isError || taskQuery.isError) {
      return (
        <ExamShell>
          <ErrorState
            title="We couldn't open this draft."
            detail="Your writing is saved. Try again in a moment."
            onRetry={() => {
              void submissionQuery.refetch();
              void taskQuery.refetch();
            }}
          />
        </ExamShell>
      );
    }
    return (
      <ExamShell>
        <LoadingState title="Opening your draft…" />
      </ExamShell>
    );
  }

  if (!submission || !task) {
    return (
      <ExamShell>
        <ErrorState title="We couldn't find that draft." detail="It may have been deleted." />
      </ExamShell>
    );
  }

  const tooShort = wordCount < Math.min(40, task.minWords);

  return (
    <ExamShell>
      <ExamTopBar
        exitHref="/writing"
        title={'Writing Task ' + task.task}
        chip={<Badge tone="neutral" caps>{'Draft ' + submission.draftNumber}</Badge>}
      >
        <p className="flex items-center gap-1.5 text-xs text-faint">
          {autosave.status === 'error' ? (
            <Icon name="alert" size={12} className="text-bad" />
          ) : (
            <Icon name="check" size={12} className="text-good" />
          )}
          {saveStatusLabel(autosave.status, autosave.lastSavedAt)}
        </p>
        <ExamDivider />
        <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)}>
          History
        </Button>
        <Button
          onClick={() => {
            setSubmitError(null);
            analyse.mutate();
          }}
          disabled={analyse.isPending || tooShort}
          title={tooShort ? 'Write a little more before submitting' : undefined}
        >
          {analyse.isPending ? 'Analyzing…' : 'Submit for analysis'}
        </Button>
      </ExamTopBar>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="shrink-0 overflow-y-auto border-b border-line bg-paper px-5 py-6 sm:px-7 lg:w-[360px] lg:border-b-0 lg:border-r">
          <TaskBrief
            task={task}
            coachReminder="Your last two essays lost marks on paragraph progression. Start each body paragraph with a clear topic sentence before adding examples."
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
          <div className="flex-1 overflow-y-auto py-8 sm:py-11">
            <div className="mx-auto max-w-[640px] px-5 sm:px-10">
              <label htmlFor="essay" className="sr-only">
                Your essay
              </label>
              <textarea
                ref={essayRef}
                id="essay"
                value={text}
                onChange={(event) => setBody(event.target.value)}
                spellCheck
                placeholder="Start your introduction here…"
                /*
                 * Grows to fit its content (see the effect below), so the only
                 * scroll container is the pane around it. A fixed-height
                 * textarea inside a scrolling parent gives two nested
                 * scrollbars that fight each other and drag the caret
                 * off-screen mid-sentence.
                 */
                className="min-h-[60vh] w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[16.5px] leading-[1.85] text-ink placeholder:text-faint focus:outline-none"
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-t border-line bg-paper px-5 py-3 sm:px-8">
            <WordCountBar count={wordCount} minWords={task.minWords} />
            <div className="ml-auto">
              <TimerDisplay label={timer.label} urgency={timer.urgency} suffix="left" />
            </div>
          </div>
        </div>
      </div>

      {submitError ? (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-40 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-bad-line bg-bad-soft px-4 py-3 text-[13px] font-medium text-bad shadow-pop"
        >
          {submitError}
          <Button variant="secondary" size="sm" onClick={() => analyse.mutate()}>
            Try again
          </Button>
        </div>
      ) : null}

      <Drawer open={historyOpen} onClose={() => setHistoryOpen(false)} title="Essay history">
        <SubmissionHistory
          taskId={task.id}
          currentSubmissionId={submissionId}
          onNavigate={() => setHistoryOpen(false)}
        />
      </Drawer>
    </ExamShell>
  );
}
