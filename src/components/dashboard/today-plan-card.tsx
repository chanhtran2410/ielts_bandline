'use client';

import Link from 'next/link';
import type { StudyPlan, StudyTask } from '@/types/plan';
import { planProgress } from '@/types/plan';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardNote, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Tooltip } from '@/components/ui/overlay';

export interface TodayPlanCardProps {
  plan: StudyPlan;
  onToggle: (task: StudyTask, completed: boolean) => void;
  /** True while a toggle is in flight, so the row can go non-interactive. */
  isUpdating?: boolean;
}

export function TodayPlanCard({ plan, onToggle, isUpdating }: TodayPlanCardProps) {
  const { done, total } = planProgress(plan);

  return (
    <Card as="section" aria-labelledby="plan-heading" className="p-6 sm:px-7">
      <CardHeader className="mb-4">
        <CardTitle id="plan-heading">Today&rsquo;s plan</CardTitle>
        <CardNote className="tnum shrink-0">
          {plan.totalMinutes} min · {done} of {total} done
        </CardNote>
      </CardHeader>

      <ul className="flex flex-col">
        {plan.tasks.map((task, index) => (
          <li
            key={task.id}
            className={cn(
              'flex items-center gap-3 py-2.5',
              index < plan.tasks.length - 1 && 'border-b border-line-soft',
            )}
          >
            <Tooltip label={task.completed ? 'Mark as not done' : 'Mark as done'}>
              <button
                type="button"
                disabled={isUpdating}
                aria-pressed={task.completed}
                onClick={() => {
                  onToggle(task, !task.completed);
                  if (!task.completed) track({ name: 'study_task_completed', taskId: task.id, kind: task.kind });
                }}
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-pill border-[1.5px] transition-colors',
                  task.completed
                    ? 'border-good bg-good text-on-dark'
                    : 'border-line-strong text-transparent hover:border-muted',
                )}
              >
                <Icon name="check" size={10} strokeWidth={2.4} className="text-current" />
                <span className="sr-only">
                  {task.completed ? 'Completed: ' : 'Not completed: '}
                  {task.title}
                </span>
              </button>
            </Tooltip>

            {task.completed ? (
              <span className="flex-1 text-[13.5px] font-medium text-faint line-through">
                {task.title}
              </span>
            ) : (
              <Link
                href={task.href}
                onClick={() => track({ name: 'study_plan_started', date: plan.date, taskCount: total })}
                className="group flex-1 text-[13.5px] font-medium text-ink transition-colors hover:text-accent"
              >
                {task.title}
                <span className="block text-[11.5px] font-normal text-faint group-hover:text-muted">
                  {task.rationale}
                </span>
              </Link>
            )}

            <span className="tnum shrink-0 text-xs text-faint">{task.minutes} min</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
