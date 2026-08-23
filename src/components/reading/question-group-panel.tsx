'use client';

import type { Question, QuestionGroup } from '@/types/question';
import { QuestionRenderer } from './question-renderer';

export interface QuestionGroupPanelProps {
  group: QuestionGroup;
  answers: Readonly<Record<string, string | null>>;
  flagged: readonly string[];
  activeQuestionId: string | null;
  onAnswer: (questionId: string, answer: string | null) => void;
  onToggleFlag: (questionId: string) => void;
  onFocusQuestion: (questionId: string) => void;
  reviewing?: boolean;
  correctness?: Readonly<Record<string, boolean>>;
}

/**
 * One question group: its heading, instruction, shared option pool, and its
 * questions. Every question type flows through the same renderer.
 */
export function QuestionGroupPanel({
  group,
  answers,
  flagged,
  activeQuestionId,
  onAnswer,
  onToggleFlag,
  onFocusQuestion,
  reviewing,
  correctness,
}: QuestionGroupPanelProps) {
  const showPool = shouldShowPool(group);

  return (
    <section aria-labelledby={'group-' + group.id} className="mb-8">
      <h2
        id={'group-' + group.id}
        className="mb-1.5 text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint"
      >
        {group.heading}
      </h2>
      <p className="mb-5 text-[13.5px] leading-relaxed text-muted">{group.instruction}</p>

      {showPool && group.options ? (
        <div className="mb-5 rounded-xl border border-line bg-surface px-[18px] py-4">
          <p className="mb-2.5 text-xs font-semibold text-muted">
            {group.optionsTitle ?? 'Options'}
          </p>
          <ul className="flex flex-col gap-1.5 text-[13px] leading-snug text-ink-soft">
            {group.options.map((option) => (
              <li key={option.value}>
                <span className="font-semibold">{option.value}</span>
                <span className="mx-1.5" />
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {group.questions.map((question: Question) => (
          <QuestionRenderer
            key={question.id}
            group={group}
            question={question}
            answer={answers[question.id] ?? null}
            onAnswer={onAnswer}
            flagged={flagged.includes(question.id)}
            onToggleFlag={onToggleFlag}
            active={activeQuestionId === question.id}
            onFocus={onFocusQuestion}
            {...(reviewing ? { reviewing: true } : {})}
            {...(correctness ? { isCorrect: correctness[question.id] ?? null } : {})}
          />
        ))}
      </ul>
    </section>
  );
}

/** Only matching types print their pool; choice options live on the question. */
function shouldShowPool(group: QuestionGroup): boolean {
  return (
    group.type === 'matching_headings' ||
    group.type === 'matching_information' ||
    group.type === 'matching_features'
  );
}
