import { z } from 'zod';

/**
 * The on-disk shape of authored or generated content.
 *
 * This mirrors the database, but it is validated far more strictly than the
 * column constraints can express — see scripts/validate-content.ts. Generated
 * IELTS material fails in specific, predictable ways (answers that are not in
 * the passage, completion answers over the word limit, headings reused across
 * paragraphs), and those are exactly the checks the DB cannot do for us.
 */

export const QUESTION_TYPES = [
  'multiple_choice',
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'matching_features',
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label',
  'short_answer',
] as const;

/** Types whose answer must be a verbatim span lifted from the passage. */
export const VERBATIM_TYPES = [
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label',
  'short_answer',
] as const;

/** Types whose answer must come from the group's shared option pool. */
export const POOL_TYPES = [
  'matching_headings',
  'matching_information',
  'matching_features',
  'true_false_not_given',
  'yes_no_not_given',
] as const;

export const OptionSchema = z.object({
  value: z.string().min(1).max(64),
  label: z.string().min(1).max(300),
});

export const QuestionSchema = z.object({
  position: z.number().int().positive(),
  prompt: z.string().min(5).max(600),
  options: z.array(OptionSchema).min(2).max(10).optional(),
  acceptedAnswers: z.array(z.string().min(1)).min(1).max(6),
  skillIds: z.array(z.string().min(1)).min(1).max(4),
  explanation: z.string().min(20).max(800),
  evidenceParagraph: z.string().regex(/^[A-Z]$/).optional(),
  evidence: z.string().min(5).max(400).optional(),
});

export const QuestionGroupSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  position: z.number().int().positive(),
  heading: z.string().min(5).max(200),
  instruction: z.string().min(10).max(400),
  optionsTitle: z.string().min(3).max(100).optional(),
  options: z.array(OptionSchema).min(2).max(14).optional(),
  maxWords: z.number().int().min(1).max(5).optional(),
  questions: z.array(QuestionSchema).min(1).max(14),
});

export const ParagraphSchema = z.object({
  letter: z.string().regex(/^[A-Z]$/),
  text: z.string().min(120),
});

export const PassageSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  title: z.string().min(5).max(160),
  topic: z.string().min(3).max(60),
  /** Which band the passage is pitched at. Drives selection by difficulty. */
  targetBand: z.number().min(4).max(9),
  source: z.enum(['ai_generated', 'authored', 'licensed']).default('ai_generated'),
  paragraphs: z.array(ParagraphSchema).min(4).max(9),
  groups: z.array(QuestionGroupSchema).min(2),
});

export const WritingTaskSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  task: z.union([z.literal(1), z.literal(2)]),
  kind: z.string().min(3),
  label: z.string().min(5),
  prompt: z.string().min(20),
  instruction: z.string().min(10),
  minWords: z.number().int().positive(),
  recommendedMinutes: z.number().int().positive(),
  targetBand: z.number().min(4).max(9).optional(),
  source: z.enum(['ai_generated', 'authored', 'licensed']).default('ai_generated'),
});

export const TemplateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(5),
  kind: z.enum(['reading_passage', 'reading_full', 'skill_drill', 'mistake_drill']),
  mode: z.enum(['practice', 'mock', 'diagnostic']),
  durationMinutes: z.number().int().positive().nullable(),
  targetBand: z.number().min(4).max(9).optional(),
  targetedSkillId: z.string().optional(),
  onlyTypes: z.array(z.enum(QUESTION_TYPES)).optional(),
  /** Passage slugs, in the order they appear on the paper. */
  passageSlugs: z.array(z.string()).min(1).max(4),
});

export type Passage = z.infer<typeof PassageSchema>;
export type QuestionGroup = z.infer<typeof QuestionGroupSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type WritingTask = z.infer<typeof WritingTaskSchema>;
export type Template = z.infer<typeof TemplateSchema>;
