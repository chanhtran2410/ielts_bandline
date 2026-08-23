import type { Test } from '@/types/attempt';
import { LANGUAGE_LOSS, SLEEP_RESEARCH, URBAN_TREES } from './passages.mock';
import { LANGUAGE_GROUPS } from './questions-language.mock';
import { SLEEP_GROUPS } from './questions-sleep.mock';
import { TREES_GROUPS } from './questions-trees.mock';

function countQuestions(test: Omit<Test, 'questionCount'>): Test {
  return { ...test, questionCount: test.groups.reduce((n, g) => n + g.questions.length, 0) };
}

/** The single-passage practice session the design shows (Passage 2). */
export const PRACTICE_TREES: Test = countQuestions({
  id: 'test_practice_trees',
  title: 'Reading Practice · Passage 2',
  kind: 'reading_passage',
  mode: 'practice',
  durationMinutes: 20,
  passages: [URBAN_TREES],
  groups: TREES_GROUPS,
});

/** A drill assembled to target the learner's weakest question type. */
export const DRILL_MATCHING_HEADINGS: Test = countQuestions({
  id: 'test_drill_headings',
  title: 'Matching Headings Drill',
  kind: 'skill_drill',
  mode: 'practice',
  durationMinutes: 10,
  passages: [URBAN_TREES],
  groups: TREES_GROUPS.filter((g) => g.type === 'matching_headings'),
  targetedSkillId: 'main_idea',
});

export const PRACTICE_SLEEP: Test = countQuestions({
  id: 'test_practice_sleep',
  title: 'Reading Practice · Passage 1',
  kind: 'reading_passage',
  mode: 'practice',
  durationMinutes: 20,
  passages: [SLEEP_RESEARCH],
  groups: SLEEP_GROUPS,
});

export const PRACTICE_LANGUAGE: Test = countQuestions({
  id: 'test_practice_language',
  title: 'Reading Practice · Passage 3',
  kind: 'reading_passage',
  mode: 'practice',
  durationMinutes: 20,
  passages: [LANGUAGE_LOSS],
  groups: LANGUAGE_GROUPS,
});

/** The full 40-question exam-faithful mock. */
export const MOCK_FULL_READING: Test = countQuestions({
  id: 'test_mock_full',
  title: 'Academic Reading · Full Mock',
  kind: 'reading_full',
  mode: 'mock',
  durationMinutes: 60,
  passages: [SLEEP_RESEARCH, URBAN_TREES, LANGUAGE_LOSS],
  groups: [...SLEEP_GROUPS, ...TREES_GROUPS, ...LANGUAGE_GROUPS],
});

export const MOCK_MINI_READING: Test = countQuestions({
  id: 'test_mock_mini',
  title: 'Academic Reading · Mini Mock',
  kind: 'reading_passage',
  mode: 'mock',
  durationMinutes: 20,
  passages: [URBAN_TREES],
  groups: TREES_GROUPS,
});

export const MOCK_SKILL_READING: Test = countQuestions({
  id: 'test_mock_skill',
  title: 'Matching Headings · Skill Mock',
  kind: 'skill_drill',
  mode: 'mock',
  durationMinutes: 15,
  passages: [URBAN_TREES],
  groups: TREES_GROUPS.filter((g) => g.type === 'matching_headings'),
  targetedSkillId: 'main_idea',
});

/** The diagnostic that opens the product. */
export const DIAGNOSTIC_TEST: Test = countQuestions({
  id: 'test_diagnostic',
  title: 'Diagnostic · Reading',
  kind: 'reading_passage',
  mode: 'diagnostic',
  durationMinutes: 30,
  passages: [SLEEP_RESEARCH],
  groups: SLEEP_GROUPS,
});

export const ALL_TESTS: readonly Test[] = [
  PRACTICE_TREES,
  PRACTICE_SLEEP,
  PRACTICE_LANGUAGE,
  DRILL_MATCHING_HEADINGS,
  MOCK_FULL_READING,
  MOCK_MINI_READING,
  MOCK_SKILL_READING,
  DIAGNOSTIC_TEST,
];

export function findTest(testId: string): Test | undefined {
  return ALL_TESTS.find((t) => t.id === testId);
}
