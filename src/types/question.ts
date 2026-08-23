/** Every Reading question type the engine can render (§10). */
export type ReadingQuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'matching_features'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'table_completion'
  | 'flow_chart_completion'
  | 'diagram_label'
  | 'short_answer';

export type QuestionType = ReadingQuestionType;

export interface Passage {
  id: string;
  /** Position within the test, 1-based. */
  order: number;
  title: string;
  /** Lettered paragraphs, in order. The letter is used by matching tasks. */
  paragraphs: PassageParagraph[];
  wordCount: number;
}

export interface PassageParagraph {
  letter: string;
  text: string;
}

/** One choosable option, used by choice-shaped question types. */
export interface AnswerOption {
  value: string;
  label: string;
}

export interface QuestionGroup {
  id: string;
  type: QuestionType;
  passageId: string;
  /** e.g. "Questions 14–18 · Matching Headings" */
  heading: string;
  instruction: string;
  /** Shared option pool for matching / choice groups. */
  options?: AnswerOption[];
  /** Shown above the questions for matching tasks, e.g. "List of headings". */
  optionsTitle?: string;
  questions: Question[];
  /** Word ceiling for completion types, e.g. 2 for "NO MORE THAN TWO WORDS". */
  maxWords?: number;
}

export interface Question {
  id: string;
  /** 1-based position across the whole test, as printed on the paper. */
  number: number;
  type: QuestionType;
  groupId: string;
  /** The stem. For matching tasks this is the item, e.g. "Paragraph C". */
  prompt: string;
  /** Options local to this question, overriding the group pool. */
  options?: AnswerOption[];
  /** The correct answer(s). Multiple entries mean any of them is accepted. */
  acceptedAnswers: string[];
  /** Which skills this question exercises, for mastery attribution. */
  skillIds: string[];
  explanation: string;
  /** Which paragraph letter justifies the answer. */
  evidenceParagraph?: string;
  /** The sentence in the passage that proves the answer. */
  evidence?: string;
}

export function isFreeTextQuestion(type: QuestionType): boolean {
  return (
    type === 'sentence_completion' ||
    type === 'summary_completion' ||
    type === 'note_completion' ||
    type === 'table_completion' ||
    type === 'flow_chart_completion' ||
    type === 'diagram_label' ||
    type === 'short_answer'
  );
}
