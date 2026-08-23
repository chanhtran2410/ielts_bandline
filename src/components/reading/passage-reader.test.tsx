import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PassageHighlight } from '@/types/attempt';
import type { Passage } from '@/types/question';
import { PassageReader, splitByHighlights } from './passage-reader';

const TEXT = 'City trees are undervalued but they do measurable work.';

function highlight(overrides: Partial<PassageHighlight> & Pick<PassageHighlight, 'id'>): PassageHighlight {
  return {
    passageId: 'p1',
    paragraphLetter: 'A',
    start: 0,
    end: 10,
    text: TEXT.slice(0, 10),
    ...overrides,
  };
}

const PASSAGE: Passage = {
  id: 'p1',
  order: 2,
  title: 'The Hidden Life of Urban Trees',
  wordCount: 9,
  paragraphs: [
    { letter: 'A', text: TEXT },
    { letter: 'B', text: 'A second paragraph for completeness.' },
  ],
};

describe('splitByHighlights', () => {
  it('returns one plain segment when nothing is highlighted', () => {
    expect(splitByHighlights(TEXT, [])).toEqual([{ text: TEXT, highlightId: null }]);
  });

  it('splices a highlight and keeps the text whole', () => {
    const segments = splitByHighlights(TEXT, [highlight({ id: 'h1' })]);

    expect(segments[0]).toEqual({ text: 'City trees', highlightId: 'h1' });
    expect(segments.map((s) => s.text).join('')).toBe(TEXT);
  });

  it('handles several highlights in order regardless of input order', () => {
    const segments = splitByHighlights(TEXT, [
      highlight({ id: 'later', start: 30, end: 40, text: TEXT.slice(30, 40) }),
      highlight({ id: 'earlier', start: 0, end: 10 }),
    ]);

    expect(segments.filter((s) => s.highlightId).map((s) => s.highlightId)).toEqual([
      'earlier',
      'later',
    ]);
    expect(segments.map((s) => s.text).join('')).toBe(TEXT);
  });

  it('drops an overlapping highlight rather than duplicating text', () => {
    const segments = splitByHighlights(TEXT, [
      highlight({ id: 'outer', start: 0, end: 20 }),
      highlight({ id: 'overlap', start: 5, end: 25 }),
    ]);

    expect(segments.map((s) => s.text).join('')).toBe(TEXT);
    expect(segments.filter((s) => s.highlightId === 'overlap')).toHaveLength(0);
  });

  it('ignores offsets that no longer fit the paragraph', () => {
    const stale = highlight({ id: 'stale', start: 900, end: 950 });
    expect(splitByHighlights(TEXT, [stale])).toEqual([{ text: TEXT, highlightId: null }]);
  });

  it('ignores a zero-length or inverted range', () => {
    const zero = highlight({ id: 'z', start: 4, end: 4 });
    const inverted = highlight({ id: 'i', start: 20, end: 5 });
    expect(splitByHighlights(TEXT, [zero, inverted])).toEqual([{ text: TEXT, highlightId: null }]);
  });

  it('handles a highlight covering the entire paragraph', () => {
    const whole = highlight({ id: 'all', start: 0, end: TEXT.length, text: TEXT });
    expect(splitByHighlights(TEXT, [whole])).toEqual([{ text: TEXT, highlightId: 'all' }]);
  });
});

describe('PassageReader', () => {
  it('renders the passage with its paragraph letters', () => {
    render(
      <PassageReader
        passage={PASSAGE}
        highlights={[]}
        onAddHighlight={vi.fn()}
        onRemoveHighlight={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: PASSAGE.title })).toBeInTheDocument();
    expect(screen.getByLabelText('Paragraph A')).toBeInTheDocument();
    expect(screen.getByLabelText('Paragraph B')).toBeInTheDocument();
  });

  it('makes an existing highlight removable', async () => {
    const user = userEvent.setup();
    const onRemoveHighlight = vi.fn();
    render(
      <PassageReader
        passage={PASSAGE}
        highlights={[highlight({ id: 'h1' })]}
        onAddHighlight={vi.fn()}
        onRemoveHighlight={onRemoveHighlight}
      />,
    );

    await user.click(screen.getByRole('button', { name: /City trees/ }));
    expect(onRemoveHighlight).toHaveBeenCalledWith('h1');
  });

  it('hides the annotation affordance in mock mode (§19)', () => {
    render(
      <PassageReader
        passage={PASSAGE}
        highlights={[]}
        onAddHighlight={vi.fn()}
        onRemoveHighlight={vi.fn()}
        annotatable={false}
      />,
    );

    expect(screen.queryByText(/Select any text to highlight/i)).not.toBeInTheDocument();
  });

  it('offers the annotation affordance in practice mode', () => {
    render(
      <PassageReader
        passage={PASSAGE}
        highlights={[]}
        onAddHighlight={vi.fn()}
        onRemoveHighlight={vi.fn()}
      />,
    );

    expect(screen.getByText(/Select any text to highlight/i)).toBeInTheDocument();
  });
});
