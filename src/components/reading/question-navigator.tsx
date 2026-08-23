'use client';

import { cn } from '@/lib/cn';

export interface NavigatorEntry {
  questionId: string;
  number: number;
  answered: boolean;
  flagged: boolean;
}

export interface QuestionNavigatorProps {
  entries: readonly NavigatorEntry[];
  activeQuestionId: string | null;
  onSelect: (questionId: string) => void;
  /** Caption on the left, e.g. "Questions 14–18 of 40". */
  caption: string;
  /** Collapses the run to a window around the active question. */
  windowSize?: number;
}

/**
 * The footer navigator. Every state in the design is represented: answered
 * (filled), active (ringed), flagged (accent text), and untouched.
 */
export function QuestionNavigator({
  entries,
  activeQuestionId,
  onSelect,
  caption,
  windowSize = 12,
}: QuestionNavigatorProps) {
  const activeIndex = Math.max(
    0,
    entries.findIndex((e) => e.questionId === activeQuestionId),
  );
  const { visible, truncated } = windowAround(entries, activeIndex, windowSize);
  const last = entries[entries.length - 1];

  return (
    <nav
      aria-label="Question navigator"
      className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-t border-line bg-surface px-4 py-2.5 sm:px-5"
    >
      <p className="text-xs font-medium text-muted">{caption}</p>

      <ul className="flex flex-1 flex-wrap justify-center gap-1.5">
        {visible.map((entry) => (
          <li key={entry.questionId}>
            <NavigatorButton
              entry={entry}
              active={entry.questionId === activeQuestionId}
              onSelect={onSelect}
            />
          </li>
        ))}
        {truncated && last ? (
          <>
            <li className="self-center px-1 text-[11px] font-medium text-faint" aria-hidden="true">
              ···
            </li>
            <li>
              <NavigatorButton
                entry={last}
                active={last.questionId === activeQuestionId}
                onSelect={onSelect}
              />
            </li>
          </>
        ) : null}
      </ul>
    </nav>
  );
}

function NavigatorButton({
  entry,
  active,
  onSelect,
}: {
  entry: NavigatorEntry;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.questionId)}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'tnum grid size-[26px] place-items-center rounded-[7px] border text-[11px] transition-colors',
        entry.answered
          ? 'border-ink bg-ink font-semibold text-on-dark'
          : 'border-line bg-transparent font-medium hover:border-line-strong',
        !entry.answered && entry.flagged && 'text-accent',
        !entry.answered && !entry.flagged && 'text-faint',
        active && 'border-[1.5px] border-accent bg-transparent font-semibold text-accent',
      )}
    >
      {entry.number}
      <span className="sr-only">
        {entry.answered ? ' answered' : ' unanswered'}
        {entry.flagged ? ', flagged' : ''}
      </span>
    </button>
  );
}

/** Keeps the navigator to a fixed width by windowing around the cursor. */
function windowAround<T>(
  items: readonly T[],
  index: number,
  size: number,
): { visible: T[]; truncated: boolean } {
  if (items.length <= size) return { visible: [...items], truncated: false };
  const half = Math.floor(size / 2);
  const start = Math.min(Math.max(0, index - half), items.length - size);
  const visible = items.slice(start, start + size);
  // Only claim truncation when the final item is genuinely off-window;
  // otherwise the caller would render the last entry a second time.
  return { visible, truncated: start + size < items.length };
}
