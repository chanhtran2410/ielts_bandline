'use client';

import { useMemo, useState } from 'react';
import type { Mistake, MistakePattern } from '@/types/mistake';
import { normalizeAnswer } from '@/lib/grading';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress';

export interface MistakeDrillProps {
  pattern: MistakePattern;
  /** Reports the round so mastery can be recalculated by the service. */
  onComplete: (correct: number, total: number) => void;
}

interface Verdict {
  correct: boolean;
  answer: string;
}

/**
 * Practising a mistake means rewriting it, not re-reading it.
 *
 * Each of the learner's own past errors is presented for correction. Grading
 * reuses the same normalisation as the reading engine, so "the canopy" and
 * "canopy" are treated identically here too.
 */
export function MistakeDrill({ pattern, onComplete }: MistakeDrillProps) {
  const items = useMemo(() => pattern.examples.slice(0, 5), [pattern.examples]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  const current: Mistake | undefined = items[index];
  const verdict = current ? verdicts[current.id] : undefined;
  const answered = Object.keys(verdicts).length;
  const correctCount = Object.values(verdicts).filter((v) => v.correct).length;
  const finished = answered === items.length && items.length > 0;

  function check() {
    if (!current || verdict) return;
    const correct = normalizeAnswer(draft) === normalizeAnswer(current.correction);
    setVerdicts((prev) => ({ ...prev, [current.id]: { correct, answer: draft } }));
    track({ name: 'mistake_practiced', patternId: pattern.id });
  }

  function advance() {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setDraft('');
    } else {
      onComplete(correctCount, items.length);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="p-6 sm:px-7">
        <CardTitle className="mb-2">Nothing to drill yet</CardTitle>
        <p className="text-[13px] leading-relaxed text-muted">
          This pattern has no recorded examples. Once it shows up in a submission, you can practise
          it here.
        </p>
      </Card>
    );
  }

  if (finished) {
    const accuracy = Math.round((correctCount / items.length) * 100);
    return (
      <Card as="section" aria-labelledby="drill-done" className="p-6 sm:px-7">
        <CardTitle id="drill-done" className="mb-1">
          {correctCount} of {items.length} corrected
        </CardTitle>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          {accuracy >= 80
            ? 'That is the standard you need. Come back in a few days to prove it stuck.'
            : 'Re-read the rule above, then run it again — this pattern is not fixed yet.'}
        </p>
        <ProgressBar value={accuracy} tone={accuracy >= 80 ? 'good' : 'accent'} className="mb-5" />
        <Button
          onClick={() => {
            setVerdicts({});
            setIndex(0);
            setDraft('');
          }}
        >
          Run it again
        </Button>
      </Card>
    );
  }

  return (
    <Card as="section" aria-labelledby="drill-heading" className="p-6 sm:px-7">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <CardTitle id="drill-heading">Fix it yourself</CardTitle>
        <p className="tnum shrink-0 text-xs font-medium text-faint">
          {index + 1} of {items.length}
        </p>
      </div>

      <ProgressBar value={(answered / items.length) * 100} height={4} className="mb-5" />

      {current ? (
        <>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            You wrote
          </p>
          <p className="mb-4 rounded-lg border border-line-soft bg-sunken px-4 py-3 text-[14px] leading-relaxed text-bad line-through decoration-1">
            {current.original}
          </p>

          <label htmlFor="drill-answer" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            Write the correction
          </label>
          <input
            id="drill-answer"
            type="text"
            value={verdict ? verdict.answer : draft}
            disabled={Boolean(verdict)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (verdict) advance();
                else check();
              }
            }}
            aria-invalid={verdict ? !verdict.correct : undefined}
            className={cn(
              'mb-4 w-full rounded-md border bg-surface px-3.5 py-2.5 text-[14px] transition-colors',
              !verdict && 'border-line focus:border-line-strong',
              verdict?.correct && 'border-good bg-good-soft',
              verdict && !verdict.correct && 'border-bad bg-bad-soft',
            )}
          />

          {verdict ? (
            <div
              role="status"
              className={cn(
                'mb-4 flex items-start gap-2.5 rounded-lg px-4 py-3 text-[13px] leading-relaxed',
                verdict.correct ? 'bg-good-soft text-ink-soft' : 'bg-bad-soft text-ink-soft',
              )}
            >
              <Icon
                name={verdict.correct ? 'check' : 'alert'}
                size={14}
                className={cn('mt-0.5 shrink-0', verdict.correct ? 'text-good' : 'text-bad')}
              />
              <span>
                {verdict.correct ? (
                  <strong className="font-semibold">Correct.</strong>
                ) : (
                  <>
                    <strong className="font-semibold">Not quite.</strong> The correction is{' '}
                    <strong className="font-semibold text-good">{current.correction}</strong>.
                  </>
                )}{' '}
                {pattern.rule}
              </span>
            </div>
          ) : null}

          {verdict ? (
            <Button onClick={advance}>
              {index + 1 < items.length ? 'Next' : 'Finish'}
              <Icon name="chevron-right" size={13} />
            </Button>
          ) : (
            <Button onClick={check} disabled={draft.trim() === ''}>
              Check
            </Button>
          )}
        </>
      ) : null}
    </Card>
  );
}
