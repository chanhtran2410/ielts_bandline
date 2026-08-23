import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PassageSchema, type Passage, type QuestionGroup, type Question } from '../content/schema';
import { countWords } from './content-lib';

/**
 * Imports the CC BY 4.0 reading datasets from LuchoBazz/ielts-ai-dataset into
 * this project's content format.
 *
 * The source is genuinely licensed for commercial reuse and adaptation, but its
 * shape differs from ours in ways that matter:
 *
 *  - Passages are one text blob. Matching-headings questions need lettered
 *    paragraphs, so we letter them on import by splitting on blank lines.
 *  - Option pools live on the question, not the group.
 *  - There are no explanations at all. We import `explanation` as absent rather
 *    than inventing reasoning. Explanations must be written by hand or generated
 *    and reviewed; there is no honest shortcut.
 *  - Type names are hyphenated and include one type we render differently.
 *
 * Usage: npx tsx scripts/import-ielts-ai-dataset.ts .scratch/ext
 */

const ATTRIBUTION = 'LuchoBazz / ielts-ai-dataset';
const LICENSE = 'CC-BY-4.0';
const SOURCE_URL = 'https://github.com/LuchoBazz/ielts-ai-dataset';

const OUT_DIR = join(process.cwd(), 'content', 'passages');

/** Their hyphenated names, mapped onto our question_type enum. */
const TYPE_MAP: Record<string, Question extends never ? never : string> = {
  'multiple-choice': 'multiple_choice',
  'true-false-not-given': 'true_false_not_given',
  'yes-no-not-given': 'yes_no_not_given',
  'matching-headings': 'matching_headings',
  'matching-information': 'matching_information',
  'matching-features': 'matching_features',
  // Not a separate type for us: the learner picks from a shared pool, which is
  // exactly the matching_features interaction. Noted rather than silently lost.
  'matching-sentence-endings': 'matching_features',
  'sentence-completion': 'sentence_completion',
  'summary-completion': 'summary_completion',
  'note-completion': 'note_completion',
  'table-completion': 'table_completion',
  'flow-chart-completion': 'flow_chart_completion',
  'diagram-label': 'diagram_label',
  'short-answer': 'short_answer',
};

const VERBATIM = new Set([
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label',
  'short_answer',
]);

const POOL_DRIVEN = new Set(['matching_headings', 'matching_information', 'matching_features']);

interface SourceQuestion {
  question_order: number;
  text: string;
  answer?: string;
  accepted_answers?: string[];
  options?: unknown;
  matching_pairs?: unknown;
  completion_gaps?: unknown;
}

interface SourceGroup {
  group_order: number;
  question_type: string;
  instructions: string;
  word_limit?: number | string | null;
  has_word_bank?: boolean;
  word_bank?: unknown;
  questions?: SourceQuestion[];
}

interface SourcePassage {
  passage_number: number;
  title: string;
  content: string;
  question_groups?: SourceGroup[];
  groups?: SourceGroup[];
}

interface SourceTest {
  title?: string;
  difficulty?: string;
  test_type?: string;
  passages: SourcePassage[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '');
}

/**
 * Splits a passage blob into lettered paragraphs.
 *
 * Prefers blank-line breaks; falls back to single newlines. If the result would
 * exceed the 9 letters our schema allows, trailing paragraphs are merged into
 * the last one rather than dropped, so no passage text is lost.
 */
function toLetteredParagraphs(content: string): { letter: string; text: string }[] {
  const byBlankLine = content.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  let parts = byBlankLine.length >= 4 ? byBlankLine : content.split(/\n/).map((s) => s.trim()).filter(Boolean);

  // Strip any letter prefix the source already carries, so we do not double it.
  parts = parts.map((p) => p.replace(/^\(?([A-H])\)?[.)\s]+(?=[A-Z])/, ''));

  const MAX = 9;
  if (parts.length > MAX) {
    const head = parts.slice(0, MAX - 1);
    head.push(parts.slice(MAX - 1).join(' '));
    parts = head;
  }

  return parts.map((text, i) => ({ letter: String.fromCharCode(65 + i), text }));
}

function parseWordLimit(raw: SourceGroup['word_limit']): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/\D/g, ''));
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : undefined;
}

/** Word limit stated in the instruction, when the field is absent. */
function limitFromInstruction(instruction: string): number | undefined {
  const words = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
  const upper = instruction.toUpperCase();
  for (let i = 0; i < words.length; i += 1) {
    if (upper.includes(words[i] + ' WORD')) return i + 1;
  }
  return undefined;
}

