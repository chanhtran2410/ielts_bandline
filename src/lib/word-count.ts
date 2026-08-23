/**
 * IELTS-faithful word counting.
 *
 * A naive split on spaces over-counts (double spaces, newlines, stray
 * punctuation) and under-counts hyphenated and apostrophised forms. IELTS
 * examiners count these the way this function does:
 *
 *  - hyphenated compounds are one word ("well-being")
 *  - contractions and possessives are one word ("don't", "student's")
 *  - numerals and alphanumerics are one word ("2026", "COVID-19")
 *  - bare punctuation is never a word
 */
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\u2011-]?[\p{L}\p{N}]+)*/gu;

export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.match(WORD_PATTERN);
  return matches ? matches.length : 0;
}

export function countSentences(text: string): number {
  if (!text.trim()) return 0;
  return text
    .split(/[.!?]+(?:\s|$)/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;
}

export function countParagraphs(text: string): number {
  return text
    .split(/\n\s*\n/u)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
}

/** Splits into paragraphs, preserving order and dropping blank runs. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\n/u)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Progress toward the task minimum, capped at 1. Used for the word-count bar,
 * which should read "full" once the requirement is met rather than overflowing.
 */
export function wordCountProgress(count: number, minWords: number): number {
  if (minWords <= 0) return 1;
  return Math.min(1, count / minWords);
}

export function meetsWordRequirement(count: number, minWords: number): boolean {
  return count >= minWords;
}

/**
 * Enforces a "NO MORE THAN N WORDS" answer limit for completion questions.
 */
export function withinAnswerWordLimit(answer: string, maxWords: number | undefined): boolean {
  if (maxWords === undefined) return true;
  return countWords(answer) <= maxWords;
}
