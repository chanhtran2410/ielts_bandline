'use client';

import type { AnswerOption as AnswerOptionType, Question, QuestionGroup } from '@/types/question';
import { isFreeTextQuestion } from '@/types/question';
import { countWords } from '@/lib/word-count';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';
import { AnswerOption } from './answer-option';

export interface QuestionRendererProps {
  group: QuestionGroup;
  question: Question;
  answer: string | null;
  onAnswer: (questionId: string, answer: string | null) => void;
  flagged: boolean;
  onToggleFlag: (questionId: string) => void;
  /** Set to focus the question and give it the active treatment. */
  active: boolean;
  onFocus: (questionId: string) => void;
  /** Locks input and reveals correctness after submission. */
  reviewing?: boolean;
  isCorrect?: boolean | null;
  /** Renders the answer inline as a compact select rather than a full list. */
  layout?: 'inline' | 'stacked';
}

/**
 * The single entry point for rendering any question (§10).
 *
 * There is one page for Reading, not thirteen. The type only decides which
 * input shape appears inside this shell, so navigation, flagging, answer
 * plumbing and review styling are written once.
 */
export function QuestionRenderer(props: QuestionRendererProps) {
  const { group, question, flagged, onToggleFlag, active, onFocus, reviewing, isCorrect } = props;
  const options = question.options ?? group.options;
  const inline = (props.layout ?? defaultLayoutFor(group)) === 'inline';

  return (
    <li
      id={'question-' + question.number}
      onFocus={() => onFocus(question.id)}
      className={cn(
        'rounded-lg border bg-surface transition-colors',
        inline ? 'flex items-center gap-3.5 px-4 py-3' : 'flex flex-col gap-3 p-4',
        active && !reviewing
          ? 'border-[1.5px] border-accent shadow-focus'
          : 'border-line hover:border-line-strong',
        reviewing && isCorrect === true && 'border-good/50',
        reviewing && isCorrect === false && 'border-bad/50',
      )}
    >
      <div className={cn('flex items-center gap-2.5', inline ? 'shrink-0' : '')}>
        <span
          className={cn(
            'tnum w-[22px] font-display text-[13px] font-semibold',
            active && !reviewing ? 'text-accent' : 'text-faint',
          )}
        >
          {question.number}
        </span>
      </div>

      <div className={cn('min-w-0', inline ? 'flex-1' : '')}>
        <p
          className={cn(
            'text-[13.5px] font-medium leading-relaxed',
            inline ? 'truncate' : 'mb-3',
          )}
        >
          {question.prompt}
          {flagged ? (
            <Icon name="flag-filled" size={12} className="ml-2 inline-block text-accent" title="Flagged" />
          ) : null}
        </p>

        {!inline ? <QuestionInput {...props} options={options} /> : null}
      </div>

      {inline ? <QuestionInput {...props} options={options} /> : null}

      {!reviewing ? (
        <button
          type="button"
          onClick={() => onToggleFlag(question.id)}
          aria-pressed={flagged}
          className={cn(
            'shrink-0 rounded-md p-1.5 transition-colors',
            flagged ? 'text-accent' : 'text-faint hover:text-ink',
          )}
        >
          <Icon name={flagged ? 'flag-filled' : 'flag'} size={13} />
          <span className="sr-only">
            {flagged ? 'Remove flag from' : 'Flag'} question {question.number}
          </span>
        </button>
      ) : null}
    </li>
  );
}

/**
 * Matching and completion types read best as a compact row; genuine choice
 * types need the options laid out so they can be compared.
 */
function defaultLayoutFor(group: QuestionGroup): 'inline' | 'stacked' {
  switch (group.type) {
    case 'multiple_choice':
    case 'true_false_not_given':
    case 'yes_no_not_given':
      return 'stacked';
    default:
      return 'inline';
  }
}

type QuestionInputProps = QuestionRendererProps & { options: readonly AnswerOptionType[] | undefined };

