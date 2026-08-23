import type { BandPoint } from '@/types/band';
import type { ImprovementMetric } from '@/types/dashboard';
import type { QuestionTypeMastery, SkillMastery } from '@/types/skill';
import { toDelta } from '@/lib/band';

/** The band journey rendered on the Progress screen. */
export const MOCK_BAND_JOURNEY: BandPoint[] = [
  { band: 5.5, date: '2026-07-06', label: 'Diagnostic', kind: 'diagnostic' },
  { band: 6, date: '2026-08-02', label: 'Mock 2', kind: 'mock' },
  { band: 6, date: '2026-08-23', label: 'You are here', kind: 'current' },
  { band: 6.5, date: '2026-09-14', label: 'Projected', kind: 'projected' },
  { band: 7, date: '2026-10-18', label: 'Target', kind: 'target' },
];

/** Skill mastery in the product's canonical display order. Writing is flat. */
export const MOCK_SKILL_MASTERY: SkillMastery[] = [
  {
    skillId: 'reading',
    name: 'Reading',
    accuracy: 80,
    band: 6.5,
    delta: toDelta(0.5, '6 weeks'),
    sampleSize: 214,
    history: [64, 66, 65, 72, 75, 80],
  },
  {
    skillId: 'writing',
    name: 'Writing',
    accuracy: 58,
    band: 5.5,
    delta: toDelta(0, '6 weeks'),
    sampleSize: 8,
    history: [54, 54, 56, 55, 57, 58],
  },
  {
    skillId: 'grammar',
    name: 'Grammar',
    accuracy: 72,
    band: 6,
    delta: toDelta(0.5, '6 weeks'),
    sampleSize: 168,
    history: [55, 60, 64, 66, 69, 72],
  },
  {
    skillId: 'vocabulary',
    name: 'Vocabulary',
    accuracy: 70,
    band: 6,
    delta: toDelta(0.5, '6 weeks'),
    sampleSize: 141,
    history: [61, 63, 65, 67, 68, 70],
  },
];

/** Sub-skills measured inside Reading, as shown on the result screen. */
export const MOCK_READING_SUBSKILLS: SkillMastery[] = [
  {
    skillId: 'scanning',
    name: 'Scanning',
    accuracy: 89,
    band: 7.5,
    delta: toDelta(6, '2 weeks'),
    sampleSize: 62,
    history: [78, 80, 83, 85, 87, 89],
  },
  {
    skillId: 'inference',
    name: 'Inference',
    accuracy: 72,
    band: 6,
    delta: toDelta(4, '2 weeks'),
    sampleSize: 44,
    history: [61, 64, 66, 68, 70, 72],
  },
  {
    skillId: 'paraphrasing',
    name: 'Paraphrasing',
    accuracy: 61,
    band: 6,
    delta: toDelta(3, '2 weeks'),
    sampleSize: 58,
    history: [52, 54, 56, 57, 59, 61],
  },
  {
    skillId: 'main_idea',
    name: 'Main Idea',
    accuracy: 54,
    band: 5.5,
    delta: toDelta(9, '2 weeks'),
    sampleSize: 40,
    history: [38, 41, 44, 47, 50, 54],
  },
];

/** The four criteria measured inside Writing. */
export const MOCK_WRITING_SUBSKILLS: SkillMastery[] = [
  {
    skillId: 'task_response',
    name: 'Task Response',
    accuracy: 72,
    band: 6.5,
    delta: toDelta(0.5, '6 weeks'),
    sampleSize: 8,
    history: [60, 63, 66, 68, 70, 72],
  },
  {
    skillId: 'lexical_resource',
    name: 'Lexical Resource',
    accuracy: 61,
    band: 6,
    delta: toDelta(0.5, '6 weeks'),
    sampleSize: 8,
    history: [52, 54, 56, 58, 60, 61],
  },
  {
    skillId: 'grammar',
    name: 'Grammatical Range & Accuracy',
    accuracy: 61,
    band: 6,
    delta: toDelta(0.5, '6 weeks'),
    sampleSize: 8,
    history: [48, 51, 54, 57, 59, 61],
  },
  {
    skillId: 'coherence',
    name: 'Coherence & Cohesion',
    accuracy: 50,
    band: 5.5,
    delta: toDelta(0, '6 weeks'),
    sampleSize: 8,
    history: [50, 51, 49, 50, 50, 50],
  },
];

export const MOCK_QUESTION_TYPE_MASTERY: QuestionTypeMastery[] = [
  { type: 'multiple_choice', label: 'Multiple Choice', accuracy: 90, delta: toDelta(6, '6 weeks'), sampleSize: 48 },
  {
    type: 'summary_completion',
    label: 'Summary Completion',
    accuracy: 85,
    delta: toDelta(9, '6 weeks'),
    sampleSize: 36,
  },
  {
    type: 'true_false_not_given',
    label: 'True / False / Not Given',
    accuracy: 81,
    delta: toDelta(12, '6 weeks'),
    sampleSize: 52,
  },
  {
    type: 'matching_headings',
    label: 'Matching Headings',
    accuracy: 58,
    delta: toDelta(15, '6 weeks'),
    sampleSize: 40,
  },
];

/** Real movement, framed before/now (§17). */
export const MOCK_IMPROVEMENTS: ImprovementMetric[] = [
  { id: 'imp_sva', label: 'Subject–verb agreement', before: 61, now: 84, period: '2 weeks' },
  { id: 'imp_tense', label: 'Verb tense consistency', before: 52, now: 88, period: '6 weeks' },
  { id: 'imp_tfng', label: 'T/F/NG accuracy', before: 69, now: 81, period: '6 weeks' },
];

/** The three metrics the dashboard surfaces, including one going the wrong way. */
export const MOCK_RECENT_PROGRESS: ImprovementMetric[] = [
  { id: 'rp_sva', label: 'Subject–verb agreement', before: 61, now: 84, period: '2 weeks' },
  { id: 'rp_headings', label: 'Matching Headings accuracy', before: 43, now: 58, period: '2 weeks' },
  { id: 'rp_topic', label: 'Topic sentence quality', before: 53, now: 49, period: '2 weeks' },
];

export const MOCK_STUDY_MINUTES_LAST_7_DAYS = 268;
