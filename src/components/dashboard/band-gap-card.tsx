import type { BandGap } from '@/types/dashboard';
import { formatBand } from '@/lib/band';
import { formatShortDate } from '@/lib/date';
import { EyebrowLabel } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/**
 * Current band, target band, and the distance between them — the first thing
 * the learner should see (§9, §33).
 */
export function BandGapCard({ gap }: { gap: BandGap }) {
  const pct = Math.round(gap.progress * 100);

  return (
    <Card as="section" aria-labelledby="band-gap-heading" className="p-7 sm:px-8">
      <h2 id="band-gap-heading" className="sr-only">
        Your band gap
      </h2>
      <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-14">
        <div className="flex gap-10 sm:gap-14">
          <div>
            <EyebrowLabel className="mb-1.5">Current estimated band</EyebrowLabel>
            <p className="tnum font-display text-[44px] font-bold leading-none tracking-[-0.02em]">
              {formatBand(gap.current)}
            </p>
          </div>
          <div>
            <EyebrowLabel className="mb-1.5">Target band</EyebrowLabel>
            <p className="tnum font-display text-[44px] font-bold leading-none tracking-[-0.02em] text-accent">
              {formatBand(gap.target)}
            </p>
          </div>
        </div>

        <div className="flex-1 pt-2.5">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-xs font-medium text-muted">
            <span className="tnum">{formatBand(gap.baseline)}</span>
            {gap.examDate ? <span>Exam · {formatShortDate(gap.examDate)}</span> : <span>No exam date</span>}
            <span className="tnum font-semibold text-accent">{formatBand(gap.target)}</span>
          </div>

          <div
            className="relative h-2 rounded-pill bg-fill"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={
              'Progress from band ' +
              formatBand(gap.baseline) +
              ' to target band ' +
              formatBand(gap.target)
            }
          >
            <div
              className="absolute inset-y-0 left-0 rounded-pill bg-accent"
              style={{ width: pct + '%' }}
            />
            <span
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-[3px] border-accent bg-surface"
              style={{ left: pct + '%' }}
              aria-hidden="true"
            />
          </div>

          <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{gap.narrative}</p>
        </div>
      </div>
    </Card>
  );
}
