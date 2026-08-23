'use client';

import { useId, useRef } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** Optional trailing count, e.g. the number of mistakes in a category. */
  count?: number;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "pill" for filter chips, "underline" for section navigation. */
  variant?: 'pill' | 'underline';
  label: string;
  className?: string;
}

/**
 * A real ARIA tablist with arrow-key navigation. Panels are rendered by the
 * caller and must carry `role="tabpanel"` plus `aria-labelledby={tabId(value)}`.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'pill',
  label,
  className,
}: TabsProps<T>) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    const next = items[(index + delta + items.length) % items.length];
    if (!next) return;
    onChange(next.value);
    listRef.current?.querySelector<HTMLElement>('[data-value="' + next.value + '"]')?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'flex gap-2',
        variant === 'underline' && 'gap-6 border-b border-line',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={baseId + '-' + item.value}
            data-value={item.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'shrink-0 whitespace-nowrap font-medium transition-colors',
              variant === 'pill' && 'rounded-pill border px-3.5 py-[7px] text-[12.5px]',
              variant === 'pill' &&
                (selected
                  ? 'border-ink bg-ink text-on-dark'
                  : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'),
              variant === 'underline' && '-mb-px border-b-2 pb-2.5 text-[13.5px]',
              variant === 'underline' &&
                (selected
                  ? 'border-accent font-semibold text-ink'
                  : 'border-transparent text-muted hover:text-ink'),
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={cn('tnum ml-1.5', selected ? 'opacity-70' : 'text-faint')}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
