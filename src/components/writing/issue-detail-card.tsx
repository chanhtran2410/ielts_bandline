'use client';

import Link from 'next/link';
import type { WritingIssue } from '@/types/writing';
import { ISSUE_CATEGORY_LABELS } from '@/constants/labels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface IssueDetailCardProps {
  issue: WritingIssue;
  /** 1-based position, for "Issue 3 of 9". */
  index: number;
  total: number;
  onApplyFix: (issue: WritingIssue) => void;
  applied?: boolean;
}

const CATEGORY_TONES = {
  grammar: 'bad',
  vocabulary: 'accent',
  collocation: 'accent',
  coherence: 'neutral',
  task_response: 'neutral',
} as const;

/**
 * Why an issue was flagged, what to write instead, and how often this same
 * mistake has happened. The "why" comes first — that is the teaching (§12).
 */
export function IssueDetailCard({
  issue,
  index,
  total,
  onApplyFix,
  applied,
}: IssueDetailCardProps) {
  return (
    <Card tone="raised" as="section" aria-labelledby="issue-title" className="self-start px-[26px] py-6">
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Badge tone={CATEGORY_TONES[issue.category]} caps>
          {ISSUE_CATEGORY_LABELS[issue.category]}
        </Badge>
        <span className="tnum text-xs font-medium text-faint">
          Issue {index} of {total}
        </span>
      </div>

      <h3 id="issue-title" className="mb-3 font-display text-sm font-semibold">
        {issue.title}
      </h3>

      <dl className="flex flex-col gap-3 text-[13px] leading-relaxed">
        <div>
          <dt className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Why</dt>
          <dd className="text-ink-soft">{issue.why}</dd>
        </div>
        <div>
          <dt className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            Your sentence
          </dt>
          <dd className="text-bad line-through decoration-1">{issue.original}</dd>
        </div>
        <div>
          <dt className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            Better
          </dt>
          <dd className="font-medium text-good">{issue.suggestion}</dd>
        </div>
      </dl>

      <div className="mt-[18px] flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={() => onApplyFix(issue)}
          disabled={applied}
        >
          {applied ? 'Fix applied' : 'Apply fix'}
        </Button>
        {issue.mistakePatternId ? (
          <Link
            href={'/mistakes/' + issue.mistakePatternId}
            className="flex flex-1 items-center justify-center rounded-md border border-line px-3 py-2 text-[12.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            Open in Error Bank
          </Link>
        ) : null}
      </div>

      {issue.mistakePatternId ? (
        <p className="mt-3 text-[11.5px] text-faint">
          You&rsquo;ve made this mistake {issue.occurrenceCount} times.{' '}
          <Link
            href={'/mistakes/' + issue.mistakePatternId}
            className="font-medium text-accent hover:text-accent-hover"
          >
            See all →
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
