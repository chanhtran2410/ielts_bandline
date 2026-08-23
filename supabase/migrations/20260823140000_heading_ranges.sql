-- ============================================================================
-- Group headings must state the range they actually cover.
--
-- A heading is authored against the paper it was written for ("Questions 14-18
-- · Matching Headings"). Assembly renumbers questions from 1, so a drill or a
-- reordered mock left the heading contradicting the questions printed under it.
-- Nothing looks broken in that state, which is what makes it dangerous: the
-- learner reads it as somebody else's test.
--
-- Fixed here rather than in the stored heading, because the correct range
-- depends on how a passage is combined with others, not on the passage itself.
-- ============================================================================

create or replace function heading_with_range(heading text, first_number int, last_number int)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    -- Already carries a range: replace it.
    when heading ~ '^Questions?\s+\d' then
      regexp_replace(heading, '^Questions?\s+\d+\s*([–—-]\s*\d+)?', range_text)
    -- Carries none (imported content): prepend one, dropping any bare
    -- "Questions ·" prefix so we do not end up saying it twice.
    else
      range_text || ' · ' || regexp_replace(heading, '^Questions?\s*·\s*', '')
  end
  from (
    select case
      when first_number = last_number then 'Question ' || first_number
      else 'Questions ' || first_number || '–' || last_number
    end as range_text
  ) r;
$$;

comment on function heading_with_range is
  'Rewrites the question range printed in a group heading to match the numbers actually assigned during assembly.';

-- ---------------------------------------------------------------------------
-- Reassemble, now retitling each group.
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
    cross join tmpl t
    where t.only_types is null or g.type = any (t.only_types)
  ),
  numbered as (
    select
      q.*,
      og.id   as grp_id,
      row_number() over (order by og.group_rank, q.position) as paper_number
    from ordered_groups og
    join questions q on q.group_id = og.id
  ),
  group_ranges as (
    select grp_id, min(paper_number)::int as first_number, max(paper_number)::int as last_number
    from numbered group by grp_id
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
        'attribution', op.attribution,
        'license', op.license,
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
        'heading', heading_with_range(og.heading, gr.first_number, gr.last_number),
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
            'explanation', case when include_answers then coalesce(n.explanation, '') else '' end,
            'evidenceParagraph', case when include_answers then n.evidence_paragraph else null end,
            'evidence', case when include_answers then n.evidence else null end
          ) order by n.paper_number), '[]'::jsonb)
          from numbered n where n.grp_id = og.id
        )
      ) order by og.group_rank), '[]'::jsonb)
      from ordered_groups og
      join group_ranges gr on gr.grp_id = og.id
    )
  )
  from tmpl;
$$;
