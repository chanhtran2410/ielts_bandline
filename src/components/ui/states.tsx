import { cn } from '@/lib/cn';
import { Button } from './button';
import { Card } from './card';

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

export interface LoadingStateProps {
  /** What is happening, in the user's terms. Never just "Loading…". */
  title: string;
  /** Sets the expectation, e.g. "Usually takes 10–20 seconds." (§26) */
  detail?: string;
  className?: string;
}

export function LoadingState({ title, detail, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}
    >
      <Spinner />
      <p className="font-display text-[15px] font-semibold">{title}</p>
      {detail ? <p className="max-w-xs text-[13px] leading-relaxed text-muted">{detail}</p> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-5 animate-spin text-accent', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Content-shaped placeholder, so a load does not collapse the layout. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-fill', className)} aria-hidden="true" />;
}

export function SkeletonCard({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <Card className={cn('p-6', className)} aria-hidden="true">
      <Skeleton className="mb-4 h-4 w-1/3" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Error                                                                      */
/* -------------------------------------------------------------------------- */

export interface ErrorStateProps {
  /** Plain language, no error codes. e.g. "We couldn't analyze your essay." */
  title: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  detail,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}
    >
      <span className="grid size-9 place-items-center rounded-pill bg-bad-soft text-bad" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v3.5" />
          <circle cx="8" cy="11" r="0.5" fill="currentColor" />
        </svg>
      </span>
      <p className="font-display text-[15px] font-semibold">{title}</p>
      {detail ? <p className="max-w-sm text-[13px] leading-relaxed text-muted">{detail}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty                                                                      */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  title: string;
  /** Say what to do next, not just that there is nothing here. */
  detail?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, detail, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}>
      {icon ? (
        <span className="grid size-9 place-items-center rounded-pill bg-fill text-muted" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-[15px] font-semibold">{title}</p>
      {detail ? <p className="max-w-sm text-[13px] leading-relaxed text-muted">{detail}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Async boundary                                                             */
/* -------------------------------------------------------------------------- */

export interface AsyncBoundaryProps<T> {
  isLoading: boolean;
  isError: boolean;
  data: T | undefined;
  loading: React.ReactNode;
  error: React.ReactNode;
  empty?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

/**
 * Guarantees every async surface renders loading, error and success (§26).
 * Using this instead of ad-hoc ternaries is what stops orphan spinners.
 */
export function AsyncBoundary<T>({
  isLoading,
  isError,
  data,
  loading,
  error,
  empty,
  children,
}: AsyncBoundaryProps<T>) {
  if (isLoading) return <>{loading}</>;
  if (isError) return <>{error}</>;
  if (data === undefined) return <>{empty ?? error}</>;
  return <>{children(data)}</>;
}
