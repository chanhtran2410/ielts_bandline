/**
 * Analytics abstraction (§27). Components call `track` with a typed event;
 * they never talk to a vendor SDK. Swap the sink here, not at 40 call sites.
 */

export type AnalyticsEvent =
  | { name: 'diagnostic_started' }
  | { name: 'diagnostic_completed'; band: number }
  | { name: 'practice_started'; testId: string; targetSkillId?: string }
  | { name: 'practice_completed'; attemptId: string; band: number; rawScore: number }
  | { name: 'question_answered'; questionId: string; questionType: string; correct?: boolean }
  | { name: 'question_flagged'; questionId: string; flagged: boolean }
  | { name: 'mock_started'; testId: string }
  | { name: 'mock_completed'; attemptId: string; band: number }
  | { name: 'writing_submitted'; submissionId: string; wordCount: number }
  | { name: 'writing_feedback_viewed'; submissionId: string; band: number }
  | { name: 'mistake_reviewed'; patternId: string }
  | { name: 'mistake_practiced'; patternId: string }
  | { name: 'study_plan_started'; date: string; taskCount: number }
  | { name: 'study_task_completed'; taskId: string; kind: string }
  | { name: 'ai_coach_message_sent'; characters: number };

export type AnalyticsEventName = AnalyticsEvent['name'];

type Payload = Record<string, unknown>;

export interface AnalyticsSink {
  emit(name: AnalyticsEventName, payload: Payload): void;
}

/** Development sink. Replace with a real provider in one place. */
const consoleSink: AnalyticsSink = {
  emit(name, payload) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', name, payload);
    }
  },
};

let sink: AnalyticsSink = consoleSink;

export function setAnalyticsSink(next: AnalyticsSink): void {
  sink = next;
}

export function track(event: AnalyticsEvent): void {
  const { name, ...payload } = event;
  sink.emit(name, payload as Payload);
}
