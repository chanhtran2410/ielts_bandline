import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PassageSchema,
  POOL_TYPES,
  TemplateSchema,
  VERBATIM_TYPES,
  WritingTaskSchema,
  type Passage,
} from '../content/schema';
import { countWords, normalizeAnswer } from './content-lib';

/**
 * IELTS-specific validation for authored and generated content.
 *
 * The Zod schema checks shape. This checks *correctness against the passage* —
 * the things generated material actually gets wrong, and the things that would
 * mark a learner wrong for giving the right answer.
 */

const CONTENT_DIR = join(process.cwd(), 'content');
const PASSAGE_DIR = join(CONTENT_DIR, 'passages');

/** Academic Reading passages run roughly 700–950 words each. */
const MIN_PASSAGE_WORDS = 650;
const MAX_PASSAGE_WORDS = 1000;
/** A full paper is 40 questions over 3 passages, so ~13 each. */
const MIN_QUESTIONS = 11;
const MAX_QUESTIONS = 16;

interface Problem {
  file: string;
  where: string;
  message: string;
  /** `error` blocks seeding; `warn` is reported and allowed through. */
  level: 'error' | 'warn';
}

function passageText(passage: Passage): string {
  return passage.paragraphs.map((p) => p.text).join('\n\n');
}

function checkPassage(file: string, passage: Passage): Problem[] {
  const problems: Problem[] = [];
  const add = (where: string, message: string, level: Problem['level'] = 'error') =>
    problems.push({ file, where, message, level });

  const full = passageText(passage);
  const words = countWords(full);
  const haystack = normalizeAnswer(full);

  if (words < MIN_PASSAGE_WORDS) {
    add('passage', `only ${words} words — Academic Reading needs ${MIN_PASSAGE_WORDS}+`);
  } else if (words > MAX_PASSAGE_WORDS) {
    add('passage', `${words} words is longer than a real passage`, 'warn');
  }

  // Paragraph letters must be A, B, C… with no gaps, or matching tasks break.
  passage.paragraphs.forEach((p, i) => {
    const expected = String.fromCharCode(65 + i);
    if (p.letter !== expected) add('paragraphs', `expected ${expected}, found ${p.letter}`);
  });

  const allQuestions = passage.groups.flatMap((g) => g.questions);
  if (allQuestions.length < MIN_QUESTIONS || allQuestions.length > MAX_QUESTIONS) {
    add('questions', `${allQuestions.length} questions — expected ${MIN_QUESTIONS}–${MAX_QUESTIONS}`);
  }

  for (const group of passage.groups) {
    const at = `group ${group.position} (${group.type})`;

    // Positions must be contiguous from 1 so assembled numbering has no holes.
    const positions = group.questions.map((q) => q.position).sort((a, b) => a - b);
    positions.forEach((pos, i) => {
      if (pos !== i + 1) add(at, `question positions must run 1..n, found ${positions.join(',')}`);
    });

    const poolValues = new Set((group.options ?? []).map((o) => o.value));
    const isPool = (POOL_TYPES as readonly string[]).includes(group.type);
    const isVerbatim = (VERBATIM_TYPES as readonly string[]).includes(group.type);

    if (isPool && poolValues.size === 0 && !group.questions.some((q) => q.options)) {
      add(at, 'needs an option pool, or per-question options');
    }
    if (isVerbatim && group.maxWords === undefined) {
      add(at, 'completion questions need maxWords to match their instruction');
    }

    // The instruction must agree with maxWords, or the learner is misled.
    if (group.maxWords !== undefined) {
      const words = ['ONE WORD', 'TWO WORDS', 'THREE WORDS', 'FOUR WORDS', 'FIVE WORDS'];
      const expected = words[group.maxWords - 1];
      if (expected && !group.instruction.toUpperCase().includes(expected)) {
        add(at, `maxWords=${group.maxWords} but instruction does not say "${expected}"`, 'warn');
      }
    }

    for (const q of group.questions) {
      const qAt = `${at} q${q.position}`;
      const options = q.options ?? group.options ?? [];
      const values = new Set(options.map((o) => o.value));

      if (q.acceptedAnswers.some((a) => a.trim() === '')) {
        add(qAt, 'has a blank accepted answer, which would mark an empty response correct');
      }

      // Choice answers must exist in the pool the learner can actually pick from.
      if ((isPool || group.type === 'multiple_choice') && values.size > 0) {
        for (const answer of q.acceptedAnswers) {
          if (!values.has(answer)) {
            add(qAt, `answer "${answer}" is not among the options [${[...values].join(', ')}]`);
          }
        }
      }

      if (group.type === 'true_false_not_given') {
        for (const a of q.acceptedAnswers) {
          if (!['TRUE', 'FALSE', 'NOT GIVEN'].includes(a)) {
            add(qAt, `"${a}" is not TRUE / FALSE / NOT GIVEN`);
          }
        }
      }
      if (group.type === 'yes_no_not_given') {
        for (const a of q.acceptedAnswers) {
          if (!['YES', 'NO', 'NOT GIVEN'].includes(a)) {
            add(qAt, `"${a}" is not YES / NO / NOT GIVEN`);
          }
        }
      }

      // The first accepted answer is the canonical one and must obey the limit.
      if (group.maxWords !== undefined) {
        const first = q.acceptedAnswers[0];
        if (first && countWords(first) > group.maxWords) {
          add(qAt, `canonical answer "${first}" exceeds the ${group.maxWords}-word limit`);
        }
      }

      // The check that catches hallucination: a completion answer has to be
      // liftable from the passage. If it is not in the text, it is invented.
      if (isVerbatim) {
        const found = q.acceptedAnswers.some((a) => haystack.includes(normalizeAnswer(a)));
        if (!found) {
          add(qAt, `no accepted answer appears in the passage: [${q.acceptedAnswers.join(' | ')}]`);
        }
      }

      if (q.evidenceParagraph) {
        const letters = new Set(passage.paragraphs.map((p) => p.letter));
        if (!letters.has(q.evidenceParagraph)) {
          add(qAt, `cites paragraph ${q.evidenceParagraph}, which does not exist`);
        }
      }
    }

    // Matching Headings: one heading per paragraph, never reused, and the pool
    // must be larger than the number of questions so there are real distractors.
    if (group.type === 'matching_headings') {
      const used = group.questions.flatMap((q) => q.acceptedAnswers);
      const duplicates = used.filter((v, i) => used.indexOf(v) !== i);
      if (duplicates.length > 0) {
        add(at, `heading(s) reused across paragraphs: ${[...new Set(duplicates)].join(', ')}`);
      }
      if (poolValues.size <= group.questions.length) {
        add(at, `pool of ${poolValues.size} for ${group.questions.length} questions leaves no distractors`);
      }
    }
  }

  // A paper that never asks for an opinion or an inference is not IELTS-like.
  const types = new Set(passage.groups.map((g) => g.type));
  if (types.size < 2) add('groups', 'only one question type — a passage should mix at least two', 'warn');

  return problems;
}

