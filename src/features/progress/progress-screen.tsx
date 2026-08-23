'use client';

import { useQuery } from '@tanstack/react-query';
import { formatBand } from '@/lib/band';
import { queryKeys } from '@/lib/query-client';
import { progressService } from '@/services/progress.service';
import { useProfile } from '@/hooks/use-profile';
import { PageBody, PageHeader } from '@/components/layout/app-shell';
import { Card, CardFootnote, CardTitle } from '@/components/ui/card';
import { MeterRow } from '@/components/ui/progress';
import { BeforeAfter } from '@/components/ui/score';
import { AsyncBoundary, ErrorState, SkeletonCard } from '@/components/ui/states';
import { BandJourney } from '@/components/progress/band-journey';
import { SkillTrendRow } from '@/components/progress/skill-trend-row';

export function ProgressScreen() {
  const { data: profile } = useProfile();

  const query = useQuery({
    queryKey: queryKeys.progress,
    queryFn: () => progressService.getOverview(),
  });

  return (
    <PageBody>
      <PageHeader
        title="Progress"
        description={
          profile
            ? 'Six weeks of study, measured against your Band ' +
              formatBand(profile.goal.targetBand) +
              ' target.'
            : 'Your band journey, skill trends and per-question-type accuracy.'
        }
      />

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        data={query.data}
        loading={
          <div className="flex flex-col gap-4">
            <SkeletonCard rows={2} />
            <div className="grid gap-4 lg:grid-cols-2">
              <SkeletonCard rows={4} />
              <SkeletonCard rows={4} />
            </div>
          </div>
        }
        error={
          <ErrorState
            title="We couldn't load your progress."
            detail="Your history is safe. This is usually a connection problem."
            onRetry={() => void query.refetch()}
          />
        }
      >
        {(overview) => {
          // The capping skill is the lowest one that is not moving — that is a
          // different and more useful thing than simply the lowest score.
          const capping = [...overview.skills]
            .filter((s) => s.delta.trend !== 'up')
            .sort((a, b) => a.band - b.band)[0];

          return (
            <div className="flex flex-col gap-4">
              <BandJourney points={overview.bandJourney} />

              <div className="grid gap-4 lg:grid-cols-2">
                <Card as="section" aria-labelledby="trends-heading" className="p-6 sm:px-7">
                  <CardTitle id="trends-heading" className="mb-4">
                    Skill trends · 6 weeks
                  </CardTitle>
                  <ul className="flex flex-col gap-3.5">
                    {overview.skills.map((skill) => (
                      <SkillTrendRow
                        key={skill.skillId}
                        skill={skill}
                        isCapping={skill.skillId === capping?.skillId}
                      />
                    ))}
                  </ul>
                  <CardFootnote>{overview.skillNarrative}</CardFootnote>
                </Card>

                <Card as="section" aria-labelledby="qtypes-heading" className="p-6 sm:px-7">
                  <CardTitle id="qtypes-heading" className="mb-4">
                    Reading question types
                  </CardTitle>
                  <div className="flex flex-col gap-3.5">
                    {overview.questionTypes.map((qt) => (
                      <MeterRow
                        key={qt.type}
                        label={qt.label}
                        value={qt.accuracy}
                        height={5}
                        suffix={
                          qt.delta.trend === 'up' ? (
                            <span className="tnum text-[11px] text-good">
                              +{Math.round(qt.delta.value)}
                            </span>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                  <CardFootnote>{overview.questionTypeNarrative}</CardFootnote>
                </Card>
              </div>

              <Card as="section" aria-labelledby="improvements-heading" className="p-6 sm:px-7">
                <CardTitle id="improvements-heading" className="mb-[18px]">
                  Biggest improvements
                </CardTitle>
                <div className="grid gap-4 md:grid-cols-3">
                  {overview.improvements.map((metric) => (
                    <BeforeAfter
                      key={metric.id}
                      label={metric.label}
                      before={metric.before}
                      now={metric.now}
                      period={metric.period}
                    />
                  ))}
                </div>
                <CardFootnote>
                  Measured over the period each figure names, from your graded attempts. Study time
                  in the last 7 days: {overview.studyMinutesLast7Days} minutes.
                </CardFootnote>
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>
    </PageBody>
  );
}
