import type { SentenceLadder } from '@/types/writing';
import { formatBand } from '@/lib/band';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

/**
 * The same idea at three levels: what the learner wrote, the minimal fix, and
 * the band-7 rewrite — each labelled with *why* it scores where it does. This is
 * the difference between a correction and a lesson.
 */
export function SentenceLadderCard({ ladder }: { ladder: SentenceLadder }) {
  const rungs = [
    {
      label: 'Your sentence',
      labelTone: 'text-bad',
      text: ladder.original.text,
      band: ladder.original.band,
      note: ladder.original.note,
      shell: 'border border-line bg-paper',
      noteTone: 'text-faint',
    },
    {
      label: 'Minimal correction',
      labelTone: 'text-muted',
      text: ladder.corrected.text,
      band: ladder.corrected.band,
      note: ladder.corrected.note,
      shell: 'border border-line',
      noteTone: 'text-faint',
    },
    {
      label: 'Higher-band alternative',
      labelTone: 'text-accent-hover',
      text: ladder.elevated.text,
      band: ladder.elevated.band,
      note: ladder.elevated.note,
      shell: 'border-[1.5px] border-picked-line bg-accent-soft',
      noteTone: 'text-accent-ink',
    },
  ];

  return (
    <Card as="section" aria-labelledby="ladder-heading" className="p-6 sm:px-7">
      <CardTitle id="ladder-heading" className="mb-1">
        Raise this sentence
      </CardTitle>
      <p className="mb-5 text-[12.5px] text-faint">
        See how the same idea reads at each level — and why the change matters.
      </p>

      <ol className="grid items-stretch gap-3 lg:grid-cols-[1fr_24px_1fr_24px_1fr] lg:gap-0">
        {rungs.map((rung, index) => (
          <li key={rung.label} className="contents">
            <div className={'rounded-xl px-5 py-[18px] ' + rung.shell}>
              <p
                className={
                  'mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] ' + rung.labelTone
                }
              >
                {rung.label}
              </p>
              <p className="text-sm leading-relaxed text-ink-soft">{rung.text}</p>
              <p className={'mt-3 text-xs leading-relaxed ' + rung.noteTone}>
                Band ~{formatBand(rung.band)} · {rung.note}
              </p>
            </div>
            {index < rungs.length - 1 ? (
              <div className="hidden items-center justify-center text-faint lg:flex" aria-hidden="true">
                <Icon name="arrow-right" size={14} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
