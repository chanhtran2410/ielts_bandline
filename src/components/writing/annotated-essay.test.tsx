import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WritingIssue } from '@/types/writing';
import { AnnotatedEssay, segmentEssay } from './annotated-essay';

const BODY = 'People thinks technology are useful because it saves a lot of time.';

function issue(overrides: Partial<WritingIssue> & Pick<WritingIssue, 'id' | 'excerpt'>): WritingIssue {
  const start = BODY.indexOf(overrides.excerpt);
  return {
    category: 'grammar',
    title: 'Subject–verb agreement',
    start,
    end: start + overrides.excerpt.length,
    why: 'Because.',
    original: overrides.excerpt,
    suggestion: 'fixed',
    occurrenceCount: 3,
    mistakePatternId: 'pat_sva',
    ...overrides,
  };
}

describe('segmentEssay', () => {
  it('returns the whole essay as one plain segment when there are no issues', () => {
    expect(segmentEssay(BODY, [])).toEqual([{ text: BODY, issue: null }]);
  });

  it('splices a single issue with the surrounding text intact', () => {
    const target = issue({ id: 'a', excerpt: 'People thinks' });
    const segments = segmentEssay(BODY, [target]);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ text: 'People thinks', issue: target });
    expect(segments[1]?.issue).toBeNull();
    expect(segments.map((s) => s.text).join('')).toBe(BODY);
  });

  it('preserves the full text across several issues', () => {
    const segments = segmentEssay(BODY, [
      issue({ id: 'a', excerpt: 'People thinks' }),
      issue({ id: 'b', excerpt: 'a lot of', category: 'vocabulary' }),
    ]);

    expect(segments.map((s) => s.text).join('')).toBe(BODY);
    expect(segments.filter((s) => s.issue !== null)).toHaveLength(2);
  });

  it('lets the narrower issue win an overlap, since that is what gets clicked', () => {
    const outer = issue({ id: 'outer', excerpt: 'People thinks technology are useful' });
    const inner = issue({ id: 'inner', excerpt: 'thinks' });

    // Order of input must not matter.
    for (const input of [
      [inner, outer],
      [outer, inner],
    ]) {
      const segments = segmentEssay(BODY, input);
      expect(segments.map((s) => s.text).join('')).toBe(BODY);
      expect(segments.filter((s) => s.issue?.id === 'inner')).toHaveLength(1);
      expect(segments.filter((s) => s.issue?.id === 'outer')).toHaveLength(0);
    }
  });

  it('keeps two word-level issues that both sit inside one sentence-level note', () => {
    const sentence = issue({ id: 'sentence', excerpt: 'People thinks technology are useful' });
    const word1 = issue({ id: 'w1', excerpt: 'thinks' });
    const word2 = issue({ id: 'w2', excerpt: 'are' });
    const segments = segmentEssay(BODY, [sentence, word1, word2]);

    expect(segments.map((s) => s.text).join('')).toBe(BODY);
    const kept = segments.filter((s) => s.issue).map((s) => s.issue!.id);
    expect(kept).toEqual(['w1', 'w2']);
  });

  it('keeps non-overlapping issues of any width', () => {
    const wide = issue({ id: 'wide', excerpt: 'People thinks technology are useful' });
    const later = issue({ id: 'later', excerpt: 'a lot of', category: 'vocabulary' });
    const segments = segmentEssay(BODY, [wide, later]);

    const kept = segments.filter((s) => s.issue).map((s) => s.issue!.id);
    expect(kept).toEqual(['wide', 'later']);
  });

  it('drops issues whose offsets fall outside the body', () => {
    const stale = { ...issue({ id: 'stale', excerpt: 'People' }), start: 500, end: 600 };
    expect(segmentEssay(BODY, [stale])).toEqual([{ text: BODY, issue: null }]);
  });

  it('drops a zero-length or inverted range rather than rendering an empty span', () => {
    const empty = { ...issue({ id: 'z', excerpt: 'People' }), start: 4, end: 4 };
    const inverted = { ...issue({ id: 'i', excerpt: 'People' }), start: 10, end: 2 };
    expect(segmentEssay(BODY, [empty, inverted])).toEqual([{ text: BODY, issue: null }]);
  });
});

describe('AnnotatedEssay', () => {
  it('makes each issue activatable and reports the selection', async () => {
    const user = userEvent.setup();
    const onSelectIssue = vi.fn();
    render(
      <AnnotatedEssay
        body={BODY}
        issues={[issue({ id: 'a', excerpt: 'People thinks' })]}
        selectedIssueId={null}
        onSelectIssue={onSelectIssue}
      />,
    );

    await user.click(screen.getByRole('button', { name: /People thinks/ }));
    expect(onSelectIssue).toHaveBeenCalledWith('a');
  });

  it('marks the selected issue as pressed', () => {
    render(
      <AnnotatedEssay
        body={BODY}
        issues={[issue({ id: 'a', excerpt: 'People thinks' })]}
        selectedIssueId="a"
        onSelectIssue={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /People thinks/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders the legend so the highlight colours are decodable', () => {
    render(
      <AnnotatedEssay body={BODY} issues={[]} selectedIssueId={null} onSelectIssue={vi.fn()} />,
    );

    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    expect(screen.getByText('Coherence')).toBeInTheDocument();
  });

  it('names the issue category in the accessible label, not colour alone', () => {
    render(
      <AnnotatedEssay
        body={BODY}
        issues={[issue({ id: 'a', excerpt: 'a lot of', category: 'vocabulary' })]}
        selectedIssueId={null}
        onSelectIssue={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /vocabulary issue/i }),
    ).toBeInTheDocument();
  });
});
