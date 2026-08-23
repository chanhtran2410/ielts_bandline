import { QueryClient } from '@tanstack/react-query';

/**
 * Server state defaults (§23). Attempt and feedback data is expensive to
 * recompute, so we keep it fresh for a minute and retry transient failures once.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}

/** Every cache key in one place, so invalidation never guesses. */
export const queryKeys = {
  profile: ['profile'] as const,
  dashboard: ['dashboard'] as const,
  practiceCatalog: ['practice', 'catalog'] as const,
  test: (testId: string) => ['test', testId] as const,
  attempt: (attemptId: string) => ['attempt', attemptId] as const,
  attemptResult: (attemptId: string) => ['attempt', attemptId, 'result'] as const,
  mockCatalog: ['mock', 'catalog'] as const,
  writingTasks: ['writing', 'tasks'] as const,
  writingSubmissions: ['writing', 'submissions'] as const,
  writingSubmission: (id: string) => ['writing', 'submission', id] as const,
  writingFeedback: (id: string) => ['writing', 'feedback', id] as const,
  mistakeSummary: ['mistakes', 'summary'] as const,
  mistakePatterns: (category: string) => ['mistakes', 'patterns', category] as const,
  mistakePattern: (id: string) => ['mistakes', 'pattern', id] as const,
  progress: ['progress'] as const,
  recommendations: ['recommendations'] as const,
  coachSession: ['coach', 'session'] as const,
  coachContext: ['coach', 'context'] as const,
};
