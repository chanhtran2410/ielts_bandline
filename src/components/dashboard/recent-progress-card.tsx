import Link from 'next/link';
import type { ImprovementMetric } from '@/types/dashboard';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';

/**
 * Movement, not vanity metrics: each row shows the current figure and how far
 * it has travelled — including when it has gone backwards (§17).
 */
export function RecentProgressCard({ metrics }: { metrics: readonly ImprovementMetric[] }) {
  return (
    <Card as="section" aria-labelledby="recent-progress-heading" className="p-6 sm:px-7">
      <CardHeader className="mb-[18px]">
        <CardTitle id="recent-progress-heading">Recent progress</CardTitle>
        <Link
          href="/progress"
          className="shrink-0 text-[12.5px] font-medium text-accent transition-colors hover:text-accent-hover"
        >
          View all →
        </Link>
      </CardHeader>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
        {metrics.map((metric) => {
          const change = Math.round(metric.now - metric.before);
          const improving = change > 0;
          return (
            <div key={metric.id}>
              <p className="mb-1.5 text-[13px] font-medium">{metric.label}</p>
              <p className="mb-2 flex items-baseline gap-2">
                <span className="tnum font-display text-xl font-bold">{Math.round(metric.now)}%</span>
                <span
                  className={cn(
                    'tnum text-xs font-semibold',
                    change === 0 ? 'text-faint' : improving ? 'text-good' : 'text-bad',
                  )}
                >
                  {change === 0 ? 'no change' : (improving ? '+' : '−') + Math.abs(change) + '%'}
                  {change !== 0 ? ' in ' + metric.period : null}
                </span>
              </p>
              <ProgressBar
                value={metric.now}
                height={5}
                tone={improving ? 'good' : change < 0 ? 'bad' : 'accent'}
                label={metric.label + ' accuracy'}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
