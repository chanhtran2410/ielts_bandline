'use client';

import { useQuery } from '@tanstack/react-query';
import type { Test } from '@/types/attempt';
import type { Recommendation } from '@/types/plan';
import { questionTypeLabel } from '@/constants/labels';
import { queryKeys } from '@/lib/query-client';
import { readingService } from '@/services/reading.service';
import { recommendationService } from '@/services/recommendation.service';
import { PageBody, PageHeader } from '@/components/layout/app-shell';
import { Badge, EyebrowLabel } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AsyncBoundary, EmptyState, ErrorState, SkeletonCard } from '@/components/ui/states';

export interface PracticeCatalogScreenProps {
  mode: 'practice' | 'mock';
}

const COPY = {
  practice: {
    title: 'Practice',
    description:
      'Targeted sessions with explanations after every question. Start with what the coach recommends — it is chosen from your weakest measured skill.',
    basePath: '/practice',
    cta: 'Start practice',
  },
  mock: {
    title: 'Mock Tests',
    description:
      'Exam conditions: a running clock, no hints, no explanations, and no AI until you submit. Use these to find out where you actually stand.',
    basePath: '/mock',
    cta: 'Start mock',
  },
} as const;

export function PracticeCatalogScreen({ mode }: PracticeCatalogScreenProps) {
  const copy = COPY[mode];

  const testsQuery = useQuery({
    queryKey: mode === 'mock' ? queryKeys.mockCatalog : queryKeys.practiceCatalog,
    queryFn: () => readingService.listTests(mode),
  });

  const recommendationsQuery = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: () => recommendationService.getRecommendations(2),
    enabled: mode === 'practice',
  });

  return (
    <PageBody>
      <PageHeader title={copy.title} description={copy.description} />

      {mode === 'practice' && recommendationsQuery.data && recommendationsQuery.data.length > 0 ? (
        <RecommendedStrip recommendations={recommendationsQuery.data} />
      ) : null}

      <AsyncBoundary
        isLoading={testsQuery.isPending}
        isError={testsQuery.isError}
        data={testsQuery.data}
        loading={
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard rows={3} />
            <SkeletonCard rows={3} />
          </div>
        }
        error={
          <ErrorState
            title={"We couldn't load the " + copy.title.toLowerCase() + '.'}
            onRetry={() => void testsQuery.refetch()}
          />
        }
      >
        {(tests) =>
          tests.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              detail="New sessions appear as soon as your first diagnostic is scored."
              icon={<Icon name="book" size={16} />}
              action={<ButtonLink href="/dashboard">Back to dashboard</ButtonLink>}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {tests.map((test) => (
                <TestCard key={test.id} test={test} basePath={copy.basePath} cta={copy.cta} />
              ))}
            </ul>
          )
        }
      </AsyncBoundary>
    </PageBody>
  );
}

function RecommendedStrip({ recommendations }: { recommendations: readonly Recommendation[] }) {
  return (
    <Card tone="dark" as="section" aria-labelledby="recommended-heading" className="mb-4 p-6 sm:px-7">
      <EyebrowLabel tone="gold" className="mb-3 tracking-[0.08em]">
        Recommended for you
      </EyebrowLabel>
      <h2 id="recommended-heading" className="sr-only">
        Recommended practice
      </h2>
      <ul className="flex flex-col gap-2.5">
        {recommendations.map((rec) => (
          <li key={rec.id}>
            <a
              href={rec.href}
              className="flex items-center gap-4 rounded-lg border border-on-dark-line bg-ink px-4 py-3 transition-colors hover:border-muted"
            >
              <span className="tnum w-11 shrink-0 font-display text-xs font-semibold text-accent-gold">
                {rec.minutes} min
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-on-dark">{rec.title}</span>
                <span className="block text-[12px] leading-relaxed text-on-dark-muted">
                  {rec.reason}
                </span>
              </span>
              <Icon name="chevron-right" size={13} className="shrink-0 text-on-dark-faint" />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TestCard({ test, basePath, cta }: { test: Test; basePath: string; cta: string }) {
  const types = [...new Set(test.groups.map((g) => g.type))];

  return (
    <Card as="li" className="flex flex-col p-6 sm:px-7">
      <div className="mb-3 flex items-start justify-between gap-3">
        <CardTitle as="h3" className="text-[17px]">
          {test.title}
        </CardTitle>
        {test.targetedSkillId ? <Badge tone="accent">targeted</Badge> : null}
      </div>

      <p className="tnum mb-4 text-[12.5px] text-muted">
        {test.questionCount} questions
        {test.durationMinutes !== null ? ' · ' + test.durationMinutes + ' min' : ' · untimed'}
        {' · '}
        {test.passages.length === 1 ? '1 passage' : test.passages.length + ' passages'}
      </p>

      <ul className="mb-5 flex flex-wrap gap-1.5">
        {types.slice(0, 4).map((type) => (
          <li key={type}>
            <Badge tone="outline" className="font-medium">
              {questionTypeLabel(type, true)}
            </Badge>
          </li>
        ))}
        {types.length > 4 ? (
          <li>
            <Badge tone="outline" className="font-medium">
              +{types.length - 4} more
            </Badge>
          </li>
        ) : null}
      </ul>

      <div className="mt-auto">
        <ButtonLink href={basePath + '/session/' + test.id}>{cta}</ButtonLink>
      </div>
    </Card>
  );
}
