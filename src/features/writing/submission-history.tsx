'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeDay } from '@/lib/date';
import { queryKeys } from '@/lib/query-client';
import { writingService } from '@/services/writing.service';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';

export interface SubmissionHistoryProps {
  taskId: string;
  currentSubmissionId: string;
  onNavigate?: () => void;
}

/** Every draft of this task, so the learner can see their own progression. */
export function SubmissionHistory({
  taskId,
  currentSubmissionId,
  onNavigate,
}: SubmissionHistoryProps) {
  const query = useQuery({
    queryKey: [...queryKeys.writingSubmissions, taskId],
    queryFn: () => writingService.listSubmissions(taskId),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState title="We couldn't load your drafts." onRetry={() => void query.refetch()} />;
  }

  const submissions = query.data ?? [];
  if (submissions.length === 0) {
    return <EmptyState title="No drafts yet" detail="Your first draft appears here once you start writing." />;
  }

  return (
    <ul className="flex flex-col gap-2 p-4">
      {submissions.map((submission) => {
        const isCurrent = submission.id === currentSubmissionId;
        const href =
          submission.status === 'analyzed'
            ? '/writing/' + submission.id + '/analysis'
            : '/writing/' + submission.id;
        return (
          <li key={submission.id}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'block rounded-xl border px-4 py-3 transition-colors',
                isCurrent
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-display text-[13.5px] font-semibold">
                  Draft {submission.draftNumber}
                </span>
                {submission.status === 'analyzed' ? (
                  <Badge tone="good">analysed</Badge>
                ) : submission.status === 'analyzing' ? (
                  <Badge tone="accent">analysing</Badge>
                ) : (
                  <Badge tone="neutral">draft</Badge>
                )}
              </div>
              <p className="tnum text-[11.5px] text-faint">
                {submission.wordCount} words · {formatRelativeDay(submission.updatedAt)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
