'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { TestMode } from '@/types/attempt';
import { readingService } from '@/services/reading.service';
import { ExamShell } from '@/components/layout/exam-shell';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { ReadingAttemptScreen } from './reading-attempt-screen';

export interface AttemptLauncherProps {
  testId: string;
  mode: TestMode;
  /** Base path for this mode, e.g. "/practice" or "/mock". */
  basePath: string;
}

/**
 * Creates the attempt, then hands off to the session screen.
 *
 * Keeping this separate means the session screen always receives a real
 * attemptId and never has to render a half-initialised state.
 */
export function AttemptLauncher({ testId, mode, basePath }: AttemptLauncherProps) {
  const started = useRef(false);

  const start = useMutation({
    mutationFn: () => readingService.startAttempt({ testId, mode }),
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start.mutate();
    // `start` is a stable mutation object; the ref guard is what enforces once.
  }, [start]);

  if (start.isError) {
    return (
      <ExamShell>
        <ErrorState
          title="We couldn't start this session."
          detail="Nothing has been recorded. Try again, or pick another session."
          onRetry={() => start.mutate()}
        />
      </ExamShell>
    );
  }

  if (!start.data) {
    return (
      <ExamShell>
        <LoadingState title="Setting up your session…" />
      </ExamShell>
    );
  }

  const attempt = start.data;
  const sessionMode = mode === 'diagnostic' ? 'diagnostic' : mode;

  return (
    <ReadingAttemptScreen
      attemptId={attempt.id}
      testId={testId}
      mode={sessionMode}
      resultHref={basePath + '/result/' + attempt.id}
      exitHref={mode === 'mock' ? '/mock' : '/dashboard'}
    />
  );
}
