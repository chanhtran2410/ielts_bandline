import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Question, QuestionGroup, QuestionType } from '@/types/question';
import { QuestionRenderer } from './question-renderer';

function makeQuestion(type: QuestionType, overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    number: 14,
    type,
    groupId: 'g1',
    prompt: 'Paragraph A',
    acceptedAnswers: ['iii'],
    skillIds: ['main_idea'],
    explanation: 'Because.',
    ...overrides,
  };
}

function makeGroup(type: QuestionType, overrides: Partial<QuestionGroup> = {}): QuestionGroup {
  return {
    id: 'g1',
    type,
    passageId: 'p1',
    heading: 'Questions 14–18',
    instruction: 'Choose the correct heading.',
    questions: [],
    ...overrides,
  };
}

function renderQuestion(
  group: QuestionGroup,
  question: Question,
  props: Partial<React.ComponentProps<typeof QuestionRenderer>> = {},
) {
  const onAnswer = vi.fn();
  const onToggleFlag = vi.fn();
  const onFocus = vi.fn();
  const view = render(
    <ul>
      <QuestionRenderer
        group={group}
        question={question}
        answer={null}
        onAnswer={onAnswer}
        flagged={false}
        onToggleFlag={onToggleFlag}
        active={false}
        onFocus={onFocus}
        {...props}
      />
    </ul>,
  );
  return { ...view, onAnswer, onToggleFlag, onFocus };
}

describe('QuestionRenderer — one renderer for every type (§10)', () => {
  it('renders a choice type as radio options', () => {
    const group = makeGroup('true_false_not_given', {
      options: [
        { value: 'TRUE', label: 'True' },
        { value: 'FALSE', label: 'False' },
        { value: 'NOT GIVEN', label: 'Not Given' },
      ],
    });
    renderQuestion(group, makeQuestion('true_false_not_given', { acceptedAnswers: ['TRUE'] }));

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByText('Not Given')).toBeInTheDocument();
  });

  it('renders a matching type as a pool select rather than repeating the pool', () => {
    const group = makeGroup('matching_headings', {
      options: [
        { value: 'i', label: 'A new way of measuring worth' },
        { value: 'iii', label: 'The economic case for urban forests' },
      ],
    });
    renderQuestion(group, makeQuestion('matching_headings'));

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('renders a completion type as a text input carrying the word limit', () => {
    const group = makeGroup('sentence_completion', { maxWords: 2 });
    renderQuestion(
      group,
      makeQuestion('sentence_completion', { acceptedAnswers: ['dusk'], prompt: 'After ____.' }),
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Max 2 words');
  });

  it('reports the chosen value for a choice type', async () => {
    const user = userEvent.setup();
    const group = makeGroup('multiple_choice');
    const question = makeQuestion('multiple_choice', {
      acceptedAnswers: ['B'],
      options: [
        { value: 'A', label: 'First option' },
        { value: 'B', label: 'Second option' },
      ],
    });
    const { onAnswer } = renderQuestion(group, question);

    await user.click(screen.getByText('Second option'));
    expect(onAnswer).toHaveBeenCalledWith('q1', 'B');
  });

  it('reports typed free text', async () => {
    const user = userEvent.setup();
    const { onAnswer } = renderQuestion(
      makeGroup('short_answer', { maxWords: 3 }),
      makeQuestion('short_answer', { acceptedAnswers: ['canopy'] }),
    );

    await user.type(screen.getByRole('textbox'), 'c');
    expect(onAnswer).toHaveBeenCalledWith('q1', 'c');
  });

  it('reports null rather than an empty string when free text is cleared', async () => {
    const user = userEvent.setup();
    const { onAnswer } = renderQuestion(
      makeGroup('short_answer', { maxWords: 3 }),
      makeQuestion('short_answer', { acceptedAnswers: ['canopy'] }),
      { answer: 'x' },
    );

    await user.clear(screen.getByRole('textbox'));
    expect(onAnswer).toHaveBeenCalledWith('q1', null);
  });

  it('warns when a completion answer exceeds the word limit', () => {
    const group = makeGroup('sentence_completion', { maxWords: 2 });
    renderQuestion(group, makeQuestion('sentence_completion', { acceptedAnswers: ['soils'] }), {
      answer: 'load bearing structural soils',
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Over the 2-word limit');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('toggles the flag through the callback', async () => {
    const user = userEvent.setup();
    const { onToggleFlag } = renderQuestion(
      makeGroup('matching_headings', { options: [{ value: 'i', label: 'One' }] }),
      makeQuestion('matching_headings'),
    );

    await user.click(screen.getByRole('button', { name: /flag question 14/i }));
    expect(onToggleFlag).toHaveBeenCalledWith('q1');
  });

  it('locks input and hides the flag control while reviewing', () => {
    renderQuestion(
      makeGroup('matching_headings', { options: [{ value: 'iii', label: 'Three' }] }),
      makeQuestion('matching_headings'),
      { reviewing: true, isCorrect: false, answer: 'i' },
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /flag question/i })).not.toBeInTheDocument();
  });

  it('shows the correct answer alongside a wrong free-text response in review', () => {
    renderQuestion(
      makeGroup('short_answer', { maxWords: 3 }),
      makeQuestion('short_answer', { acceptedAnswers: ['thirteen years'] }),
      { reviewing: true, isCorrect: false, answer: 'twelve years' },
    );

    expect(screen.getByText('thirteen years')).toBeInTheDocument();
  });

  it('does not crash when a choice group is missing its options', () => {
    renderQuestion(makeGroup('multiple_choice'), makeQuestion('multiple_choice'));
    expect(screen.getByText(/missing its answer options/i)).toBeInTheDocument();
  });
});
