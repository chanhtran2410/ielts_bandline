import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { PassageSchema, type Passage } from '../content/schema';

/**
 * Generates Reading passages with question sets, one file per passage.
 *
 * Generation is the easy half. The hard half is that IELTS material fails in
 * specific ways — answers that are not in the passage, completion answers over
 * the stated word limit, headings reused across paragraphs — so nothing written
 * here is trusted. Every passage is validated before it is kept, and rejects
 * are retried with the failure fed back to the model.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/generate-content.ts --count 100
 *   ANTHROPIC_API_KEY=... npx tsx scripts/generate-content.ts --count 4 --band 6.5
 */

const OUT_DIR = join(process.cwd(), 'content', 'passages');
const MODEL = 'claude-sonnet-5';
const MAX_ATTEMPTS_PER_PASSAGE = 3;

/** Bands to spread generation across when no single band is requested. */
const BAND_SPREAD = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

const TOPICS = [
  'urban ecology', 'sleep science', 'language endangerment', 'archaeology',
  'behavioural economics', 'materials science', 'ocean currents', 'food history',
  'transport planning', 'antibiotic resistance', 'museum curation', 'birdsong',
  'renewable energy grids', 'memory and testimony', 'seed banks', 'desert farming',
  'cartography', 'volcanology', 'animal migration', 'public health history',
  'glass making', 'forensic science', 'coral restoration', 'clock making',
  'soil microbiology', 'dam engineering', 'colour perception', 'papermaking',
  'urban heat islands', 'whale acoustics', 'grain storage', 'lighthouse design',
];

const QUESTION_TYPE_MIXES = [
  ['matching_headings', 'summary_completion', 'true_false_not_given'],
  ['true_false_not_given', 'sentence_completion', 'multiple_choice'],
  ['matching_information', 'note_completion', 'yes_no_not_given'],
  ['matching_features', 'multiple_choice', 'short_answer'],
  ['matching_headings', 'table_completion', 'multiple_choice'],
  ['yes_no_not_given', 'flow_chart_completion', 'matching_features'],
  ['true_false_not_given', 'diagram_label', 'summary_completion'],
];

function buildPrompt(band: number, topic: string, types: string[], slug: string): string {
  return [
    `Write one IELTS Academic Reading passage and its question set.`,
    ``,
    `Constraints that are not negotiable:`,
    `- Passage length: 700-900 words of continuous academic prose.`,
    `- 5 to 7 paragraphs, lettered A, B, C… with no gaps.`,
    `- Difficulty pitched at a Band ${band.toFixed(1)} candidate.`,
    `- Topic: ${topic}. Informative and factual in register, not persuasive.`,
    `- Exactly 13 questions total, split across these types: ${types.join(', ')}.`,
    ``,
    `Rules that generated material usually breaks — obey them exactly:`,
    `1. For completion and short-answer types, the answer MUST be a verbatim`,
    `   span copied from the passage. Do not paraphrase the answer.`,
    `2. The first entry of acceptedAnswers must fit maxWords. Put any longer`,
    `   variant (e.g. one carrying an article) after it.`,
    `3. The instruction text must state the same limit as maxWords, using the`,
    `   wording "NO MORE THAN TWO WORDS" / "ONE WORD ONLY" etc.`,
    `4. For matching_headings: give more headings than paragraphs so there are`,
    `   real distractors, and never let two paragraphs share a heading.`,
    `5. TRUE/FALSE/NOT GIVEN answers must be exactly "TRUE", "FALSE" or`,
    `   "NOT GIVEN"; YES/NO variants likewise. FALSE requires the passage to`,
    `   contradict the statement; NOT GIVEN means the passage is silent.`,
    `6. Every explanation must say WHY the answer is right and, where there is`,
    `   an obvious trap, why the tempting wrong answer is wrong.`,
    `7. skillIds must come from: scanning, inference, paraphrasing, main_idea.`,
    ``,
    `Return ONLY a JSON object matching this shape, with no commentary:`,
    `{`,
    `  "slug": "${slug}",`,
    `  "title": "...",`,
    `  "topic": "${topic}",`,
    `  "targetBand": ${band},`,
    `  "source": "ai_generated",`,
    `  "paragraphs": [{ "letter": "A", "text": "..." }],`,
    `  "groups": [{`,
    `    "type": "matching_headings",`,
    `    "position": 1,`,
    `    "heading": "Questions 1-5 · Matching Headings",`,
    `    "instruction": "...",`,
    `    "optionsTitle": "List of headings",`,
    `    "options": [{ "value": "i", "label": "..." }],`,
    `    "maxWords": null,`,
    `    "questions": [{`,
    `      "position": 1,`,
    `      "prompt": "Paragraph A",`,
    `      "acceptedAnswers": ["iii"],`,
    `      "skillIds": ["main_idea"],`,
    `      "explanation": "...",`,
    `      "evidenceParagraph": "A",`,
    `      "evidence": "..."`,
    `    }]`,
    `  }]`,
    `}`,
  ].join('\n');
}

