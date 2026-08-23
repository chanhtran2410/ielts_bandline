# Attribution

Bandline includes third-party content. Each entry below is a licence condition,
not a courtesy — the credit must ship with any deployment that serves this
content, and it must stay accurate as content is added or removed.

The database enforces the machine-readable half of this: `passages.source =
'licensed'` requires `attribution` and `license` to be non-null, so licensed
material cannot be seeded without its credit.

---

## Reading passages and question sets

**Source:** [LuchoBazz/ielts-ai-dataset](https://github.com/LuchoBazz/ielts-ai-dataset)
**Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
**Used:** 15 Reading passages and 154 questions, imported into
`content/passages/*.json` and seeded to the `passages`, `question_groups` and
`questions` tables.

**Changes made.** CC BY 4.0 requires that modifications be indicated. The
imported material was adapted as follows:

- Passage bodies were split into lettered paragraphs (A, B, C…). The source
  supplies one continuous text, but matching-headings and matching-information
  questions cannot be answered without paragraph labels.
- Question-type names were mapped to this project's vocabulary.
  `matching-sentence-endings` is rendered using the `matching_features`
  interaction, since both present a stem with a shared option pool.
- Option pools were moved from individual questions to their group, and pools
  for `matching_information` were constructed from the paragraph letters, which
  the source leaves implicit.
- Answer lists were reordered so the canonical answer comes first and satisfies
  the stated word limit.
- Groups and questions that could not be graded were dropped: 46 items, chiefly
  table-completion groups whose answer fields were empty in the source, and
  summary blocks whose text exceeded a single question prompt.
- No explanations were added. The source contains none, and inventing them would
  produce confident-sounding reasoning that had never been checked.

Nothing in the source was presented as originating with this project, and no
additional restrictions have been placed on the licensed material.

---

## Originally authored content

`content/passages/urban-streams-b65-001.json` and
`content/writing-tasks.json` were written for this project
(`source = 'authored'`). They carry no third-party licence.

---

## Not used

Commercial IELTS practice sites were considered as a content source and
rejected. Their tests are copyrighted by the publisher — in many cases
ultimately by Cambridge Assessment — and reproducing them in a paid product
would be infringement regardless of how the files were obtained. The CC BY
dataset above exists precisely to avoid that, which is why it is the source
used here.

---

## A standing caveat on quality

Every imported passage is `reviewed_at IS NULL`: it is unreviewed
machine-generated material. The `passage_readiness` view reports what is
actually fit to serve:

```sql
select slug, word_count, full_length, missing_explanations, exam_ready
from passage_readiness order by exam_ready desc, word_count desc;
```

At the time of writing, `exam_ready` is **0 of 16**. Two passages reach
full length, none has been reviewed by anyone with IELTS expertise, and 156
questions have no explanation. This content is adequate for exercising the
product; it is not yet adequate for someone paying to be told their band.
