import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PassageSchema,
  TemplateSchema,
  WritingTaskSchema,
  type Passage,
  type Template,
  type WritingTask,
} from '../content/schema';
import { countWords, pgRest, requireSupabaseConfig, type SupabaseConfig } from './content-lib';

/**
 * Seeds content into Supabase.
 *
 * Idempotent: everything is keyed on a slug and upserted, so running this twice
 * updates rather than duplicates. Child rows (paragraphs, groups, questions)
 * are replaced wholesale for a passage, because a regenerated passage may have
 * a different number of them.
 */

const CONTENT_DIR = join(process.cwd(), 'content');

interface Row {
  id: string;
  slug: string;
}

async function seedPassage(config: SupabaseConfig, passage: Passage): Promise<void> {
  const wordCount = countWords(passage.paragraphs.map((p) => p.text).join(' '));

  const [row] = await pgRest<Row[]>(config, 'passages?on_conflict=slug', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: [
      {
        slug: passage.slug,
        title: passage.title,
        topic: passage.topic,
        word_count: wordCount,
        target_band: passage.targetBand,
        source: passage.source,
      },
    ],
  });
  if (!row) throw new Error('upsert returned no row for ' + passage.slug);

  // Replace children: a regenerated passage can change their shape entirely.
  await pgRest(config, 'passage_paragraphs?passage_id=eq.' + row.id, { method: 'DELETE' });
  await pgRest(config, 'question_groups?passage_id=eq.' + row.id, { method: 'DELETE' });

  await pgRest(config, 'passage_paragraphs', {
    method: 'POST',
    body: passage.paragraphs.map((p, i) => ({
      passage_id: row.id,
      letter: p.letter,
      position: i + 1,
      body: p.text,
    })),
  });

  for (const group of passage.groups) {
    const [groupRow] = await pgRest<{ id: string }[]>(config, 'question_groups', {
      method: 'POST',
      prefer: 'return=representation',
      body: [
        {
          passage_id: row.id,
          type: group.type,
          position: group.position,
          heading: group.heading,
          instruction: group.instruction,
          options_title: group.optionsTitle ?? null,
          options: group.options ?? null,
          max_words: group.maxWords ?? null,
        },
      ],
    });
    if (!groupRow) throw new Error('group upsert failed in ' + passage.slug);

    await pgRest(config, 'questions', {
      method: 'POST',
      body: group.questions.map((q) => ({
        group_id: groupRow.id,
        position: q.position,
        prompt: q.prompt,
        options: q.options ?? null,
        accepted_answers: q.acceptedAnswers,
        skill_ids: q.skillIds,
        explanation: q.explanation,
        evidence_paragraph: q.evidenceParagraph ?? null,
        evidence: q.evidence ?? null,
      })),
    });
  }
}

async function seedTemplate(
  config: SupabaseConfig,
  template: Template,
  passageIds: Map<string, string>,
): Promise<void> {
  const [row] = await pgRest<Row[]>(config, 'test_templates?on_conflict=slug', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: [
      {
        slug: template.slug,
        title: template.title,
        kind: template.kind,
        mode: template.mode,
        duration_minutes: template.durationMinutes,
        target_band: template.targetBand ?? null,
        targeted_skill_id: template.targetedSkillId ?? null,
        only_types: template.onlyTypes ?? null,
      },
    ],
  });
  if (!row) throw new Error('template upsert failed: ' + template.slug);

  await pgRest(config, 'test_template_passages?template_id=eq.' + row.id, { method: 'DELETE' });
  await pgRest(config, 'test_template_passages', {
    method: 'POST',
    body: template.passageSlugs.map((slug, i) => {
      const passageId = passageIds.get(slug);
      if (!passageId) throw new Error(`template ${template.slug} references unknown passage ${slug}`);
      return { template_id: row.id, passage_id: passageId, position: i + 1 };
    }),
  });
}

async function seedWritingTasks(config: SupabaseConfig, tasks: WritingTask[]): Promise<void> {
  if (tasks.length === 0) return;
  await pgRest(config, 'writing_tasks?on_conflict=slug', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: tasks.map((t) => ({
      slug: t.slug,
      task: t.task,
      kind: t.kind,
      label: t.label,
      prompt: t.prompt,
      instruction: t.instruction,
      min_words: t.minWords,
      recommended_minutes: t.recommendedMinutes,
      target_band: t.targetBand ?? null,
      source: t.source,
    })),
  });
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

async function main(): Promise<void> {
  const config = requireSupabaseConfig();

  const files = readdirSync(join(CONTENT_DIR, 'passages')).filter((f) => f.endsWith('.json'));
  const passages = files.map((f) => PassageSchema.parse(readJson(join(CONTENT_DIR, 'passages', f))));

  console.log(`Seeding ${passages.length} passages…`);
  for (const passage of passages) {
    await seedPassage(config, passage);
    const questions = passage.groups.flatMap((g) => g.questions).length;
    console.log(`  ✓ ${passage.slug}  band ${passage.targetBand.toFixed(1)}  ${questions} questions`);
  }

  const rows = await pgRest<Row[]>(config, 'passages?select=id,slug');
  const passageIds = new Map(rows.map((r) => [r.slug, r.id]));

  const templates = readJson<unknown[]>(join(CONTENT_DIR, 'templates.json')).map((t) =>
    TemplateSchema.parse(t),
  );
  console.log(`Seeding ${templates.length} test templates…`);
  for (const template of templates) {
    await seedTemplate(config, template, passageIds);
    console.log(`  ✓ ${template.slug}  (${template.mode})`);
  }

  const tasks = readJson<unknown[]>(join(CONTENT_DIR, 'writing-tasks.json')).map((t) =>
    WritingTaskSchema.parse(t),
  );
  console.log(`Seeding ${tasks.length} writing tasks…`);
  await seedWritingTasks(config, tasks);

  console.log('\nDone.');
}

main().catch((error: unknown) => {
  console.error('\nSeeding failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
