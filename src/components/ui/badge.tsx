import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'good' | 'bad' | 'gold' | 'outline';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-fill text-muted',
  accent: 'bg-accent-soft text-accent',
  good: 'bg-good-soft text-good',
  bad: 'bg-bad-soft text-bad',
  gold: 'bg-accent text-on-dark',
  outline: 'border border-line bg-surface text-muted',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Uppercases and letter-spaces the label, as used for mode chips. */
  caps?: boolean;
}

export function Badge({ tone = 'neutral', caps = false, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-pill px-2 py-[3px] text-[10.5px] font-semibold',
        caps && 'uppercase tracking-[0.05em]',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** The small uppercase label that sits above a figure. */
export function EyebrowLabel({
  className,
  tone = 'faint',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: 'faint' | 'accent' | 'gold' | 'muted' | 'bad' }) {
  const tones = {
    faint: 'text-faint',
    accent: 'text-accent',
    gold: 'text-accent-gold',
    muted: 'text-muted',
    bad: 'text-bad',
  } as const;
  return (
    <div
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.07em]',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
