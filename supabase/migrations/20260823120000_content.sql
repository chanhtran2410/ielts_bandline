-- ============================================================================
-- Content: passages, questions and test templates.
--
-- This is shared, read-only material. It is not owned by any learner, so it is
-- readable by everyone and writable only through the service role (the seeding
-- pipeline and any future CMS).
--
-- Design note on question numbering: a question stores its `position` inside
-- its group, never the number printed on the paper. The paper number is
-- assigned when a test is assembled, which is what lets one passage appear in
-- a drill, a practice session and a full mock without renumbering.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type question_type as enum (
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
  'short_answer'
);

create type test_kind as enum ('reading_passage', 'reading_full', 'skill_drill', 'mistake_drill');
create type test_mode as enum ('practice', 'mock', 'diagnostic');
create type content_source as enum ('ai_generated', 'authored', 'licensed');

-- ---------------------------------------------------------------------------
-- Passages
-- ---------------------------------------------------------------------------

create table passages (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  topic         text not null,
  word_count    integer not null check (word_count > 0),
  -- Which band this passage is pitched at, so selection can match difficulty
  -- to the learner instead of serving everything to everyone.
  target_band   numeric(2,1) not null check (target_band between 4.0 and 9.0),
  source        content_source not null default 'ai_generated',
  -- Set once a human with IELTS expertise has signed the passage off. Until
  -- then it is generated text and must not be presented as exam-standard.
  reviewed_at   timestamptz,
  reviewed_by   text,
  created_at    timestamptz not null default now()
);

create index passages_target_band_idx on passages (target_band);
create index passages_reviewed_idx on passages (reviewed_at) where reviewed_at is not null;

comment on column passages.reviewed_at is
  'Null means the passage is unreviewed AI output. Production selection should prefer reviewed passages.';

create table passage_paragraphs (
  passage_id  uuid not null references passages (id) on delete cascade,
  letter      text not null check (letter ~ '^[A-Z]$'),
  position    integer not null check (position > 0),
  body        text not null,
  primary key (passage_id, letter),
  unique (passage_id, position)
);

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------

create table question_groups (
  id             uuid primary key default gen_random_uuid(),
  passage_id     uuid not null references passages (id) on delete cascade,
  type           question_type not null,
  position       integer not null check (position > 0),
  heading        text not null,
  instruction    text not null,
  options_title  text,
  -- [{ "value": "iii", "label": "The economic case for urban forests" }]
  options        jsonb,
  -- Ceiling for completion types: "NO MORE THAN TWO WORDS" is 2.
  max_words      integer check (max_words between 1 and 5),
  unique (passage_id, position)
);

create index question_groups_passage_idx on question_groups (passage_id);
create index question_groups_type_idx on question_groups (type);

create table questions (
  id                  uuid primary key default gen_random_uuid(),
  group_id            uuid not null references question_groups (id) on delete cascade,
  position            integer not null check (position > 0),
  prompt              text not null,
  -- Per-question options override the group pool (multiple choice needs this).
  options             jsonb,
  -- Any one of these is accepted. The first must satisfy the group word limit.
  accepted_answers    text[] not null check (array_length(accepted_answers, 1) > 0),
  skill_ids           text[] not null check (array_length(skill_ids, 1) > 0),
  explanation         text not null,
  evidence_paragraph  text,
  evidence            text,
  unique (group_id, position)
);

create index questions_group_idx on questions (group_id);

-- ---------------------------------------------------------------------------
-- Test templates
-- ---------------------------------------------------------------------------

create table test_templates (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  kind               test_kind not null,
  mode               test_mode not null,
  duration_minutes   integer check (duration_minutes > 0),
  target_band        numeric(2,1) check (target_band between 4.0 and 9.0),
  -- Set when the template exists to attack one weakness.
  targeted_skill_id  text,
  -- Restricts the template to these question types, for skill drills.
  only_types         question_type[],
  created_at         timestamptz not null default now()
);

create index test_templates_mode_idx on test_templates (mode);
create index test_templates_band_idx on test_templates (target_band);

create table test_template_passages (
  template_id  uuid not null references test_templates (id) on delete cascade,
  passage_id   uuid not null references passages (id) on delete cascade,
  position     integer not null check (position > 0),
  primary key (template_id, passage_id),
  unique (template_id, position)
);

-- ---------------------------------------------------------------------------
-- Writing tasks (also shared content)
-- ---------------------------------------------------------------------------

