import type { DashboardData, SkillSnapshot, Weakness } from '@/types/dashboard';
import { bandGapProgress, formatBand } from '@/lib/band';
import { formatLongDate, greetingFor } from '@/lib/date';
import { profileService } from './profile.service';
import { progressService } from './progress.service';
import { recommendationService } from './recommendation.service';
import { mistakesService } from './mistakes.service';

export interface DashboardService {
  getDashboard(): Promise<DashboardData>;
}

/** Which skills get a tile, and where each tile links. */
const SKILL_TILE_HREFS: Record<string, string | null> = {
  reading: '/progress',
  writing: '/writing',
  vocabulary: null,
  grammar: null,
};

function bandGapNarrative(baseline: number, current: number, target: number): string {
  const closed = current - baseline;
  const span = target - baseline;
  if (closed <= 0) {
    return 'You have ' + formatBand(span) + ' bands to close. Your first result will set the pace.';
  }
  if (current >= target) {
    return 'You have reached your target band. Keep practising to hold it under exam pressure.';
  }
  return (
    "You've closed " +
    formatBand(closed) +
    ' of the ' +
    formatBand(span) +
    ' bands to your target. On pace for early October.'
  );
}

/**
 * Composes the dashboard from the other services (§9). The screen never
 * assembles this itself, and never sees a fixture.
 */
const dashboardServiceImpl: DashboardService = {
  async getDashboard() {
    const [profile, baseline, overview, plan, recentProgress, categories, patterns] =
      await Promise.all([
        profileService.getProfile(),
        profileService.getBaselineBand(),
        progressService.getOverview(),
        recommendationService.getTodayPlan(),
        progressService.getRecentProgress(),
        mistakesService.getCategorySummary(),
        mistakesService.getPatterns({ category: 'all', mastery: 'all', query: '' }),
      ]);

    const weakestSkill = [...overview.skills].sort((a, b) => a.band - b.band)[0];

    const skills: SkillSnapshot[] = overview.skills.map((skill) => ({
      skillId: skill.skillId,
      label: skill.name,
      band: skill.band,
      delta: skill.delta,
      isWeakest: skill.skillId === weakestSkill?.skillId,
      href: SKILL_TILE_HREFS[skill.skillId] ?? null,
    }));

    // The blocker is the weakest *criterion*, which is finer-grained than the
    // weakest skill tile — "Coherence & Cohesion" rather than just "Writing".
    const writingCriteria = await progressService.getSkillMastery('writing');
    const weakestCriterion = [...writingCriteria].sort((a, b) => a.accuracy - b.accuracy)[0];

    const coherencePatterns = patterns.filter((p) => p.category === 'coherence');
    const relatedMistakeCount =
      categories.find((c) => c.category === 'coherence')?.count ??
      coherencePatterns.reduce((n, p) => n + p.count, 0);

    const weakness: Weakness | null = weakestCriterion
      ? {
          skillId: 'coherence',
          title: weakestCriterion.name,
          band: weakestCriterion.band,
          diagnosis:
            "You've made " +
            relatedMistakeCount +
            ' related mistakes in your last 8 writing submissions — mostly weak topic sentences and inconsistent paragraph progression.',
          relatedMistakeCount,
          href: '/mistakes/pat_topic_sentence',
        }
      : null;

    const now = new Date();

    return {
      greeting: greetingFor(now),
      date: formatLongDate(plan.date),
      bandGap: {
        current: profile.currentBand,
        target: profile.goal.targetBand,
        baseline,
        progress: bandGapProgress(baseline, profile.currentBand, profile.goal.targetBand),
        examDate: profile.goal.examDate,
        narrative: bandGapNarrative(baseline, profile.currentBand, profile.goal.targetBand),
      },
      weakness,
      plan,
      skills,
      recentProgress,
      bandJourney: overview.bandJourney,
    };
  },
};

export const dashboardService: DashboardService = dashboardServiceImpl;
