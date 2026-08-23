'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Band } from '@/types/band';
import type { ExamHorizon, SkillId, StudyMinutesPerDay } from '@/types/user';
import { track } from '@/lib/analytics';
import { formatFullDate } from '@/lib/date';
import { cn } from '@/lib/cn';
import { useUpdateGoal } from '@/hooks/use-profile';
import { Brand } from '@/components/layout/brand';
import { Button, ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  DAILY_TIME_CHOICES,
  EXAM_HORIZON_CHOICES,
  FOCUS_SKILL_CHOICES,
  ONBOARDING_STEPS,
  TARGET_BAND_CHOICES,
  estimateExamDate,
  type Choice,
} from './onboarding-steps';

interface Draft {
  targetBand: Band;
  examHorizon: ExamHorizon;
  examDate: string | null;
  minutesPerDay: StudyMinutesPerDay;
  focusSkills: SkillId[];
}

export function OnboardingScreen() {
  const router = useRouter();
  const updateGoal = useUpdateGoal();
  const [stepIndex, setStepIndex] = useState(0);

  const [draft, setDraft] = useState<Draft>({
    targetBand: 6.5,
    examHorizon: 'about_8_weeks',
    examDate: estimateExamDate('about_8_weeks'),
    minutesPerDay: 45,
    focusSkills: [],
  });

  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  function next() {
    if (!isLast) {
      setStepIndex(stepIndex + 1);
      return;
    }
    updateGoal.mutate(
      {
        targetBand: draft.targetBand,
        examHorizon: draft.examHorizon,
        examDate: draft.examDate,
        minutesPerDay: draft.minutesPerDay,
        focusSkills: draft.focusSkills,
      },
      {
        onSuccess: () => {
          track({ name: 'diagnostic_started' });
          router.push('/practice/session/test_diagnostic');
        },
      },
    );
  }

  if (!step) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5 lg:px-8">
        <Brand href="/" />
        <Link
          href="/"
          className="text-[13px] font-medium text-faint transition-colors hover:text-muted"
        >
          Save &amp; exit
        </Link>
      </header>

      <main id="main" className="flex flex-1 items-center justify-center px-6 pb-16 pt-6">
        <div className="w-full max-w-[520px]">
          <div className="mb-9 flex items-center gap-2">
            {ONBOARDING_STEPS.map((s, index) => (
              <span
                key={s.id}
                className={cn(
                  'h-1 flex-1 rounded-pill transition-colors',
                  index <= stepIndex ? 'bg-accent' : 'bg-fill',
                )}
              />
            ))}
            <span className="tnum ml-2 shrink-0 text-xs font-medium text-faint">
              {stepIndex + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>

          <p className="mb-2.5 text-xs font-medium uppercase tracking-[0.07em] text-accent">
            {step.eyebrow}
          </p>
          <h1 className="mb-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]">
            {step.question}
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-muted">{step.rationale}</p>

          {step.id === 'target' ? (
            <ChoiceGrid
              choices={TARGET_BAND_CHOICES}
              selected={[draft.targetBand]}
              onSelect={(value) => setDraft({ ...draft, targetBand: value })}
              name="Target band"
            />
          ) : null}

          {step.id === 'exam_date' ? (
            <>
              <ChoiceGrid
                choices={EXAM_HORIZON_CHOICES}
                selected={[draft.examHorizon]}
                onSelect={(value) =>
                  setDraft({ ...draft, examHorizon: value, examDate: estimateExamDate(value) })
                }
                name="Exam timing"
              />
              {draft.examDate ? (
                <div className="mb-8 flex items-center gap-3 rounded-xl border border-line bg-surface px-[18px] py-3.5">
                  <Icon name="calendar" size={16} className="text-muted" />
                  <div className="flex-1">
                    <p className="text-[11px] text-faint">Estimated exam date</p>
                    <p className="text-sm font-medium">{formatFullDate(draft.examDate)}</p>
                  </div>
                </div>
              ) : (
                <p className="mb-8 rounded-xl border border-line bg-surface px-[18px] py-3.5 text-[12.5px] leading-relaxed text-muted">
                  No date yet — we&rsquo;ll pace for steady progress and suggest a date once we see
                  your diagnostic.
                </p>
              )}
            </>
          ) : null}

          {step.id === 'daily_time' ? (
            <ChoiceGrid
              choices={DAILY_TIME_CHOICES}
              selected={[draft.minutesPerDay]}
              onSelect={(value) => setDraft({ ...draft, minutesPerDay: value })}
              name="Daily study time"
            />
          ) : null}

          {step.id === 'skills' ? (
            <ChoiceGrid
              choices={FOCUS_SKILL_CHOICES}
              selected={draft.focusSkills}
              multiple
              onSelect={(value) =>
                setDraft({
                  ...draft,
                  focusSkills: draft.focusSkills.includes(value)
                    ? draft.focusSkills.filter((s) => s !== value)
                    : [...draft.focusSkills, value],
                })
              }
              name="Weakest skills"
            />
          ) : null}

          {step.id === 'diagnostic' ? (
            <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
              <dl className="flex flex-col gap-3 text-[13.5px]">
                <SummaryRow label="Target band" value={draft.targetBand.toFixed(1)} />
                <SummaryRow
                  label="Exam date"
                  value={draft.examDate ? formatFullDate(draft.examDate) : 'Not booked'}
                />
                <SummaryRow label="Daily study" value={draft.minutesPerDay + ' minutes'} />
                <SummaryRow
                  label="Your focus"
                  value={
                    draft.focusSkills.length > 0
                      ? draft.focusSkills
                          .map(
                            (id) => FOCUS_SKILL_CHOICES.find((c) => c.value === id)?.label ?? id,
                          )
                          .join(', ')
                      : "We'll find it for you"
                  }
                />
              </dl>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            {stepIndex > 0 ? (
              <Button variant="secondary" size="lg" onClick={() => setStepIndex(stepIndex - 1)}>
                <Icon name="chevron-left" size={13} />
                Back
              </Button>
            ) : (
              <ButtonLink href="/" variant="secondary" size="lg">
                <Icon name="chevron-left" size={13} />
                Back
              </ButtonLink>
            )}

            <Button size="lg" onClick={next} disabled={updateGoal.isPending}>
              {isLast ? (updateGoal.isPending ? 'Starting…' : 'Start diagnostic') : 'Continue'}
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>

          {updateGoal.isError ? (
            <p role="alert" className="mt-4 text-[13px] font-medium text-bad">
              We couldn&rsquo;t save your goal. Try again.
            </p>
          ) : null}

          <ol className="mt-11 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11.5px]">
            {ONBOARDING_STEPS.map((s, index) => (
              <li
                key={s.id}
                className={cn(
                  index < stepIndex && 'text-muted',
                  index === stepIndex && 'font-semibold text-accent',
                  index > stepIndex && 'text-faint',
                )}
              >
                {index + 1} {s.short}
                {index < stepIndex ? ' ✓' : ''}
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft pb-3 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function ChoiceGrid<T extends string | number>({
  choices,
  selected,
  onSelect,
  multiple,
  name,
}: {
  choices: readonly Choice<T>[];
  selected: readonly T[];
  onSelect: (value: T) => void;
  multiple?: boolean;
  name: string;
}) {
  return (
    <fieldset className="mb-8">
      <legend className="sr-only">{name}</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {choices.map((choice) => {
          const isSelected = selected.includes(choice.value);
          return (
            <button
              key={String(choice.value)}
              type="button"
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={isSelected}
              onClick={() => onSelect(choice.value)}
              className={cn(
                'relative rounded-xl border px-[18px] py-4 text-left transition-colors',
                isSelected
                  ? 'border-[1.5px] border-accent bg-accent-soft'
                  : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              <span
                className={cn(
                  'mb-0.5 block pr-6 text-sm font-semibold',
                  isSelected && 'text-accent-hover',
                )}
              >
                {choice.label}
              </span>
              <span className={cn('block text-xs', isSelected ? 'text-accent' : 'text-faint')}>
                {choice.note}
                {choice.common ? ' · most common' : ''}
              </span>
              {isSelected ? (
                <span
                  className="absolute right-3.5 top-3.5 grid size-[18px] place-items-center rounded-pill bg-accent text-on-dark"
                  aria-hidden="true"
                >
                  <Icon name="check" size={10} strokeWidth={2.4} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
