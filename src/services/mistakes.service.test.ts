import { describe, expect, it } from 'vitest';
import { mistakesService } from './mistakes.service';

const NO_FILTER = { category: 'all', mastery: 'all', query: '' } as const;

describe('mistakesService — classification and filtering (§16)', () => {
  it('sorts patterns worst-accuracy first, so the list is a work queue', async () => {
    const patterns = await mistakesService.getPatterns(NO_FILTER);
    const accuracies = patterns.map((p) => p.accuracy);

    expect(patterns.length).toBeGreaterThan(1);
    expect([...accuracies].sort((a, b) => a - b)).toEqual(accuracies);
  });

  it('summarises each category with a count that matches its patterns', async () => {
    const summary = await mistakesService.getCategorySummary();

    for (const entry of summary) {
      const patterns = await mistakesService.getPatterns({ ...NO_FILTER, category: entry.category });
      expect(patterns).toHaveLength(entry.patternCount);
      expect(patterns.reduce((n, p) => n + p.count, 0)).toBe(entry.count);
    }
  });

  it('reports a total equal to the sum of every pattern', async () => {
    const [total, patterns] = await Promise.all([
      mistakesService.getTotalCount(),
      mistakesService.getPatterns(NO_FILTER),
    ]);

    expect(total).toBe(patterns.reduce((n, p) => n + p.count, 0));
  });

  it('filters by category', async () => {
    const grammar = await mistakesService.getPatterns({ ...NO_FILTER, category: 'grammar' });

    expect(grammar.length).toBeGreaterThan(0);
    expect(grammar.every((p) => p.category === 'grammar')).toBe(true);
  });

  it('filters by mastery state', async () => {
    const nearly = await mistakesService.getPatterns({ ...NO_FILTER, mastery: 'nearly_resolved' });
    expect(nearly.every((p) => p.mastery === 'nearly_resolved')).toBe(true);
  });

  it('searches titles, rules and the learner’s own examples', async () => {
    const byTitle = await mistakesService.getPatterns({ ...NO_FILTER, query: 'agreement' });
    expect(byTitle.some((p) => p.id === 'pat_sva')).toBe(true);

    const byExample = await mistakesService.getPatterns({ ...NO_FILTER, query: 'people thinks' });
    expect(byExample.some((p) => p.id === 'pat_sva')).toBe(true);
  });

  it('searches case-insensitively and returns nothing for a miss', async () => {
    const upper = await mistakesService.getPatterns({ ...NO_FILTER, query: 'AGREEMENT' });
    expect(upper.length).toBeGreaterThan(0);

    const miss = await mistakesService.getPatterns({ ...NO_FILTER, query: 'zzzznotathing' });
    expect(miss).toEqual([]);
  });

  it('rejects an unknown pattern with a non-retryable error', async () => {
    await expect(mistakesService.getPattern('nope')).rejects.toThrow(/no longer exists/i);
  });

  it('moves accuracy toward a strong practice round without erasing history', async () => {
    const before = await mistakesService.getPattern('pat_collocation');
    const after = await mistakesService.recordPractice('pat_collocation', 5, 5);

    expect(after.accuracy).toBeGreaterThan(before.accuracy);
    // A single perfect round must not jump straight to 100% — history is weighted.
    expect(after.accuracy).toBeLessThan(100);
    expect(after.accuracyTrend).toBe('up');
  });

  it('derives mastery from accuracy so the badge cannot contradict the bar', async () => {
    // Repeated perfect rounds should eventually raise the mastery state.
    for (let i = 0; i < 25; i += 1) {
      await mistakesService.recordPractice('pat_linkers', 5, 5);
    }
    const pattern = await mistakesService.getPattern('pat_linkers');

    expect(pattern.accuracy).toBeGreaterThanOrEqual(85);
    expect(['nearly_resolved', 'mastered']).toContain(pattern.mastery);
  });

  it('ignores a practice round with no questions in it', async () => {
    const before = await mistakesService.getPattern('pat_articles');
    const after = await mistakesService.recordPractice('pat_articles', 0, 0);

    expect(after.accuracy).toBe(before.accuracy);
  });

  it('lets mastery be set explicitly', async () => {
    const updated = await mistakesService.setMastery('pat_ng_confusion', 'mastered');
    expect(updated.mastery).toBe('mastered');
  });
});
