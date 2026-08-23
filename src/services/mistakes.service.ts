import type {
  MasteryState,
  MistakeCategory,
  MistakeCategorySummary,
  MistakeFilter,
  MistakePattern,
} from '@/types/mistake';
import { MISTAKE_CATEGORY_LABELS } from '@/types/mistake';
import { MOCK_PATTERNS } from '@/mocks/mistakes.mock';
import { clone, delay, ServiceError } from './http';

export interface MistakesService {
  /** Counts per category for the Error Bank rail. */
  getCategorySummary(): Promise<MistakeCategorySummary[]>;
  getPatterns(filter: MistakeFilter): Promise<MistakePattern[]>;
  getPattern(patternId: string): Promise<MistakePattern>;
  /** Total mistakes on record, for the page subtitle. */
  getTotalCount(): Promise<number>;
  setMastery(patternId: string, mastery: MasteryState): Promise<MistakePattern>;
  /** Records a practice round against a pattern and returns the new accuracy. */
  recordPractice(patternId: string, correct: number, total: number): Promise<MistakePattern>;
}

let patterns: MistakePattern[] = clone(MOCK_PATTERNS) as MistakePattern[];

/** A short human note per category, e.g. "3 recurring patterns". */
function noteFor(category: MistakeCategory, matching: readonly MistakePattern[]): string {
  if (category === 'grammar') return matching.length + ' recurring patterns';
  if (category === 'vocabulary') return 'Register and word choice';
  if (category === 'collocation') return 'Mostly verb–noun pairings';
  if (category === 'coherence') return 'Topic sentences, linking';
  if (category === 'task_response') return 'Under-developed ideas';
  return 'Question-type habits';
}

function matchesFilter(pattern: MistakePattern, filter: MistakeFilter): boolean {
  if (filter.category !== 'all' && pattern.category !== filter.category) return false;
  if (filter.mastery !== 'all' && pattern.mastery !== filter.mastery) return false;
  if (filter.query.trim()) {
    const needle = filter.query.trim().toLowerCase();
    const haystack = [
      pattern.title,
      pattern.rule,
      ...pattern.examples.flatMap((e) => [e.original, e.correction]),
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

/** Mastery is derived from accuracy, so the badge can never contradict the bar. */
function masteryFor(accuracy: number, previous: MasteryState): MasteryState {
  if (accuracy >= 95) return 'mastered';
  if (accuracy >= 85) return 'nearly_resolved';
  if (previous === 'new') return 'practising';
  return previous === 'mastered' ? 'nearly_resolved' : previous;
}

const mockMistakesService: MistakesService = {
  async getCategorySummary() {
    const categories = [...new Set(patterns.map((p) => p.category))];
    const summary: MistakeCategorySummary[] = categories
      .map((category) => {
        const matching = patterns.filter((p) => p.category === category);
        return {
          category,
          label: MISTAKE_CATEGORY_LABELS[category],
          note: noteFor(category, matching),
          count: matching.reduce((n, p) => n + p.count, 0),
          patternCount: matching.length,
        };
      })
      .sort((a, b) => b.count - a.count);
    return delay(summary);
  },

  async getPatterns(filter) {
    const matching = patterns
      .filter((p) => matchesFilter(p, filter))
      // Worst accuracy first: the Error Bank is a work queue, not an archive.
      .sort((a, b) => a.accuracy - b.accuracy);
    return delay(clone(matching));
  },

  async getPattern(patternId) {
    const pattern = patterns.find((p) => p.id === patternId);
    if (!pattern) {
      throw new ServiceError('That mistake pattern no longer exists.', { retryable: false });
    }
    return delay(clone(pattern));
  },

  async getTotalCount() {
    return delay(patterns.reduce((n, p) => n + p.count, 0));
  },

  async setMastery(patternId, mastery) {
    patterns = patterns.map((p) => (p.id === patternId ? { ...p, mastery } : p));
    return this.getPattern(patternId);
  },

  async recordPractice(patternId, correct, total) {
    patterns = patterns.map((pattern) => {
      if (pattern.id !== patternId || total <= 0) return pattern;
      // Weighted blend so one good round cannot erase a long history.
      const roundAccuracy = (correct / total) * 100;
      const weight = Math.min(0.4, total / Math.max(total, pattern.count));
      const accuracy = Math.round(pattern.accuracy * (1 - weight) + roundAccuracy * weight);
      return {
        ...pattern,
        accuracy,
        accuracyTrend: accuracy > pattern.accuracy ? 'up' : accuracy < pattern.accuracy ? 'down' : 'flat',
        mastery: masteryFor(accuracy, pattern.mastery),
        lastSeenAt: new Date().toISOString(),
      };
    });
    return this.getPattern(patternId);
  },
};

export const mistakesService: MistakesService = mockMistakesService;
