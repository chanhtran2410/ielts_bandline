import type { BandPoint } from '@/types/band';
import { formatBand } from '@/lib/band';
import { formatShortDate } from '@/lib/date';
import { cn } from '@/lib/cn';
import { Card, CardTitle } from '@/components/ui/card';

/**
 * The band journey: where the learner started, where they are, and where the
 * target sits. Achieved segments are solid; anything still ahead is dashed —
 * the projection must never look like a result.
 */
export function BandJourney({ points }: { points: readonly BandPoint[] }) {
  return (
    <Card as="section" aria-labelledby="journey-heading" className="p-7 sm:px-8">
      <CardTitle id="journey-heading" className="mb-6">
        Band journey
      </CardTitle>

      <ol className="flex items-start overflow-x-auto pb-1">
        {points.map((point, index) => {
          const isCurrent = point.kind === 'current';
          const nextPoint = points[index + 1];
          // The connector after a point is solid only if the point after it has
          // actually happened.
          const achievedAhead =
            nextPoint !== undefined &&
            (nextPoint.kind === 'diagnostic' || nextPoint.kind === 'mock' || nextPoint.kind === 'current');

          return (
            <li key={point.date + point.label} className="contents">
              <div className="flex min-w-[86px] shrink-0 flex-col items-center gap-2">
                <span
                  className={cn(
                    'tnum grid place-items-center rounded-pill font-display font-bold',
                    isCurrent
                      ? 'size-[60px] bg-accent text-[17px] text-on-dark ring-[5px] ring-halo'
                      : 'size-[52px] text-[15px]',
                    point.kind === 'diagnostic' || point.kind === 'mock'
                      ? 'bg-fill text-muted'
                      : undefined,
                    point.kind === 'projected' && 'border-2 border-dashed border-line-strong text-faint',
                    point.kind === 'target' && 'border-2 border-accent text-accent',
                  )}
                >
                  {formatBand(point.band)}
                </span>
                <span
                  className={cn(
                    'text-center text-[11.5px]',
                    isCurrent
                      ? 'font-semibold text-accent'
                      : point.kind === 'target'
                        ? 'font-semibold text-muted'
                        : 'text-faint',
                  )}
                >
                  {point.label}
                  {/* "You are here" needs no date; everything else is dated once. */}
                  {isCurrent ? null : (
                    <span className="block">{formatShortDate(point.date)}</span>
                  )}
                </span>
              </div>

              {nextPoint ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mx-2 mb-[26px] mt-[26px] h-[3px] min-w-8 flex-1 shrink-0',
                    achievedAhead
                      ? 'bg-accent'
                      : 'bg-[repeating-linear-gradient(90deg,var(--color-line-strong)_0_6px,transparent_6px_12px)]',
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