/** Dispatches on question type — the only place the type list is switched on. */
function QuestionInput({
  group,
  question,
  answer,
  onAnswer,
  reviewing,
  isCorrect,
  options,
}: QuestionInputProps) {
  const disabled = Boolean(reviewing);

  if (isFreeTextQuestion(question.type)) {
    return (
      <FreeTextAnswer
        question={question}
        maxWords={group.maxWords}
        answer={answer}
        onAnswer={onAnswer}
        disabled={disabled}
        isCorrect={isCorrect ?? null}
      />
    );
  }

  if (!options || options.length === 0) {
    return (
      <p className="text-xs text-faint">This question is missing its answer options.</p>
    );
  }

  // Long option pools (headings, paragraph letters, features) are chosen from a
  // select: the pool is already printed above the list, so repeating it per
  // question would bury the questions themselves.
  const usesPool =
    group.type === 'matching_headings' ||
    group.type === 'matching_information' ||
    group.type === 'matching_features';

  if (usesPool) {
    return (
      <PoolAnswer
        question={question}
        options={options}
        answer={answer}
        onAnswer={onAnswer}
        disabled={disabled}
        isCorrect={isCorrect ?? null}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <AnswerOption
          key={option.value}
          name={'q-' + question.id}
          value={option.value}
          label={option.label}
          selected={answer === option.value}
          onSelect={(value) => onAnswer(question.id, value)}
          disabled={disabled}
          {...(reviewing
            ? {
                state: question.acceptedAnswers.includes(option.value)
                  ? answer === option.value
                    ? ('correct' as const)
                    : ('missed' as const)
                  : answer === option.value
                    ? ('incorrect' as const)
                    : undefined,
              }
            : {})}
        />
      ))}
    </div>
  );
}

function PoolAnswer({
  question,
  options,
  answer,
  onAnswer,
  disabled,
  isCorrect,
}: {
  question: Question;
  options: readonly AnswerOptionType[];
  answer: string | null;
  onAnswer: (id: string, answer: string | null) => void;
  disabled: boolean;
  isCorrect: boolean | null;
}) {
  const chosen = answer !== null && answer !== '';
  return (
    // Fixed width: a native select otherwise sizes itself to its widest option,
    // and heading labels are long enough to squeeze the question text.
    <div className="relative w-[92px] shrink-0">
      <select
        value={answer ?? ''}
        disabled={disabled}
        onChange={(event) => onAnswer(question.id, event.target.value || null)}
        aria-label={'Answer for question ' + question.number + ': ' + question.prompt}
        className={cn(
          'w-full cursor-pointer appearance-none rounded-md border py-1.5 pl-3 pr-7 font-display text-[13px] font-semibold transition-colors',
          chosen
            ? 'border-picked-line bg-picked text-accent-hover'
            : 'border-dashed border-line-strong bg-transparent text-[12.5px] font-medium text-faint',
          disabled && isCorrect === true && 'border-good bg-good-soft text-good',
          disabled && isCorrect === false && 'border-bad bg-bad-soft text-bad',
        )}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value}
            {option.label && option.label !== option.value ? ' — ' + option.label : ''}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={10}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}

function FreeTextAnswer({
  question,
  maxWords,
  answer,
  onAnswer,
  disabled,
  isCorrect,
}: {
  question: Question;
  maxWords: number | undefined;
  answer: string | null;
  onAnswer: (id: string, answer: string | null) => void;
  disabled: boolean;
  isCorrect: boolean | null;
}) {
  const value = answer ?? '';
  const over = maxWords !== undefined && countWords(value) > maxWords;

  return (
    <div className="flex min-w-0 shrink-0 flex-col items-end gap-1 sm:w-52">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onAnswer(question.id, event.target.value || null)}
        aria-label={'Answer for question ' + question.number}
        aria-invalid={over || undefined}
        placeholder={maxWords ? 'Max ' + maxWords + (maxWords === 1 ? ' word' : ' words') : 'Your answer'}
        className={cn(
          'w-full rounded-md border bg-surface px-3 py-1.5 text-[13px] font-medium transition-colors placeholder:font-normal placeholder:text-faint',
          over ? 'border-bad' : 'border-line focus:border-line-strong',
          disabled && isCorrect === true && 'border-good bg-good-soft',
          disabled && isCorrect === false && 'border-bad bg-bad-soft line-through',
        )}
      />
      {over ? (
        <p role="alert" className="text-[11px] font-medium text-bad">
          Over the {maxWords}-word limit
        </p>
      ) : null}
      {disabled && isCorrect === false ? (
        <p className="text-[11.5px] font-medium text-good">{question.acceptedAnswers[0]}</p>
      ) : null}
    </div>
  );
}
