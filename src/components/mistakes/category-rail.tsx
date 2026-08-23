'use client';

import type { MistakeCategory, MistakeCategorySummary } from '@/types/mistake';
import { cn } from '@/lib/cn';

export interface CategoryRailProps {
  categories: readonly MistakeCategorySummary[];
  selected: MistakeCategory | 'all';
  onSelect: (category: MistakeCategory | 'all') => void;
  totalCount: number;
}

/**
 * The Error Bank's category rail. A real tablist, so arrow keys move between
 * categories and the selected one is announced.
 */
export function CategoryRail({ categories, selected, onSelect, totalCount }: CategoryRailProps) {
  const entries: { value: MistakeCategory | 'all'; label: string; note: string; count: number }[] = [
    { value: 'all', label: 'All mistakes', note: 'Everything on record', count: totalCount },
    ...categories.map((c) => ({
      value: c.category,
      label: c.label,
      note: c.note,
      count: c.count,
    })),
  ];

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const index = entries.findIndex((e) => e.value === selected);
    const next = entries[(index + delta + entries.length) % entries.length];
    if (next) onSelect(next.value);
  }

  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      aria-label="Mistake categories"
      onKeyDown={onKeyDown}
      className="flex gap-2 overflow-x-auto pb-1 lg:w-[260px] lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {entries.map((entry) => {
        const active = entry.value === selected;
        return (
          <button
            key={entry.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(entry.value)}
            className={cn(
              'flex min-w-[190px] shrink-0 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors lg:min-w-0',
              active
                ? 'border-ink bg-ink text-on-dark'
                : 'border-line bg-surface hover:border-line-strong',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold">{entry.label}</span>
              <span
                className={cn('block truncate text-[11.5px]', active ? 'text-on-dark-faint' : 'text-faint')}
              >
                {entry.note}
              </span>
            </span>
            <span
              className={cn(
                'tnum shrink-0 font-display text-lg font-bold',
                active ? 'text-accent-gold' : 'text-muted',
              )}
            >
              {entry.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
