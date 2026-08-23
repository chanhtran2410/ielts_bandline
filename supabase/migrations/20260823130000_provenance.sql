-- ============================================================================
-- Provenance and imported-content support.
--
-- Two things this addresses:
--
-- 1. Attribution. Content imported under CC BY 4.0 must credit its licensor and
--    name the licence. That is a licence condition, not a nicety, so the credit
--    lives beside the content rather than in a file someone may forget to ship.
--
-- 2. Explanations. Imported question sets frequently arrive with an answer key
--    and no reasoning. This product's whole claim is that it explains *why* an
--    answer is wrong, so an empty explanation has to be a visible, queryable
--    gap rather than an empty string that renders as confident silence.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Attribution
-- ---------------------------------------------------------------------------

alter table passages
  add column attribution   text,
  add column license       text,
  add column source_url    text;

alter table writing_tasks
  add column attribution   text,
  add column license       text,
  add column source_url    text;

comment on column passages.attribution is
  'Who to credit, for licences that require it (CC BY and similar). Rendered next to the passage.';
comment on column passages.license is
  'SPDX-style identifier, e.g. CC-BY-4.0. Null means originally authored for this product.';

-- Anything not authored in-house must say where it came from and under what
-- terms, or attribution silently rots as content is added.
alter table passages
  add constraint passages_licensed_content_is_attributed
  check (source <> 'licensed' or (attribution is not null and license is not null));

-- ---------------------------------------------------------------------------
-- Explanations
-- ---------------------------------------------------------------------------

-- Was NOT NULL, which forced imports to invent reasoning. A null explanation is
-- honest; a fabricated one is worse than none, because the learner trusts it.
alter table questions alter column explanation drop not null;

-- Reject the middle ground: an explanation is either absent or substantive.
alter table questions
  add constraint questions_explanation_is_meaningful
  check (explanation is null or length(trim(explanation)) >= 20);

create index questions_missing_explanation_idx
  on questions (group_id) where explanation is null;

comment on column questions.explanation is
  'Why the answer is right, and why the tempting wrong answer is wrong. Null means not yet written — see scripts/backfill-explanations.ts. Practice mode must degrade gracefully rather than show a blank.';

-- ---------------------------------------------------------------------------
-- Content readiness
--
-- Lets selection prefer material that is actually fit to serve, instead of
-- treating a 450-word unreviewed import the same as a full-length reviewed one.
-- ---------------------------------------------------------------------------

create view passage_readiness as
select
  p.id,
  p.slug,
  p.title,
  p.target_band,
  p.word_count,
  p.source,
  p.license,
  p.reviewed_at is not null                     as reviewed,
  p.word_count >= 650                           as full_length,
  count(q.id)                                   as question_count,
  count(q.id) filter (where q.explanation is null) as missing_explanations,
  count(distinct g.type)                        as type_variety,
  -- Ready to put in front of a paying learner: long enough, explained, and
  -- signed off by someone who knows the exam.
  (p.reviewed_at is not null
     and p.word_count >= 650
     and count(q.id) filter (where q.explanation is null) = 0) as exam_ready
from passages p
left join question_groups g on g.passage_id = p.id
left join questions q on q.group_id = g.id
group by p.id;

comment on view passage_readiness is
  'One row per passage describing how usable it is. exam_ready is the gate for serving content in a paid product.';

grant select on passage_readiness to anon, authenticated;
