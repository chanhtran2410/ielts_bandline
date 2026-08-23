import type { CriterionFeedback, WritingFeedback } from '@/types/writing';
import { criteriaOf } from '@/types/writing';
import { formatBand } from '@/lib/band';
import { cn } from '@/lib/cn';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ProgressBar, toneForAccuracy } from '@/components/ui/progress';

/** Band 9 is the top of the scale, so a band maps onto the bar as band/9. */
function fillFor(band: number): number {
  return Math.round((band / 9) * 100);
}

export function CriteriaBreakdown({ feedback }: { feedback: WritingFeedback }) {
  const criteria = criteriaOf(feedback);
  const weakest = [...criteria].sort((a, b) => a.band - b.band)[0];

  return (
    <Card as="section" aria-labelledby="criteria-heading" className="p-6 sm:px-7">
      <CardTitle id="criteria-heading" className="mb-[18px]">
        Criteria breakdown
      </CardTitle>

      <ul className="flex flex-col gap-3.5">
        {criteria.map((criterion) => (
          <CriterionRow
            key={criterion.criterion}
            criterion={criterion}
            isWeakest={criterion.criterion === weakest?.criterion}
          />
        ))}
      </ul>

      <div className="mt-[18px] flex items-start gap-2.5 border-t border-line-soft pt-4">
        <Icon name="sparkle" size={14} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-[13px] leading-relaxed text-muted">
          <strong className="font-semibold text-ink">{feedback.headline}</strong>{' '}
          {weakest?.comment}
        </p>
      </div>
    </Card>
  );
}

function CriterionRow({
  criterion,
  isWeakest,
}: {
  criterion: CriterionFeedback;
  isWeakest: boolean;
}) {
  const fill = fillFor(criterion.band);
  return (
    <li className="flex items-center gap-4">
      <span
        className={cn(
          'w-[150px] shrink-0 text-[13px] sm:w-[180px]',
          isWeakest ? 'font-semibold text-bad' : 'font-medium',
        )}
      >
        {criterion.label}
      </span>
      <ProgressBar
        value={fill}
        tone={isWeakest ? 'bad' : toneForAccuracy(fill)}
        className="flex-1"
        label={criterion.label + ' band ' + formatBand(criterion.band)}
      />
      <span
        className={cn(
          'tnum w-8 shrink-0 text-right font-display text-sm font-bold',
          isWeakest && 'text-bad',
        )}
      >
        {formatBand(criterion.band)}
      </span>
    </li>
  );
}

/** The per-criterion strengths and improvements, shown below the breakdown. */
export function CriteriaDetail({ feedback }: { feedback: WritingFeedback }) {
  return (
    <Card as="section" aria-labelledby="criteria-detail-heading" className="p-6 sm:px-7">
      <CardTitle id="criteria-detail-heading" className="mb-1">
        What the examiner would say
      </CardTitle>
      <p className="mb-5 text-[12.5px] text-faint">
        Per criterion: what is already working, and the specific change that raises the band.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {criteriaOf(feedback).map((criterion) => (
          <div key={criterion.criterion} className="rounded-xl border border-line-soft bg-sunken p-5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="font-display text-[13.5px] font-semibold">{criterion.label}</h3>
              <span className="tnum font-display text-sm font-bold text-accent">
                {formatBand(criterion.band)}
              </span>
            </div>
            <p className="mb-3.5 text-[12.5px] leading-relaxed text-muted">{criterion.comment}</p>

            {criterion.strengths.length > 0 ? (
              <>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-good">
                  Working
                </p>
                <ul className="mb-3 flex flex-col gap-1">
                  {criterion.strengths.map((item) => (
                    <li key={item} className="text-[12.5px] leading-relaxed text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
              To raise the band
            </p>
            <ul className="flex flex-col gap-1">
              {criterion.improvements.map((item) => (
                <li key={item} className="text-[12.5px] leading-relaxed text-ink-soft">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
