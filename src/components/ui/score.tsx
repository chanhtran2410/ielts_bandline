import Link from 'next/link';
import type { Band, Delta } from '@/types/band';
import { formatBand, formatBandDelta } from '@/lib/band';
import { cn } from '@/lib/cn';
import { Badge, EyebrowLabel } from './badge';
import { Card } from './card';

/* -------------------------------------------------------------------------- */
/* BandFigure — the large numeral used for every band readout                  */
/* -------------------------------------------------------------------------- */

export interface BandFigureProps {
  band: Band;
  /** Matches the design's four band sizes. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'ink' | 'accent' | 'gold' | 'bad';
  className?: string;
}

const FIGURE_SIZES = {
  sm: 'text-[20px]',
  md: 'text-[28px]',
  lg: 'text-[42px] leading-none tracking-[-0.02em]',
  xl: 'text-[56px] leading-none tracking-[-0.03em]',
} as const;

const FIGURE_TONES = {
  ink: 'text-ink',
  accent: 'text-accent',
  gold: 'text-accent-gold',
  bad: 'text-bad',
} as const;

export function BandFigure({ band, size = 'md', tone = 'ink', className }: BandFigureProps) {
  return (
    <span
      className={cn('tnum font-display font-bold', FIGURE_SIZES[size], FIGURE_TONES[tone], className)}
    >
      {formatBand(band)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* DeltaTag — the "▲ 0.5" / "—" treatment                                     */
/* -------------------------------------------------------------------------- */

export function DeltaTag({
  delta,
  suffix,
  className,
}: {
  delta: Delta | null;
  /** e.g. "vs last test". */
  suffix?: string;
  className?: string;
}) {
  const tone =
    !delta || delta.trend === 'flat' ? 'text-faint' : delta.trend === 'up' ? 'text-good' : 'text-bad';
  return (
    <span className={cn('tnum text-[11.5px] font-semibold', tone, className)}>
      {formatBandDelta(delta)}
      {delta && delta.trend !== 'flat' && suffix ? ' ' + suffix : null}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ScoreCard — raw score plus band, as used on every result screen            */
/* -------------------------------------------------------------------------- */

export interface ScoreCardProps {
  label: string;
  rawScore: number;
  totalQuestions: number;
  band: Band;
  bandDelta: Delta | null;
  summary: string;
  className?: string;
}

export function ScoreCard({
  label,
  rawScore,
  totalQuestions,
  band,
  bandDelta,
  summary,
  className,
}: ScoreCardProps) {
  return (
    <Card className={cn('flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:gap-12', className)}>
      <div>
        <EyebrowLabel className="mb-2">{label}</EyebrowLabel>
        <p className="flex items-baseline gap-1.5">
          <span className="tnum font-display text-[42px] font-bold leading-none tracking-[-0.02em]">
            {rawScore}
          </span>
          <span className="tnum font-display text-lg font-semibold text-faint">/ {totalQuestions}</span>
        </p>
      </div>
      <div className="hidden h-14 w-px bg-line sm:block" />
      <div>
        <EyebrowLabel className="mb-2">Estimated band</EyebrowLabel>
        <p className="flex items-baseline gap-2.5">
          <BandFigure band={band} size="lg" tone="accent" />
          <DeltaTag delta={bandDelta} suffix="vs last test" className="text-[12.5px]" />
        </p>
      </div>
      <p className="text-[13.5px] leading-relaxed text-muted sm:flex-1">{summary}</p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* SkillCard — the small band tile used on the dashboard                      */
/* -------------------------------------------------------------------------- */

export interface SkillCardProps {
  label: string;
  band: Band;
  delta: Delta;
  isWeakest?: boolean;
  href?: string | null;
}

export function SkillCard({ label, band, delta, isWeakest, href }: SkillCardProps) {
  const body = (
    <>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-muted">{label}</span>
        {isWeakest ? (
          <Badge tone="accent" className="text-[10px]">
            weakest
          </Badge>
        ) : null}
      </div>
      <p className="flex items-baseline gap-2">
        <BandFigure band={band} size="md" />
        <DeltaTag delta={delta} />
      </p>
    </>
  );

  const shell = 'block rounded-2xl border border-line bg-surface px-[22px] py-5 shadow-card';

  if (!href) {
    return <div className={shell}>{body}</div>;
  }
  return (
    <Link href={href} className={cn(shell, 'transition-colors hover:border-line-strong')}>
      {body}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* BeforeAfter — the "61% → 84% +23%" improvement treatment (§17)             */
/* -------------------------------------------------------------------------- */

export interface BeforeAfterProps {
  label: string;
  before: number;
  now: number;
  period: string;
  className?: string;
}

export function BeforeAfter({ label, before, now, period, className }: BeforeAfterProps) {
  const change = now - before;
  const tone = change > 0 ? 'text-good' : change < 0 ? 'text-bad' : 'text-faint';
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return (
    <div className={cn('rounded-xl border border-line-soft bg-sunken px-5 py-[18px]', className)}>
      <p className="mb-3 text-[13px] font-medium">{label}</p>
      <div className="flex items-center gap-2.5">
        <div>
          <p className="text-[10.5px] text-faint">Before</p>
          <p className="tnum font-display text-lg font-semibold text-muted">{Math.round(before)}%</p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="shrink-0 text-faint"
          aria-hidden="true"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
        <div>
          <p className="text-[10.5px] text-faint">Now</p>
          <p className="tnum font-display text-lg font-semibold">{Math.round(now)}%</p>
        </div>
        <p className={cn('tnum ml-auto font-display text-[15px] font-bold', tone)}>
          {sign}
          {Math.abs(Math.round(change))}%
        </p>
      </div>
      <p className="sr-only">measured over {period}</p>
    </div>
  );
}
