-- ============================================================================
-- Learner data: profiles, attempts, submissions, mistakes, mastery, plans.
--
-- Every table here is owned by exactly one learner, and every table carries an
-- RLS policy keyed on auth.uid(). Without those policies any signed-in user
-- could read anyone else's essays, so they are not optional.
-- ============================================================================

create type attempt_status as enum ('in_progress', 'submitted', 'abandoned');
create type submission_status as enum ('draft', 'analyzing', 'analyzed', 'failed');
create type mistake_category as enum (
  'grammar', 'vocabulary', 'collocation', 'coherence', 'task_response', 'reading_strategy'
);
create type mastery_state as enum ('new', 'practising', 'nearly_resolved', 'mastered');
create type exam_horizon as enum ('within_4_weeks', 'about_8_weeks', 'three_months_plus', 'not_booked');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  name                    text not null default '',
  initials                text not null default '',
  target_band             numeric(2,1) not null default 6.5 check (target_band between 4.0 and 9.0),
  exam_horizon            exam_horizon not null default 'not_booked',
  exam_date               date,
  minutes_per_day         integer not null default 45 check (minutes_per_day between 5 and 480),
  focus_skills            text[] not null default '{}',
  -- The band the learner started at. Frozen after the diagnostic, because the
  -- whole progress narrative is measured against it.
  baseline_band           numeric(2,1),
  diagnostic_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reading attempts
-- ---------------------------------------------------------------------------

create table attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  template_slug    text not null,
  mode             test_mode not null,
  status           attempt_status not null default 'in_progress',
  started_at       timestamptz not null default now(),
  submitted_at     timestamptz,
  elapsed_seconds  integer not null default 0 check (elapsed_seconds >= 0)
);

create index attempts_user_idx on attempts (user_id, started_at desc);
create index attempts_open_idx on attempts (user_id) where status = 'in_progress';

