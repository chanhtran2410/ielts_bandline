import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { WritingFeedback } from '@/types/writing';
import { countWords } from '@/lib/word-count';
import { MOCK_FEEDBACK } from '@/mocks/writing.mock';

/**
 * Essay analysis. This runs server-side so ANTHROPIC_API_KEY never reaches the
 * browser — on Vercel it deploys as a function with no server to operate.
 *
 * Until a key is configured it returns the reference analysis, with the same
 * response shape the live path produces, so the client is already final.
 */
export const runtime = 'nodejs';
export const maxDuration = 60;

const RequestSchema = z.object({
  submissionId: z.string().min(1),
  taskPrompt: z.string().min(1),
  taskNumber: z.union([z.literal(1), z.literal(2)]),
  minWords: z.number().int().positive(),
  body: z.string().min(1),
});

export async function POST(request: Request) {
  const started = Date.now();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'That request was not valid.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { submissionId, body, minWords } = parsed.data;
  const wordCount = countWords(body);

  // Refusing here rather than spending a model call on an essay that cannot be
  // scored: under-length essays are capped regardless of quality.
  if (wordCount < Math.min(40, minWords)) {
    return NextResponse.json(
      {
        error:
          'There is not enough writing to analyse. Aim for at least ' + minWords + ' words.',
        retryable: false,
      },
      { status: 422 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const feedback: WritingFeedback = {
      ...MOCK_FEEDBACK,
      submissionId,
      analyzedAt: new Date().toISOString(),
      analysisSeconds: Math.max(1, Math.round((Date.now() - started) / 1000)),
    };
    return NextResponse.json(feedback, {
      headers: { 'x-bandline-source': 'reference-analysis' },
    });
  }

  // With a key present, call the model here and map its structured output onto
  // WritingFeedback. Keeping that mapping server-side is what lets the UI stay
  // fixed while the prompt evolves.
  return NextResponse.json(
    {
      error: 'Live analysis is not wired up in this build.',
      retryable: false,
    },
    { status: 501 },
  );
}