function main() {
  const problems: Problem[] = [];
  const passages: Passage[] = [];
  const slugs = new Set<string>();

  const files = readdirSync(PASSAGE_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No passages found in content/passages');
    process.exit(1);
  }

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(PASSAGE_DIR, file), 'utf8'));
    const parsed = PassageSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push({
          file,
          where: issue.path.join('.') || 'root',
          message: issue.message,
          level: 'error',
        });
      }
      continue;
    }
    if (slugs.has(parsed.data.slug)) {
      problems.push({ file, where: 'slug', message: `duplicate slug ${parsed.data.slug}`, level: 'error' });
    }
    slugs.add(parsed.data.slug);
    passages.push(parsed.data);
    problems.push(...checkPassage(file, parsed.data));
  }

  // Templates must only reference passages that exist.
  const templatesPath = join(CONTENT_DIR, 'templates.json');
  let templateCount = 0;
  try {
    const raw = JSON.parse(readFileSync(templatesPath, 'utf8')) as unknown[];
    for (const entry of raw) {
      const parsed = TemplateSchema.safeParse(entry);
      if (!parsed.success) {
        problems.push({
          file: 'templates.json',
          where: 'root',
          message: parsed.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; '),
          level: 'error',
        });
        continue;
      }
      templateCount += 1;
      for (const slug of parsed.data.passageSlugs) {
        if (!slugs.has(slug)) {
          problems.push({
            file: 'templates.json',
            where: parsed.data.slug,
            message: `references unknown passage "${slug}"`,
            level: 'error',
          });
        }
      }
    }
  } catch {
    problems.push({ file: 'templates.json', where: 'file', message: 'missing or unreadable', level: 'error' });
  }

  let taskCount = 0;
  try {
    const raw = JSON.parse(readFileSync(join(CONTENT_DIR, 'writing-tasks.json'), 'utf8')) as unknown[];
    for (const entry of raw) {
      const parsed = WritingTaskSchema.safeParse(entry);
      if (!parsed.success) {
        problems.push({
          file: 'writing-tasks.json',
          where: 'root',
          message: parsed.error.issues.map((i) => i.message).join('; '),
          level: 'error',
        });
      } else {
        taskCount += 1;
      }
    }
  } catch {
    problems.push({ file: 'writing-tasks.json', where: 'file', message: 'missing', level: 'warn' });
  }

  const errors = problems.filter((p) => p.level === 'error');
  const warnings = problems.filter((p) => p.level === 'warn');

  for (const p of [...errors, ...warnings]) {
    const tag = p.level === 'error' ? 'ERROR' : 'warn ';
    console.log(`${tag}  ${p.file} › ${p.where}: ${p.message}`);
  }

  const bands = passages.map((p) => p.targetBand).sort((a, b) => a - b);
  const byBand = bands.reduce<Record<string, number>>((acc, b) => {
    acc[b.toFixed(1)] = (acc[b.toFixed(1)] ?? 0) + 1;
    return acc;
  }, {});

  console.log('');
  console.log(`passages         ${passages.length}`);
  console.log(`questions        ${passages.reduce((n, p) => n + p.groups.flatMap((g) => g.questions).length, 0)}`);
  console.log(`templates        ${templateCount}`);
  console.log(`writing tasks    ${taskCount}`);
  console.log(`band coverage    ${Object.entries(byBand).map(([b, n]) => `${b}:${n}`).join('  ')}`);
  console.log(`types covered    ${new Set(passages.flatMap((p) => p.groups.map((g) => g.type))).size}/13`);
  console.log('');
  console.log(errors.length === 0 ? `PASS (${warnings.length} warnings)` : `FAIL — ${errors.length} errors`);

  process.exit(errors.length === 0 ? 0 : 1);
}

main();
