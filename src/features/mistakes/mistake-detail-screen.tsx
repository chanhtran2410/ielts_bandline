'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MASTERY_LABELS, MISTAKE_CATEGORY_LABELS } from '@/types/mistake';
import { track } from '@/lib/analytics';
import { formatRelativeDay } from '@/lib/date';
import { queryKeys } from '@/lib/query-client';
import { mistakesService } from '@/services/mistakes.service';
import { PageBody } from '@/components/layout/app-shell';
import { Badge, EyebrowLabel } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { BeforeAfter } from '@/components/ui/score';
import { AsyncBoundary, ErrorState, SkeletonCard } from '@/components/ui/states';
import { MistakeDrill } from './mistake-drill';

export function MistakeDetailScreen({ patternId }: { patternId: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.mistakePattern(patternId),
    queryFn: () => mistakesService.getPattern(patternId),
  });

  useEffect(() => {
    if (query.data) track({ name: 'mistake_reviewed', patternId });
  }, [query.data, patternId]);

  const recordPractice = useMutation({
    mutationFn: ({ correct, total }: { correct: number; total: number }) =>
      mistakesService.recordPractice(patternId, correct, total),
    onSuccess: (pattern) => {
      queryClient.setQueryData(queryKeys.mistakePattern(patternId), pattern);
      void queryClient.invalidateQueries({ queryKey: queryKeys.mistakeSummary });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const setMastery = useMutation({
    mutationFn: () => mistakesService.setMastery(patternId, 'mastered'),
    onSuccess: (pattern) => {
      queryClient.setQueryData(queryKeys.mistakePattern(patternId), pattern);
      void queryClient.invalidateQueries({ queryKey: ['mistakes'] });
    },
  });

  return (
    <PageBody width="narrow">
      <Link
        href="/mistakes"
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        <Icon name="chevron-left" size={14} />
        All mistakes
      </Link>

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        data={query.data}
        loading={
          <div className="flex flex-col gap-4">
            <SkeletonCard rows={3} />
            <SkeletonCard rows={4} />
          </div>
        }
        error={
          <ErrorState
            title="We couldn't load this mistake."
            detail="It may have been resolved and cleared."
            onRetry={() => void query.refetch()}
          />
        }
      >
        {(pattern) => (
          <div className="flex flex-col gap-4">
            <header>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="neutral" caps>
                  {MISTAKE_CATEGORY_LABELS[pattern.category]}
                </Badge>
                <Badge tone={pattern.accuracy >= 85 ? 'good' : 'accent'}>
                  {MASTERY_LABELS[pattern.mastery]}
                </Badge>
              </div>
              <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.02em]">
                {pattern.title}
              </h1>
              <p className="tnum text-[13.5px] text-muted">
                {pattern.count} mistakes · last seen {formatRelativeDay(pattern.lastSeenAt)}
              </p>
            </header>

            <Card tone="dark" as="section" aria-labelledby="rule-heading" className="p-6 sm:px-7">
              <EyebrowLabel tone="gold" className="mb-3 tracking-[0.08em]">
                The rule
              </EyebrowLabel>
              <h2 id="rule-heading" className="sr-only">
                The rule behind this mistake
              </h2>
              <p className="text-[15px] leading-relaxed text-on-dark">{pattern.rule}</p>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <BeforeAfter
                label="Accuracy on this pattern"
                before={pattern.baselineAccuracy}
                now={pattern.accuracy}
                period="since first detected"
              />
              <Card className="flex flex-col justify-center px-5 py-[18px]">
                <EyebrowLabel className="mb-1.5">Mastery</EyebrowLabel>
                <p className="mb-3 text-[13px] leading-relaxed text-muted">
                  {pattern.accuracy >= 85
                    ? 'You are close. One clean round and this stops costing you marks.'
                    : 'Not fixed yet — this pattern is still appearing in your work.'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  disabled={pattern.mastery === 'mastered' || setMastery.isPending}
                  onClick={() => setMastery.mutate()}
                >
                  {pattern.mastery === 'mastered' ? 'Marked as mastered' : 'Mark as mastered'}
                </Button>
              </Card>
            </div>

            <MistakeDrill
              pattern={pattern}
              onComplete={(correct, total) => recordPractice.mutate({ correct, total })}
            />

            <Card as="section" aria-labelledby="examples-heading" className="p-6 sm:px-7">
              <CardTitle id="examples-heading" className="mb-1">
                Every time you made this mistake
              </CardTitle>
              <p className="mb-4 text-[12.5px] text-faint">
                Your own writing, with the correction alongside. Seeing the pattern repeat is what
                makes it stick.
              </p>
              <ul className="flex flex-col gap-2.5">
                {pattern.examples.map((example) => (
                  <li
                    key={example.id}
                    className="rounded-lg border border-line-soft bg-sunken px-4 py-3"
                  >
                    <p className="mb-1 text-[13.5px] text-bad line-through decoration-1">
                      {example.original}
                    </p>
                    <p className="mb-2 text-[13.5px] font-medium text-good">{example.correction}</p>
                    <p className="text-[11.5px] text-faint">
                      {example.sourceHref ? (
                        <Link href={example.sourceHref} className="hover:text-accent">
                          {example.source}
                        </Link>
                      ) : (
                        example.source
                      )}
                      {' · '}
                      {formatRelativeDay(example.occurredAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </AsyncBoundary>
    </PageBody>
  );
}
