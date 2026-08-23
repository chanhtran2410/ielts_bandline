import { cn } from '@/lib/cn';

export type ProgressTone = 'accent' | 'good' | 'bad' | 'ink';

const FILLS: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  good: 'bg-good',
  bad: 'bg-bad',
  ink: 'bg-ink',
};

export interface ProgressBarProps {
  /** 0 to 100. */
  value: number;
  tone?: ProgressTone;
  /** Track height in px; the design uses 4, 5, 6 and 8. */
  height?: 4 | 5 | 6 | 8;
  className?: string;
  /** Accessible name. Omit only when an adjacent label already names it. */
  label?: string;
}

const TRACK_HEIGHTS = { 4: 'h-1', 5: 'h-[5px]', 6: 'h-1.5', 8: 'h-2' } as const;

export function ProgressBar({ value, tone = 'accent', height = 6, label, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-pill bg-fill', TRACK_HEIGHTS[height], className)}
    >
      <div className={cn('h-full rounded-pill', FILLS[tone])} style={{ width: pct + '%' }} />
    </div>
  );
}

/**
 * Tone from an accuracy figure: the design colours anything at or above 80%
 * green, below 55% red, and the band in between amber.
 */
export function toneForAccuracy(accuracy: number): ProgressTone {
  if (accuracy >= 80) return 'good';
  if (accuracy < 55) return 'bad';
  return 'accent';
}

export interface ProgressRingProps {
  /** 0 to 100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: ProgressTone;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

const RING_STROKES: Record<ProgressTone, string> = {
  accent: 'stroke-accent',
  good: 'stroke-good',
  bad: 'stroke-bad',
  ink: 'stroke-ink',
};

export function ProgressRing({
  value,
  size = 52,
  strokeWidth = 4,
  tone = 'accent',
  label,
  children,
  className,
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-fill"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className={RING_STROKES[tone]}
        />
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  );
}

/** Labelled accuracy row: name on the left, figure on the right, bar beneath. */
export interface MeterRowProps {
  label: React.ReactNode;
  value: number;
  /** Overrides the automatic tone. */
  tone?: ProgressTone;
  /** Renders the label and figure in the "problem" treatment. */
  emphasise?: boolean;
  suffix?: React.ReactNode;
  height?: 4 | 5 | 6 | 8;
}

export function MeterRow({ label, value, tone, emphasise, suffix, height = 6 }: MeterRowProps) {
  const resolved = tone ?? toneForAccuracy(value);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] font-medium">
        <span className={cn(emphasise && 'font-semibold text-bad')}>{label}</span>
        <span className={cn('tnum font-semibold', emphasise && 'text-bad')}>
          {Math.round(value)}%{suffix ? <span className="ml-1 font-normal">{suffix}</span> : null}
        </span>
      </div>
      <ProgressBar value={value} tone={resolved} height={height} />
    </div>
  );
}
