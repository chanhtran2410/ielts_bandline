'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MasteryState, MistakeCategory, MistakePattern } from '@/types/mistake';
import { queryKeys } from '@/lib/query-client';
import { mistakesService } from '@/services/mistakes.service';
import { PageBody, PageHeader } from '@/components/layout/app-shell';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Tabs } from '@/components/ui/tabs';
import { AsyncBoundary, EmptyState, ErrorState, SkeletonCard } from '@/components/ui/states';
import { CategoryRail } from '@/components/mistakes/category-rail';
import { MistakeCard } from '@/components/mistakes/mistake-card';

const MASTERY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'practising', label: 'Practising' },
  { value: 'nearly_resolved', label: 'Nearly resolved' },
  { value: 'mastered', label: 'Mastered' },
] as const satisfies readonly { value: MasteryState | 'all'; label: string }[];

export function ErrorBankScreen() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<MistakeCategory | 'all'>('all');
  const [mastery, setMastery] = useState<MasteryState | 'all'>('all');
  const [query, setQuery] = useState('');

  const summaryQuery = useQuery({
    queryKey: queryKeys.mistakeSummary,
    queryFn: () => mistakesService.getCategorySummary(),
  });

  const totalQuery = useQuery({
    queryKey: [...queryKeys.mistakeSummary, 'total'],
    queryFn: () => mistakesService.getTotalCount(),
  });

  const patternsQuery = useQuery({
    queryKey: [...queryKeys.mistakePatterns(category), mastery, query],
    queryFn: () => mistakesService.getPatterns({ category, mastery, query }),
  });

  const markMastered = useMutation({
    mutationFn: (pattern: MistakePattern) => mistakesService.setMastery(pattern.id, 'mastered'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mistakes'] });
    },
  });

  const total = totalQuery.data ?? 0;

  return (
    <PageBody>
      <PageHeader
        title="My Mistakes"
        description={
          total > 0
            ? total +
              ' mistakes collected from your writing and reading practice. Fix them here so they stop costing you band points.'
            : 'Every mistake you make is collected here, grouped into patterns you can actually fix.'
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        <AsyncBoundary
          isLoading={summaryQuery.isPending}
          isError={summaryQuery.isError}
          data={summaryQuery.data}
          loading={<div className="h-40 w-full animate-pulse rounded-xl bg-fill lg:w-[260px]" />}
          error={<div className="text-[13px] text-bad">Categories unavailable.</div>}
        >
          {(categories) => (
            <CategoryRail
              categories={categories}
              selected={category}
              onSelect={setCategory}
              totalCount={total}
            />
          )}
        </AsyncBoundary>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              items={MASTERY_FILTERS}
              value={mastery}
              onChange={setMastery}
              label="Filter by mastery"
              className="overflow-x-auto pb-1"
            />
            <Input
              type="search"
              label="Search mistakes"
              labelHidden
              placeholder="Search your mistakes…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              wrapperClassName="sm:w-56 shrink-0"
            />
          </div>

          <AsyncBoundary
            isLoading={patternsQuery.isPending}
            isError={patternsQuery.isError}
            data={patternsQuery.data}
            loading={
              <div className="flex flex-col gap-4">
                <SkeletonCard rows={4} />
                <SkeletonCard rows={2} />
              </div>
            }
            error={
              <ErrorState
                title="We couldn't load your mistakes."
                onRetry={() => void patternsQuery.refetch()}
              />
            }
          >
            {(patterns) =>
              patterns.length === 0 ? (
                <EmptyState
                  title={query ? 'No mistakes match that search' : 'Nothing here — good news'}
                  detail={
                    query
                      ? 'Try a different word, or clear the search to see everything.'
                      : 'No mistakes in this category yet. They appear automatically as you practise.'
                  }
                  icon={<Icon name="alert" size={16} />}
                />
              ) : (
                <ul className="flex flex-col gap-4">
                  {patterns.map((pattern, index) => (
                    <MistakeCard
                      key={pattern.id}
                      pattern={pattern}
                      expanded={index === 0}
                      onMarkMastered={(p) => markMastered.mutate(p)}
                    />
                  ))}
                </ul>
              )
            }
          </AsyncBoundary>
        </div>
      </div>
    </PageBody>
  );
}
