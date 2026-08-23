import type { QuestionType } from '@/types/question';
import type { WritingCriterion, WritingIssueCategory } from '@/types/writing';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false_not_given: 'True / False / Not Given',
  yes_no_not_given: 'Yes / No / Not Given',
  matching_headings: 'Matching Headings',
  matching_information: 'Matching Information',
  matching_features: 'Matching Features',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  note_completion: 'Note Completion',
  table_completion: 'Table Completion',
  flow_chart_completion: 'Flow Chart Completion',
  diagram_label: 'Diagram Labelling',
  short_answer: 'Short Answer',
};

/** Compact variants for narrow columns, as used on the Progress screen. */
export const QUESTION_TYPE_SHORT_LABELS: Partial<Record<QuestionType, string>> = {
  true_false_not_given: 'T / F / Not Given',
  yes_no_not_given: 'Y / N / Not Given',
  flow_chart_completion: 'Flow Chart',
  diagram_label: 'Diagram Label',
};

export function questionTypeLabel(type: QuestionType, short = false): string {
  if (short) return QUESTION_TYPE_SHORT_LABELS[type] ?? QUESTION_TYPE_LABELS[type];
  return QUESTION_TYPE_LABELS[type];
}

export const SKILL_LABELS: Record<string, string> = {
  reading: 'Reading',
  writing: 'Writing',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  task_response: 'Task Response',
  coherence: 'Coherence & Cohesion',
  lexical_resource: 'Lexical Resource',
  scanning: 'Scanning',
  inference: 'Inference',
  paraphrasing: 'Paraphrasing',
  main_idea: 'Main Idea',
};

export const CRITERION_LABELS: Record<WritingCriterion, string> = {
  task_response: 'Task Response',
  coherence: 'Coherence & Cohesion',
  lexical_resource: 'Lexical Resource',
  grammar: 'Grammatical Range & Accuracy',
};

export const ISSUE_CATEGORY_LABELS: Record<WritingIssueCategory, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  collocation: 'Collocation',
  coherence: 'Coherence',
  task_response: 'Task Response',
};

/**
 * Highlight treatment per issue category. Grammar reads red, vocabulary amber,
 * cohesion blue — matching the legend on the analysis screen.
 */
export const ISSUE_HIGHLIGHT_CLASSES: Record<WritingIssueCategory, string> = {
  grammar: 'bg-hl-grammar border-b-2 border-hl-grammar-line',
  vocabulary: 'bg-hl-lexis border-b-2 border-hl-lexis-line',
  collocation: 'bg-hl-lexis border-b-2 border-hl-lexis-line',
  coherence: 'bg-hl-cohesion border-b-2 border-hl-cohesion-line',
  task_response: 'bg-hl-cohesion border-b-2 border-hl-cohesion-line',
};

/** The three swatches shown in the sentence-feedback legend. */
export const ISSUE_LEGEND: readonly { label: string; className: string }[] = [
  { label: 'Grammar', className: 'bg-hl-grammar border-b-2 border-hl-grammar-line' },
  { label: 'Vocabulary', className: 'bg-hl-lexis border-b-2 border-hl-lexis-line' },
  { label: 'Coherence', className: 'bg-hl-cohesion border-b-2 border-hl-cohesion-line' },
];
