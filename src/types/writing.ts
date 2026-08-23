import type { Band } from './band';

export type WritingTaskNumber = 1 | 2;

export type WritingTaskKind =
  | 'opinion'
  | 'discussion'
  | 'problem_solution'
  | 'advantages_disadvantages'
  | 'two_part'
  | 'chart_description'
  | 'process_description';

export interface WritingTask {
  id: string;
  task: WritingTaskNumber;
  kind: WritingTaskKind;
  /** e.g. "Task 2 · Opinion essay" */
  label: string;
  prompt: string;
  instruction: string;
  minWords: number;
  recommendedMinutes: number;
}

export type WritingSubmissionStatus = 'draft' | 'analyzing' | 'analyzed' | 'failed';

export interface WritingSubmission {
  id: string;
  taskId: string;
  /** 1-based; a learner may revise the same task several times. */
  draftNumber: number;
  body: string;
  wordCount: number;
  status: WritingSubmissionStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  /** Seconds spent writing, for pacing feedback. */
  timeSpentSeconds: number;
}

export type WritingCriterion = 'task_response' | 'coherence' | 'lexical_resource' | 'grammar';

export interface CriterionFeedback {
  criterion: WritingCriterion;
  label: string;
  band: Band;
  /** What the examiner would say, in one or two sentences. */
  comment: string;
  strengths: string[];
  improvements: string[];
}

export type WritingIssueCategory = 'grammar' | 'vocabulary' | 'collocation' | 'coherence' | 'task_response';

export interface WritingIssue {
  id: string;
  category: WritingIssueCategory;
  /** Short name of the pattern, e.g. "Subject–verb agreement". */
  title: string;
  /** The exact substring of the essay this issue refers to. */
  excerpt: string;
  /** Character offsets into the submitted body, so highlights survive edits. */
  start: number;
  end: number;
  /** Why it is wrong — the teaching, not the label. */
  why: string;
  original: string;
  suggestion: string;
  /** How many times the learner has made this same mistake, all-time. */
  occurrenceCount: number;
  mistakePatternId: string | null;
}

/** Same idea rendered at three levels, so the learner sees the ladder (§15). */
export interface SentenceLadder {
  issueId: string;
  original: { text: string; band: Band; note: string };
  corrected: { text: string; band: Band; note: string };
  elevated: { text: string; band: Band; note: string };
}

export interface WritingFeedback {
  submissionId: string;
  overallBand: Band;
  taskResponse: CriterionFeedback;
  coherence: CriterionFeedback;
  lexicalResource: CriterionFeedback;
  grammar: CriterionFeedback;
  issues: WritingIssue[];
  ladders: SentenceLadder[];
  /** The single biggest problem, named plainly. */
  headline: string;
  /** Seconds the analysis took, shown as "Analyzed in 14s". */
  analysisSeconds: number;
  analyzedAt: string;
}

export function criteriaOf(feedback: WritingFeedback): CriterionFeedback[] {
  return [feedback.taskResponse, feedback.coherence, feedback.lexicalResource, feedback.grammar];
}
