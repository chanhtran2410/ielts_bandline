'use client';

import Link from 'next/link';
import type { MistakePattern } from '@/types/mistake';
import { MASTERY_LABELS } from '@/types/mistake';
import { formatRelativeDay } from '@/lib/date';
import { cn } from '@/lib/cn';
import { Badge, EyebrowLabel } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';

export interface MistakeCardProps {
  pattern: MistakePattern;
  /** The worst pattern gets the expanded treatment with example pairs. */
  expanded?: boolean;
  onMarkMastered?: (pattern: MistakePattern) => void;
}

const TREND_COPY = {
  up: { label: '▲ improving', tone: 'text-good' },
  down: { label: '▼ slipping', tone: 'text-bad' },
  flat: { label: '— flat', tone: 'text-faint' },
} as const;

export function MistakeCard({ pattern, expanded, onMarkMastered }: MistakeCardProps) {
  const trend = TREND_COPY[pattern.accuracyTrend];
  const nearlyDone = pattern.mastery === 'nearly_resolved' || pattern.mastery === 'mastered';

  if (!expanded) {
    return (
      <Card as="li" className="flex flex-wrap items-center gap-4 px-6 py-5 sm:px-7">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <CardTitle as="h3">
              <Link href={'/mistakes/' + pattern.id} className="hover:text-accent">
                {pattern.title}
              </Link>
            </CardTitle>
            {nearlyDone ? <Badge tone="good">{MASTERY_LABELS[pattern.mastery]}</Badge> : null}
          </div>
          <p className="tnum text-[12.5px] text-muted">
            {pattern.count} mistakes · accuracy {pattern.accuracy}%
            {pattern.accuracy > pattern.baselineAccuracy
              ? ', up from ' + pattern.baselineAccuracy + '%'
              : ''}
          </p>
        </div>
        <ButtonLink href={'/mistakes/' + pattern.id} variant="secondary" size="sm">
          Practice again
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card as="li" className="p-6 sm:px-7">
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <CardTitle as="h3" className="text-[17px]">
              <Link href={'/mistakes/' + pattern.id} className="hover:text-accent">
                {pattern.title}
              </Link>
            </CardTitle>
            {nearlyDone ? <Badge tone="good">{MASTERY_LABELS[pattern.mastery]}</Badge> : null}
          </div>
          <p className="text-[13px] text-muted">
            {pattern.count} mistakes · last seen {formatRelativeDay(pattern.lastSeenAt)}
          </p>
        </div>
        <div className="text-right">
          <EyebrowLabel className="mb-0.5">Your accuracy</EyebrowLabel>
          <p className="flex items-baseline justify-end gap-1.5">
            <span className="tnum font-display text-[22px] font-bold">{pattern.accuracy}%</span>
            <span className={cn('text-[11.5px] font-semibold', trend.tone)}>{trend.label}</span>
          </p>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-line-soft bg-sunken px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
        {pattern.rule}
      </p>

      <ul className="mb-[18px] grid gap-2.5 sm:grid-cols-2">
        {pattern.examples.slice(0, 2).map((example) => (
          <li
            key={example.id}
            className="rounded-lg border border-line-soft bg-sunken px-4 py-3"
          >
            <p className="mb-1 text-[13.5px] text-bad line-through decoration-1">{example.original}</p>
            <p className="text-[13.5px] font-medium text-good">{example.correction}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2.5">
        <ButtonLink href={'/mistakes/' + pattern.id}>Practice again</ButtonLink>
        <ButtonLink href={'/mistakes/' + pattern.id} variant="secondary">
          See all {pattern.count} examples
        </ButtonLink>
        {onMarkMastered && pattern.mastery !== 'mastered' ? (
          <Button variant="ghost" onClick={() => onMarkMastered(pattern)}>
            Mark as mastered
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
