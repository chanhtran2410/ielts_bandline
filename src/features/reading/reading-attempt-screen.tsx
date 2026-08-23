'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/overlay';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TimerDisplay } from '@/components/ui/timer';
import { ExamDivider, ExamShell, ExamTopBar } from '@/components/layout/exam-shell';
import { PassageReader } from '@/components/reading/passage-reader';
import { QuestionGroupPanel } from '@/components/reading/question-group-panel';
import { QuestionNavigator } from '@/components/reading/question-navigator';
import { useAttempt } from './use-attempt';

export interface ReadingAttemptScreenProps {
  attemptId: string;
  testId: string;
  mode: 'practice' | 'mock' | 'diagnostic';
  resultHref: string;
  exitHref: string;
}

/**
 * The reading session. Mock mode is a genuinely different experience, not a
 * flag on a shared one: no annotation, no flag hints, and a confirmation before
 * submitting because the clock does not come back (§19).
 */
export function ReadingAttemptScreen({
  attemptId,
  testId,
  mode,
  resultHref,
  exitHref,
}: ReadingAttemptScreenProps) {
  const attempt = useAttempt({ attemptId, testId, mode, resultHref });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pane, setPane] = useState<'passage' | 'questions'>('passage');
  const isMock = mode === 'mock';

  // Keyboard navigation between questions, so the mouse is optional (§11, §21).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        attempt.next();
      } else if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        attempt.previous();
      } else if (event.key === 'f' && attempt.activeQuestionId) {
        event.preventDefault();
        attempt.toggleFlag(attempt.activeQuestionId);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [attempt]);

  if (attempt.isLoading) {
    return (
      <ExamShell>
        <LoadingState title="Loading your session…" detail="Restoring any answers you had saved." />
      </ExamShell>
    );
  }

  if (attempt.isError || !attempt.test) {
    return (
      <ExamShell>
        <ErrorState
          title="We couldn't load this test."
          detail="Nothing has been lost. Try again, or go back and pick another session."
          onRetry={attempt.refetch}
        />
      </ExamShell>
    );
  }

  const test = attempt.test;
  const passage = test.passages[0];
  const total = attempt.questions.length;
  const unanswered = total - attempt.answeredTotal;

  return (
    <ExamShell>
      <ExamTopBar
        exitHref={exitHref}
        title={test.title}
        chip={
          <Badge tone={isMock ? 'neutral' : 'accent'} caps>
            {isMock ? 'Mock mode' : 'Practice mode'}
          </Badge>
        }
      >
        <TimerDisplay label={attempt.timer.label} urgency={attempt.timer.urgency} />
        <ExamDivider />
        {!isMock && attempt.activeQuestionId ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => attempt.toggleFlag(attempt.activeQuestionId as string)}
            aria-pressed={attempt.flagged.includes(attempt.activeQuestionId)}
          >
            <Icon name="flag" size={12} />
            Flag
          </Button>
        ) : null}
        <Button onClick={() => setConfirmOpen(true)} disabled={attempt.isSubmitting}>
          {attempt.isSubmitting ? 'Submitting…' : 'Submit'}
        </Button>
      </ExamTopBar>

      {/* Mobile pane switcher — the two-column split does not survive a phone. */}
      <div className="flex shrink-0 border-b border-line bg-paper px-4 lg:hidden" role="tablist" aria-label="Session pane">
        {(['passage', 'questions'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={pane === value}
            onClick={() => setPane(value)}
            className={
              'flex-1 border-b-2 py-2.5 text-[13px] font-medium capitalize transition-colors ' +
              (pane === value
                ? 'border-accent font-semibold text-ink'
                : 'border-transparent text-muted')
            }
          >
            {value}
            {value === 'questions' ? (
              <span className="tnum ml-1.5 text-faint">
                {attempt.answeredTotal}/{total}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className={
            'overflow-y-auto border-r border-line bg-surface px-5 py-7 sm:px-10 lg:flex-[1.15] ' +
            (pane === 'passage' ? 'flex-1' : 'hidden lg:block')
          }
        >
          {passage ? (
            <PassageReader
              passage={passage}
              highlights={attempt.highlights}
              onAddHighlight={attempt.addHighlight}
              onRemoveHighlight={attempt.removeHighlight}
              annotatable={!isMock}
            />
          ) : null}
        </div>

        <div
          className={
            'overflow-y-auto bg-paper px-5 py-7 sm:px-9 lg:flex-1 ' +
            (pane === 'questions' ? 'flex-1' : 'hidden lg:block')
          }
        >
          <div className="max-w-[520px]">
            {test.groups.map((group) => (
              <QuestionGroupPanel
                key={group.id}
                group={group}
                answers={attempt.answers}
                flagged={attempt.flagged}
                activeQuestionId={attempt.activeQuestionId}
                onAnswer={attempt.setAnswer}
                onToggleFlag={attempt.toggleFlag}
                onFocusQuestion={attempt.focusQuestion}
              />
            ))}
          </div>
        </div>
      </div>

      <QuestionNavigator
        entries={attempt.navigatorEntries}
        activeQuestionId={attempt.activeQuestionId}
        onSelect={attempt.goToQuestion}
        caption={attempt.answeredTotal + ' of ' + total + ' answered'}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={unanswered > 0 ? 'Submit with ' + unanswered + ' unanswered?' : 'Submit your answers?'}
        description={
          unanswered > 0
            ? 'Unanswered questions score zero. You cannot return to this attempt after submitting.'
            : 'You cannot return to this attempt after submitting.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Keep working
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                attempt.submit();
              }}
              disabled={attempt.isSubmitting}
            >
              Submit
            </Button>
          </>
        }
      />

      {attempt.submitError ? (
        <div
          role="alert"
          className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-bad-line bg-bad-soft px-4 py-3 text-[13px] font-medium text-bad shadow-pop"
        >
          {attempt.submitError}
          <Button variant="secondary" size="sm" onClick={attempt.submit}>
            Try again
          </Button>
        </div>
      ) : null}
    </ExamShell>
  );
}