function normaliseOptions(raw: unknown): { value: string; label: string }[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const options = raw
    .map((entry, i) => {
      if (typeof entry === 'string') {
        // "iii. The economic case" or "A) Something"
        const m = /^\(?([A-Za-z]{1,4}|[ivxIVX]{1,5})\)?[.)]\s*(.+)$/.exec(entry.trim());
        if (m?.[1] && m[2]) return { value: m[1], label: m[2] };
        return { value: String.fromCharCode(65 + i), label: entry.trim() };
      }
      if (entry && typeof entry === 'object') {
        const o = entry as Record<string, unknown>;
        const value = o.value ?? o.key ?? o.letter ?? o.id ?? String.fromCharCode(65 + i);
        const label = o.label ?? o.text ?? o.heading ?? o.ending ?? o.feature ?? value;
        return { value: String(value), label: String(label) };
      }
      return null;
    })
    .filter((o): o is { value: string; label: string } => o !== null && o.label.length > 0);

  return options.length >= 2 ? options : undefined;
}

const TFNG = [
  { value: 'TRUE', label: 'True' },
  { value: 'FALSE', label: 'False' },
  { value: 'NOT GIVEN', label: 'Not Given' },
];
const YNNG = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
  { value: 'NOT GIVEN', label: 'Not Given' },
];

/**
 * Coerces one accepted-answer entry to text. Short-answer items sometimes
 * arrive as `{ id, text }` rather than a bare string.
 */
function answerText(entry: unknown): string {
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'number') return String(entry);
  if (entry && typeof entry === 'object') {
    const o = entry as Record<string, unknown>;
    const value = o.text ?? o.answer ?? o.value ?? o.label;
    if (typeof value === 'string') return value;
  }
  return '';
}

/** Keeps the canonical answer first and within the word limit. */
function orderAnswers(accepted: unknown[], maxWords: number | undefined): string[] {
  const unique = [...new Set(accepted.map((a) => answerText(a).trim()).filter(Boolean))];
  if (maxWords === undefined) return unique;
  const fits = unique.filter((a) => countWords(a) <= maxWords);
  const rest = unique.filter((a) => countWords(a) > maxWords);
  return [...fits, ...rest];
}

function skillsFor(type: string): string[] {
  if (type === 'matching_headings') return ['main_idea', 'paraphrasing'];
  if (type === 'true_false_not_given' || type === 'yes_no_not_given') return ['inference', 'scanning'];
  if (type === 'multiple_choice') return ['main_idea', 'paraphrasing'];
  if (VERBATIM.has(type)) return ['scanning'];
  return ['scanning', 'paraphrasing'];
}

interface Skipped {
  where: string;
  reason: string;
}

function convertGroup(
  source: SourceGroup,
  position: number,
  letters: string[],
  skipped: Skipped[],
): QuestionGroup | null {
  const type = TYPE_MAP[source.question_type];
  if (!type) {
    skipped.push({ where: `group ${source.group_order}`, reason: `unknown type "${source.question_type}"` });
    return null;
  }

  const maxWords = VERBATIM.has(type)
    ? (parseWordLimit(source.word_limit) ?? limitFromInstruction(source.instructions) ?? 2)
    : undefined;

  const groupOptions =
    type === 'true_false_not_given'
      ? TFNG
      : type === 'yes_no_not_given'
        ? YNNG
        : normaliseOptions(source.word_bank) ??
          // A matching pool is often repeated on every question; the first one
          // is representative, so it becomes the group pool.
          normaliseOptions((source.questions ?? []).find((q) => q.options)?.options) ??
          // "Which paragraph contains…" has no explicit pool in the source
          // because the pool *is* the paragraph list. Build it from the letters
          // we assigned, rather than treating the group as unusable.
          (type === 'matching_information'
            ? letters.map((letter) => ({ value: letter, label: 'Paragraph ' + letter }))
            : undefined);

  const questions: Question[] = [];
  for (const [i, q] of (source.questions ?? []).entries()) {
    const accepted = orderAnswers(
      q.accepted_answers && q.accepted_answers.length > 0
        ? q.accepted_answers
        : q.answer
          ? [q.answer]
          : [],
      maxWords,
    );

    if (accepted.length === 0) {
      // Seen in the source on table-completion groups whose gaps carry column
      // headers instead of answers. Ungradeable, so it cannot be imported.
      skipped.push({ where: `group ${source.group_order} q${q.question_order}`, reason: 'no answer' });
      continue;
    }

    // A prompt outside these bounds is a structural problem, not a wording one:
    // usually a whole summary blob dumped into one question. Drop the question
    // rather than the passage, so one malformed item costs the least possible.
    const prompt = q.text.trim();
    if (prompt.length < 5 || prompt.length > 600) {
      skipped.push({
        where: `group ${source.group_order} q${q.question_order}`,
        reason: `prompt is ${prompt.length} chars (needs 5–600)`,
      });
      continue;
    }

    const perQuestion = normaliseOptions(q.options);
    // Matching types read their pool from the group; keeping a duplicate on the
    // question would make the renderer print the pool twice.
    const options = POOL_DRIVEN.has(type) ? undefined : perQuestion;

    const question: Question = {
      position: i + 1,
      prompt,
      acceptedAnswers: accepted,
      skillIds: skillsFor(type),
      // Deliberately absent. The source has no reasoning, and a placeholder
      // would read as teaching while teaching nothing.
      explanation: '',
      ...(options ? { options } : {}),
    };
    questions.push(question);
  }

  if (questions.length === 0) return null;

  // Matching headings needs distractors; if the pool is not bigger than the
  // question count the group is unusable as written.
  if (type === 'matching_headings' && (groupOptions?.length ?? 0) <= questions.length) {
    skipped.push({
      where: `group ${source.group_order}`,
      reason: `matching_headings pool (${groupOptions?.length ?? 0}) not larger than ${questions.length} questions`,
    });
    return null;
  }

  // Prompts like "Paragraph C" must refer to a letter we actually created.
  if (POOL_DRIVEN.has(type)) {
    for (const q of questions) {
      const m = /^paragraph\s+([A-H])/i.exec(q.prompt);
      if (m?.[1] && !letters.includes(m[1].toUpperCase())) {
        skipped.push({
          where: `group ${source.group_order}`,
          reason: `refers to paragraph ${m[1]} but the passage only has ${letters.join('')}`,
        });
        return null;
      }
    }
  }

  const group: QuestionGroup = {
    type: type as QuestionGroup['type'],
    position,
    heading: `Questions · ${source.question_type.replace(/-/g, ' ')}`,
    instruction: source.instructions.trim(),
    questions,
    ...(groupOptions ? { options: groupOptions } : {}),
    ...(maxWords !== undefined ? { maxWords } : {}),
    ...(POOL_DRIVEN.has(type) ? { optionsTitle: 'List of options' } : {}),
  };
  return group;
}

