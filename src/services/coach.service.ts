import type { CoachContext, CoachMessage, CoachSession } from '@/types/coach';
import type { Recommendation } from '@/types/plan';
import { MOCK_STUDY_MINUTES_LAST_7_DAYS } from '@/mocks/progress.mock';
import { clone, delay } from './http';
import { mistakesService } from './mistakes.service';
import { profileService } from './profile.service';
import { progressService } from './progress.service';
import { recommendationService } from './recommendation.service';

export interface CoachService {
  /**
   * Builds the learning context the coach reasons over. The chat UI never
   * derives weaknesses itself — it asks for this (§18).
   */
  getContext(): Promise<CoachContext>;
  getSession(): Promise<CoachSession>;
  sendMessage(text: string, context: CoachContext): Promise<CoachMessage>;
}

let sequence = 0;
function nextId(): string {
  sequence += 1;
  return 'msg_' + Date.now().toString(36) + '_' + sequence;
}

/** The opening exchange shown in the design canvas. */
function seedMessages(recommendations: Recommendation[]): CoachMessage[] {
  return [
    {
      id: 'msg_seed_1',
      role: 'user',
      paragraphs: ['What should I study today?'],
      recommendations: [],
      recommendationsAfter: 0,
      createdAt: '2026-08-23T08:00:00.000Z',
      status: 'complete',
    },
    {
      id: 'msg_seed_2',
      role: 'coach',
      paragraphs: [
        "Your biggest current blocker is Coherence & Cohesion — it's been Band 5.5 across your last three essays while your grammar improved 18% over the last two weeks.",
        "With 8 weeks left and 45 minutes today, I'd spend it like this:",
        'The rewrite matters most — it targets the exact paragraph that lost you marks in Tuesday’s essay.',
      ],
      recommendations,
      recommendationsAfter: 2,
      createdAt: '2026-08-23T08:00:12.000Z',
      status: 'complete',
    },
    {
      id: 'msg_seed_3',
      role: 'user',
      paragraphs: ['Will I reach 7.0 by my exam?'],
      recommendations: [],
      recommendationsAfter: 0,
      createdAt: '2026-08-23T08:02:00.000Z',
      status: 'complete',
    },
    {
      id: 'msg_seed_4',
      role: 'coach',
      paragraphs: [
        'At your current pace, yes — but narrowly. Reading and grammar are on track. The risk is Writing: it needs to move from 5.5 to 6.5, which usually takes 5–6 weeks of focused Coherence work. If you keep your 45-minute daily plan and submit two essays a week, I project 6.5–7.0 by October 18.',
      ],
      recommendations: [],
      recommendationsAfter: 0,
      createdAt: '2026-08-23T08:02:09.000Z',
      status: 'complete',
    },
  ];
}

/**
 * Stands in for the model until the route handler is wired to a live key.
 * The shape it returns is identical to the real one, so the UI is final.
 */
function composeReply(text: string, context: CoachContext, recommendations: Recommendation[]): CoachMessage {
  const weakest = context.weakSkills[0];
  const topMistake = context.recentMistakes[0];
  const lower = text.toLowerCase();

  const paragraphs: string[] = [];
  let withRecommendations = -1;

  if (lower.includes('stuck') || lower.includes('why')) {
    paragraphs.push(
      weakest
        ? weakest.name +
            ' is what is holding you at Band ' +
            context.currentBand.toFixed(1) +
            '. It sits at ' +
            Math.round(weakest.accuracy) +
            '% accuracy while everything else you practise is climbing.'
        : 'Nothing in your data stands out as a single blocker right now.',
    );
    if (topMistake) {
      paragraphs.push(
        'The mechanism is concrete: "' +
          topMistake.title +
          '" has appeared ' +
          topMistake.count +
          ' times. That one habit is doing most of the damage, which is good news — it is fixable.',
      );
    }
    paragraphs.push('Here is what I would do about it:');
    withRecommendations = paragraphs.length - 1;
  } else if (lower.includes('plan') || lower.includes('week')) {
    paragraphs.push(
      context.weeksToExam !== null
        ? 'You have ' +
            context.weeksToExam +
            ' weeks and ' +
            context.minutesPerDay +
            ' minutes a day. That is enough for one weakness at a time, not three.'
        : 'Without an exam date I will pace this for steady progress rather than a peak.',
    );
    paragraphs.push('Start with these, in this order:');
    withRecommendations = paragraphs.length - 1;
    paragraphs.push(
      'Reassess after two weeks. If ' +
        (weakest?.name ?? 'your weakest skill') +
        ' has not moved, the method is wrong rather than the effort.',
    );
  } else {
    paragraphs.push(
      'You are at Band ' +
        context.currentBand.toFixed(1) +
        ' against a target of ' +
        context.targetBand.toFixed(1) +
        '. Over the last week you studied ' +
        context.studyMinutesLast7Days +
        ' minutes, which is on pace.',
    );
    paragraphs.push('Given where your accuracy actually is, this is the highest-value work:');
    withRecommendations = paragraphs.length - 1;
  }

  return {
    id: nextId(),
    role: 'coach',
    paragraphs,
    recommendations: withRecommendations >= 0 ? recommendations : [],
    recommendationsAfter: Math.max(0, withRecommendations),
    createdAt: new Date().toISOString(),
    status: 'complete',
  };
}

const mockCoachService: CoachService = {
  async getContext() {
    const [profile, readingSkills, writingSkills, patterns] = await Promise.all([
      profileService.getProfile(),
      progressService.getSkillMastery('reading'),
      progressService.getSkillMastery('writing'),
      mistakesService.getPatterns({ category: 'all', mastery: 'all', query: '' }),
    ]);

    const weakSkills = [...writingSkills, ...readingSkills]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 4)
      .map((skill) => ({
        skillId: skill.skillId,
        name: skill.name,
        band: skill.band,
        accuracy: skill.accuracy,
      }));

    return {
      currentBand: profile.currentBand,
      targetBand: profile.goal.targetBand,
      examDate: profile.goal.examDate,
      weeksToExam: profile.weeksToExam,
      minutesPerDay: profile.goal.minutesPerDay,
      weakSkills,
      recentMistakes: patterns
        .slice(0, 5)
        .map((p) => ({ patternId: p.id, title: p.title, count: p.count })),
      recentAttempts: [
        {
          attemptId: 'attempt_trees_1',
          title: 'Reading Practice · Passage 2',
          band: 7,
          submittedAt: '2026-08-23T08:40:00.000Z',
        },
        {
          attemptId: 'attempt_mock_2',
          title: 'Academic Reading · Full Mock',
          band: 6.5,
          submittedAt: '2026-08-02T10:15:00.000Z',
        },
      ],
      studyMinutesLast7Days: MOCK_STUDY_MINUTES_LAST_7_DAYS,
    };
  },

  async getSession() {
    const recommendations = await recommendationService.getRecommendations(3);
    return delay({
      id: 'session_1',
      messages: seedMessages(recommendations),
      suggestedPrompts: [
        'Why is my writing stuck at 5.5?',
        'Review my last essay with me',
        'Plan my final 2 weeks',
      ],
      contextSummary: 'Knows your last 12 tests, 8 essays and 90 mistakes',
    });
  },

  async sendMessage(text, context) {
    const recommendations = await recommendationService.getRecommendations(3);
    return delay(clone(composeReply(text, context, recommendations)), 900);
  },
};

export const coachService: CoachService = mockCoachService;