/** Strips code fences and stray prose the model may wrap the JSON in. */
function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('no JSON object in response');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function generateOne(
  client: Anthropic,
  band: number,
  topic: string,
  types: string[],
  slug: string,
): Promise<Passage> {
  let feedback = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_PASSAGE; attempt += 1) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16_000,
      messages: [{ role: 'user', content: buildPrompt(band, topic, types, slug) + feedback }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    try {
      const parsed = PassageSchema.parse(extractJson(text));
      // Shape is right; scripts/validate-content.ts does the IELTS-rule pass
      // over the whole corpus afterwards, and is the real gate.
      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`    attempt ${attempt} rejected: ${message.slice(0, 200)}`);
      feedback =
        '\n\nYour previous attempt was rejected for this reason. Fix it and return only JSON:\n' +
        message.slice(0, 1500);
    }
  }
  throw new Error(`could not generate a valid passage for ${slug} after ${MAX_ATTEMPTS_PER_PASSAGE} attempts`);
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf('--' + name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Set ANTHROPIC_API_KEY. This script calls the model; nothing else does.');
    process.exit(1);
  }

  const count = Number(arg('count') ?? 10);
  const fixedBand = arg('band') ? Number(arg('band')) : undefined;
  const overwrite = process.argv.includes('--overwrite');

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const client = new Anthropic({ apiKey });

  let written = 0;
  let failed = 0;

  for (let i = 0; i < count; i += 1) {
    const band = fixedBand ?? BAND_SPREAD[i % BAND_SPREAD.length] ?? 6.5;
    const topic = TOPICS[i % TOPICS.length] ?? 'urban ecology';
    const types = QUESTION_TYPE_MIXES[i % QUESTION_TYPE_MIXES.length] ?? QUESTION_TYPE_MIXES[0]!;
    const slug =
      topic.replace(/\s+/g, '-') + '-b' + band.toFixed(1).replace('.', '') + '-' + String(i + 1).padStart(3, '0');
    const outPath = join(OUT_DIR, slug + '.json');

    if (existsSync(outPath) && !overwrite) {
      console.log(`[${i + 1}/${count}] ${slug} — exists, skipping`);
      continue;
    }

    console.log(`[${i + 1}/${count}] ${slug}  band ${band.toFixed(1)}  ${types.join('/')}`);
    try {
      const passage = await generateOne(client, band, topic, types, slug);
      writeFileSync(outPath, JSON.stringify(passage, null, 2) + '\n');
      written += 1;
      console.log(`    ✓ written`);
    } catch (error) {
      failed += 1;
      console.log(`    ✗ ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\n${written} written, ${failed} failed.`);
  console.log('Next: npm run content:validate   (nothing is seeded until this passes)');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