function bandOf(test: SourceTest, fallback: number): number {
  const fromTitle = /band[_\s-]?(\d(?:\.\d)?)/i.exec(test.title ?? '')?.[1];
  const n = Number(fromTitle ?? test.difficulty);
  return Number.isFinite(n) && n >= 4 && n <= 9 ? n : fallback;
}

function main(): void {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: npx tsx scripts/import-ielts-ai-dataset.ts <dir-of-downloaded-json>');
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f.includes('reading'));
  const skipped: Skipped[] = [];
  let written = 0;
  let missingExplanations = 0;
  let shortPassages = 0;

  for (const file of files) {
    const test = JSON.parse(readFileSync(join(dir, file), 'utf8')) as SourceTest;
    const band = bandOf(test, 7.0);

    for (const sourcePassage of test.passages) {
      const paragraphs = toLetteredParagraphs(sourcePassage.content);
      const letters = paragraphs.map((p) => p.letter);
      const sourceGroups = sourcePassage.question_groups ?? sourcePassage.groups ?? [];

      const groups: QuestionGroup[] = [];
      for (const sg of sourceGroups) {
        const converted = convertGroup(sg, groups.length + 1, letters, skipped);
        if (converted) groups.push(converted);
      }

      if (groups.length < 2) {
        skipped.push({ where: sourcePassage.title, reason: `only ${groups.length} usable group(s)` });
        continue;
      }

      const words = countWords(paragraphs.map((p) => p.text).join(' '));
      if (words < 650) shortPassages += 1;

      const candidate: Passage = {
        slug: slugify(sourcePassage.title) + '-b' + String(band).replace('.', ''),
        title: sourcePassage.title.trim(),
        topic: 'imported',
        targetBand: band,
        source: 'licensed',
        paragraphs,
        groups,
      };

      const parsed = PassageSchema.safeParse(candidate);
      if (!parsed.success) {
        skipped.push({
          where: sourcePassage.title,
          reason: parsed.error.issues.slice(0, 2).map((i) => i.path.join('.') + ': ' + i.message).join('; '),
        });
        continue;
      }

      missingExplanations += groups.flatMap((g) => g.questions).length;
      writeFileSync(
        join(OUT_DIR, parsed.data.slug + '.json'),
        JSON.stringify(
          { ...parsed.data, attribution: ATTRIBUTION, license: LICENSE, sourceUrl: SOURCE_URL },
          null,
          2,
        ) + '\n',
      );
      written += 1;
      console.log(`  ✓ ${parsed.data.slug}  band ${band.toFixed(1)}  ${words}w  ${groups.length} groups`);
    }
  }

  console.log('');
  console.log(`imported passages      ${written}`);
  console.log(`short of 650 words     ${shortPassages}`);
  console.log(`questions needing WHY  ${missingExplanations}`);
  console.log(`skipped                ${skipped.length}`);
  for (const s of skipped.slice(0, 25)) console.log(`  - ${s.where}: ${s.reason}`);
  if (skipped.length > 25) console.log(`  … and ${skipped.length - 25} more`);
}

main();
