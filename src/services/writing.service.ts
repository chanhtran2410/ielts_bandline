import type { WritingFeedback, WritingSubmission, WritingTask } from '@/types/writing';
import { countWords } from '@/lib/word-count';
import { MOCK_FEEDBACK, MOCK_SUBMISSIONS, MOCK_TASKS } from '@/mocks/writing.mock';
import { clone, delay, ServiceError } from './http';

export interface WritingService {
  listTasks(): Promise<WritingTask[]>;
  getTask(taskId: string): Promise<WritingTask>;
  /** All submissions, newest first, for the essay history panel. */
  listSubmissions(taskId?: string): Promise<WritingSubmission[]>;
  getSubmission(submissionId: string): Promise<WritingSubmission>;
  /** Creates the next draft for a task. */
  createDraft(taskId: string): Promise<WritingSubmission>;
  saveDraft(submissionId: string, body: string, timeSpentSeconds: number): Promise<WritingSubmission>;
  /** Sends the essay for analysis. Rejects if the word floor is unmet. */
  submitForAnalysis(submissionId: string): Promise<WritingFeedback>;
  getFeedback(submissionId: string): Promise<WritingFeedback>;
}

let submissions: WritingSubmission[] = clone(MOCK_SUBMISSIONS) as WritingSubmission[];
const feedback = new Map<string, WritingFeedback>([[MOCK_FEEDBACK.submissionId, clone(MOCK_FEEDBACK)]]);

let sequence = 0;

const mockWritingService: WritingService = {
  async listTasks() {
    return delay(clone(MOCK_TASKS));
  },

  async getTask(taskId) {
    const task = MOCK_TASKS.find((t) => t.id === taskId);
    if (!task) throw new ServiceError('We could not find that writing task.', { retryable: false });
    return delay(clone(task));
  },

  async listSubmissions(taskId) {
    const matching = submissions
      .filter((s) => (taskId ? s.taskId === taskId : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return delay(clone(matching));
  },

  async getSubmission(submissionId) {
    const submission = submissions.find((s) => s.id === submissionId);
    if (!submission) {
      throw new ServiceError('We could not find that draft.', { retryable: false });
    }
    return delay(clone(submission));
  },

  async createDraft(taskId) {
    const existing = submissions.filter((s) => s.taskId === taskId);
    sequence += 1;
    const now = new Date().toISOString();
    const draft: WritingSubmission = {
      id: 'sub_' + Date.now().toString(36) + '_' + sequence,
      taskId,
      draftNumber: existing.length + 1,
      body: '',
      wordCount: 0,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      timeSpentSeconds: 0,
    };
    submissions = [draft, ...submissions];
    return delay(clone(draft));
  },

  async saveDraft(submissionId, body, timeSpentSeconds) {
    let saved: WritingSubmission | undefined;
    submissions = submissions.map((submission) => {
      if (submission.id !== submissionId) return submission;
      saved = {
        ...submission,
        body,
        wordCount: countWords(body),
        timeSpentSeconds,
        updatedAt: new Date().toISOString(),
      };
      return saved;
    });
    if (!saved) throw new ServiceError('We could not save that draft.', { retryable: false });
    return delay(clone(saved), 160);
  },

  async submitForAnalysis(submissionId) {
    const submission = submissions.find((s) => s.id === submissionId);
    if (!submission) {
      throw new ServiceError('We could not find that draft.', { retryable: false });
    }

    const task = MOCK_TASKS.find((t) => t.id === submission.taskId);
    const minWords = task?.minWords ?? 250;
    if (submission.wordCount < Math.min(40, minWords)) {
      throw new ServiceError(
        'There is not enough writing to analyse yet. Aim for at least ' + minWords + ' words.',
        { retryable: false },
      );
    }

    submissions = submissions.map((s) =>
      s.id === submissionId ? { ...s, status: 'analyzing' as const } : s,
    );

    // A real implementation posts to /api/writing/analyze here. The mock reuses
    // the reference analysis but keys it to this submission.
    const analysed: WritingFeedback = {
      ...clone(MOCK_FEEDBACK),
      submissionId,
      analyzedAt: new Date().toISOString(),
    };
    feedback.set(submissionId, analysed);

    submissions = submissions.map((s) =>
      s.id === submissionId
        ? { ...s, status: 'analyzed' as const, submittedAt: new Date().toISOString() }
        : s,
    );

    // Deliberately slow: the UI must show its "usually takes 10–20 seconds" state.
    return delay(clone(analysed), 1_400);
  },

  async getFeedback(submissionId) {
    const found = feedback.get(submissionId);
    if (!found) {
      throw new ServiceError('This essay has not been analysed yet.', { retryable: false });
    }
    return delay(clone(found));
  },
};

export const writingService: WritingService = mockWritingService;
