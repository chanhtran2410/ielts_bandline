import { describe, expect, it } from 'vitest';
import {
  countParagraphs,
  countSentences,
  countWords,
  meetsWordRequirement,
  toParagraphs,
  withinAnswerWordLimit,
  wordCountProgress,
} from './word-count';

describe('countWords', () => {
  it('counts a plain sentence', () => {
    expect(countWords('Technology has made life easier')).toBe(5);
  });

  it('is unaffected by collapsed or repeated whitespace', () => {
    expect(countWords('  one   two \n\n three \t four  ')).toBe(4);
  });

  it('treats a hyphenated compound as one word', () => {
    expect(countWords('well-being')).toBe(1);
    expect(countWords('a state-of-the-art facility')).toBe(3);
  });

  it('treats contractions and possessives as one word', () => {
    expect(countWords("don't")).toBe(1);
    expect(countWords('the student’s essay')).toBe(3);
  });

  it('counts numerals and alphanumerics as words', () => {
    expect(countWords('In 2026, COVID-19 receded')).toBe(4);
  });

  it('never counts bare punctuation', () => {
    expect(countWords('... --- !!! ???')).toBe(0);
    expect(countWords('Yes — really.')).toBe(2);
  });

  it('returns zero for empty and whitespace-only input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n  ')).toBe(0);
  });

  it('does not over-count where a naive space split would', () => {
    const naive = 'one  two'.split(' ').length;
    expect(naive).toBe(3);
    expect(countWords('one  two')).toBe(2);
  });
});

describe('countSentences', () => {
  it('counts terminated sentences', () => {
    expect(countSentences('One. Two! Three?')).toBe(3);
  });

  it('counts a trailing unterminated sentence', () => {
    expect(countSentences('One. Two')).toBe(2);
  });

  it('returns zero for blank input', () => {
    expect(countSentences('   ')).toBe(0);
  });
});

describe('paragraphs', () => {
  it('counts blank-line separated blocks', () => {
    expect(countParagraphs('a\n\nb\n\n\nc')).toBe(3);
  });

  it('ignores trailing blank lines', () => {
    expect(countParagraphs('a\n\nb\n\n\n')).toBe(2);
  });

  it('splits into trimmed non-empty lines', () => {
    expect(toParagraphs('  a  \n\n  b  ')).toEqual(['a', 'b']);
  });
});

describe('word requirement', () => {
  it('caps progress at the minimum', () => {
    expect(wordCountProgress(125, 250)).toBe(0.5);
    expect(wordCountProgress(400, 250)).toBe(1);
    expect(wordCountProgress(0, 250)).toBe(0);
  });

  it('treats a zero minimum as satisfied', () => {
    expect(wordCountProgress(0, 0)).toBe(1);
  });

  it('reports whether the minimum is met', () => {
    expect(meetsWordRequirement(250, 250)).toBe(true);
    expect(meetsWordRequirement(249, 250)).toBe(false);
  });
});

describe('withinAnswerWordLimit', () => {
  it('enforces a NO MORE THAN N WORDS limit', () => {
    expect(withinAnswerWordLimit('structural soils', 2)).toBe(true);
    expect(withinAnswerWordLimit('load bearing structural soils', 2)).toBe(false);
  });

  it('allows anything when there is no limit', () => {
    expect(withinAnswerWordLimit('as many words as I like', undefined)).toBe(true);
  });
});
