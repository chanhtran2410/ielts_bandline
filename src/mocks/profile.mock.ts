import type { UserProfile } from '@/types/user';

/**
 * The reference learner from the design canvas: Band 6.0 heading for 7.0, exam
 * in 8 weeks, capped by Writing. Every other fixture is consistent with this.
 */
export const MOCK_PROFILE: UserProfile = {
  user: {
    id: 'user_minh',
    name: 'Minh Nguyen',
    email: 'minh@example.com',
    initials: 'MN',
  },
  goal: {
    targetBand: 7,
    examHorizon: 'about_8_weeks',
    examDate: '2026-10-18',
    minutesPerDay: 45,
    focusSkills: ['writing', 'coherence', 'main_idea'],
  },
  currentBand: 6,
  weeksToExam: 8,
  diagnosticCompletedAt: '2026-07-06T09:30:00.000Z',
};

/** Where the learner started, used as the band-journey baseline. */
export const MOCK_BASELINE_BAND = 5.5;
