import type { TimerUrgency } from '@/lib/timer';
import { cn } from '@/lib/cn';
import { Icon } from './icon';

export interface TimerDisplayProps {
  /** Pre-formatted clock, from useTimer().label. */
  label: string;
  urgency?: TimerUrgency;
  /** Appended after the clock, e.g. "left". */
  suffix?: string;
  className?: string;
}

const URGENCY_TONES: Record<TimerUrgency, string> = {
  normal: 'text-ink',
  warning: 'text-accent',
  critical: 'text-bad',
};

/**
 * Presentation only — it holds no interval and no timer state (§11).
 * Feed it from useTimer so the same clock can be rendered in several places.
 */
export function TimerDisplay({ label, urgency = 'normal', suffix, className }: TimerDisplayProps) {
  return (
    <p
      className={cn(
        'flex items-center gap-1.5 font-display text-[13px] font-semibold',
        URGENCY_TONES[urgency],
        className,
      )}
    >
      <Icon name="clock" size={14} className={urgency === 'normal' ? 'text-muted' : undefined} />
      <span
        className="tnum"
        /* Announce only at the coarse changes that matter, not every second. */
        aria-live={urgency === 'critical' ? 'polite' : 'off'}
      >
        {label}
      </span>
      {suffix ? <span className="font-medium">{suffix}</span> : null}
      <span className="sr-only">{urgency === 'critical' ? 'Time almost up' : 'remaining'}</span>
    </p>
  );
}