-- Doubles as the autosave record: one row per answered question, upserted as
-- the learner works. Losing a tab therefore costs at most the debounce window.
create table attempt_answers (
  attempt_id         uuid not null references attempts (id) on delete cascade,
  question_id        uuid not null references questions (id) on delete cascade,
  answer             text,
  is_correct         boolean,
  flagged            boolean not null default false,
  time_spent_seconds integer not null default 0,
  updated_at         timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create table attempt_annotations (
  id               uuid primary key default gen_random_uuid(),
  attempt_id       uuid not null references attempts (id) on delete cascade,
  passage_slug     text not null,
  paragraph_letter text not null,
  start_offset     integer not null check (start_offset >= 0),
  end_offset       integer not null,
  quoted_text      text not null,
  note             text,
  created_at       timestamptz not null default now(),
  check (end_offset > start_offset)
);

create index attempt_annotations_attempt_idx on attempt_annotations (attempt_id);

create table attempt_results (
  attempt_id      uuid primary key references attempts (id) on delete cascade,
  raw_score       integer not null check (raw_score >= 0),
  total_questions integer not null check (total_questions > 0),
  estimated_band  numeric(2,1) not null check (estimated_band between 0 and 9),
  band_delta      numeric(3,1),
  summary         text not null default '',
  -- Aggregates are stored as computed, not recomputed on read: the numbers a
  -- learner saw must not silently change when the analysis logic is updated.
  question_types  jsonb not null default '[]',
  skills          jsonb not null default '[]',
  weakness        jsonb,
  submitted_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Writing
-- ---------------------------------------------------------------------------

create table submissions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  task_slug          text not null,
  draft_number       integer not null check (draft_number > 0),
  body               text not null default '',
  word_count         integer not null default 0,
  status             submission_status not null default 'draft',
  time_spent_seconds integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  submitted_at       timestamptz,
  unique (user_id, task_slug, draft_number)
);

create index submissions_user_idx on submissions (user_id, updated_at desc);

create table writing_feedback (
  submission_id    uuid primary key references submissions (id) on delete cascade,
  overall_band     numeric(2,1) not null check (overall_band between 0 and 9),
  headline         text not null default '',
  analysis_seconds integer not null default 0,
  -- The four CriterionFeedback objects, keyed by criterion.
  criteria         jsonb not null default '{}',
  issues           jsonb not null default '[]',
  ladders          jsonb not null default '[]',
  -- Which model produced this, so a scoring change can be traced.
  model            text,
  analyzed_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Error Bank
-- ---------------------------------------------------------------------------

create table mistake_patterns (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  category           mistake_category not null,
  title              text not null,
  rule               text not null,
  occurrence_count   integer not null default 0 check (occurrence_count >= 0),
  accuracy           integer not null default 0 check (accuracy between 0 and 100),
  baseline_accuracy  integer not null default 0 check (baseline_accuracy between 0 and 100),
  mastery            mastery_state not null default 'new',
  last_seen_at       timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  -- One pattern per title per learner, so occurrences aggregate instead of
  -- creating a new "pattern" every time the same mistake recurs.
  unique (user_id, title)
);

create index mistake_patterns_user_idx on mistake_patterns (user_id, accuracy);

create table mistakes (
  id          uuid primary key default gen_random_uuid(),
  pattern_id  uuid not null references mistake_patterns (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  original    text not null,
  correction  text not null,
  source      text not null default '',
  source_href text,
  occurred_at timestamptz not null default now()
);

create index mistakes_pattern_idx on mistakes (pattern_id, occurred_at desc);

create table mistake_practice_rounds (
  id          uuid primary key default gen_random_uuid(),
  pattern_id  uuid not null references mistake_patterns (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  correct     integer not null check (correct >= 0),
  total       integer not null check (total > 0),
  practised_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Mastery and plans
-- ---------------------------------------------------------------------------

create table skill_mastery (
  user_id      uuid not null references auth.users (id) on delete cascade,
  skill_id     text not null,
  accuracy     integer not null check (accuracy between 0 and 100),
  band         numeric(2,1) not null check (band between 0 and 9),
  sample_size  integer not null default 0 check (sample_size >= 0),
  measured_at  timestamptz not null default now(),
  primary key (user_id, skill_id)
);

-- Append-only, so trends are real history rather than a recomputed guess.
create table skill_mastery_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  skill_id    text not null,
  accuracy    integer not null check (accuracy between 0 and 100),
  recorded_at timestamptz not null default now()
);

create index skill_mastery_history_idx on skill_mastery_history (user_id, skill_id, recorded_at);

create table band_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  band       numeric(2,1) not null check (band between 0 and 9),
  label      text not null,
  kind       text not null check (kind in ('diagnostic', 'mock', 'current', 'projected', 'target')),
  recorded_on date not null default current_date
);

create index band_history_user_idx on band_history (user_id, recorded_on);

create table study_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  plan_date     date not null default current_date,
  total_minutes integer not null default 0,
  unique (user_id, plan_date)
);

create table study_tasks (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references study_plans (id) on delete cascade,
  position        integer not null,
  title           text not null,
  kind            text not null,
  minutes         integer not null check (minutes > 0),
  completed       boolean not null default false,
  href            text not null,
  target_skill_id text,
  rationale       text not null default '',
  unique (plan_id, position)
);

create table coach_messages (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  role                  text not null check (role in ('user', 'coach')),
  paragraphs            jsonb not null default '[]',
  recommendations       jsonb not null default '[]',
  recommendations_after integer not null default 0,
  created_at            timestamptz not null default now()
);

create index coach_messages_user_idx on coach_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table profiles                enable row level security;
alter table attempts                enable row level security;
alter table attempt_answers         enable row level security;
alter table attempt_annotations     enable row level security;
alter table attempt_results         enable row level security;
alter table submissions             enable row level security;
alter table writing_feedback        enable row level security;
alter table mistake_patterns        enable row level security;
alter table mistakes                enable row level security;
alter table mistake_practice_rounds enable row level security;
alter table skill_mastery           enable row level security;
alter table skill_mastery_history   enable row level security;
alter table band_history            enable row level security;
alter table study_plans             enable row level security;
alter table study_tasks             enable row level security;
alter table coach_messages          enable row level security;

-- Tables with a direct user_id: one policy covers every operation.
create policy "own rows" on profiles                for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own rows" on attempts                for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on submissions             for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on mistake_patterns        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on mistakes                for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on mistake_practice_rounds for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on skill_mastery           for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on skill_mastery_history   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on band_history            for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on study_plans             for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on coach_messages          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables reach the owner through their parent.
create policy "own rows" on attempt_answers for all
  using (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "own rows" on attempt_annotations for all
  using (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "own rows" on attempt_results for all
  using (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "own rows" on writing_feedback for all
  using (exists (select 1 from submissions s where s.id = submission_id and s.user_id = auth.uid()))
  with check (exists (select 1 from submissions s where s.id = submission_id and s.user_id = auth.uid()));

create policy "own rows" on study_tasks for all
  using (exists (select 1 from study_plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from study_plans p where p.id = plan_id and p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Create a profile automatically on signup, so no screen has to cope with a
-- signed-in user who has no profile row.
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data ->> 'name', new.email), 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keep updated_at honest without the client having to remember.
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch    before update on profiles    for each row execute function touch_updated_at();
create trigger submissions_touch before update on submissions for each row execute function touch_updated_at();
