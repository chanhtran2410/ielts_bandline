'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardData } from '@/types/dashboard';
import type { StudyTask } from '@/types/plan';
import { queryKeys } from '@/lib/query-client';
import { dashboardService } from '@/services/dashboard.service';
import { recommendationService } from '@/services/recommendation.service';
import { PageBody } from '@/components/layout/app-shell';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SkillCard } from '@/components/ui/score';
import { AsyncBoundary, ErrorState, SkeletonCard } from '@/components/ui/states';
import { BandGapCard } from '@/components/dashboard/band-gap-card';
import { RecentProgressCard } from '@/components/dashboard/recent-progress-card';
import { TodayPlanCard } from '@/components/dashboard/today-plan-card';
import { WeaknessCard } from '@/components/dashboard/weakness-card';

export function DashboardScreen() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => dashboardService.getDashboard(),
  });

  const toggleTask = useMutation({
    mutationFn: ({ task, completed }: { task: StudyTask; completed: boolean }) =>
      recommendationService.markTaskComplete(task.id, completed),
    // Optimistic: ticking a task should feel instant.
    onMutate: async ({ task, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previous = queryClient.getQueryData<DashboardData>(queryKeys.dashboard);
      if (previous) {
        queryClient.setQueryData<DashboardData>(queryKeys.dashboard, {
          ...previous,
          plan: {
            ...previous.plan,
            tasks: previous.plan.tasks.map((t) => (t.id === task.id ? { ...t, completed } : t)),
          },
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.dashboard, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  return (
    <PageBody>
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        data={query.data}
        loading={<DashboardSkeleton />}
        error={
          <ErrorState
            title="We couldn't load your dashboard."
            detail="Your progress is safe. This is usually a connection problem."
            onRetry={() => void query.refetch()}
          />
        }
      >
        {(data) => (
          <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[13px] text-faint">{data.date}</p>
                <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.02em]">
                  {data.greeting} 👋
                </h1>
              </div>
              <ButtonLink href="/coach" variant="primary">
                <Icon name="sparkle" size={14} />
                Ask your coach
              </ButtonLink>
            </div>

            <div className="flex flex-col gap-4">
              <BandGapCard gap={data.bandGap} />

              <div className="grid gap-4 lg:grid-cols-2">
                {data.weakness ? <WeaknessCard weakness={data.weakness} /> : null}
                <TodayPlanCard
                  plan={data.plan}
                  isUpdating={toggleTask.isPending}
                  onToggle={(task, completed) => toggleTask.mutate({ task, completed })}
                />
              </div>

              <section aria-labelledby="skills-heading">
                <h2 id="skills-heading" className="sr-only">
                  Skill overview
                </h2>
                <div className="grid gap-4 xs:grid-cols-2 lg:grid-cols-4">
                  {data.skills.map((skill) => (
                    <SkillCard
                      key={skill.skillId}
                      label={skill.label}
                      band={skill.band}
                      delta={skill.delta}
                      isWeakest={skill.isWeakest}
                      href={skill.href}
                    />
                  ))}
                </div>
              </section>

              <RecentProgressCard metrics={data.recentProgress} />
            </div>
          </>
        )}
      </AsyncBoundary>
    </PageBody>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonCard rows={2} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard rows={4} />
        <SkeletonCard rows={4} />
      </div>
      <div className="grid gap-4 xs:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard rows={1} />
        <SkeletonCard rows={1} />
        <SkeletonCard rows={1} />
        <SkeletonCard rows={1} />
      </div>
    </div>
  );
}
