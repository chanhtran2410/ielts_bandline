# Architecture

Five rules hold this codebase together. Each one exists because breaking it
caused a specific, predictable kind of mess.

## 1. Services are the only data boundary

No component fetches. No component imports a fixture. A screen asks a service,
and the service decides where the data comes from.

```
UI  →  reading.service  →  mock fixtures (today) / Supabase (tomorrow)
```

Every service is declared as an interface first, and the mock implementation
satisfies that interface exactly:

```ts
export interface ReadingService {
  getTest(testId: string): Promise<Test>;
  startAttempt(input: StartAttemptInput): Promise<Attempt>;
  submitAttempt(attemptId: string, draft: AttemptDraft): Promise<AttemptResult>;
  // …
}

export const readingService: ReadingService = mockReadingService;
```

Swapping in Supabase means writing a second object that satisfies
`ReadingService` and changing the last line. **No UI file changes.** That is the
whole point, and it is enforced by lint: `no-restricted-imports` blocks
`@/mocks/*` everywhere except `src/services`, `src/app/api` and tests.

## 2. Business logic lives outside React

Band conversion, answer grading, word counting and timer arithmetic are pure
functions in `src/lib`, with no React import. They are the most heavily tested
code in the repo, because they are the code a learner's trust rests on.

The corollary: **components never compute a band, a score, or a weakness.** A
component that needs a band asks for one.

The recommendation layer is the same idea applied to the adaptive engine
(`recommendation.service.ts`). The frontend asks "what should I do next"; it
never runs the selection algorithm. When that ranking moves server-side, the UI
will not notice.

## 3. Server state and UI state are separate

| Kind | Where it lives | Examples |
| --- | --- | --- |
| Server state | TanStack Query | profile, tests, attempts, results, feedback, mistakes |
| UI state | local `useState` | selected answer, open modal, current question, editor text |

In-flight exam work is deliberately **local** state mirrored to the service by
`useAutosave`, not round-tripped through the query cache on every keystroke.

Where server data seeds a local editor, it is **derived over, not copied in**:

```ts
// Not: useEffect(() => setBody(submission.body), [submission])
const text = body ?? submission?.body ?? '';
```

`null` means "not edited yet". This removes a whole class of
render-cascade bugs and is why the React 19 `set-state-in-effect` rule passes
clean.

## 4. There is one question renderer, not thirteen

`QuestionRenderer` is the single entry point for every one of the 13 Reading
question types. The type decides only which *input shape* appears inside a shared
shell; numbering, flagging, answer plumbing, review styling and keyboard
behaviour are written once.

```
QuestionGroupPanel  →  QuestionRenderer  →  { AnswerOption | pool select | text input }
```

Adding a question type means adding a case, not a page.

## 5. Every async surface renders four states

Loading, success, error, retry. `AsyncBoundary` makes this structural rather than
a thing you remember to do:

```tsx
<AsyncBoundary
  isLoading={query.isPending}
  isError={query.isError}
  data={query.data}
  loading={<LoadingState title="Analyzing your essay…" detail="Usually takes 10–20 seconds." />}
  error={<ErrorState title="We couldn't analyze your essay." onRetry={() => query.refetch()} />}
>
  {(feedback) => /* … */}
</AsyncBoundary>
```

Loading copy says what is happening and how long it takes. Error copy says what
failed and what is safe. There are no bare spinners in this product.

## Design tokens

`src/app/globals.css` defines every colour, radius, shadow and font in one
`@theme` block, transcribed from the approved design canvas. Semantic names, not
literal ones — `--color-accent`, not `--color-amber-700` — so a rebrand is a
token edit.

**Never write a hex, a radius, or a shadow outside that block.**

## Route groups

- `(shell)` — the sidebar screens: dashboard, practice, mock, writing, mistakes,
  progress, coach.
- `(focus)` — exam sessions, the writing editor, and result screens. These have
  **no sidebar on purpose**: nothing should invite a learner away mid-attempt.

Route files are thin. They read params and render a feature component, so page
logic is testable without Next's router.

## Mock mode is a different experience, not a flag

Practice mode offers highlighting, flagging hints, and explanations. Mock mode
offers none of it, and confirms before submitting because the clock does not come
back. This is checked in `e2e/core-loop.spec.ts` — it is a product guarantee, not
a styling detail.

## What is not built

- **Vocabulary drills.** The nav item is in the approved design but no screen was.
  `/vocabulary` says so plainly and routes to the vocabulary mistakes that do
  exist, rather than inventing a UX the design never specified.
- **Live model calls.** `/api/writing/analyze` and `/api/coach` validate their
  input, enforce the word floor, and return the reference analysis when
  `ANTHROPIC_API_KEY` is absent. The mapping from model output to
  `WritingFeedback` is the remaining work, and it belongs in the route handler so
  the UI stays fixed while the prompt evolves.
- **Auth.** `src/lib/supabase.ts` has the browser and server clients ready;
  no sign-in flow is wired, and the profile service returns a fixed learner.
