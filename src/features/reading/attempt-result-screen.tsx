'use client';

import { useQuery } from '@tanstack/react-query';
import { questionTypeLabel } from '@/constants/labels';
import { formatShortDate } from '@/lib/date';
import { queryKeys } from '@/lib/query-client';
import { readingService } from '@/services/reading.service';
import { ResultTopBar } from '@/components/layout/exam-shell';
import { Card, CardTitle } from '@/components/ui/card';
import { MeterRow } from '@/components/ui/progress';
import { ScoreCard } from '@/components/ui/score';
import { AsyncBoundary, ErrorState, LoadingState } from '@/components/ui/states';
import { ResultWeaknessCard } from '@/components/dashboard/weakness-card';

export interface AttemptResultScreenProps {
  attemptId: string;
  /** Practice and mock results differ only in where they link back to. */
  backHref: string;
  backLabel: string;
}

export function AttemptResultScreen({
  attemptId,
  backHref,
  backLabel,
}: AttemptResultScreenProps) {
  const query = useQuery({
    queryKey: queryKeys.attemptResult(attemptId),
    queryFn: () => readingService.getResult(attemptId),
    staleTime: Infinity,
  });

  return (
    <div className="min-h-dvh">
      <ResultTopBar
        backHref={backHref}
        backLabel={backLabel}
        caption={
          query.data
            ? query.data.testTitle + ' · ' + formatShortDate(query.data.submittedAt)
            : undefined
        }
      />

      <div className="mx-auto max-w-[880px] px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
        <AsyncBoundary
          isLoading={query.isPending}
          isError={query.isError}
          data={query.data}
          loading={<LoadingState title="Scoring your answers…" detail="This takes a moment." />}
          error={
            <ErrorState
              title="We couldn't load this result."
              detail="Your answers were saved. Try again in a moment."
              onRetry={() => void query.refetch()}
            />
          }
        >
          {(result) => (
            <div className="flex flex-col gap-4">
              <ScoreCard
                label="Reading"
                rawScore={result.rawScore}
                totalQuestions={result.totalQuestions}
                band={result.estimatedBand}
                bandDelta={result.bandDelta}
                summary={result.summary}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <Card as="section" aria-labelledby="qtype-heading" className="p-6 sm:px-7">
                  <CardTitle id="qtype-heading" className="mb-[18px]">
                    Question type performance
                  </CardTitle>
                  <div className="flex flex-col gap-4">
                    {result.questionTypes.map((qt) => (
                      <MeterRow
                        key={qt.type}
                        label={questionTypeLabel(qt.type)}
                        value={qt.accuracy}
                        emphasise={qt.accuracy < 55}
                        suffix={
                          <span className="tnum text-faint">
                            {qt.correct}/{qt.total}
                          </span>
                        }
                      />
                    ))}
                  </div>
                </Card>

                <Card as="section" aria-labelledby="skill-heading" className="p-6 sm:px-7">
                  <CardTitle id="skill-heading" className="mb-[18px]">
                    Skill analysis
                  </CardTitle>
                  <div className="flex flex-col gap-4">
                    {result.skills.map((skill) => (
                      <MeterRow
                        key={skill.skillId}
                        label={skill.name}
                        value={skill.accuracy}
                        emphasise={skill.accuracy < 55}
                      />
                    ))}
                  </div>
                  <p className="mt-4 border-t border-line-soft pt-3 text-xs text-faint">
                    Measured across the {result.totalQuestions} questions in this attempt. Your
                    long-term mastery on the Progress screen blends this with every earlier session.
                  </p>
                </Card>
              </div>

              {result.weakness ? (
                <ResultWeaknessCard
                  weakness={result.weakness}
                  practiceHref={result.weakness.practiceHref}
                  mistakesHref="/mistakes"
                />
              ) : null}
            </div>
          )}
        </AsyncBoundary>
      </div>
    </div>
  );
}
