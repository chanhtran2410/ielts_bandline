import type { Recommendation, StudyPlan, StudyTask } from '@/types/plan';
import type { SkillMastery } from '@/types/skill';
import { MOCK_READING_SUBSKILLS, MOCK_WRITING_SUBSKILLS } from '@/mocks/progress.mock';
import { MOCK_PATTERNS } from '@/mocks/mistakes.mock';
import { MOCK_PROFILE } from '@/mocks/profile.mock';
import { clone, delay } from './http';

/**
 * The recommendation boundary (§13). The frontend asks "what should I do next";
 * it never runs the selection algorithm itself. Today the ranking lives here
 * behind the interface; tomorrow it moves server-side without touching the UI.
 */
export interface RecommendationService {
  /** Today's plan, sized to the learner's available minutes. */
  getTodayPlan(): Promise<StudyPlan>;
  /** Ranked next steps, most urgent first. */
  getRecommendations(limit?: number): Promise<Recommendation[]>;
  /** What to practise after a specific weakness has been identified. */
  getForSkill(skillId: string): Promise<Recommendation[]>;
  markTaskComplete(taskId: string, completed: boolean): Promise<StudyPlan>;
}

const TODAY = '2026-08-23';

/**
 * The plan the design shows: four tasks totalling 50 minutes, the first done.
 * Ordering is weakness-first — the Coherence work leads because Coherence is
 * the lowest-scoring criterion in MOCK_WRITING_SUBSKILLS.
 */
let plan: StudyPlan = {
  date: TODAY,
  totalMinutes: 50,
  tasks: [
    {
      id: 'task_headings',
      title: 'Matching Headings',
      kind: 'reading_drill',
      minutes: 10,
      completed: true,
      href: '/practice/session/test_drill_headings',
      targetSkillId: 'main_idea',
      rationale: 'Your weakest Reading question type at 58% accuracy.',
    },
    {
      id: 'task_topic_sentence',
      title: 'Topic Sentence Practice',
      kind: 'writing_drill',
      minutes: 10,
      completed: false,
      href: '/mistakes/pat_topic_sentence',
      targetSkillId: 'coherence',
      rationale: 'Coherence is Band 5.5 and 12 of your mistakes are missing topic sentences.',
    },
    {
      id: 'task_grammar_review',
      title: 'Grammar Error Review',
      kind: 'mistake_review',
      minutes: 15,
      completed: false,
      href: '/mistakes/pat_sva',
      targetSkillId: 'grammar',
      rationale: 'Subject–verb agreement has cost you marks in 17 separate places.',
    },
    {
      id: 'task_mini_writing',
      title: 'Mini Writing Practice',
      kind: 'writing_drill',
      minutes: 15,
      completed: false,
      href: '/writing',
      targetSkillId: 'writing',
      rationale: 'Writing is flat at 5.5 while every other skill climbs.',
    },
  ],
};

/** Lowest mastery first — this is the "weakest skill" selection step. */
function weakestFirst(skills: readonly SkillMastery[]): SkillMastery[] {
  return [...skills].sort((a, b) => a.accuracy - b.accuracy);
}

function buildRecommendations(): Recommendation[] {
  const weakSkills = weakestFirst([...MOCK_WRITING_SUBSKILLS, ...MOCK_READING_SUBSKILLS]);
  const worstPatterns = [...MOCK_PATTERNS].sort((a, b) => a.accuracy - b.accuracy);

  const fromSkills: Recommendation[] = weakSkills.slice(0, 2).map((skill, index) => ({
    id: 'rec_skill_' + skill.skillId,
    title:
      skill.skillId === 'coherence'
        ? 'Topic sentence practice'
        : skill.skillId === 'main_idea'
          ? 'Matching Headings drill'
          : skill.name + ' practice',
    reason:
      skill.name +
      ' is your lowest measured skill at ' +
      Math.round(skill.accuracy) +
      '% accuracy across ' +
      skill.sampleSize +
      ' graded items.',
    minutes: 10,
    href: skill.skillId === 'main_idea' ? '/practice/session/test_drill_headings' : '/writing',
    targetSkillId: null,
    priority: 100 - index,
  }));

  const fromPatterns: Recommendation[] = worstPatterns.slice(0, 2).map((pattern, index) => ({
    id: 'rec_pattern_' + pattern.id,
    title: pattern.title,
    reason:
      'You have made this mistake ' +
      pattern.count +
      ' times and are only ' +
      pattern.accuracy +
      '% accurate on it.',
    minutes: 15,
    href: '/mistakes/' + pattern.id,
    targetSkillId: null,
    priority: 80 - index,
  }));

  const rewrite: Recommendation = {
    id: 'rec_rewrite',
    title: 'Rewrite your weakest paragraph',
    reason:
      'It targets the exact paragraph that lost you marks in your most recent essay, so the fix is immediate.',
    minutes: 15,
    href: '/writing/sub_task2_d2/analysis',
    targetSkillId: 'coherence',
    priority: 95,
  };

  return [...fromSkills, rewrite, ...fromPatterns].sort((a, b) => b.priority - a.priority);
}

/** Trims the plan to the minutes the learner actually said they have. */
function fitToBudget(tasks: readonly StudyTask[], minutes: number): StudyTask[] {
  const kept: StudyTask[] = [];
  let used = 0;
  for (const task of tasks) {
    if (used + task.minutes > minutes && kept.length > 0) break;
    kept.push(task);
    used += task.minutes;
  }
  return kept;
}

const mockRecommendationService: RecommendationService = {
  async getTodayPlan() {
    const budget = MOCK_PROFILE.goal.minutesPerDay;
    const tasks = fitToBudget(plan.tasks, Math.max(budget, 50));
    return delay(clone({ ...plan, tasks, totalMinutes: tasks.reduce((n, t) => n + t.minutes, 0) }));
  },

  async getRecommendations(limit = 3) {
    return delay(clone(buildRecommendations().slice(0, limit)));
  },

  async getForSkill(skillId) {
    const all = buildRecommendations();
    const matching = all.filter((r) => r.targetSkillId === skillId);
    return delay(clone(matching.length > 0 ? matching : all.slice(0, 2)));
  },

  async markTaskComplete(taskId, completed) {
    plan = {
      ...plan,
      tasks: plan.tasks.map((task) => (task.id === taskId ? { ...task, completed } : task)),
    };
    return delay(clone(plan));
  },
};

export const recommendationService: RecommendationService = mockRecommendationService;
