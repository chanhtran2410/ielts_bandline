'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { Passage, PassageParagraph } from '@/types/question';
import type { PassageHighlight } from '@/types/attempt';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';

export interface PassageReaderProps {
  passage: Passage;
  highlights: readonly PassageHighlight[];
  onAddHighlight: (highlight: Omit<PassageHighlight, 'id'>) => void;
  onRemoveHighlight: (highlightId: string) => void;
  /** Disabled in mock mode, where annotation is not offered. */
  annotatable?: boolean;
}

/**
 * The passage pane. Selecting text inside a paragraph creates a highlight; the
 * offsets are stored against the paragraph rather than the rendered DOM, so
 * they survive a re-render and a restored attempt.
 */
export function PassageReader({
  passage,
  highlights,
  onAddHighlight,
  onRemoveHighlight,
  annotatable = true,
}: PassageReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const byParagraph = useMemo(() => {
    const map = new Map<string, PassageHighlight[]>();
    for (const highlight of highlights) {
      const list = map.get(highlight.paragraphLetter) ?? [];
      list.push(highlight);
      map.set(highlight.paragraphLetter, list);
    }
    return map;
  }, [highlights]);

  const captureSelection = useCallback(() => {
    if (!annotatable) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    // Resolve to the paragraph that owns both ends of the selection.
    const paragraphNode =
      range.startContainer.parentElement?.closest<HTMLElement>('[data-paragraph]') ?? null;
    if (!paragraphNode || !paragraphNode.contains(range.endContainer)) return;

    const letter = paragraphNode.dataset.paragraph;
    const text = selection.toString().trim();
    if (!letter || text.length < 3) return;

    const full = paragraphNode.textContent ?? '';
    const start = full.indexOf(text);
    if (start < 0) return;

    onAddHighlight({
      passageId: passage.id,
      paragraphLetter: letter,
      start,
      end: start + text.length,
      text,
    });
    selection.removeAllRanges();
  }, [annotatable, onAddHighlight, passage.id]);

  return (
    <div ref={containerRef} className="max-w-[600px]">
      <p className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint">
        Reading Passage {passage.order}
      </p>
      <h1 className="mb-[18px] font-display text-[22px] font-semibold leading-snug tracking-[-0.01em]">
        {passage.title}
      </h1>

      <div
        className="flex flex-col gap-4 text-[15px] leading-[1.75] text-ink-soft"
        onMouseUp={captureSelection}
        onTouchEnd={captureSelection}
      >
        {passage.paragraphs.map((paragraph) => (
          <ParagraphText
            key={paragraph.letter}
            paragraph={paragraph}
            highlights={byParagraph.get(paragraph.letter) ?? []}
            onRemoveHighlight={onRemoveHighlight}
          />
        ))}
      </div>

      {annotatable ? (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-line bg-paper px-3.5 py-3 text-[12.5px] text-muted">
          <Icon name="pencil" size={14} className="text-accent" />
          Select any text to highlight it. Click a highlight to remove it.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders one paragraph, splicing highlight spans in by offset. Overlapping
 * highlights are merged so a span can never be nested inside itself.
 */
function ParagraphText({
  paragraph,
  highlights,
  onRemoveHighlight,
}: {
  paragraph: PassageParagraph;
  highlights: readonly PassageHighlight[];
  onRemoveHighlight: (id: string) => void;
}) {
  const segments = useMemo(() => splitByHighlights(paragraph.text, highlights), [paragraph.text, highlights]);

  return (
    <p data-paragraph={paragraph.letter} className="m-0">
      <strong className="mr-2 font-semibold text-faint" aria-label={'Paragraph ' + paragraph.letter}>
        {paragraph.letter}
      </strong>
      {segments.map((segment, index) =>
        segment.highlightId ? (
          <button
            key={index}
            type="button"
            onClick={() => onRemoveHighlight(segment.highlightId as string)}
            className={cn(
              'cursor-pointer rounded-xs bg-hl-lexis px-px text-left',
              'border-b-2 border-hl-lexis-line hover:bg-hl-lexis/70',
            )}
          >
            {segment.text}
            <span className="sr-only"> (highlighted — activate to remove)</span>
          </button>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

interface Segment {
  text: string;
  highlightId: string | null;
}

/** Exported for unit testing: the offset splicing is easy to get subtly wrong. */
export function splitByHighlights(text: string, highlights: readonly PassageHighlight[]): Segment[] {
  if (highlights.length === 0) return [{ text, highlightId: null }];

  const sorted = [...highlights]
    .filter((h) => h.start >= 0 && h.end <= text.length && h.end > h.start)
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const highlight of sorted) {
    // Skip any highlight already swallowed by an earlier, overlapping one.
    if (highlight.start < cursor) continue;
    if (highlight.start > cursor) {
      segments.push({ text: text.slice(cursor, highlight.start), highlightId: null });
    }
    segments.push({ text: text.slice(highlight.start, highlight.end), highlightId: highlight.id });
    cursor = highlight.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlightId: null });
  }
  return segments;
}
