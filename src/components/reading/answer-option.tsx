'use client';

import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';

export interface AnswerOptionProps {
  /** The stored answer value, e.g. "TRUE" or "iii". */
  value: string;
  label: string;
  selected: boolean;
  onSelect: (value: string) => void;
  /** Grouping name for the underlying radio input. */
  name: string;
  /** Set after submission, when the answer can be shown as right or wrong. */
  state?: 'correct' | 'incorrect' | 'missed';
  disabled?: boolean;
}

const STATE_CLASSES = {
  correct: 'border-good bg-good-soft',
  incorrect: 'border-bad bg-bad-soft',
  missed: 'border-good border-dashed bg-surface',
} as const;

/**
 * A single selectable answer, built on a real radio input so keyboard and
 * screen-reader behaviour comes from the platform rather than from us (§21).
 */
export function AnswerOption({
  value,
  label,
  selected,
  onSelect,
  name,
  state,
  disabled,
}: AnswerOptionProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border bg-surface px-4 py-3 transition-colors',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
        state ? STATE_CLASSES[state] : selected ? 'border-accent bg-picked' : 'border-line hover:border-line-strong',
        disabled && 'cursor-default',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        className={cn(
          'mt-px grid size-5 shrink-0 place-items-center rounded-pill border-[1.5px] font-display text-[10px] font-bold',
          selected ? 'border-accent bg-accent text-on-dark' : 'border-line-strong text-muted',
          state === 'correct' && 'border-good bg-good text-on-dark',
          state === 'incorrect' && 'border-bad bg-bad text-on-dark',
        )}
        aria-hidden="true"
      >
        {state === 'correct' ? (
          <Icon name="check" size={10} strokeWidth={2.4} />
        ) : state === 'incorrect' ? (
          <Icon name="close" size={9} strokeWidth={2.4} />
        ) : (
          value.slice(0, 3)
        )}
      </span>
      <span className={cn('text-[13.5px] leading-relaxed', selected && 'font-medium')}>{label}</span>
    </label>
  );
}
