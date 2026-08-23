import type { SkillMastery } from '@/types/skill';
import { formatBand } from '@/lib/band';
import { cn } from '@/lib/cn';

const STROKES = {
  up: 'stroke-good',
  down: 'stroke-bad',
  flat: 'stroke-accent',
} as const;

export interface SkillTrendRowProps {
  skill: SkillMastery;
  /** Flags the skill that is capping the overall band. */
  isCapping?: boolean;
}

/**
 * One skill's six-week trajectory. Deliberately a sparkline, not a full chart:
 * the question is "is this moving", and a line answers that at a glance.
 */
export function SkillTrendRow({ skill, isCapping }: SkillTrendRowProps) {
  const trend = skill.delta.trend;
  const stroke = isCapping ? 'stroke-bad' : STROKES[trend];

  return (
    <li className="flex items-center gap-3.5">
      <span
        className={cn('w-[90px] shrink-0 text-[13px]', isCapping ? 'font-semibold text-bad' : 'font-medium')}
      >
        {skill.name}
      </span>
      <Sparkline values={skill.history} className={stroke} />
      <span
        className={cn(
          'tnum w-8 shrink-0 text-right font-display text-sm font-bold',
          isCapping && 'text-bad',
        )}
      >
        {formatBand(skill.band)}
      </span>
    </li>
  );
}

/**
 * Plots values into a fixed 180x28 box. The vertical scale spans the series'
 * own range with a small pad, so a flat line reads as flat rather than as noise.
 */
export function Sparkline({
  values,
  className,
  width = 180,
  height = 28,
}: {
  values: readonly number[];
  className?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return <span className="flex-1 text-[11.5px] text-faint">Not enough data yet</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  // A flat series would divide by zero; give it a nominal span so it centres.
  const span = max - min || 10;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - pad - ((value - min) / span) * (height - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');

  return (
    <svg
      viewBox={'0 0 ' + width + ' ' + height}
      width={width}
      height={height}
      className="min-w-0 flex-1"
      role="img"
      aria-label={'Trend from ' + values[0] + '% to ' + values[values.length - 1] + '%'}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
