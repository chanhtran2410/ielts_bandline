import type { StudyGoal, UserProfile } from '@/types/user';
import { MOCK_BASELINE_BAND, MOCK_PROFILE } from '@/mocks/profile.mock';
import { clone, delay } from './http';

export interface ProfileService {
  getProfile(): Promise<UserProfile>;
  /** The band the learner started from, used as the journey baseline. */
  getBaselineBand(): Promise<number>;
  updateGoal(goal: Partial<StudyGoal>): Promise<UserProfile>;
}

/** In-memory state so onboarding edits persist across a session. */
let profile: UserProfile = clone(MOCK_PROFILE);

const mockProfileService: ProfileService = {
  async getProfile() {
    return delay(clone(profile));
  },

  async getBaselineBand() {
    return delay(MOCK_BASELINE_BAND);
  },

  async updateGoal(goal) {
    profile = { ...profile, goal: { ...profile.goal, ...goal } };
    if (goal.examDate !== undefined) {
      profile.weeksToExam = goal.examDate
        ? Math.max(
            0,
            Math.round(
              (new Date(goal.examDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000),
            ),
          )
        : null;
    }
    return delay(clone(profile));
  },
};

export const profileService: ProfileService = mockProfileService;
