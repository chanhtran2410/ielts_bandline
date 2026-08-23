import { wordCountProgress } from '@/lib/word-count';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/progress';

export interface WordCountBarProps {
  count: number;
  minWords: number;
  className?: string;
}

/**
 * Word count against the task minimum. Under-length essays are capped at
 * Band 5 regardless of quality, so this is a score-critical readout, not
 * decoration — it goes green the moment the requirement is met.
 */
export function WordCountBar({ count, minWords, className }: WordCountBarProps) {
  const progress = wordCountProgress(count, minWords);
  const met = count >= minWords;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <p className="flex shrink-0 items-baseline gap-1.5">
        <span className={cn('tnum font-display text-sm font-semibold', met && 'text-good')}>
          {count}
        </span>
        <span className="tnum text-xs text-faint">/ {minWords} words</span>
      </p>
      <ProgressBar
        value={progress * 100}
        height={4}
        tone={met ? 'good' : 'accent'}
        className="w-24 shrink-0"
        label={'Word count: ' + count + ' of ' + minWords + ' required'}
      />
      <span className="sr-only" aria-live="polite">
        {met ? 'Word requirement met' : minWords - count + ' words to go'}
      </span>
    </div>
  );
}
