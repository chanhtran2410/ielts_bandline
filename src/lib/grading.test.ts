import { describe, expect, it } from 'vitest';
import type { Question } from '@/types/question';
import {
  accuracy,
  answeredCount,
  bySkill,
  byQuestionType,
  gradeAll,
  isAnswerCorrect,
  normalizeAnswer,
  normalizeChoice,
  rawScore,
} from './grading';

function question(overrides: Partial<Question> & Pick<Question, 'id' | 'type' | 'acceptedAnswers'>): Question {
  return {
    number: 1,
    groupId: 'g1',
    prompt: 'Prompt',
    skillIds: ['main_idea'],
    explanation: '',
    ...overrides,
  };
}

describe('normalizeAnswer', () => {
  it('ignores case and surrounding whitespace', () => {
    expect(normalizeAnswer('  Structural Soils ')).toBe('structural soils');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeAnswer('structural   soils')).toBe('structural soils');
  });

  it('drops a leading article', () => {
    expect(normalizeAnswer('the canopy')).toBe('canopy');
    expect(normalizeAnswer('a tree')).toBe('tree');
    expect(normalizeAnswer('an option')).toBe('option');
  });

  it('does not eat a word that merely starts with an article', () => {
    expect(normalizeAnswer('theory')).toBe('theory');
    expect(normalizeAnswer('android')).toBe('android');
  });

  it('drops trailing punctuation and normalises smart quotes', () => {
    expect(normalizeAnswer('canopy.')).toBe('canopy');
    expect(normalizeAnswer('don\u2019t')).toBe("don't");
  });
});

describe('normalizeChoice', () => {
  it('compares choice tokens case-insensitively without stripping articles', () => {
    expect(normalizeChoice(' TRUE ')).toBe('true');
    expect(normalizeChoice('A')).toBe('a');
  });
});

describe('isAnswerCorrect', () => {
  it('accepts an exact choice match', () => {
    const q = question({ id: 'q1', type: 'true_false_not_given', acceptedAnswers: ['TRUE'] });
    expect(isAnswerCorrect(q, 'true')).toBe(true);
    expect(isAnswerCorrect(q, 'FALSE')).toBe(false);
  });

  it('accepts any of several accepted answers', () => {
    const q = question({
      id: 'q2',
      type: 'short_answer',
      acceptedAnswers: ['thirteen years', '13 years'],
    });
    expect(isAnswerCorrect(q, '13 years')).toBe(true);
    expect(isAnswerCorrect(q, 'Thirteen Years')).toBe(true);
    expect(isAnswerCorrect(q, 'twelve years')).toBe(false);
  });

  it('normalises free text but not choices', () => {
    const free = question({ id: 'q3', type: 'sentence_completion', acceptedAnswers: ['canopy'] });
    expect(isAnswerCorrect(free, 'the canopy')).toBe(true);

    const choice = question({ id: 'q4', type: 'matching_headings', acceptedAnswers: ['iii'] });
    expect(isAnswerCorrect(choice, 'the iii')).toBe(false);
  });

  it('treats unanswered and blank as incorrect, never as correct', () => {
    const q = question({ id: 'q5', type: 'short_answer', acceptedAnswers: ['canopy'] });
    expect(isAnswerCorrect(q, null)).toBe(false);
    expect(isAnswerCorrect(q, '')).toBe(false);
    expect(isAnswerCorrect(q, '   ')).toBe(false);
  });

  it('does not mark a blank answer correct when a blank answer is accepted', () => {
    const q = question({ id: 'q6', type: 'short_answer', acceptedAnswers: [''] });
    expect(isAnswerCorrect(q, '')).toBe(false);
  });
});

describe('gradeAll and rawScore', () => {
  const questions: Question[] = [
    question({ id: 'a', number: 1, type: 'matching_headings', acceptedAnswers: ['iii'] }),
    question({ id: 'b', number: 2, type: 'matching_headings', acceptedAnswers: ['iv'] }),
    question({ id: 'c', number: 3, type: 'true_false_not_given', acceptedAnswers: ['TRUE'], skillIds: ['scanning'] }),
  ];

  it('grades every question, including the ones left unanswered', () => {
    const graded = gradeAll(questions, { a: 'iii', b: 'v' });
    expect(graded).toHaveLength(3);
    expect(graded.map((g) => g.isCorrect)).toEqual([true, false, false]);
    expect(graded[2]?.answer).toBeNull();
  });

  it('counts only correct answers in the raw score', () => {
    expect(rawScore(gradeAll(questions, { a: 'iii', b: 'iv', c: 'TRUE' }))).toBe(3);
    expect(rawScore(gradeAll(questions, {}))).toBe(0);
  });
});

describe('accuracy', () => {
  it('returns a rounded percentage', () => {
    expect(accuracy(32, 40)).toBe(80);
    expect(accuracy(1, 3)).toBe(33);
  });

  it('returns zero rather than NaN when nothing was asked', () => {
    expect(accuracy(0, 0)).toBe(0);
  });
});

describe('byQuestionType', () => {
  it('aggregates per type and sorts strongest first', () => {
    const questions: Question[] = [
      question({ id: 'a', type: 'multiple_choice', acceptedAnswers: ['A'] }),
      question({ id: 'b', type: 'multiple_choice', acceptedAnswers: ['B'] }),
      question({ id: 'c', type: 'matching_headings', acceptedAnswers: ['i'] }),
      question({ id: 'd', type: 'matching_headings', acceptedAnswers: ['ii'] }),
    ];
    const result = byQuestionType(gradeAll(questions, { a: 'A', b: 'B', c: 'i', d: 'wrong' }), {
      multiple_choice: 'Multiple Choice',
      matching_headings: 'Matching Headings',
    });
    expect(result[0]).toMatchObject({ label: 'Multiple Choice', accuracy: 100, correct: 2, total: 2 });
    expect(result[1]).toMatchObject({ label: 'Matching Headings', accuracy: 50 });
  });
});

describe('bySkill', () => {
  it('attributes a question to every skill it exercises', () => {
    const questions: Question[] = [
      question({ id: 'a', type: 'matching_headings', acceptedAnswers: ['i'], skillIds: ['main_idea', 'paraphrasing'] }),
      question({ id: 'b', type: 'matching_headings', acceptedAnswers: ['ii'], skillIds: ['main_idea'] }),
    ];
    const buckets = bySkill(gradeAll(questions, { a: 'i', b: 'wrong' }));
    expect(buckets.get('main_idea')).toEqual({ correct: 1, total: 2 });
    expect(buckets.get('paraphrasing')).toEqual({ correct: 1, total: 1 });
  });
});

describe('answeredCount', () => {
  it('ignores blank and missing answers', () => {
    const questions: Question[] = [
      question({ id: 'a', type: 'short_answer', acceptedAnswers: ['x'] }),
      question({ id: 'b', type: 'short_answer', acceptedAnswers: ['y'] }),
      question({ id: 'c', type: 'short_answer', acceptedAnswers: ['z'] }),
    ];
    expect(answeredCount(questions, { a: 'x', b: '  ', c: null })).toBe(1);
  });
});