create table writing_tasks (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  task                smallint not null check (task in (1, 2)),
  kind                text not null,
  label               text not null,
  prompt              text not null,
  instruction         text not null,
  min_words           integer not null check (min_words > 0),
  recommended_minutes integer not null check (recommended_minutes > 0),
  target_band         numeric(2,1) check (target_band between 4.0 and 9.0),
  source              content_source not null default 'ai_generated',
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: content is readable by everyone, writable only by the service role.
-- ---------------------------------------------------------------------------

alter table passages              enable row level security;
alter table passage_paragraphs    enable row level security;
alter table question_groups       enable row level security;
alter table questions             enable row level security;
alter table test_templates        enable row level security;
alter table test_template_passages enable row level security;
alter table writing_tasks         enable row level security;

create policy "content readable by all" on passages              for select using (true);
create policy "content readable by all" on passage_paragraphs    for select using (true);
create policy "content readable by all" on question_groups       for select using (true);
create policy "content readable by all" on test_templates        for select using (true);
create policy "content readable by all" on test_template_passages for select using (true);
create policy "content readable by all" on writing_tasks         for select using (true);

-- Questions are readable too, but note what this means: `accepted_answers` and
-- `explanation` ship to the browser. That is fine for practice mode, which
-- shows explanations anyway. Mock mode must not fetch them — see
-- reading_test_for_mode() below, which strips them server-side.
create policy "questions readable by all" on questions for select using (true);

-- ---------------------------------------------------------------------------
-- Assembly: turn a template into a numbered test.
--
-- Doing this in the database keeps paper numbering in one place, and lets mock
-- mode withhold answers without trusting the client to ignore them.
-- ---------------------------------------------------------------------------

create or replace function reading_test_for_mode(
  template_slug text,
  include_answers boolean default true
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with tmpl as (
    select * from test_templates where slug = template_slug
  ),
  ordered_passages as (
    select p.*, ttp.position as passage_position
    from tmpl
    join test_template_passages ttp on ttp.template_id = tmpl.id
    join passages p on p.id = ttp.passage_id
    order by ttp.position
  ),
  ordered_groups as (
    select
      g.*,
      op.passage_position,
      row_number() over (order by op.passage_position, g.position) as group_rank
    from ordered_passages op
    join question_groups g on g.passage_id = op.id
    -- Joined rather than sub-selected: `= any (subquery)` is read as the row
    -- form and fails to match against an array column.
    cross join tmpl t
    where t.only_types is null or g.type = any (t.only_types)
  ),
  numbered as (
    select
      q.*,
      og.id   as grp_id,
      og.type as grp_type,
      row_number() over (order by og.group_rank, q.position) as paper_number
    from ordered_groups og
    join questions q on q.group_id = og.id
  )
  select jsonb_build_object(
    'id', tmpl.slug,
    'title', tmpl.title,
    'kind', tmpl.kind,
    'mode', tmpl.mode,
    'durationMinutes', tmpl.duration_minutes,
    'targetedSkillId', tmpl.targeted_skill_id,
    'questionCount', (select count(*) from numbered),
    'passages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', op.slug,
        'order', op.passage_position,
        'title', op.title,
        'wordCount', op.word_count,
        'paragraphs', (
          select jsonb_agg(jsonb_build_object('letter', pp.letter, 'text', pp.body) order by pp.position)
          from passage_paragraphs pp where pp.passage_id = op.id
        )
      ) order by op.passage_position), '[]'::jsonb)
      from ordered_passages op
    ),
    'groups', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', og.id,
        'type', og.type,
        'passageId', (select slug from passages where id = og.passage_id),
        'heading', og.heading,
        'instruction', og.instruction,
        'optionsTitle', og.options_title,
        'options', og.options,
        'maxWords', og.max_words,
        'questions', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', n.id,
            'number', n.paper_number,
            'type', og.type,
            'groupId', og.id,
            'prompt', n.prompt,
            'options', n.options,
            -- Withheld in mock mode: the client never receives the key.
            'acceptedAnswers', case when include_answers then to_jsonb(n.accepted_answers) else '[]'::jsonb end,
            'skillIds', to_jsonb(n.skill_ids),
            'explanation', case when include_answers then n.explanation else '' end,
            'evidenceParagraph', case when include_answers then n.evidence_paragraph else null end,
            'evidence', case when include_answers then n.evidence else null end
          ) order by n.paper_number), '[]'::jsonb)
          from numbered n where n.grp_id = og.id
        )
      ) order by og.group_rank), '[]'::jsonb)
      from ordered_groups og
    )
  )
  from tmpl;
$$;

comment on function reading_test_for_mode is
  'Assembles a template into the Test shape the frontend expects, numbering questions across passages. Pass include_answers => false for mock mode so the answer key never reaches the browser.';
