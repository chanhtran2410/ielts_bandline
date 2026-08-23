'use client';

import { useMemo } from 'react';
import type { WritingIssue } from '@/types/writing';
import { ISSUE_HIGHLIGHT_CLASSES, ISSUE_LEGEND } from '@/constants/labels';
import { cn } from '@/lib/cn';

export interface AnnotatedEssayProps {
  body: string;
  issues: readonly WritingIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
}

/**
 * The essay with its issues spliced in as activatable spans.
 *
 * Highlights are positioned by character offset from structured feedback, never
 * by matching model prose against the text (§15).
 */
export function AnnotatedEssay({
  body,
  issues,
  selectedIssueId,
  onSelectIssue,
}: AnnotatedEssayProps) {
  const segments = useMemo(() => segmentEssay(body, issues), [body, issues]);

  return (
    <div>
      <div className="text-[14.5px] leading-[1.9] text-ink-soft">
        {segments.map((segment, index) => {
          if (!segment.issue) {
            return (
              <span key={index} className="whitespace-pre-wrap">
                {segment.text}
              </span>
            );
          }
          const selected = segment.issue.id === selectedIssueId;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectIssue(segment.issue!.id)}
              aria-pressed={selected}
              className={cn(
                // `inline` rather than the button default of inline-block, so a
                // highlight spanning a line break flows with the text instead of
                // becoming a full-width box.
                'inline cursor-pointer rounded-xs px-0.5 text-left transition-shadow',
                ISSUE_HIGHLIGHT_CLASSES[segment.issue.category],
                selected && 'shadow-[0_0_0_2px_rgb(185_28_28/0.15)]',
              )}
            >
              {segment.text}
              <span className="sr-only">
                {' '}
                — {segment.issue.category} issue: {segment.issue.title}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-3.5 border-t border-line-soft pt-3.5">
        {ISSUE_LEGEND.map((entry) => (
          <li key={entry.label} className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted">
            <span className={cn('size-2.5 rounded-xs', entry.className)} aria-hidden="true" />
            {entry.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface EssaySegment {
  text: string;
  issue: WritingIssue | null;
}

/**
 * Splices issues into the essay by offset. Exported so the offset arithmetic —
 * which is easy to get wrong at overlaps — can be tested directly.
 */
export function segmentEssay(body: string, issues: readonly WritingIssue[]): EssaySegment[] {
  const valid = issues.filter(
    (issue) => issue.start >= 0 && issue.end <= body.length && issue.end > issue.start,
  );

  /*
   * Two passes, because a single left-to-right sweep would let a wide
   * sentence-level note swallow the word-level fixes inside it — and the
   * word-level fix is the thing the learner actually clicks.
   *
   * Pass 1 claims spans shortest-first, so the narrowest annotation always wins
   * an overlap. Pass 2 lays the survivors down in reading order.
   */
  const claimed: WritingIssue[] = [];
  for (const issue of [...valid].sort((a, b) => a.end - a.start - (b.end - b.start))) {
    const overlaps = claimed.some((kept) => issue.start < kept.end && kept.start < issue.end);
    if (!overlaps) claimed.push(issue);
  }
  claimed.sort((a, b) => a.start - b.start);

  const segments: EssaySegment[] = [];
  let cursor = 0;
  for (const issue of claimed) {
    if (issue.start > cursor) {
      segments.push({ text: body.slice(cursor, issue.start), issue: null });
    }
    segments.push({ text: body.slice(issue.start, issue.end), issue });
    cursor = issue.end;
  }

  if (cursor < body.length) segments.push({ text: body.slice(cursor), issue: null });
  return segments;
}
