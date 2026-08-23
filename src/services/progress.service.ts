import type { BandPoint } from '@/types/band';
import type { ImprovementMetric } from '@/types/dashboard';
import type { QuestionTypeMastery, SkillMastery } from '@/types/skill';
import {
  MOCK_BAND_JOURNEY,
  MOCK_IMPROVEMENTS,
  MOCK_QUESTION_TYPE_MASTERY,
  MOCK_READING_SUBSKILLS,
  MOCK_RECENT_PROGRESS,
  MOCK_SKILL_MASTERY,
  MOCK_STUDY_MINUTES_LAST_7_DAYS,
  MOCK_WRITING_SUBSKILLS,
} from '@/mocks/progress.mock';
import { clone, delay } from './http';

export interface ProgressOverview {
  bandJourney: BandPoint[];
  skills: SkillMastery[];
  questionTypes: QuestionTypeMastery[];
  improvements: ImprovementMetric[];
  /** One-line read on what the skill trends mean, generated server-side. */
  skillNarrative: string;
  questionTypeNarrative: string;
  studyMinutesLast7Days: number;
}

export interface ProgressService {
  getOverview(): Promise<ProgressOverview>;
  /** Sub-skill mastery within one domain, for result and analysis screens. */
  getSkillMastery(domain: 'reading' | 'writing' | 'all'): Promise<SkillMastery[]>;
  getRecentProgress(): Promise<ImprovementMetric[]>;
  getBandJourney(): Promise<BandPoint[]>;
}

const mockProgressService: ProgressService = {
  async getOverview() {
    return delay(
      clone({
        bandJourney: MOCK_BAND_JOURNEY,
        skills: MOCK_SKILL_MASTERY,
        questionTypes: MOCK_QUESTION_TYPE_MASTERY,
        improvements: MOCK_IMPROVEMENTS,
        skillNarrative:
          "Writing is flat while everything else climbs — it's now the skill capping your overall band.",
        questionTypeNarrative:
          'Matching Headings is your fastest-improving type since starting targeted practice.',
        studyMinutesLast7Days: MOCK_STUDY_MINUTES_LAST_7_DAYS,
      }),
    );
  },

  async getSkillMastery(domain) {
    const byDomain = {
      reading: MOCK_READING_SUBSKILLS,
      writing: MOCK_WRITING_SUBSKILLS,
      all: MOCK_SKILL_MASTERY,
    } as const;
    return delay(clone(byDomain[domain]));
  },

  async getRecentProgress() {
    return delay(clone(MOCK_RECENT_PROGRESS));
  },

  async getBandJourney() {
    return delay(clone(MOCK_BAND_JOURNEY));
  },
};

export const progressService: ProgressService = mockProgressService;
