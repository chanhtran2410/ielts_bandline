'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { WritingTask } from '@/types/writing';
import { formatRelativeDay } from '@/lib/date';
import { queryKeys } from '@/lib/query-client';
import { writingService } from '@/services/writing.service';
import { PageBody, PageHeader } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AsyncBoundary, EmptyState, ErrorState, SkeletonCard } from '@/components/ui/states';

export function WritingCatalogScreen() {
  const router = useRouter();

  const tasksQuery = useQuery({
    queryKey: queryKeys.writingTasks,
    queryFn: () => writingService.listTasks(),
  });

  const submissionsQuery = useQuery({
    queryKey: queryKeys.writingSubmissions,
    queryFn: () => writingService.listSubmissions(),
  });

  const startDraft = useMutation({
    mutationFn: (taskId: string) => writingService.createDraft(taskId),
    onSuccess: (submission) => router.push('/writing/' + submission.id),
  });

  const submissions = submissionsQuery.data ?? [];

  return (
    <PageBody>
      <PageHeader
        title="Writing"
        description="Submit an essay and get a band estimate across all four IELTS criteria, sentence-level corrections, and higher-band rewrites — with the reasoning behind each one."
      />

      {submissions.length > 0 ? (
        <Card as="section" aria-labelledby="recent-essays-heading" className="mb-4 p-6 sm:px-7">
          <CardTitle id="recent-essays-heading" className="mb-4">
            Continue where you left off
          </CardTitle>
          <ul className="flex flex-col gap-2">
            {submissions.slice(0, 3).map((submission) => (
              <li key={submission.id}>
                <Link
                  href={
                    submission.status === 'analyzed'
                      ? '/writing/' + submission.id + '/analysis'
                      : '/writing/' + submission.id
                  }
                  className="flex items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium">
                      Draft {submission.draftNumber}
                      {' · '}
                      {tasksQuery.data?.find((t) => t.id === submission.taskId)?.label ?? 'Writing task'}
                    </span>
                    <span className="tnum block text-[11.5px] text-faint">
                      {submission.wordCount} words · {formatRelativeDay(submission.updatedAt)}
                    </span>
                  </span>
                  {submission.status === 'analyzed' ? (
                    <Badge tone="good">analysed</Badge>
                  ) : (
                    <Badge tone="neutral">draft</Badge>
                  )}
                  <Icon name="chevron-right" size={13} className="shrink-0 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <AsyncBoundary
        isLoading={tasksQuery.isPending}
        isError={tasksQuery.isError}
        data={tasksQuery.data}
        loading={
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard rows={3} />
            <SkeletonCard rows={3} />
          </div>
        }
        error={
          <ErrorState
            title="We couldn't load the writing tasks."
            onRetry={() => void tasksQuery.refetch()}
          />
        }
      >
        {(tasks) =>
          tasks.length === 0 ? (
            <EmptyState title="No tasks available yet" icon={<Icon name="pencil" size={16} />} />
          ) : (
            <>
              <h2 className="mb-3 font-display text-[15px] font-semibold">Start a new essay</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStart={() => startDraft.mutate(task.id)}
                    starting={startDraft.isPending && startDraft.variables === task.id}
                  />
                ))}
              </ul>
              {startDraft.isError ? (
                <p role="alert" className="mt-4 text-[13px] font-medium text-bad">
                  We couldn&rsquo;t start that essay. Try again.
                </p>
              ) : null}
            </>
          )
        }
      </AsyncBoundary>
    </PageBody>
  );
}

function TaskCard({
  task,
  onStart,
  starting,
}: {
  task: WritingTask;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <Card as="li" className="flex flex-col p-6 sm:px-7">
      <p className="mb-2.5 text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint">
        {task.label}
      </p>
      <CardTitle as="h3" className="mb-2 text-base leading-snug">
        {task.prompt}
      </CardTitle>
      <p className="mb-4 text-[13px] font-medium text-ink-soft">{task.instruction}</p>
      <p className="tnum mb-5 text-[12.5px] text-faint">
        At least {task.minWords} words · {task.recommendedMinutes} minutes
      </p>
      <div className="mt-auto">
        <Button onClick={onStart} disabled={starting}>
          {starting ? 'Starting…' : 'Start writing'}
        </Button>
      </div>
    </Card>
  );
}
